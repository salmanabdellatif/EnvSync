/**
 * Project Configuration Layer
 * Handles envsync.json and .env file detection
 */

import fs from "node:fs";
import path from "node:path";
import type { ProjectConfig } from "../types/index.js";

const CONFIG_FILENAME = "envsync.json";

/**
 * Get path to project config file
 */
export function getConfigPath(): string {
  return path.join(process.cwd(), CONFIG_FILENAME);
}

/**
 * Check if project config exists
 */
export function configExists(): boolean {
  return fs.existsSync(getConfigPath());
}

/**
 * Load project configuration
 * @returns ProjectConfig or null if not found
 */
export function loadProjectConfig(): ProjectConfig | null {
  const configPath = getConfigPath();
  if (!fs.existsSync(configPath)) return null;

  try {
    const raw = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    // Ensure mapping exists
    if (!raw.mapping) raw.mapping = {};
    return raw as ProjectConfig;
  } catch {
    return null;
  }
}

/**
 * Save project configuration
 */
export function saveProjectConfig(config: ProjectConfig): void {
  const configPath = getConfigPath();
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

/**
 * Get file linked to an environment
 */
export function getLinkedFile(
  config: ProjectConfig,
  envName: string
): string | null {
  return config.mapping[envName] || null;
}

/**
 * Get environment linked to a file
 */
export function getLinkedEnv(
  config: ProjectConfig,
  filePath: string
): string | null {
  const entry = Object.entries(config.mapping).find(
    ([, file]) => file === filePath
  );
  return entry ? entry[0] : null;
}

/**
 * Link a file to an environment
 */
export function linkFileToEnv(
  config: ProjectConfig,
  envName: string,
  filePath: string
): void {
  config.mapping[envName] = filePath;
  saveProjectConfig(config);
}

/**
 * Get all linked environment names
 */
export function getLinkedEnvNames(config: ProjectConfig): string[] {
  return Object.keys(config.mapping);
}

/**
 * Get all linked file paths
 */
export function getLinkedFiles(config: ProjectConfig): string[] {
  return Object.values(config.mapping);
}

/**
 * Detect .env files in current directory
 * Excludes .example files
 */
export function detectEnvFiles(): string[] {
  try {
    return fs
      .readdirSync(process.cwd())
      .filter((f) => f.startsWith(".env") && !f.includes(".example"));
  } catch {
    return [];
  }
}

/**
 * Get unlinked .env files (not mapped to any environment)
 */
export function getUnlinkedFiles(config: ProjectConfig): string[] {
  const linkedFiles = getLinkedFiles(config).map((f) => path.resolve(f));
  return detectEnvFiles().filter((f) => {
    const absPath = path.resolve(f);
    return !linkedFiles.includes(absPath);
  });
}
