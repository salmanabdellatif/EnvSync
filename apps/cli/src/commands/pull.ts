/**
 * Pull Command
 * Download remote environment variables to local file
 */

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import fs from "node:fs";
import path from "node:path";
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

  // 1. Load prerequisites
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

  // 2. Calculate alignment padding
  const maxFileLen = Math.max(...mappings.map(([, f]) => f.length));
  const maxEnvLen = Math.max(...mappings.map(([e]) => e.length));

  // 3. Scan and compare each file
  console.log(chalk.bold("\nScanning linked files...\n"));

  const pendingPulls: Array<{
    env: Environment;
    filePath: string;
    remoteSecrets: Record<string, { value: string; comment?: string }>;
    changeCount: number;
  }> = [];
  let syncedCount = 0;

  for (const [envName, filePath] of mappings) {
    const env = environments.find(
      (e) => e.name.toLowerCase() === envName.toLowerCase()
    );

    const filePad = " ".repeat(maxFileLen - filePath.length);
    const envPad = " ".repeat(maxEnvLen - envName.length);

    if (!env) {
      console.log(
        chalk.yellow(
          `  [SKIP]   ${filePath}${filePad} > ${envName}${envPad}  ⚠️ Env not found`
        )
      );
      continue;
    }

    try {
      // Fetch remote
      const remoteSecrets = await fetchDecryptedSecrets(
        config.projectId,
        env.id,
        projectKey
      );

      // Parse local (if exists)
      let changeCount = 0;
      if (fs.existsSync(filePath)) {
        const { parseEnvFile } = await import("../utils/env.js");
        const localVars = parseEnvFile(filePath);

        // Calculate what would change (remote -> local comparison)
        const remoteKeys = Object.keys(remoteSecrets);
        const localKeys = Object.keys(localVars);

        // Count differences
        for (const key of remoteKeys) {
          if (!localVars[key]) {
            changeCount++; // New key from remote
          } else {
            const localVal = localVars[key].value?.trim() || "";
            const remoteVal = remoteSecrets[key].value?.trim() || "";
            const localComment = localVars[key].comment?.trim() || "";
            const remoteComment = remoteSecrets[key].comment?.trim() || "";

            if (localVal !== remoteVal || localComment !== remoteComment) {
              changeCount++; // Value or comment changed
            }
          }
        }
        for (const key of localKeys) {
          if (!remoteSecrets[key]) {
            changeCount++; // Key will be removed (remote doesn't have it)
          }
        }
      } else {
        // File doesn't exist - all remote keys are new
        changeCount = Object.keys(remoteSecrets).length;
      }

      if (changeCount === 0) {
        console.log(
          chalk.green(
            `  [OK]     ${filePath}${filePad} > ${envName}${envPad} (Synced)`
          )
        );
        syncedCount++;
      } else {
        console.log(
          chalk.cyan(
            `  [UPDATE] ${filePath}${filePad} > ${envName}${envPad} (${changeCount} changes)`
          )
        );
        pendingPulls.push({ env, filePath, remoteSecrets, changeCount });
      }
    } catch (e: any) {
      console.log(
        chalk.red(
          `  [ERR]    ${filePath}${filePad} > ${envName}${envPad}: ${e.message}`
        )
      );
    }
  }

  // 4. Handle results
  if (pendingPulls.length === 0) {
    logger.success("\nAll files are already in sync!");
    return;
  }

  // 5. Confirm before overwriting
  if (!options.yes) {
    const totalChanges = pendingPulls.reduce(
      (sum, p) => sum + p.changeCount,
      0
    );
    console.log("");
    logger.warning(
      `${pendingPulls.length} file(s) have changes (${totalChanges} total).`
    );
    const confirmed = await promptConfirm("Apply updates?", true);
    if (!confirmed) {
      logger.info("Cancelled.");
      return;
    }
  }

  // 6. Execute pulls (only for changed files)
  console.log("");
  const pullSpinner = ora("Pulling...").start();

  for (const { env, filePath, remoteSecrets } of pendingPulls) {
    try {
      pullSpinner.text = `Pulling ${env.name}...`;

      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const envContent = stringifyEnv(remoteSecrets);
      fs.writeFileSync(filePath, envContent);
    } catch (e: any) {
      logger.error(`\nFailed to pull ${env.name}: ${e.message}`);
    }
  }

  pullSpinner.succeed("Pull complete.");
  logger.success(
    `Updated ${pendingPulls.length} file(s). ${syncedCount} already synced.`
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

  // Ensure directory exists (fixes Fresh Clone with nested paths)
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

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
