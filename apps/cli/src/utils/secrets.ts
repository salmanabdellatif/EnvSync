/**
 * Secrets Utilities - Security Layer
 * Handles encryption/decryption of secrets
 */

import { configManager } from "../lib/config.js";
import { getProjectKey, getSecrets } from "../lib/api.js";
import {
  encryptSymmetric,
  decryptSymmetric,
  decryptAsymmetric,
} from "../lib/crypto.js";
import type {
  EnvMap,
  DecryptedSecretMap,
  EnvVariable,
  RemoteSecret,
} from "../types/index.js";

/**
 * Get and decrypt the project master key
 * @returns Decrypted project key as hex string
 * @throws Error if key not found or decryption fails
 */
export async function getDecryptedProjectKey(
  projectId: string
): Promise<string> {
  const { encryptedKey } = await getProjectKey(projectId);

  if (!encryptedKey) {
    throw new Error("Project key not found. Run 'envsync init' again.");
  }

  const privateKey = configManager.getPrivateKey();
  if (!privateKey) {
    throw new Error("Local key missing. Run 'envsync init' again.");
  }

  return decryptAsymmetric(encryptedKey, privateKey);
}

/**
 * Fetch and decrypt remote secrets for an environment
 */
export async function fetchDecryptedSecrets(
  projectId: string,
  envId: string,
  projectKey: string
): Promise<DecryptedSecretMap> {
  // Now typed as Promise<RemoteSecret[]> in api.ts (or cast here safely)
  const remoteRaw = (await getSecrets(projectId, envId)) as RemoteSecret[];
  const result: DecryptedSecretMap = {};

  for (const secret of remoteRaw) {
    try {
      result[secret.key] = {
        value: decryptSymmetric(
          {
            encryptedValue: secret.encryptedValue,
            iv: secret.iv,
            authTag: secret.authTag,
          },
          projectKey
        ),
        comment: secret.comment,
      };
    } catch {
      // Mark as failed so it gets overwritten
      result[secret.key] = {
        value: "__DECRYPTION_FAILED__",
        comment: "",
      };
    }
  }

  return result;
}

/**
 * Encrypt local variables for upload
 */
export function encryptSecrets(
  localVars: EnvMap,
  keys: string[],
  projectKey: string
): EnvVariable[] {
  return keys.map((key) => {
    const entry = localVars[key];
    const encrypted = encryptSymmetric(entry.value, projectKey);
    return {
      key,
      encryptedValue: encrypted.encryptedValue,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      comment: entry.comment,
    };
  });
}
