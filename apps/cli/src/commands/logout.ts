import { Command } from "commander";
import chalk from "chalk";
import { configManager } from "../lib/config.js";
import { logger } from "../utils/logger.js";

export const logoutCommand = new Command("logout")
  .description("Log out and clear local credentials")
  .action(async () => {
    if (!configManager.isAuthenticated()) {
      logger.info(chalk.yellow("You are already logged out."));
      return;
    }

    const email = configManager.getUserEmail();
    configManager.clear();
    console.log(chalk.green(`\nLogged out from ${email}.`));
    console.log(chalk.gray("Local credentials have been removed."));
  });
