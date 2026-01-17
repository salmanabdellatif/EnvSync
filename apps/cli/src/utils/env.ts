import fs from "node:fs";

export interface EnvEntry {
  value: string;
  comment?: string;
}

export function parseEnvFile(filePath: string): Record<string, EnvEntry> {
  if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);

  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const result: Record<string, EnvEntry> = {};

  let pendingComment: string | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      pendingComment = null;
      continue;
    }

    if (trimmed.startsWith("#")) {
      pendingComment = trimmed.replace(/^#\s*/, "");
      continue;
    }

    // Parse Key=Value
    const cleanLine = trimmed.startsWith("export ")
      ? trimmed.slice(7)
      : trimmed;
    const separatorIndex = cleanLine.indexOf("=");

    if (separatorIndex === -1) {
      pendingComment = null;
      continue;
    }

    const key = cleanLine.slice(0, separatorIndex).trim();
    let value = cleanLine.slice(separatorIndex + 1).trim();

    // Strip quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key) {
      result[key] = {
        value,
        ...(pendingComment && { comment: pendingComment }),
      };
      pendingComment = null;
    }
  }

  return result;
}
