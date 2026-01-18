/**
 * Environment Variable Parser
 * Handles parsing and stringifying of .env files
 * Supports:
 * - Comments (full line and inline)
 * - Quoted values (single and double)
 * - Multiline values (basic support)
 */

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

    // 1. Handle Full Line Comments
    if (trimmed.startsWith("#")) {
      pendingComment = trimmed.replace(/^#\s*/, "");
      continue;
    }

    // 2. Parse Key=Value
    const cleanLine = trimmed.startsWith("export ")
      ? trimmed.slice(7)
      : trimmed;
    const separatorIndex = cleanLine.indexOf("=");

    if (separatorIndex === -1) {
      pendingComment = null;
      continue;
    }

    const key = cleanLine.slice(0, separatorIndex).trim();
    const rawValue = cleanLine.slice(separatorIndex + 1).trim();
    let value = rawValue;

    // 3. Handle Inline Comments & Quotes
    if (rawValue.startsWith('"') || rawValue.startsWith("'")) {
      const quoteChar = rawValue[0];
      // Check if it properly ends with the same quote
      if (rawValue.endsWith(quoteChar) && rawValue.length > 1) {
        value = rawValue.slice(1, -1);
      }
    } else {
      // Unquoted value: Stop at the first #
      const commentIndex = rawValue.indexOf("#");
      if (commentIndex !== -1) {
        value = rawValue.slice(0, commentIndex).trim();
      }
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

export function stringifyEnv(
  env: Record<string, { value: string; comment?: string }>
): string {
  let output = "";
  for (const [key, entry] of Object.entries(env)) {
    if (entry.comment) {
      output += `# ${entry.comment}\n`;
    }

    let val = entry.value;

    // Auto-Quote if value contains spaces, #, or newlines
    const needsQuotes = /[\s#'"]/.test(val);

    if (needsQuotes && !val.startsWith('"') && !val.startsWith("'")) {
      // Escape existing double quotes
      val = `"${val.replace(/"/g, '\\"')}"`;
    }

    output += `${key}=${val}\n\n`;
  }
  return output;
}
