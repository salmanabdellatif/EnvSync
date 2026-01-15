#!/usr/bin/env node
import { Command } from "commander";
import { loginCommand } from "./commands/login.js";
import { logoutCommand } from "./commands/logout.js";

const program = new Command();

program
  .name("envsync")
  .description("CLI for EnvSync - E2E encrypted secrets management")
  .version("0.1.0");

// Register commands
program.addCommand(loginCommand);
program.addCommand(logoutCommand);

program.parse(process.argv);
