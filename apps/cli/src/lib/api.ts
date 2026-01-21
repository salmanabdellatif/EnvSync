import axios from "axios";
import { configManager } from "./config.js";
import { BackupPayload } from "./crypto.js";
import {
  UserProfile,
  Environment,
  Project,
  EnvVariable,
  BatchChanges,
} from "../types/index.js";

const API_URL = "http://localhost:3000/api/v1";

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

// --- Interceptors ---

apiClient.interceptors.request.use((config) => {
  if (configManager.isAuthenticated()) {
    const token = configManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      if (!error.config.url?.includes("/auth/login")) {
        configManager.clear();
      }
    }
    return Promise.reject(error);
  }
);

// --- Response Types ---

export interface LoginResponse {
  token: string;
  user: UserProfile;
}

export interface PublicKeyResponse {
  publicKey: string | null;
}

export interface ProjectKeyResponse {
  encryptedKey: string | null;
}

export interface BatchResult {
  created: number;
  updated: number;
  deleted: number;
  message: string;
}

export interface BatchPayload {
  changes: BatchChanges;
}

// --- API Methods ---

export async function verifyToken(token?: string): Promise<UserProfile> {
  const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  return apiClient.get("/users/me", config);
}

// Public Key
export async function uploadPublicKey(
  publicKey: string
): Promise<{ message: string }> {
  return apiClient.post("/users/key", { publicKey });
}

export async function getMyPublicKey(): Promise<PublicKeyResponse> {
  return apiClient.get("/users/key");
}

// Private Key Backup
export async function uploadBackup(
  payload: BackupPayload
): Promise<{ message: string }> {
  return apiClient.post("/users/backup", payload);
}

export async function downloadBackup(): Promise<BackupPayload> {
  return apiClient.get("/users/backup");
}

// --- 2. Projects ---

export async function getProjects(): Promise<Project[]> {
  return apiClient.get("/projects");
}

export async function getProject(projectId: string): Promise<Project> {
  return apiClient.get(`/projects/${projectId}`);
}

export async function createProject(name: string): Promise<Project> {
  return apiClient.post("/projects", { name });
}

// Project Master Key (stored per-member with E2E encryption)
export async function getProjectKey(
  projectId: string
): Promise<ProjectKeyResponse> {
  return apiClient.get(`/projects/${projectId}/members/key`);
}

export async function initializeProjectKey(
  projectId: string,
  encryptedKey: string
): Promise<{ message: string }> {
  return apiClient.post(`/projects/${projectId}/members/key`, { encryptedKey });
}

// --- 3. Environments & Secrets ---

export async function getEnvironments(
  projectId: string
): Promise<Environment[]> {
  return apiClient.get(`/projects/${projectId}/environments`);
}

export async function createEnvironment(
  projectId: string,
  name: string
): Promise<Environment> {
  return apiClient.post(`/projects/${projectId}/environments`, { name });
}

export async function getEnvironment(
  projectId: string,
  slug: string
): Promise<Environment | undefined> {
  const envs = await getEnvironments(projectId);
  return envs.find((e) => e.name.toLowerCase() === slug.toLowerCase());
}

export async function getSecrets(
  projectId: string,
  envId: string
): Promise<EnvVariable[]> {
  return apiClient.get(
    `/projects/${projectId}/environments/${envId}/variables`
  );
}

export async function pushBatch(
  projectId: string,
  envId: string,
  changes: BatchChanges
): Promise<BatchResult> {
  const payload: BatchPayload = { changes };
  return apiClient.post(
    `/projects/${projectId}/environments/${envId}/variables/batch`,
    payload
  );
}

// --- 4. Members ---

export interface UserLookupResponse {
  id: string;
  name: string;
  email: string;
  publicKey: string | null;
}

export interface ProjectMember {
  user: {
    id: string;
    email: string;
    name: string;
  };
  role: string;
  wrappedKey: string | null;
}

export async function lookupUser(email: string): Promise<UserLookupResponse> {
  return apiClient.get(`/users/lookup?email=${encodeURIComponent(email)}`);
}

export async function getProjectMembers(
  projectId: string
): Promise<ProjectMember[]> {
  return apiClient.get(`/projects/${projectId}/members`);
}

export async function addProjectMember(
  projectId: string,
  email: string,
  role: string,
  wrappedKey: string
): Promise<{ message: string }> {
  return apiClient.post(`/projects/${projectId}/members`, {
    email,
    role,
    wrappedKey,
  });
}

export async function updateMemberKey(
  projectId: string,
  userId: string,
  wrappedKey: string
): Promise<{ message: string }> {
  return apiClient.patch(`/projects/${projectId}/members/${userId}/key`, {
    wrappedKey,
  });
}
