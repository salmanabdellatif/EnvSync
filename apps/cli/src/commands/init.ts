import { Command } from "commander";
import chalk from "chalk";
import inquirer from "inquirer";
import ora from "ora";
import fs from "node:fs";
import path from "node:path";
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

// --- Types ---

interface ProjectAnswer {
  projectId: string;
}

interface NewProjectAnswer {
  name: string;
}

// --- Command ---

export const initCommand = new Command("init")
  .description("Initialize Envsync in this directory")
  .action(async () => {
    console.log(chalk.bold.blue("\nEnvsync Initialization\n"));

    try {
      // Step 1: Authentication
      if (!configManager.isAuthenticated()) {
        console.log(chalk.yellow("Not logged in."));

        const { proceed } = await inquirer.prompt([
          {
            type: "confirm",
            name: "proceed",
            message: "Open browser to login?",
            default: true,
          },
        ]);

        if (!proceed) {
          console.log(chalk.gray("Cancelled."));
          return;
        }

        // Trigger browser login flow
        const success = await startBrowserLogin();
        if (!success) {
          return;
        }
      } else {
        const user = configManager.getUser();
        console.log(chalk.green(`Logged in as ${chalk.bold(user?.email)}`));
      }

      // Step 2: Identity (RSA Keys)
      await ensureUserKeys();

      // Step 3: Check existing config
      const configPath = path.join(process.cwd(), "envsync.json");
      if (fs.existsSync(configPath)) {
        const existingConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        const linkedProject =
          existingConfig.projectName || existingConfig.projectId;

        console.log(
          chalk.yellow(`\nAlready linked to: ${chalk.bold(linkedProject)}`)
        );

        const { overwrite } = await inquirer.prompt([
          {
            type: "confirm",
            name: "overwrite",
            message: "Link to a different project?",
            default: false,
          },
        ]);

        if (!overwrite) {
          console.log(chalk.gray("Cancelled."));
          return;
        }
      }

      // Step 4: Project selection
      const fetchSpinner = ora("Fetching projects...").start();
      const projects = await getProjects();
      fetchSpinner.stop();

      const { projectId } = await inquirer.prompt<ProjectAnswer>([
        {
          type: "rawlist",
          name: "projectId",
          message: "Select a project:",
          choices: [
            ...projects.map((p) => ({ name: p.name, value: p.id })),
            { name: "+ Create new project", value: "NEW" },
          ],
        },
      ]);

      let finalProjectId = projectId;
      let finalProjectName =
        projects.find((p) => p.id === projectId)?.name || "";

      // Step 4a: Create new project
      if (projectId === "NEW") {
        const { name } = await inquirer.prompt<NewProjectAnswer>([
          {
            type: "input",
            name: "name",
            message: "Project name:",
            validate: (input: string) =>
              (input.length > 2 && /^[a-zA-Z0-9-_]+$/.test(input)) ||
              "Must be 3+ chars, alphanumeric only.",
          },
        ]);

        const createSpinner = ora("Creating project...").start();
        const newProject = await createProject(name);
        finalProjectId = newProject.id;
        finalProjectName = newProject.name;
        createSpinner.succeed(`Created ${chalk.bold(name)}`);
      }

      // Step 5: Write config file
      const configContent = {
        projectId: finalProjectId,
        projectName: finalProjectName,
        linkedAt: new Date().toISOString(),
      };
      fs.writeFileSync(configPath, JSON.stringify(configContent, null, 2));
      console.log(chalk.green(`\nLinked to ${chalk.bold(finalProjectName)}`));

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
      console.log(chalk.bold.green("\nInitialized successfully!"));
      console.log(`Run ${chalk.cyan("envsync push")} to sync secrets.`);
    } catch (error: any) {
      console.error(chalk.red("\nInitialization failed:"));
      console.error(error.message || error);
    }
  });
