import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import fs from "node:fs";
import { configManager } from "../lib/config.js";
import { ensureUserKeys } from "../lib/keys.js";
import { startBrowserLogin } from "./login.js";
import {
  getProjects,
  createProject,
  getProjectKey,
  initializeProjectKey,
} from "../lib/api.js";
import { generateProjectKey, encryptAsymmetric } from "../lib/crypto.js";

// Utils
import { logger } from "../utils/logger.js";
import { promptConfirm, promptSelectOrCreateProject } from "../utils/ui.js";
import {
  getConfigPath,
  loadProjectConfig,
  saveProjectConfig,
} from "../utils/config-file.js";
import { ProjectConfig } from "../types/index.js";

// --- Command ---

export const initCommand = new Command("init")
  .description("Initialize Envsync in this directory")
  .action(async () => {
    console.log(chalk.bold.blue("\nEnvsync Initialization\n"));

    try {
      // Step 1: Authentication
      if (!configManager.isAuthenticated()) {
        logger.warning("Not logged in.");

        const proceed = await promptConfirm("Open browser to login?", true);

        if (!proceed) {
          logger.info("Cancelled.");
          return;
        }

        // Trigger browser login flow
        const success = await startBrowserLogin();
        if (!success) {
          return;
        }
      } else {
        const user = configManager.getUser();
        logger.success(`Logged in as ${chalk.bold(user?.email)}`);
      }

      // Step 2: Identity (RSA Keys)
      await ensureUserKeys();

      // Step 3: Check existing config
      const existingConfig = loadProjectConfig();
      if (existingConfig) {
        const linkedProject =
          existingConfig.projectName || existingConfig.projectId;

        logger.warning(`Already linked to: ${chalk.bold(linkedProject)}`);

        const overwrite = await promptConfirm(
          "Link to a different project?",
          false
        );

        if (!overwrite) {
          logger.info("Cancelled.");
          return;
        }
      }

      // Step 4: Project selection
      const fetchSpinner = ora("Fetching projects...").start();
      const projects = await getProjects();
      fetchSpinner.stop();

      const result = await promptSelectOrCreateProject(projects);
      let finalProjectId: string;
      let finalProjectName: string;

      // Step 4a: Create new project
      if (result.createNew && result.newName) {
        const createSpinner = ora("Creating project...").start();
        const newProject = await createProject(result.newName);
        finalProjectId = newProject.id;
        finalProjectName = newProject.name;
        createSpinner.succeed(`Created ${chalk.bold(result.newName)}`);
      } else if (result.project) {
        finalProjectId = result.project.id;
        finalProjectName = result.project.name;
      } else {
        return; // Should not happen
      }

      // Step 5: Project encryption (E2E handshake)
      const keySpinner = ora("Verifying encryption...").start();

      try {
        const keyResponse = await getProjectKey(finalProjectId);

        if (keyResponse.encryptedKey) {
          // Key exists - user has access
          keySpinner.succeed("Encryption verified.");
        } else {
          // Key is null - member exists but no wrapped key
          // Try to initialize (only OWNER can do this)
          keySpinner.text = "Initializing encryption...";

          try {
            const masterKeyHex = generateProjectKey();
            const myPublicKey = configManager.getPublicKey();

            if (!myPublicKey) {
              keySpinner.fail("Public key missing.");
              return;
            }

            const encryptedKey = encryptAsymmetric(masterKeyHex, myPublicKey);
            await initializeProjectKey(finalProjectId, encryptedKey);
            keySpinner.succeed("Encryption initialized.");
          } catch (initError: any) {
            // 403 = Not an owner, can't initialize - show grant message
            if (initError.response?.status === 403) {
              keySpinner.fail("Access denied.");

              const currentUser = configManager.getUser();
              const email = currentUser?.email || "your-email";

              console.log("");
              logger.warning(
                `You are a member of "${finalProjectName}", but you don't have the secure key yet.`
              );
              logger.info(
                "This happens if you were added via the Web UI without CLI encryption."
              );

              console.log("");
              logger.info(
                "Ask an Admin to run this command to unlock your access:"
              );
              console.log(chalk.bold.cyan(`  envsync grant ${email}`));
              console.log("");

              return;
            }
            throw initError;
          }
        }
      } catch (error: any) {
        // 403 from getProjectKey = Not a member at all
        if (error.response?.status === 403) {
          logger.error("You are not a member of this project.");
          return;
        }

        // 404 = Project not found
        if (error.response?.status === 404) {
          keySpinner.fail("Project not found.");
          return;
        }

        // Any other error
        keySpinner.stop();
        throw error;
      }

      // Step 6: Write config file (only after successful verification)
      const configContent: ProjectConfig = {
        projectId: finalProjectId,
        projectName: finalProjectName,
        linkedAt: new Date().toISOString(),
        mapping: {},
      };

      saveProjectConfig(configContent);
      logger.success(`Linked to ${chalk.bold(finalProjectName)}`);

      // Done
      logger.success("\nInitialized successfully!");
      logger.info(`Run ${chalk.cyan("envsync push")} to sync secrets.`);
    } catch (error: any) {
      // Only catch unexpected errors (403 and 404 are handled above)
      logger.error("\nInitialization failed:");
      logger.error(error.message || error);
    }
  });
