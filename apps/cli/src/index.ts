#!/usr/bin/env node
import { Command } from "commander";

const program = new Command();

program
  .name("envsync")
  .description("CLI for EnvSync - Manage your environment secrets")
  .version("1.0.0");

program
  .command("login")
  .description("Login to EnvSync")
  .action(() => {
    console.log("Login command executed!");
  });

program.parse(process.argv);
