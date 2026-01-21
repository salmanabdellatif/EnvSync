import { EnvMap, DecryptedSecretMap } from "../types/index.js";

export interface SyncStatus {
  totalDiff: number;
  localOnly: string[]; // Exists locally, missing on server
  remoteOnly: string[]; // Exists on server, missing locally
  modified: string[]; // Exists in both, but value differs
  isSynced: boolean;
}

/**
 * Calculates differences between local file and remote environment
 * Returns neutral naming (localOnly, remoteOnly, modified)
 */
export function calculateSyncStatus(
  localVars: EnvMap,
  remoteSecrets: DecryptedSecretMap
): SyncStatus {
  const localOnly: string[] = [];
  const remoteOnly: string[] = [];
  const modified: string[] = [];

  const remoteKeys = Object.keys(remoteSecrets);
  const localKeys = Object.keys(localVars);

  // 1. Check for Modified and Remote-Only (on server)
  for (const key of remoteKeys) {
    if (!localVars[key]) {
      remoteOnly.push(key);
    } else {
      const localVal = localVars[key].value?.trim() || "";
      const remoteVal = remoteSecrets[key].value?.trim() || "";
      const localComment = localVars[key].comment?.trim() || "";
      const remoteComment = remoteSecrets[key].comment?.trim() || "";

      // Compare values and comments
      if (localVal !== remoteVal || localComment !== remoteComment) {
        modified.push(key);
      }
    }
  }

  // 2. Check for Local-Only (secrets to be pushed)
  for (const key of localKeys) {
    if (!remoteSecrets[key]) {
      localOnly.push(key);
    }
  }

  const totalDiff = localOnly.length + remoteOnly.length + modified.length;

  return {
    totalDiff,
    localOnly,
    remoteOnly,
    modified,
    isSynced: totalDiff === 0,
  };
}
