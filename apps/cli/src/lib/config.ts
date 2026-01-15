import Conf from "conf";

interface ProjectConfig {
  token?: string;
  userEmail?: string;
}

const config = new Conf<ProjectConfig>({
  projectName: "envsync",
  schema: {
    token: { type: "string" },
    userEmail: { type: "string" },
  },
});

export const configManager = {
  getToken: () => config.get("token"),
  getUserEmail: () => config.get("userEmail"),

  isAuthenticated: (): boolean => {
    return config.has("token") && config.has("userEmail");
  },

  setSession: (payload: { token: string; email: string }) => {
    config.set("token", payload.token);
    config.set("userEmail", payload.email);
  },

  clear: () => config.clear(),
  getPath: () => config.path,
};
