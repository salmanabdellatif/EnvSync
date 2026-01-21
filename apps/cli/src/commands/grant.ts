/**
 * Grant Command
 * Grant crypto access to project members who are missing their wrapped keys
 */

import { Command } from "commander";
import chalk from "chalk";
import ora, { Ora } from "ora";
import inquirer from "inquirer";
import { configManager } from "../lib/config.js";
import {
  getProjectMembers,
  updateMemberKey,
  lookupUser,
  ProjectMember,
} from "../lib/api.js";
import { loadProjectConfig } from "../utils/config-file.js";
import { getDecryptedProjectKey } from "../utils/secrets.js";
import { encryptAsymmetric } from "../lib/crypto.js";
import { logger } from "../utils/logger.js";
import { promptConfirm } from "../utils/ui.js";

/**
 * Helper: Processes a grant for a single internal member object
 */
async function processGrantAction(
  projectId: string,
  member: ProjectMember,
  projectKeyRaw: string,
  spinner?: Ora
) {
  try {
    // 1. Get their Public Key
    const userDetails = await lookupUser(member.user.email);
    if (!userDetails.publicKey) {
      if (spinner) {
        spinner.stop();
        console.log(
          chalk.yellow(`  [SKIP] ${member.user.email} - No CLI setup yet`)
        );
        spinner.start();
      }
      return false;
    }

    // 2. Encrypt project key with their public key
    const wrappedKey = encryptAsymmetric(projectKeyRaw, userDetails.publicKey);

    // 3. Upload wrapped key
    await updateMemberKey(projectId, member.user.id, wrappedKey);
    return true;
  } catch (e: any) {
    if (spinner) {
      spinner.stop();
      console.log(chalk.red(`  [ERR]  ${member.user.email} - ${e.message}`));
      spinner.start();
    }
    return false;
  }
}

export const grantCommand = new Command("grant")
  .description("Grant crypto access to project members")
  .argument("[email]", "Email of the member to fix (optional if --all used)")
  .option("-a, --all", "Grant access to ALL members missing keys")
  .action(async (emailArg, options) => {
    console.log(chalk.bold.blue("\nEnvSync Grant Access\n"));

    try {
      // 1. Auth & Config Check
      const config = loadProjectConfig();
      if (!config) {
        logger.error("This directory is not linked to a project.");
        logger.info(`Run ${chalk.cyan("envsync init")} first.`);
        return;
      }
      if (!configManager.isAuthenticated()) {
        logger.error("You are not logged in.");
        logger.info(`Run ${chalk.cyan("envsync login")} first.`);
        return;
      }

      // 2. Resolve Email (Prompt if needed and NOT --all)
      let email = emailArg;
      if (!email && !options.all) {
        const { inputEmail } = await inquirer.prompt([
          {
            type: "input",
            name: "inputEmail",
            message: "Enter user email to grant access:",
            validate: (input: string) => {
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              return emailRegex.test(input) || "Invalid email format";
            },
          },
        ]);
        email = inputEmail;
      }

      // 3. Fetch Members
      const memberSpinner = ora("Checking project members...").start();
      const members = await getProjectMembers(config.projectId);
      memberSpinner.stop();

      // 4. Unlock the Vault ONCE (efficient)
      const vaultSpinner = ora("Unlocking project vault...").start();
      let projectKeyRaw: string;
      try {
        projectKeyRaw = await getDecryptedProjectKey(config.projectId);
        vaultSpinner.succeed("Vault unlocked.");
      } catch (e: any) {
        vaultSpinner.fail("Could not unlock project vault.");
        logger.error(e.message);
        return;
      }

      // ==========================================
      // PATH A: BATCH MODE (--all)
      // ==========================================
      if (options.all) {
        const pendingFixes = members.filter((m) => !m.wrappedKey);

        if (pendingFixes.length === 0) {
          logger.success("All members already have access keys!");
          return;
        }

        console.log("");
        logger.info(
          `Found ${pendingFixes.length} member(s) needing access keys:\n`
        );
        for (const m of pendingFixes) {
          console.log(chalk.gray(`  - ${m.user.email} (${m.role})`));
        }
        console.log("");

        const confirm = await promptConfirm(
          "Grant access to all of them?",
          true
        );
        if (!confirm) {
          logger.info("Cancelled.");
          return;
        }

        const batchSpinner = ora("Processing...").start();
        let successCount = 0;

        for (const member of pendingFixes) {
          batchSpinner.text = `Granting to ${member.user.email}...`;
          const success = await processGrantAction(
            config.projectId,
            member,
            projectKeyRaw,
            batchSpinner
          );
          if (success) successCount++;
        }

        batchSpinner.succeed("Batch grant complete.");
        logger.success(`\nGranted access to ${successCount} member(s).`);
        if (successCount < pendingFixes.length) {
          logger.warning(
            `${
              pendingFixes.length - successCount
            } user(s) skipped. Tell them to run 'envsync login' first.`
          );
        }
        return;
      }

      // ==========================================
      // PATH B: SINGLE USER MODE
      // ==========================================

      const targetMember = members.find(
        (m) => m.user.email.toLowerCase() === email.toLowerCase()
      );

      if (!targetMember) {
        logger.error(`User ${email} is not a member of this project.`);
        logger.info(`Run ${chalk.cyan(`envsync add ${email}`)} first.`);
        return;
      }

      if (targetMember.wrappedKey) {
        logger.success(`${email} already has an access key.`);
        const force = await promptConfirm("Re-generate it anyway?", false);
        if (!force) {
          logger.info("Cancelled.");
          return;
        }
      } else {
        // Confirmation for first-time grant
        const confirmed = await promptConfirm(
          `Grant access to ${email}?`,
          true
        );
        if (!confirmed) {
          logger.info("Cancelled.");
          return;
        }
      }

      const singleSpinner = ora(`Granting access to ${email}...`).start();
      const success = await processGrantAction(
        config.projectId,
        targetMember,
        projectKeyRaw,
        singleSpinner
      );

      if (success) {
        singleSpinner.succeed("Access granted!");
        logger.success(`${email} can now run 'envsync init' or 'pull'.`);
      } else {
        singleSpinner.fail("Failed to grant access.");
      }
    } catch (error: any) {
      logger.error(
        "\nError: " + (error.response?.data?.message || error.message)
      );
    }
  });
