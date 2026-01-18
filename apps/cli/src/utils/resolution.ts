/**
 * Resolution Utilities - Orchestration Layer
 */

import fs from "node:fs";
import ora from "ora";
import type { ProjectConfig, Environment } from "../types/index.js";
import { getEnvironments, createEnvironment } from "../lib/api.js";
import {
  detectEnvFiles,
  getLinkedFile,
  getLinkedEnv,
  getLinkedEnvNames,
  linkFileToEnv,
  getUnlinkedFiles,
} from "./config-file.js";
import {
  promptSelectFile,
  promptSelectOrCreateEnvironment,
  promptCreateFirstEnvironment,
  promptConfirm,
} from "./ui.js";
import { logger } from "./logger.js";

// --- Environment Resolution ---

export async function resolveEnvironment(
  projectId: string,
  flagEnv?: string
): Promise<{ env: Environment; environments: Environment[] } | null> {
  const spinner = ora("Loading environments...").start();
  let environments: Environment[];

  try {
    environments = await getEnvironments(projectId);
    spinner.stop();
  } catch (e) {
    spinner.fail("Could not load environments.");
    throw e;
  }

  // 1. No environments exist
  if (environments.length === 0) {
    const newName = await promptCreateFirstEnvironment();
    if (!newName) return null;

    const createSpinner = ora("Creating environment...").start();
    try {
      const newEnv = await createEnvironment(projectId, newName);
      createSpinner.succeed(`Environment "${newEnv.name}" created.`);
      return { env: newEnv, environments: [newEnv] };
    } catch (e: any) {
      createSpinner.fail("Could not create environment.");
      logger.error(e.response?.data?.message || e.message);
      return null;
    }
  }

  // 2. Flag provided
  if (flagEnv) {
    const env = environments.find(
      (e) => e.name.toLowerCase() === flagEnv.trim().toLowerCase()
    );
    if (!env) {
      logger.error(`Environment "${flagEnv}" not found.`);
      return null;
    }
    return { env, environments };
  }

  // 3. Single environment
  if (environments.length === 1) {
    logger.debug(`Using environment: ${environments[0].name}`);
    return { env: environments[0], environments };
  }

  // 4. Multiple environments (Prompt)
  const result = await promptSelectOrCreateEnvironment(environments);

  if (result.createNew && result.newName) {
    const createSpinner = ora("Creating environment...").start();
    try {
      const newEnv = await createEnvironment(projectId, result.newName);
      environments.push(newEnv);
      createSpinner.succeed(`Environment "${newEnv.name}" created.`);
      return { env: newEnv, environments };
    } catch (e: any) {
      createSpinner.fail("Could not create environment.");
      logger.error(e.response?.data?.message || e.message);
      return null;
    }
  }

  return { env: result.env!, environments };
}

// --- File Resolution ---

export async function resolveFile(
  config: ProjectConfig,
  environments: Environment[],
  flagFile?: string,
  flagEnv?: string,
  options: { allowNew?: boolean } = {}
): Promise<{
  filePath: string;
  env: Environment;
  config: ProjectConfig;
} | null> {
  const envFiles = detectEnvFiles();
  let effectiveEnvFiles = envFiles;

  // Fresh Clone Scenario
  if (envFiles.length === 0) {
    if (options.allowNew) {
      logger.warning("No .env files found (Fresh Clone detected).");
      const create = await promptConfirm("Create a new .env file?", true);
      if (!create) {
        logger.info("Cancelled.");
        return null;
      }
      effectiveEnvFiles = [".env"];
    } else {
      logger.error("No .env files found in this directory.");
      return null;
    }
  }

  let filePath: string;
  let env: Environment | undefined;

  // 1. File flag provided
  if (flagFile) {
    if (!fs.existsSync(flagFile) && !options.allowNew) {
      logger.error(`File not found: ${flagFile}`);
      return null;
    }
    filePath = flagFile;
  }
  // 2. Env flag provided
  else if (flagEnv) {
    const mappedFile = getLinkedFile(config, flagEnv);
    if (mappedFile && (fs.existsSync(mappedFile) || options.allowNew)) {
      filePath = mappedFile;
      logger.debug(`Using: ${filePath}`);
    } else {
      const unlinked = getUnlinkedFiles(config);

      if (unlinked.length === 0) {
        if (options.allowNew && envFiles.length === 0) {
          filePath = effectiveEnvFiles[0];
        } else {
          logger.error("All .env files are linked to other environments.");
          return null;
        }
      } else {
        filePath = await promptSelectFile(
          unlinked,
          `Select file for "${flagEnv}":`
        );
      }
    }

    env = environments.find(
      (e) => e.name.toLowerCase() === flagEnv.toLowerCase()
    );
    if (!env) {
      logger.error(`Environment "${flagEnv}" not found.`);
      return null;
    }
  }
  // 3. No flags
  else {
    if (effectiveEnvFiles.length === 1) {
      filePath = effectiveEnvFiles[0];
      logger.debug(`Using: ${filePath}`);
    } else {
      filePath = await promptSelectFile(
        effectiveEnvFiles,
        "Which file do you want to use?"
      );
    }
  }

  // Resolve Environment (if missing)
  if (!env) {
    const linkedEnvName = getLinkedEnv(config, filePath);
    if (linkedEnvName) {
      env = environments.find(
        (e) => e.name.toLowerCase() === linkedEnvName.toLowerCase()
      );
      if (env) logger.debug(`${filePath} > ${env.name}`);
    }
  }

  // Link if needed
  if (!env) {
    logger.info(`${filePath} is not linked to any environment.`);

    const linkedEnvNames = getLinkedEnvNames(config);
    const unlinkedEnvs = environments.filter(
      (e) => !linkedEnvNames.includes(e.name)
    );

    const result = await promptSelectOrCreateEnvironment(
      unlinkedEnvs,
      "Link this file to:"
    );

    if (result.createNew && result.newName) {
      const createSpinner = ora("Creating environment...").start();
      try {
        const newEnv = await createEnvironment(
          config.projectId,
          result.newName
        );
        env = newEnv;
        createSpinner.succeed(`Environment "${newEnv.name}" created.`);
      } catch (e: any) {
        createSpinner.fail("Could not create environment.");
        logger.error(e.response?.data?.message || e.message);
        return null;
      }
    } else {
      env = result.env!;
    }

    linkFileToEnv(config, env.name, filePath);
    logger.success(`Linked: ${filePath} > ${env.name}`);
  }

  return { filePath, env, config };
}
