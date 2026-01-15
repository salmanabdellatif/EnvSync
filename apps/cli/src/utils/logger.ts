import chalk from "chalk";

export const logger = {
  info: (msg: string) => {
    console.log(chalk.blue("ℹ"), msg);
  },
  success: (msg: string) => {
    console.log(chalk.green("✔"), msg);
  },
  warning: (msg: string) => {
    console.log(chalk.yellow("⚠"), msg);
  },
  error: (msg: string) => {
    console.error(chalk.red("✖"), msg);
  },
  debug: (msg: string) => {
    // Only log debug messages if we are explicitly strictly debugging
    if (process.env.DEBUG) {
      console.log(chalk.gray(`[DEBUG] ${msg}`));
    }
  },
};
