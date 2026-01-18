/**
 * Shared types for EnvSync CLI
 */

// --- Project Configuration ---

export interface ProjectConfig {
  projectId: string;
  projectName: string;
  linkedAt: string;
  mapping: Record<string, string>; // envName -> filePath
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  publicKey?: string;
}

// --- Environment Variables ---

export interface EnvEntry {
  value: string;
  comment?: string;
}

export type EnvMap = Record<string, EnvEntry>;

// --- Remote Secrets ---

export interface RemoteSecret {
  key: string;
  encryptedValue: string;
  iv: string;
  authTag: string;
  comment?: string;
}

export interface DecryptedSecret {
  value: string;
  comment?: string;
}

export type DecryptedSecretMap = Record<string, DecryptedSecret>;

// --- Diff Results ---

export interface DiffResult {
  creates: string[];
  updates: string[];
  deletes: string[];
}

// --- API Responses ---

export interface Environment {
  id: string;
  name: string;
  projectId: string;
}

export interface Project {
  id: string;
  name: string;
  slug?: string;
  description?: string;
}

// --- Upload Payload ---

export interface EnvVariable {
  key: string;
  encryptedValue: string;
  iv: string;
  authTag: string;
  comment?: string;
}

export interface BatchChanges {
  creates: EnvVariable[];
  updates: EnvVariable[];
  deletes: string[];
}
