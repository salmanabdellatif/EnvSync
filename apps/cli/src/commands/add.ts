/**
 * Add Member Command
 * Add a member to the current project with security best practices
 */

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import inquirer from "inquirer";
import { configManager } from "../lib/config.js";
import { lookupUser, addProjectMember, getProjectMembers } from "../lib/api.js";
import { loadProjectConfig } from "../utils/config-file.js";
import { getDecryptedProjectKey } from "../utils/secrets.js";
import { encryptAsymmetric } from "../lib/crypto.js";
import { logger } from "../utils/logger.js";
import { promptConfirm } from "../utils/ui.js";

// Rich role descriptions for clarity
const ROLE_CHOICES = [
  { name: `Member  ${chalk.gray("- Read & Write secrets")}`, value: "MEMBER" },
  {
    name: `Admin   ${chalk.gray("- Manage members & settings")}`,
    value: "ADMIN",
  },
  { name: `Viewer  ${chalk.gray("- Read-only access")}`, value: "VIEWER" },
  {
    name: `Owner   ${chalk.gray("- Full danger zone access")}`,
    value: "OWNER",
  },
];

const VALID_ROLES = ["OWNER", "ADMIN", "MEMBER", "VIEWER"];

export const addCommand = new Command("add")
  .description("Add a member to the project")
  .argument("<email>", "User's email address")
  .argument("[role]", "Role (OWNER, ADMIN, MEMBER, VIEWER)")
  .action(async (email, roleArgument) => {
    console.log(chalk.bold.blue("\nEnvSync Add Member\n"));

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

      // 2. Email Validation (Regex)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        logger.error("Invalid email format.");
        return;
      }

      // 3. Validate Role (if provided via argument)
      let role = roleArgument ? roleArgument.toUpperCase() : null;
      if (role && !VALID_ROLES.includes(role)) {
        logger.error(`Invalid role: ${role}`);
        console.log(`Valid roles: ${VALID_ROLES.join(", ")}`);
        return;
      }

      // 4. User Lookup with Spinner
      const spinner = ora(`Looking up ${email}...`).start();
      let targetUser;
      try {
        targetUser = await lookupUser(email);
        spinner.stop();
      } catch (e: any) {
        spinner.fail("User not found.");
        logger.info(`Ask ${chalk.bold(email)} to register on EnvSync first.`);
        return;
      }

      // 5. Crypto Safety Check (Block users without CLI keys)
      if (!targetUser.publicKey) {
        logger.warning(
          `User ${targetUser.name} has not set up their CLI keys.`
        );
        logger.info("Cannot securely share secrets yet.");
        logger.info("Tell them to run 'envsync login' or 'init' first.");
        return;
      }

      // 6. Duplicate Check (Avoid 409 Conflict)
      const members = await getProjectMembers(config.projectId);
      const existing = members.find((m) => m.user.id === targetUser.id);

      if (existing) {
        logger.warning(
          `${targetUser.email} is already a member (${existing.role}).`
        );

        // Smart Grant Suggestion: If they exist but no wrapped key
        if (!existing.wrappedKey) {
          console.log("");
          logger.info("However, they are missing their secure access key.");
          logger.info(
            `Run ${chalk.cyan(`envsync grant ${email}`)} to fix this.`
          );
        }
        return;
      }

      // 7. Identity Confirmation (Visual check before proceeding)
      console.log(chalk.gray("--------------------------------"));
      console.log(`  User:  ${chalk.bold(targetUser.name)}`);
      console.log(`  Email: ${chalk.cyan(targetUser.email)}`);
      console.log(chalk.gray("--------------------------------"));

      // 8. Role Selection with Descriptions
      if (!role) {
        const { selectedRole } = await inquirer.prompt([
          {
            type: "list",
            name: "selectedRole",
            message: "Select permission level:",
            choices: ROLE_CHOICES,
            pageSize: 4,
          },
        ]);
        role = selectedRole;
      }

      // 9. Final Confirmation (Include role in message)
      console.log("");
      const confirmed = await promptConfirm(
        `Add ${targetUser.name} as ${chalk.bold(role)}?`,
        true
      );
      if (!confirmed) {
        logger.info("Cancelled.");
        return;
      }

      // 10. Crypto Ceremony (Generate Wrapped Key)
      const cryptoSpinner = ora("Encrypting access key...").start();

      let projectKeyRaw: string;
      try {
        projectKeyRaw = await getDecryptedProjectKey(config.projectId);
      } catch (e: any) {
        cryptoSpinner.fail("Could not unlock project vault.");
        logger.error(e.message);
        return;
      }

      // Encrypt project key with target user's public key
      const wrappedKey = encryptAsymmetric(projectKeyRaw, targetUser.publicKey);

      // 11. Execute API Call
      cryptoSpinner.text = "Adding member...";

      await addProjectMember(
        config.projectId,
        targetUser.email,
        role!,
        wrappedKey
      );

      cryptoSpinner.succeed("Member added successfully!");

      // 12. Success Message with Next-Step Tip
      logger.success(`${targetUser.email} is now a ${role}.`);
      logger.info(
        `Tell them to run ${chalk.cyan("envsync pull")} to get started.`
      );
    } catch (error: any) {
      logger.error(
        "\nError: " + (error.response?.data?.message || error.message)
      );
    }
  });
