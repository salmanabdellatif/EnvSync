/**
 * Validation Utilities
 */

// Environment variable key format: UPPERCASE_SNAKE_CASE
const ENV_KEY_REGEX = /^[A-Z_][A-Z0-9_]*$/;

// Environment name format: lowercase with dashes/underscores
const ENV_NAME_REGEX = /^[a-z0-9_-]+$/;

/**
 * Validate environment variable keys
 * @returns Array of invalid keys (empty if all valid)
 */
export function validateEnvKeys(keys: string[]): string[] {
  return keys.filter((key) => !ENV_KEY_REGEX.test(key));
}

/**
 * Check if all keys are valid
 */
export function areKeysValid(keys: string[]): boolean {
  return validateEnvKeys(keys).length === 0;
}

/**
 * Validate environment name format
 */
export function isValidEnvName(name: string): boolean {
  return ENV_NAME_REGEX.test(name.trim().toLowerCase());
}

/**
 * Format validation error message for keys
 */
export function formatKeyValidationError(invalidKeys: string[]): string {
  const shown = invalidKeys.slice(0, 5);
  const extra =
    invalidKeys.length > 5 ? `\n  ...and ${invalidKeys.length - 5} more` : "";

  return (
    "Invalid key names found:\n" +
    "Keys must be UPPERCASE (e.g., DATABASE_URL, API_KEY)\n" +
    shown.map((k) => `  - ${k}`).join("\n") +
    extra +
    "\n\nPlease rename them in your .env file and try again."
  );
}
