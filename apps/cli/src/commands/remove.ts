/**
 * Remove Member Command
 * Remove a member from the project
 */

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import inquirer from "inquirer";
import { configManager } from "../lib/config.js";
import { getProjectMembers, removeProjectMember } from "../lib/api.js";
import { loadProjectConfig } from "../utils/config-file.js";
import { logger } from "../utils/logger.js";
import { promptConfirm } from "../utils/ui.js";

export const removeCommand = new Command("remove")
  .description("Remove a member from the project")
  .argument("[email]", "Email of the member to remove")
  .action(async (emailArg) => {
    console.log(chalk.bold.blue("\nEnvSync Remove Member\n"));

    try {
      // 1. Auth & Config Check
      const config = loadProjectConfig();
      if (!config) {
        logger.error("Not linked to a project.");
        return;
      }
      if (!configManager.isAuthenticated()) {
        logger.error("Not logged in.");
        return;
      }

      // 2. Fetch Members
      const spinner = ora("Fetching project members...").start();
      const members = await getProjectMembers(config.projectId);
      spinner.stop();

      // 3. Resolve Target Email
      let email = emailArg;
      if (!email) {
        if (members.length <= 1) {
          logger.warning("No other members to remove.");
          return;
        }

        const { selectedEmail } = await inquirer.prompt([
          {
            type: "rawlist",
            name: "selectedEmail",
            message: "Select member to remove:",
            choices: members
              .filter((m) => m.user.id !== configManager.getUser()?.id) // Don't list self primarily
              .map((m) => ({
                name: `${m.user.name} (${m.user.email}) - ${m.role}`,
                value: m.user.email,
              })),
          },
        ]);
        email = selectedEmail;
      }

      // 4. Find Target
      const target = members.find(
        (m) => m.user.email.toLowerCase() === email.toLowerCase()
      );

      if (!target) {
        logger.error(`User ${email} is not a member of this project.`);
        return;
      }

      // 5. Safety Checks
      const currentUser = configManager.getUser();
      if (target.user.id === currentUser?.id) {
        logger.warning("You are trying to remove yourself.");
        const selfConfirm = await promptConfirm(
          "Are you sure you want to leave this project?",
          false
        );
        if (!selfConfirm) return;
      }

      if (target.role === "OWNER") {
        logger.warning(
          `${chalk.bold(target.user.email)} is an OWNER of this project.`
        );
        logger.info(
          "Removal will only succeed if there is at least one other owner remaining."
        );
      }

      // 6. Final Confirmation
      const confirmed = await promptConfirm(
        `Are you sure you want to remove ${chalk.bold(target.user.name)} (${
          target.user.email
        })?`,
        false
      );

      if (!confirmed) {
        logger.info("Cancelled.");
        return;
      }

      // 7. Execution
      const removeSpinner = ora(`Removing ${target.user.email}...`).start();
      try {
        await removeProjectMember(config.projectId, target.user.id);
        removeSpinner.succeed("Member removed.");

        logger.success(
          `${target.user.email} no longer has access to this project.`
        );
      } catch (e: any) {
        removeSpinner.fail("Failed to remove member.");
        logger.error(e.response?.data?.message || e.message);
      }
    } catch (error: any) {
      logger.error("\nError: " + (error.message || error));
    }
  });
