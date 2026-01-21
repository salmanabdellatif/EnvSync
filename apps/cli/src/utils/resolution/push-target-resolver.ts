/**
 * Push Target Resolver - Orchestration Layer
 */

import ora from "ora";
import type { ProjectConfig, Environment } from "../../types/index.js";
import { getEnvironments, createEnvironment } from "../../lib/api.js";
import {
  getLinkedFile,
  getUnlinkedFiles,
  linkFileToEnv,
} from "../config-file.js";
import {
  promptSelectFile,
  promptCreateFirstEnvironment,
  promptSelectPushTarget,
  promptNewEnvironmentName,
} from "../ui.js";
import { logger } from "../logger.js";

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
