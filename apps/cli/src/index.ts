#!/usr/bin/env node
import { Command } from "commander";
import { loginCommand } from "./commands/login.js";
import { logoutCommand } from "./commands/logout.js";
import { whoamiCommand } from "./commands/whoami.js";
import { initCommand } from "./commands/init.js";
import { pushCommand } from "./commands/push.js";
import { pullCommand } from "./commands/pull.js";
import { addCommand } from "./commands/add.js";
import { grantCommand } from "./commands/grant.js";
import { statusCommand } from "./commands/status.js";
import { removeCommand } from "./commands/remove.js";

const program = new Command();

program
  .name("envsync")
  .description("CLI for EnvSync - E2E encrypted secrets management")
  .version("0.1.0");

// Register commands
program.addCommand(loginCommand);
program.addCommand(logoutCommand);
program.addCommand(whoamiCommand);
program.addCommand(initCommand);
program.addCommand(pushCommand);
program.addCommand(pullCommand);
program.addCommand(addCommand);
program.addCommand(removeCommand);
program.addCommand(grantCommand);
program.addCommand(statusCommand);

program.parse(process.argv);
