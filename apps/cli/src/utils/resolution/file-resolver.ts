/**
 * File Resolver - Orchestration Layer
 */

import fs from "node:fs";
import ora from "ora";
import type { ProjectConfig, Environment } from "../../types/index.js";
import { createEnvironment } from "../../lib/api.js";
import {
  detectEnvFiles,
  getLinkedFile,
  getLinkedEnv,
  getLinkedEnvNames,
  linkFileToEnv,
  getUnlinkedFiles,
} from "../config-file.js";
import {
  promptSelectFile,
  promptSelectOrCreateEnvironment,
  promptConfirm,
} from "../ui.js";
import { logger } from "../logger.js";

export async function resolveFile(
  config: ProjectConfig,
  environments: Environment[],
  flagFile?: string,
  flagEnv?: string,
  options: {
    allowNew?: boolean;
    allowCreate?: boolean;
    preResolvedEnv?: Environment;
  } = {}
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

      // Save the link if we just selected a file for this env
      env = environments.find(
        (e) => e.name.toLowerCase() === flagEnv.toLowerCase()
      );
      if (env) {
        linkFileToEnv(config, env.name, filePath);
        logger.success(`Linked: ${filePath} > ${env.name}`);
      }
    }

    if (!env) {
      env = environments.find(
        (e) => e.name.toLowerCase() === flagEnv.toLowerCase()
      );
    }
    if (!env) {
      logger.error(`Environment "${flagEnv}" not found.`);
      return null;
    }
  }
  // 3. No flags - select from unlinked files only
  else {
    const unlinkedFiles = getUnlinkedFiles(config);

    // If no unlinked files but we have files, all are linked
    if (unlinkedFiles.length === 0 && effectiveEnvFiles.length > 0) {
      // Show all files for existing linked scenario
      if (effectiveEnvFiles.length === 1) {
        filePath = effectiveEnvFiles[0];
        logger.debug(`Using: ${filePath}`);
      } else {
        filePath = await promptSelectFile(
          effectiveEnvFiles,
          "Which file do you want to use?"
        );
      }
    } else if (unlinkedFiles.length === 1) {
      filePath = unlinkedFiles[0];
      logger.debug(`Using: ${filePath}`);
    } else if (unlinkedFiles.length > 1) {
      filePath = await promptSelectFile(
        unlinkedFiles,
        "Which file do you want to link?"
      );
    } else {
      // Fresh clone scenario
      filePath = effectiveEnvFiles[0];
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
    // Use pre-resolved env if provided (avoids double-prompting)
    if (options.preResolvedEnv) {
      env = options.preResolvedEnv;
    } else {
      logger.info(`${filePath} is not linked to any environment.`);

      const linkedEnvNames = getLinkedEnvNames(config);
      const unlinkedEnvs = environments.filter(
        (e) => !linkedEnvNames.includes(e.name)
      );

      // Pass allowCreate option (false for pull command)
      const allowCreate = options.allowCreate !== false;
      const result = await promptSelectOrCreateEnvironment(
        unlinkedEnvs,
        "Link this file to:",
        allowCreate
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
    }

    linkFileToEnv(config, env.name, filePath);
    logger.success(`Linked: ${filePath} > ${env.name}`);
  }

  return { filePath, env, config };
}
