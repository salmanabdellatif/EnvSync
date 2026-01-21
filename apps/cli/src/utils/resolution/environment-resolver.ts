/**
 * Environment Resolver - Orchestration Layer
 */

import ora from "ora";
import type { Environment } from "../../types/index.js";
import { getEnvironments, createEnvironment } from "../../lib/api.js";
import {
  promptSelectOrCreateEnvironment,
  promptCreateFirstEnvironment,
} from "../ui.js";
import { logger } from "../logger.js";

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
