import { Command } from "commander";
import chalk from "chalk";
import inquirer from "inquirer";
import fs from "node:fs";
import path from "node:path";
import ora from "ora";
import { configManager } from "../lib/config.js";
import { getProjects } from "../lib/api.js";
import { logger } from "../utils/logger.js";

const CONFIG_FILE = "envsync.json";

export const initCommand = new Command("init")
  .description("Link current directory to an EnvSync project")
  .action(async () => {
    // 1. Auth Check
    if (!configManager.isAuthenticated()) {
      logger.error(chalk.red("You must login first."));
      console.log(`Run ${chalk.cyan("envsync login")} to get started.`);
      return;
    }

    const configPath = path.join(process.cwd(), CONFIG_FILE);

    // 2. Overwrite Check (Prevent accidental data loss)
    if (fs.existsSync(configPath)) {
      const { overwrite } = await inquirer.prompt([
        {
          type: "confirm",
          name: "overwrite",
          message: `${CONFIG_FILE} already exists. Do you want to overwrite it?`,
          default: false,
        },
      ]);

      if (!overwrite) {
        console.log(chalk.gray("Init cancelled."));
        return;
      }
    }

    const spinner = ora("Fetching your projects...").start();

    try {
      // 3. API Call (Needs src/lib/api.ts to work)
      const projects = await getProjects();
      spinner.succeed(`Found ${projects.length} project(s)`);

      if (projects.length === 0) {
        console.log(chalk.yellow("You don't have any projects yet."));
        console.log(
          `Visit ${chalk.cyan("https://envsync.tech/dashboard")} to create one.`
        );
        return;
      }

      // 4. User Selection
      const choices = projects.map((p: any) => ({
        name: String(p.name),
        value: { id: p.id, name: p.name },
      }));

      const { selectedProject } = await inquirer.prompt([
        {
          type: "rawlist",
          name: "selectedProject",
          message: "Select the project to link:",
          choices,
        },
      ]);

      // 5. Write Metadata (Safe to commit to Git)
      const configData = {
        projectId: selectedProject.id,
        name: selectedProject.name,
      };

      fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));

      console.log(
        chalk.green(`\nLinked to project: ${chalk.bold(selectedProject.name)}`)
      );
      console.log(chalk.gray(`Created ${CONFIG_FILE}`));

      // 6. Security Check (.gitignore)
      checkGitIgnore();
    } catch (error: any) {
      spinner.fail("Failed to fetch projects");
      if (error.response?.status === 401) {
        console.log(chalk.red("Your session has expired."));
        console.log(chalk.yellow("Please run 'envsync login' again."));
      } else {
        console.error(chalk.red(`Failed to fetch projects: ${error.message}`));
      }
    }
  });

function checkGitIgnore() {
  const gitIgnorePath = path.join(process.cwd(), ".gitignore");

  if (!fs.existsSync(gitIgnorePath)) return;

  const content = fs.readFileSync(gitIgnorePath, "utf-8");

  if (!content.includes(".env")) {
    console.log(
      chalk.yellow("\nWarning: .env is not in your .gitignore file!")
    );
    console.log(
      chalk.gray("We highly recommend adding it to prevent leaking secrets.")
    );
  }
}
