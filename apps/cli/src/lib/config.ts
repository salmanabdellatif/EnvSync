import Conf from "conf";

// --- Types ---

export interface UserProfile {
  id: string;
  email: string;
  name: string;
}

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

interface ProjectConfig {
  token?: string;
  user?: UserProfile;
  publicKey?: string;
  privateKey?: string;
}

// --- Configuration ---

const config = new Conf<ProjectConfig>({
  projectName: "envsync",
  schema: {
    token: { type: "string" },
    user: {
      type: "object",
      properties: {
        id: { type: "string" },
        email: { type: "string" },
        name: { type: "string" },
      },
    },
    publicKey: { type: "string" },
    privateKey: { type: "string" },
  },
});

// --- Manager ---

export const configManager = {
  // 1. Authentication
  setAuth(token: string, user: UserProfile) {
    config.set("token", token);
    config.set("user", user);
  },

  getToken(): string | undefined {
    return config.get("token");
  },

  getUser(): UserProfile | undefined {
    return config.get("user");
  },

  isAuthenticated(): boolean {
    return config.has("token") && config.has("user");
  },

  logout() {
    config.clear();
  },

  // 2. Encryption Keys (Identity)
  setKeyPair(keys: KeyPair) {
    config.set("publicKey", keys.publicKey);
    config.set("privateKey", keys.privateKey);
  },

  getPublicKey(): string | undefined {
    return config.get("publicKey");
  },

  getPrivateKey(): string | undefined {
    return config.get("privateKey");
  },

  // 3. Debugging / Utils
  clear: () => config.clear(),
  getPath: () => config.path,
};
