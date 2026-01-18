/**
 * Pull Command
 * Download remote environment variables to local file
 */

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import fs from "node:fs";
import { ProjectConfig, Environment } from "../types/index.js";

// Utils
import { configManager } from "../lib/config.js";
import { loadProjectConfig } from "../utils/config-file.js";
import { resolveEnvironment, resolveFile } from "../utils/resolution.js";
import {
  getDecryptedProjectKey,
  fetchDecryptedSecrets,
} from "../utils/secrets.js";
import { stringifyEnv } from "../utils/env.js";
import { logger } from "../utils/logger.js";
import { promptConfirm } from "../utils/ui.js";

// ===========================================
// Batch Pull (Default if mappings exist)
// ===========================================

async function pullAllLinkedFiles(
  config: ProjectConfig,
  options: { yes?: boolean }
): Promise<void> {
  const mappings = Object.entries(config.mapping) as [string, string][];

  if (mappings.length === 0) {
    logger.warning("No linked files found in envsync.json.");
    return;
  }

  // Get project key
  const spinner = ora("Loading...").start();
  let projectKey: string;
  let environments: Environment[];

  try {
    const { getEnvironments } = await import("../lib/api.js");
    environments = await getEnvironments(config.projectId);
    projectKey = await getDecryptedProjectKey(config.projectId);
    spinner.succeed("Ready");
  } catch (e: any) {
    spinner.fail(e.message);
    return;
  }

  console.log(chalk.bold(`\nFound ${mappings.length} linked file(s).\n`));

  // 1. Prepare Pulls
  const pendingPulls: Array<{
    env: Environment;
    filePath: string;
  }> = [];

  for (const [envName, filePath] of mappings) {
    const env = environments.find(
      (e) => e.name.toLowerCase() === envName.toLowerCase()
    );

    if (!env) {
      logger.warning(
        `Environment '${envName}' not found. Skipping ${filePath}.`
      );
      continue;
    }
    pendingPulls.push({ env, filePath });
    console.log(chalk.gray(`  - ${envName} -> ${filePath}`));
  }

  if (pendingPulls.length === 0) return;

  // 2. Initial Overwrite Check (for safety)
  const existingFiles = pendingPulls
    .map((p) => p.filePath)
    .filter((f) => fs.existsSync(f));

  if (existingFiles.length > 0 && !options.yes) {
    logger.warning(
      `${existingFiles.length} file(s) already exist and will be overwritten.`
    );
    const confirmed = await promptConfirm("Overwrite all files?", false);
    if (!confirmed) {
      logger.info("Cancelled.");
      return;
    }
  }

  // 3. Execution
  console.log("");
  const pullSpinner = ora("Pulling...").start();

  for (const { env, filePath } of pendingPulls) {
    try {
      pullSpinner.text = `Pulling ${env.name}...`;
      await downloadAndSave(config.projectId, env.id, projectKey, filePath);
    } catch (e: any) {
      logger.error(`\nFailed to pull ${env.name}: ${e.message}`);
    }
  }

  pullSpinner.succeed("Batch pull complete.");
  logger.success(
    `Successfully restored ${pendingPulls.length} environment files.`
  );
}

// ===========================================
// Core Logic
// ===========================================

async function downloadAndSave(
  projectId: string,
  envId: string,
  key: string,
  filePath: string
): Promise<number> {
  const remoteSecrets = await fetchDecryptedSecrets(projectId, envId, key);
  const envContent = stringifyEnv(remoteSecrets);
  fs.writeFileSync(filePath, envContent);
  return Object.keys(remoteSecrets).length;
}

// ===========================================
// Single Pull
// ===========================================

async function pullSingleFile(
  config: ProjectConfig,
  options: { file?: string; env?: string; yes?: boolean }
): Promise<void> {
  // 1. Resolve environment
  const envResult = await resolveEnvironment(config.projectId, options.env);
  if (!envResult) return;

  // 2. Resolve file (with Fresh Clone support)
  const fileResult = await resolveFile(
    config,
    envResult.environments,
    options.file,
    options.env,
    { allowNew: true }
  );
  if (!fileResult) return;

  const { filePath, env } = fileResult;

  // 🛑 SAFETY CHECK: Overwrite Protection
  if (fs.existsSync(filePath) && !options.yes) {
    logger.warning(`File '${filePath}' already exists.`);

    const overwrite = await promptConfirm(
      "Overwrite it with remote secrets?",
      false
    );

    if (!overwrite) {
      logger.info("Cancelled.");
      return;
    }
  }

  // 3. Get project key
  const spinner = ora("Downloading...").start();
  let projectKey: string;

  try {
    projectKey = await getDecryptedProjectKey(config.projectId);
  } catch (e: any) {
    spinner.fail(e.message);
    return;
  }

  // 4. Download and Save
  const secretCount = await downloadAndSave(
    config.projectId,
    env.id,
    projectKey,
    filePath
  );

  spinner.succeed("Downloaded.");
  logger.success(
    `Pulled ${secretCount} secrets from ${chalk.bold(env.name)} to ${chalk.bold(
      filePath
    )}`
  );
}

export const pullCommand = new Command("pull")
  .description("Download remote environment variables")
  .option("-e, --env <name>", "Target environment name")
  .option("-f, --file <path>", "Path to .env file")
  .option("-y, --yes", "Skip confirmation prompts (overwrite)")
  .action(async (options) => {
    console.log(chalk.bold.blue("\nEnvSync Pull\n"));

    try {
      // 1. Load config
      const config = loadProjectConfig();
      if (!config) {
        logger.error("This directory is not linked to a project.");
        logger.info(`Run ${chalk.cyan("envsync init")} first.`);
        return;
      }

      // 2. Auth check
      if (!configManager.isAuthenticated()) {
        logger.error("You are not logged in.");
        logger.info(`Run ${chalk.cyan("envsync login")} first.`);
        return;
      }

      // 3. Dispatch Logic
      // If NO specific file/env flags are provided AND mappings exist -> Batch Pull
      const hasFlags = options.file || options.env;
      const hasMappings =
        config.mapping && Object.keys(config.mapping).length > 0;

      if (!hasFlags && hasMappings) {
        await pullAllLinkedFiles(config, options);
      } else {
        await pullSingleFile(config, options);
      }
    } catch (error: any) {
      logger.error(
        "\nError: " + (error.response?.data?.message || error.message)
      );
    }
  });
