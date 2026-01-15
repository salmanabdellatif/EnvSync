import { Command } from "commander";
import chalk from "chalk";
import { configManager } from "../lib/config.js";

export const whoamiCommand = new Command("whoami")
  .description("Display the current logged-in user")
  .action(async () => {
    if (!configManager.isAuthenticated()) {
      console.log(chalk.yellow("\nNot logged in."));
      console.log(`Run ${chalk.cyan("envsync login")} to get started.`);
      return;
    }

    const email = configManager.getUserEmail();

    console.log("\nCurrently logged in as:");
    console.log(chalk.green(`  ${email}`));

    console.log(chalk.gray(`\n(Config: ${configManager.getPath()})`));
  });
