/**
 * Push Command
 * Upload local environment variables to the server
 */

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import fs from "node:fs";
import { ProjectConfig, Environment } from "../types/index.js";

// Utilities
import { configManager } from "../lib/config.js";
import { pushBatch } from "../lib/api.js";
import { parseEnvFile } from "../utils/env.js";
import {
  loadProjectConfig,
  detectEnvFiles,
  getLinkedFiles,
} from "../utils/config-file.js";
import {
  validateEnvKeys,
  formatKeyValidationError,
} from "../utils/validators.js";
import { promptConfirm } from "../utils/ui.js";
import { resolveEnvironment, resolveFile } from "../utils/resolution.js";
import {
  getDecryptedProjectKey,
  fetchDecryptedSecrets,
  encryptSecrets,
} from "../utils/secrets.js";
import {
  calculateDiff,
  hasChanges,
  printDiffSummary,
  printDeleteWarning,
  formatSyncResult,
} from "../utils/diff.js";
import { logger } from "../utils/logger.js";

// ===========================================
// Batch Push (--all flag)
// ===========================================

async function pushAllLinkedFiles(
  config: ProjectConfig,
  options: { prune?: boolean; yes?: boolean }
): Promise<void> {
  const mappings = Object.entries(config.mapping) as [string, string][];

  if (mappings.length === 0) {
    logger.warning("No linked files found.");
    logger.info("Link files to environments first using: envsync push");
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

  console.log(chalk.bold(`\nScanning ${mappings.length} file(s)...\n`));

  const pendingPushes: Array<{
    env: Environment;
    filePath: string;
    localVars: Record<string, any>;
    diff: any;
  }> = [];

  const envFiles = detectEnvFiles();
  const unlinkedFiles = envFiles.filter(
    (f) => !getLinkedFiles(config).includes(f)
  );

  // 1. Dry Run - Calculate all diffs
  for (const [envName, filePath] of mappings) {
    const env = environments.find(
      (e) => e.name.toLowerCase() === envName.toLowerCase()
    );

    if (!env || !fs.existsSync(filePath)) {
      logger.debug(`  [XX] ${filePath} > ${envName} (Skip: Not found)`);
      continue;
    }

    try {
      const localVars = parseEnvFile(filePath);
      const localKeys = Object.keys(localVars);

      if (localKeys.length === 0) continue;

      const remote = await fetchDecryptedSecrets(
        config.projectId,
        env.id,
        projectKey
      );
      const diff = calculateDiff(localVars, remote, options.prune);

      if (hasChanges(diff)) {
        pendingPushes.push({ env, filePath, localVars, diff });
        console.log(
          chalk.cyan(`  [CHANGE] ${filePath} > ${env.name}`) +
            chalk.gray(
              ` (+${diff.creates.length} ~${diff.updates.length} -${diff.deletes.length})`
            )
        );
      } else {
        console.log(chalk.green(`  [OK] ${filePath} > ${env.name} (Synced)`));
      }
    } catch (e: any) {
      console.log(chalk.red(`  [ERR] ${filePath} > ${envName}: ${e.message}`));
    }
  }

  if (pendingPushes.length === 0) {
    logger.success("\nAll files are already in sync!");
    return;
  }

  // 2. Summary & Confirmation
  console.log(chalk.bold(`\nSummary:`));
  console.log(`  Files to push: ${pendingPushes.length}`);

  const totalDeletes = pendingPushes.reduce(
    (sum, p) => sum + p.diff.deletes.length,
    0
  );
  if (totalDeletes > 0 && options.prune) {
    console.log(
      chalk.red.bold(
        `  ⚠️  WARNING: ${totalDeletes} keys will be DELETED across environments!`
      )
    );
  }

  if (!options.yes) {
    const confirmed = await promptConfirm("Push all changes?");
    if (!confirmed) {
      console.log(chalk.gray("Cancelled."));
      return;
    }
  }

  // 3. Execution
  console.log("");
  const pushSpinner = ora("Pushing changes...").start();

  for (const { env, localVars, diff } of pendingPushes) {
    try {
      pushSpinner.text = `Pushing to ${env.name}...`;
      await pushBatch(config.projectId, env.id, {
        creates: encryptSecrets(localVars, diff.creates, projectKey),
        updates: encryptSecrets(localVars, diff.updates, projectKey),
        deletes: options.prune ? diff.deletes : [],
      });
    } catch (e: any) {
      logger.error(`\nFailed to push to ${env.name}: ${e.message}`);
    }
  }

  pushSpinner.succeed("Batch push complete.");

  // Show unlinked files
  if (unlinkedFiles.length > 0) {
    console.log(
      chalk.gray(`\n${unlinkedFiles.length} file(s) skipped (not linked):`)
    );
    unlinkedFiles.forEach((f) => console.log(chalk.gray(`  - ${f}`)));
  }
}

// ===========================================
// Single Push
// ===========================================

async function pushSingleFile(
  config: ProjectConfig,
  options: { file?: string; env?: string; prune?: boolean; yes?: boolean }
): Promise<void> {
  // 1. Resolve environment (fetches from API)
  const envResult = await resolveEnvironment(config.projectId, options.env);
  if (!envResult) return;

  // 2. Resolve file (checks mapping, prompts if needed)
  const fileResult = await resolveFile(
    config,
    envResult.environments,
    options.file,
    options.env
  );
  if (!fileResult) return;

  const { filePath, env } = fileResult;

  // 3. Parse file
  const localVars = parseEnvFile(filePath);
  const localKeys = Object.keys(localVars);

  if (localKeys.length === 0) {
    logger.warning("File is empty. Nothing to push.");
    return;
  }

  logger.debug(`Found ${localKeys.length} variable(s) in ${filePath}`);

  // 4. Validate keys
  const invalidKeys = validateEnvKeys(localKeys);
  if (invalidKeys.length > 0) {
    console.log(chalk.red.bold("\n" + formatKeyValidationError(invalidKeys)));
    return;
  }

  // 5. Get project key
  const keySpinner = ora("Preparing...").start();
  let projectKey: string;

  try {
    projectKey = await getDecryptedProjectKey(config.projectId);
    keySpinner.succeed("Ready.");
  } catch (e: any) {
    keySpinner.fail(e.message);
    return;
  }

  // 6. Fetch remote and calculate diff
  const diffSpinner = ora("Comparing...").start();
  const remote = await fetchDecryptedSecrets(
    config.projectId,
    env.id,
    projectKey
  );
  diffSpinner.stop();

  const diff = calculateDiff(localVars, remote, options.prune);

  // 7. Print summary
  printDiffSummary(diff, env.name);

  if (!hasChanges(diff)) {
    return;
  }

  // 8. Confirm
  if (!options.yes) {
    printDeleteWarning(diff.deletes);
    const confirmed = await promptConfirm("Apply changes?", true);
    if (!confirmed) {
      console.log(chalk.gray("Cancelled."));
      return;
    }
  }

  // 9. Push
  const pushSpinner = ora("Uploading...").start();

  try {
    await pushBatch(config.projectId, env.id, {
      creates: encryptSecrets(localVars, diff.creates, projectKey),
      updates: encryptSecrets(localVars, diff.updates, projectKey),
      deletes: options.prune ? diff.deletes : [],
    });

    pushSpinner.succeed("Uploaded.");
    logger.success(formatSyncResult(diff));
  } catch (e: any) {
    pushSpinner.fail("Upload failed.");
    logger.error(e.response?.data?.message || e.message);
  }
}

// ===========================================
// Command Definition
// ===========================================

export const pushCommand = new Command("push")
  .description("Upload local environment variables to the server")
  .option("-e, --env <name>", "Target environment name")
  .option("-f, --file <path>", "Path to .env file")
  .option("-a, --all", "Push all linked files at once")
  .option("-p, --prune", "Remove remote keys not in local file")
  .option("-y, --yes", "Skip confirmation prompts")
  .addHelpText(
    "after",
    `
Examples:
  $ envsync push                     Interactive mode
  $ envsync push -f .env -e dev      Push specific file to environment
  $ envsync push --all               Push all linked files
  $ envsync push --all --yes         Push all without confirmation
  $ envsync push --prune             Remove keys not in local file
`
  )
  .action(async (options) => {
    console.log(chalk.bold.blue("\nEnvSync Push\n"));

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

      // 3. Dispatch to batch or single mode
      if (options.all) {
        await pushAllLinkedFiles(config, options);
      } else {
        await pushSingleFile(config, options);
      }
    } catch (error: any) {
      logger.error(
        "\nError: " + (error.response?.data?.message || error.message)
      );
    }
  });
