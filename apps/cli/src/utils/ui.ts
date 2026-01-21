/**
 * UI Utilities - Reusable Prompts
 */

import inquirer from "inquirer";
import chalk from "chalk";
import fs from "node:fs";
import type { Environment, Project } from "../types/index.js";

/**
 * Prompt user to select an environment
 */
export async function promptSelectEnvironment(
  environments: Environment[],
  message = "Select environment:"
): Promise<Environment> {
  const { selected } = await inquirer.prompt([
    {
      type: "rawlist",
      name: "selected",
      message,
      choices: environments.map((e) => ({ name: e.name, value: e })),
    },
  ]);
  return selected;
}

/**
 * Prompt user to select an environment or create new
 */
export async function promptSelectOrCreateEnvironment(
  environments: Environment[],
  message = "Select environment:",
  allowCreate = true
): Promise<{ env: Environment | null; createNew: boolean; newName?: string }> {
  const choices = [
    ...environments.map((e) => ({ name: e.name, value: e.name })),
  ];

  // Only add "Create new" option if allowed
  if (allowCreate) {
    choices.push({ name: "Create new environment", value: "__CREATE__" });
  }

  const { selected } = await inquirer.prompt([
    {
      type: "rawlist",
      name: "selected",
      message,
      choices,
    },
  ]);

  if (selected === "__CREATE__") {
    const { newName } = await inquirer.prompt([
      {
        type: "input",
        name: "newName",
        message: "Environment name:",
        validate: (input: string) =>
          /^[a-z0-9_-]+$/.test(input.trim().toLowerCase()) ||
          "Use lowercase letters, numbers, and dashes only",
      },
    ]);
    return {
      env: null,
      createNew: true,
      newName: newName.trim().toLowerCase(),
    };
  }

  const env = environments.find((e) => e.name === selected)!;
  return { env, createNew: false };
}

/**
 * Prompt user to select a file
 */
export async function promptSelectFile(
  files: string[],
  message = "Select file:"
): Promise<string> {
  const { selected } = await inquirer.prompt([
    {
      type: "rawlist",
      name: "selected",
      message,
      choices: files,
    },
  ]);
  return selected;
}

/**
 * Prompt user to select a project or create new
 */
export async function promptSelectOrCreateProject(
  projects: Project[],
  message = "Select project:"
): Promise<{ project: Project | null; createNew: boolean; newName?: string }> {
  const choices = [
    ...projects.map((p) => ({ name: p.name, value: p.id })),
    { name: "+ Create new project", value: "__CREATE__" },
  ];

  const { selected } = await inquirer.prompt([
    {
      type: "rawlist",
      name: "selected",
      message,
      choices,
    },
  ]);

  if (selected === "__CREATE__") {
    const { newName } = await inquirer.prompt([
      {
        type: "input",
        name: "newName",
        message: "Project name:",
        validate: (input: string) =>
          (input.length > 2 && /^[a-zA-Z0-9-_]+$/.test(input)) ||
          "Must be 3+ chars, alphanumeric only.",
      },
    ]);
    return { project: null, createNew: true, newName };
  }

  const project = projects.find((p) => p.id === selected)!;
  return { project, createNew: false };
}

/**
 * Prompt for confirmation
 */
export async function promptConfirm(
  message: string,
  defaultValue = true
): Promise<boolean> {
  const { confirmed } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirmed",
      message,
      default: defaultValue,
    },
  ]);
  return confirmed;
}

/**
 * Prompt to create an environment when none exist
 */
import { logger } from "./logger.js";

/**
 * Prompt to create an environment when none exist
 */
export async function promptCreateFirstEnvironment(): Promise<string | null> {
  logger.warning("No environments found on the server.");

  const createNew = await promptConfirm("Would you like to create one?", true);
  if (!createNew) {
    logger.info("Cancelled.");
    return null;
  }

  const { envName } = await inquirer.prompt([
    {
      type: "input",
      name: "envName",
      message: "Environment name:",
      default: "development",
      validate: (input: string) =>
        /^[a-z0-9_-]+$/.test(input.trim().toLowerCase()) ||
        "Use lowercase letters, numbers, and dashes only",
    },
  ]);

  return envName.trim().toLowerCase();
}

/**
 * Prompt unified push target selector
 * Shows flat menu with visual status for missing files
 */
export async function promptSelectPushTarget(
  environments: Environment[],
  mapping: Record<string, string>
): Promise<{
  type: "ALL" | "ENV" | "CREATE";
  env?: Environment;
}> {
  const maxNameLen = Math.max(0, ...environments.map((e) => e.name.length));
  const choices: any[] = [];

  // 1. Calculate file status
  let existingCount = 0;
  let missingCount = 0;

  environments.forEach((env) => {
    const file = mapping[env.name];
    if (file && fs.existsSync(file)) existingCount++;
    else if (file) missingCount++;
  });

  // 2. Option A: Push All (with status context)
  const mappingCount = existingCount + missingCount;
  if (mappingCount > 0) {
    const statusText =
      missingCount > 0
        ? `(${existingCount} found, ${missingCount} missing)`
        : `(${mappingCount} files)`;

    choices.push({
      name: chalk.bold(`Push All Linked Files ${statusText}`),
      value: "ALL",
    });
  }

  // 3. Option B: Individual Environments with status
  // Calculate max file path length for alignment
  const maxFileLen = Math.max(
    0,
    ...environments.map((e) => (mapping[e.name] || "").length)
  );

  environments.forEach((env) => {
    const linkedFile = mapping[env.name];
    const namePadding = " ".repeat(maxNameLen - env.name.length + 2);

    let label: string;
    if (linkedFile) {
      const filePadding = " ".repeat(maxFileLen - linkedFile.length + 1);
      if (fs.existsSync(linkedFile)) {
        // File exists - normal display
        label = `${env.name}${namePadding}${chalk.gray(`(${linkedFile})`)}`;
      } else {
        // File missing - warning display with aligned "Missing"
        label = `${
          env.name
        }${namePadding}(${linkedFile})${filePadding}${chalk.red("⚠️ Missing")}`;
      }
    } else {
      // Not linked
      label = env.name;
    }

    choices.push({ name: label, value: env });
  });

  // 4. Option C: Create
  choices.push({ name: "+ Create new environment", value: "CREATE" });

  const { result } = await inquirer.prompt([
    {
      type: "rawlist",
      name: "result",
      message: "Select target:",
      choices,
      pageSize: 10,
    },
  ]);

  if (result === "ALL") return { type: "ALL" };
  if (result === "CREATE") return { type: "CREATE" };
  return { type: "ENV", env: result };
}

/**
 * Prompt for new environment name
 */
export async function promptNewEnvironmentName(): Promise<string> {
  const { newName } = await inquirer.prompt([
    {
      type: "input",
      name: "newName",
      message: "New environment name:",
      validate: (input: string) =>
        /^[a-z0-9_-]+$/.test(input.trim().toLowerCase()) ||
        "Lowercase letters, numbers, dashes only.",
    },
  ]);
  return newName.trim().toLowerCase();
}
