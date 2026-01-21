/**
 * Diff Utilities - Logic Layer
 * Compare local and remote secrets
 */

import chalk from "chalk";
import type { EnvMap, DecryptedSecretMap, DiffResult } from "../types/index.js";
import { logger } from "./logger.js";

/**
 * Calculate difference between local and remote secrets
 */
export function calculateDiff(
  local: EnvMap,
  remote: DecryptedSecretMap,
  prune = false
): DiffResult {
  const localKeys = Object.keys(local);
  const creates: string[] = [];
  const updates: string[] = [];
  const deletes: string[] = [];

  // Find creates and updates
  for (const key of localKeys) {
    if (!remote[key]) {
      creates.push(key);
    } else {
      const localEntry = local[key];
      const remoteEntry = remote[key];

      const valueChanged = localEntry.value !== remoteEntry.value;
      const commentChanged =
        (localEntry.comment || "") !== (remoteEntry.comment || "");

      if (valueChanged || commentChanged) {
        updates.push(key);
      }
    }
  }

  // Find deletes (only if prune is enabled)
  if (prune) {
    for (const key of Object.keys(remote)) {
      if (!localKeys.includes(key)) {
        deletes.push(key);
      }
    }
  }

  return { creates, updates, deletes };
}

/**
 * Check if there are any changes
 */
export function hasChanges(diff: DiffResult): boolean {
  return diff.creates.length + diff.updates.length + diff.deletes.length > 0;
}

/**
 * Get count of total changes
 */
export function getChangeCount(diff: DiffResult): number {
  return diff.creates.length + diff.updates.length + diff.deletes.length;
}

/**
 * Print diff summary to console
 */

/**
 * Print diff summary to console
 */
export function printDiffSummary(diff: DiffResult, envName: string): void {
  console.log(chalk.bold(`\nChanges for ${chalk.cyan(envName)}:`));

  if (diff.creates.length) {
    console.log(chalk.green(`  + ${diff.creates.length} new`));
  }
  if (diff.updates.length) {
    console.log(chalk.yellow(`  ~ ${diff.updates.length} updates`));
  }
  if (diff.deletes.length) {
    console.log(chalk.red(`  - ${diff.deletes.length} to delete`));
  }

  if (!hasChanges(diff)) {
    logger.success("Already in sync.");
  }
}

/**
 * Print delete warning
 */
export function printDeleteWarning(deletes: string[]): void {
  if (deletes.length === 0) return;

  logger.warning("These keys will be deleted from remote:");
  deletes.forEach((k) => console.log(chalk.red(`  - ${k}`)));
}

/**
 * Format sync result message
 */
export function formatSyncResult(diff: DiffResult): string {
  return `Synced: +${diff.creates.length} ~${diff.updates.length} -${diff.deletes.length}`;
}
