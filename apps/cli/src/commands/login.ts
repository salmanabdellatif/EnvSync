import { Command } from "commander";
import ora from "ora";
import chalk from "chalk";
import open from "open";
import { configManager } from "../lib/config.js";
import {
  generateState,
  startAuthServer,
  buildLoginUrl,
} from "../lib/server.js";
import { logger } from "../utils/logger.js";
import { verifyToken } from "../lib/api.js";

export const loginCommand = new Command("login")
  .description("Authenticate with EnvSync via browser")
  .option("-f, --force", "Force re-login even if already authenticated")
  .action(async (options) => {
    if (configManager.isAuthenticated() && !options.force) {
      const email = configManager.getUserEmail();
      logger.info(`Already logged in as ${email}`);
      logger.info(
        'Use "--force" to re-login or "envsync logout" to switch accounts.'
      );
      return;
    }

    console.log(chalk.blue("\n🔐 EnvSync Login\n"));

    const state = generateState();
    const loginUrl = buildLoginUrl(state);
    const serverPromise = startAuthServer(state);

    console.log(chalk.gray("Opening browser for authentication..."));

    const spinner = ora("Waiting for browser authentication...");

    process.on("SIGINT", () => {
      if (spinner.isSpinning) {
        spinner.fail(chalk.yellow("Login cancelled by user."));
      } else {
        console.log(chalk.yellow("\nLogin cancelled by user."));
      }
      process.exit(0);
    });

    console.log(chalk.gray(`If browser doesn't open, visit:\n${loginUrl}\n`));

    try {
      await open(loginUrl);
      spinner.start();

      const result = await serverPromise;

      spinner.text = "Verifying credentials...";
      const userProfile = await verifyToken(result.token);

      configManager.setSession({
        token: result.token,
        email: userProfile.email,
      });

      spinner.succeed(chalk.green(`Logged in as ${userProfile.email}!`));
      console.log(chalk.gray(`Config saved to: ${configManager.getPath()}`));
    } catch (error: any) {
      spinner.fail(chalk.red(`Login failed: ${error.message}`));
      process.exit(1);
    }
  });
