/**
 * Status Command
 * Shows the link between local files and remote environments and their sync status
 */

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import fs from "node:fs";
import { loadProjectConfig } from "../utils/config-file.js";
import {
  getDecryptedProjectKey,
  fetchDecryptedSecrets,
} from "../utils/secrets.js";
import { parseEnvFile } from "../utils/env.js";
import { calculateSyncStatus } from "../utils/status-utils.js";
import { logger } from "../utils/logger.js";
import { getEnvironments } from "../lib/api.js";
import { Environment } from "../types/index.js";

export const statusCommand = new Command("status")
  .description("Show the status of linked files and environments")
  .option("-v, --verbose", "Show detailed diffs of keys")
  .action(async (options) => {
    console.log(chalk.bold.blue("\nEnvSync Status\n"));

    try {
      // 1. Load config
      const config = loadProjectConfig();
      if (!config) {
        logger.error("Not linked to a project.");
        return;
      }

      const spinner = ora("Checking status...").start();

      // 2. Load prerequisites
      let environments: Environment[];
      let projectKey: string;
      try {
        // Fetch environments and project key
        environments = await getEnvironments(config.projectId);
        projectKey = await getDecryptedProjectKey(config.projectId);
      } catch (e: any) {
        spinner.fail("Failed to load project data.");
        logger.error(e.message);
        return;
      }

      const mappings = Object.entries(config.mapping);
      if (mappings.length === 0) {
        spinner.stop();
        logger.warning("No linked files found.");
        logger.info(
          `Run ${chalk.cyan("envsync pull")} or ${chalk.cyan(
            "envsync push"
          )} to link your first file.`
        );
        return;
      }

      // 3. PARALLEL STATUS CHECK ⚡
      const statusRows = await Promise.all(
        mappings.map(async ([envName, filePath]) => {
          const env = environments.find(
            (e) => e.name.toLowerCase() === envName.toLowerCase()
          );

          // Default State
          const row = {
            envName,
            filePath,
            statusText: "",
            color: chalk.white,
            details: null as ReturnType<typeof calculateSyncStatus> | null,
          };

          if (!env) {
            row.statusText = "Env missing on server";
            row.color = chalk.red;
            return row;
          }

          if (!fs.existsSync(filePath)) {
            row.statusText = "Local file missing";
            row.color = chalk.yellow;
            return row;
          }

          try {
            const remoteSecrets = await fetchDecryptedSecrets(
              config.projectId,
              env.id,
              projectKey
            );
            const localVars = parseEnvFile(filePath);
            const sync = calculateSyncStatus(localVars, remoteSecrets);

            if (sync.isSynced) {
              row.statusText = "Synced";
              row.color = chalk.green;
            } else {
              // Smart Summary
              const parts = [];
              if (sync.localOnly.length)
                parts.push(`+${sync.localOnly.length} local`);
              if (sync.remoteOnly.length)
                parts.push(`+${sync.remoteOnly.length} remote`);
              if (sync.modified.length)
                parts.push(`${sync.modified.length} diffs`);

              row.statusText = parts.join(", ");
              row.color = chalk.cyan;
              row.details = sync;
            }
          } catch (e) {
            row.statusText = "Access Error";
            row.color = chalk.red;
          }

          return row;
        })
      );

      spinner.stop();

      // 4. Render Table
      const maxFileLen = Math.max(...mappings.map(([, f]) => f.length), 10);
      const maxEnvLen = Math.max(...mappings.map(([e]) => e.length), 10);

      console.log(
        chalk.gray(
          `  ${"FILE".padEnd(maxFileLen)}   ${"ENVIRONMENT".padEnd(
            maxEnvLen
          )}   STATUS`
        )
      );
      console.log(
        chalk.gray(
          `  ${"-".repeat(maxFileLen)}   ${"-".repeat(
            maxEnvLen
          )}   ${"-".repeat(20)}`
        )
      );

      for (const row of statusRows) {
        console.log(
          `  ${row.filePath.padEnd(maxFileLen)}   ${row.envName.padEnd(
            maxEnvLen
          )}   ${row.color(row.statusText)}`
        );

        // Verbose Output
        if (options.verbose && row.details && !row.details.isSynced) {
          if (row.details.localOnly.length) {
            console.log(
              chalk.gray(
                `    └ New Local:  ${row.details.localOnly.join(", ")}`
              )
            );
          }
          if (row.details.remoteOnly.length) {
            console.log(
              chalk.gray(
                `    └ New Remote: ${row.details.remoteOnly.join(", ")}`
              )
            );
          }
          if (row.details.modified.length) {
            console.log(
              chalk.gray(`    └ Modified:   ${row.details.modified.join(", ")}`)
            );
          }
        }
      }

      // 5. Unlinked environments info
      const linkedEnvNames = mappings.map(([e]) => e.toLowerCase());
      const unlinkedEnvs = environments.filter(
        (e) => !linkedEnvNames.includes(e.name.toLowerCase())
      );

      if (unlinkedEnvs.length > 0) {
        console.log("");
        logger.info(
          `Tip: ${unlinkedEnvs.length} other environment(s) available on server.`
        );
        console.log(
          chalk.gray(`     (${unlinkedEnvs.map((e) => e.name).join(", ")})`)
        );
      }
    } catch (error: any) {
      logger.error("\nError: " + (error.message || error));
    }
  });
