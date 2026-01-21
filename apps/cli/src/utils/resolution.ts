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
  flagEnv?: string,
  options: { allowCreate?: boolean } = {}
): Promise<{ env: Environment; environments: Environment[] } | null> {
  const spinner = ora("Loading environments...").start();
  let environments: Environment[];
  const allowCreate = options.allowCreate !== false;

  try {
    environments = await getEnvironments(projectId);
    spinner.stop();
  } catch (e) {
    spinner.fail("Could not load environments.");
    throw e;
  }

  // 1. No environments exist
  if (environments.length === 0) {
    // For pull, can't create - need existing envs
    if (!allowCreate) {
      logger.error(
        "No environments found. Push secrets first to create an environment."
      );
      return null;
    }

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
  const result = await promptSelectOrCreateEnvironment(
    environments,
    "Select environment:",
    allowCreate
  );

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

// --- Push Target Resolution ---

export async function resolvePushTarget(config: ProjectConfig): Promise<{
  type: "ALL" | "SINGLE";
  env?: Environment;
  filePath?: string;
} | null> {
  // 1. Load Environments
  const spinner = ora("Loading environments...").start();
  let environments: Environment[];

  try {
    environments = await getEnvironments(config.projectId);
    spinner.stop();
  } catch (e: any) {
    spinner.fail("Failed to load environments");
    return null;
  }

  // Handle no environments
  if (environments.length === 0) {
    const newName = await promptCreateFirstEnvironment();
    if (!newName) return null;

    const createSpinner = ora("Creating environment...").start();
    try {
      const newEnv = await createEnvironment(config.projectId, newName);
      createSpinner.succeed(`Environment "${newEnv.name}" created.`);
      environments = [newEnv];
    } catch (e: any) {
      createSpinner.fail("Could not create environment.");
      logger.error(e.response?.data?.message || e.message);
      return null;
    }
  }

  // 2. Show Flat Menu
  const { promptSelectPushTarget, promptNewEnvironmentName } = await import(
    "./ui.js"
  );
  const selection = await promptSelectPushTarget(environments, config.mapping);

  // CASE A: Push All
  if (selection.type === "ALL") {
    return { type: "ALL" };
  }

  // CASE B: Existing Environment
  if (selection.type === "ENV" && selection.env) {
    const linkedFile = getLinkedFile(config, selection.env.name);

    if (linkedFile) {
      // Already linked
      return { type: "SINGLE", env: selection.env, filePath: linkedFile };
    }

    // Not linked - prompt for file and link it
    const unlinkedFiles = getUnlinkedFiles(config);

    if (unlinkedFiles.length === 0) {
      logger.warning("No unlinked .env files found.");
      logger.info(
        `Create a new file (e.g. .env.${selection.env.name}) and run push again.`
      );
      return null;
    }

    const selectedFile = await promptSelectFile(
      unlinkedFiles,
      `Select file for "${selection.env.name}":`
    );

    // Save link
    linkFileToEnv(config, selection.env.name, selectedFile);
    logger.success(`Linked: ${selectedFile} > ${selection.env.name}`);

    return { type: "SINGLE", env: selection.env, filePath: selectedFile };
  }

  // CASE C: Create New Environment
  if (selection.type === "CREATE") {
    // 1. Ask Name
    const newName = await promptNewEnvironmentName();

    // 2. Create via API
    const createSpinner = ora("Creating...").start();
    let newEnv: Environment;
    try {
      newEnv = await createEnvironment(config.projectId, newName);
      createSpinner.succeed(`Created "${newEnv.name}"`);
    } catch (e: any) {
      createSpinner.fail("Creation failed");
      logger.error(e.response?.data?.message || e.message);
      return null;
    }

    // 3. Check for unlinked files
    const unlinkedFiles = getUnlinkedFiles(config);

    if (unlinkedFiles.length === 0) {
      logger.warning("No unlinked .env files found.");
      logger.info(
        `Create a new file (e.g. .env.${newName}) and run push again.`
      );
      return null;
    }

    // 4. Select file to link
    const selectedFile = await promptSelectFile(
      unlinkedFiles,
      `Select file to link to ${newName}:`
    );

    // 5. Save link
    linkFileToEnv(config, newEnv.name, selectedFile);
    logger.success(`Linked: ${selectedFile} > ${newEnv.name}`);

    return { type: "SINGLE", env: newEnv, filePath: selectedFile };
  }

  return null;
}

// --- File Resolution ---

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
