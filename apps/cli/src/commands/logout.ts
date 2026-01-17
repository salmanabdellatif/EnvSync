import { Command } from "commander";
import chalk from "chalk";
import { configManager } from "../lib/config.js";

export const logoutCommand = new Command("logout")
  .description("Log out and clear local credentials")
  .action(async () => {
    if (!configManager.isAuthenticated()) {
      console.log(chalk.yellow("You are already logged out."));
      return;
    }

    const email = configManager.getUser()?.email;
    configManager.clear();
    console.log(chalk.green(`\nLogged out from ${email}.`));
    console.log(chalk.gray("Local credentials have been removed."));
  });
