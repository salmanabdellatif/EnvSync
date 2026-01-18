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

      // Step 5: Write config file
      const configContent: ProjectConfig = {
        projectId: finalProjectId,
        projectName: finalProjectName,
        linkedAt: new Date().toISOString(),
        mapping: {},
      };

      saveProjectConfig(configContent);
      logger.success(`Linked to ${chalk.bold(finalProjectName)}`);

      // Step 6: Project encryption (E2E handshake)
      const keySpinner = ora("Verifying encryption...").start();

      try {
        const keyResponse = await getProjectKey(finalProjectId);

        // Check if key exists (not just 404, but also null value)
        if (!keyResponse.encryptedKey) {
          throw { response: { status: 404 } }; // Trigger initialization
        }

        keySpinner.succeed("Encryption verified.");
      } catch (error: any) {
        // 404 or null key = New project, needs key initialization
        if (error.response?.status === 404) {
          keySpinner.text = "Initializing encryption...";

          const masterKeyHex = generateProjectKey();
          const myPublicKey = configManager.getPublicKey();

          if (!myPublicKey) {
            keySpinner.fail("Public key missing.");
            return;
          }

          const encryptedKey = encryptAsymmetric(masterKeyHex, myPublicKey);
          await initializeProjectKey(finalProjectId, encryptedKey);
          keySpinner.succeed("Encryption initialized.");
        } else {
          keySpinner.fail("Encryption verification failed.");
          throw error;
        }
      }

      // Done
      logger.success("\nInitialized successfully!");
      logger.info(`Run ${chalk.cyan("envsync push")} to sync secrets.`);
    } catch (error: any) {
      logger.error("\nInitialization failed:");
      logger.error(error.message || error);
    }
  });
