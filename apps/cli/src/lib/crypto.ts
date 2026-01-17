import crypto from "node:crypto";

// --- Types ---
export interface EncryptedData {
  encryptedValue: string; // Base64
  iv: string; // Base64
  authTag: string; // Base64
}

export interface BackupPayload {
  encryptedPrivateKey: string; // Base64
  iv: string; // Base64
  salt: string; // Base64
  authTag: string; // Base64
}

export interface KeyPair {
  publicKey: string; // PEM
  privateKey: string; // PEM
}

// --- 1. Project Master Key (Symmetric) ---

export function generateProjectKey(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function encryptSymmetric(text: string, keyHex: string): EncryptedData {
  const iv = crypto.randomBytes(16);
  const key = Buffer.from(keyHex, "hex");
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");
  const authTag = cipher.getAuthTag().toString("base64");

  return { encryptedValue: encrypted, iv: iv.toString("base64"), authTag };
}

export function decryptSymmetric(data: EncryptedData, keyHex: string): string {
  const key = Buffer.from(keyHex, "hex");
  const iv = Buffer.from(data.iv, "base64");
  const authTag = Buffer.from(data.authTag, "base64");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(data.encryptedValue, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

// --- 2. Identity Keys (RSA Asymmetric) ---

export function generateKeyPair(): KeyPair {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  return { publicKey: publicKey as string, privateKey: privateKey as string };
}

export function encryptAsymmetric(data: string, publicKey: string): string {
  const buffer = Buffer.from(data, "utf8");
  const encrypted = crypto.publicEncrypt(publicKey, buffer);
  return encrypted.toString("base64");
}

export function decryptAsymmetric(
  encryptedBase64: string,
  privateKey: string
): string {
  const buffer = Buffer.from(encryptedBase64, "base64");
  const decrypted = crypto.privateDecrypt(privateKey, buffer);
  return decrypted.toString("utf8");
}

// --- 3. Recovery Key (For Private Key Backup) ---

/**
 * Generates a high-entropy recovery key (16 bytes = 128 bits).
 * Format: RK-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX (8 blocks)
 */
export function generateRecoveryKey(): string {
  const bytes = crypto.randomBytes(16);
  const hex = bytes.toString("hex").toUpperCase(); // 32 chars

  // Split into blocks of 4 for readability
  const blocks = hex.match(/.{1,4}/g)?.join("-") || hex;

  return `RK-${blocks}`;
}

export function encryptWithRecoveryKey(
  privateKey: string,
  recoveryKey: string
): BackupPayload {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(recoveryKey, salt, 32);

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  let encrypted = cipher.update(privateKey, "utf8", "base64");
  encrypted += cipher.final("base64");
  const authTag = cipher.getAuthTag().toString("base64");

  return {
    encryptedPrivateKey: encrypted,
    iv: iv.toString("base64"),
    salt: salt.toString("base64"),
    authTag,
  };
}

export function decryptWithRecoveryKey(
  payload: BackupPayload,
  recoveryKey: string
): string {
  const salt = Buffer.from(payload.salt, "base64");
  const iv = Buffer.from(payload.iv, "base64");
  const authTag = Buffer.from(payload.authTag, "base64");

  const key = crypto.scryptSync(recoveryKey, salt, 32);

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(
    payload.encryptedPrivateKey,
    "base64",
    "utf8"
  );
  decrypted += decipher.final("utf8");
  return decrypted;
}
