/**
 * Global static links used across the app.
 */
export const siteLinks = {
  github: "https://github.com/salmanabdellatif/EnvSync",
  docs: "https://envsync.tech/docs",
  website: "https://envsync.tech",
} as const;

export const cliCommands = {
  install: "npm install -g @envsync-labs/cli",
  login: "envsync login",
  init: "envsync init",
  push: "envsync push",
  pull: "envsync pull",
} as const;
