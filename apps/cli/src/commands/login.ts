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
import { verifyToken } from "../lib/api.js";

/**
 * Reusable browser login flow.
 * Can be called from login command or init command.
 */
export async function startBrowserLogin(): Promise<boolean> {
  const state = generateState();
  const loginUrl = buildLoginUrl(state);
  const serverPromise = startAuthServer(state);

  console.log(chalk.gray("Opening browser for authentication..."));
  console.log(chalk.gray(`If browser doesn't open, visit:\n${loginUrl}\n`));

  const spinner = ora("Waiting for browser authentication...");

  try {
    await open(loginUrl);
    spinner.start();

    const result = await serverPromise;

    spinner.text = "Verifying credentials...";
    const userProfile = await verifyToken(result.token);

    configManager.setAuth(result.token, userProfile);

    spinner.succeed(chalk.green(`Logged in as ${userProfile.email}!`));
    return true;
  } catch (error: any) {
    spinner.fail(chalk.red(`Login failed: ${error.message}`));
    return false;
  }
}

export const loginCommand = new Command("login")
  .description("Authenticate with EnvSync via browser")
  .option("-f, --force", "Force re-login even if already authenticated")
  .action(async (options) => {
    if (configManager.isAuthenticated() && !options.force) {
      const email = configManager.getUser()?.email;
      console.log(chalk.green(`Already logged in as ${chalk.bold(email)}`));
      console.log(
        chalk.gray(
          'Use "--force" to re-login or "envsync logout" to switch accounts.'
        )
      );
      return;
    }

    console.log(chalk.blue("\nEnvSync Login\n"));

    process.on("SIGINT", () => {
      console.log(chalk.yellow("\nLogin cancelled."));
      process.exit(0);
    });

    const success = await startBrowserLogin();
    if (success) {
      console.log(chalk.gray(`Config saved to: ${configManager.getPath()}`));
    } else {
      process.exit(1);
    }
  });
