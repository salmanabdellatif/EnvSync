import { Command } from "commander";
import { configManager } from "../lib/config.js";
import { logger } from "../utils/logger.js";

export const logoutCommand = new Command("logout")
  .description("Log out and clear local credentials")
  .action(async () => {
    if (!configManager.isAuthenticated()) {
      logger.warning("You are already logged out.");
      return;
    }

    const email = configManager.getUser()?.email;
    configManager.clear();
    logger.success(`Logged out from ${email}.`);
    logger.info("Local credentials have been removed.");
  });
