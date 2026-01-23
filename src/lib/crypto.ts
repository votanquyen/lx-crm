/**
 * Encryption Utilities for Sensitive Settings
 * Uses Node.js crypto with AES-256-GCM
 */
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

/**
 * Get encryption key from environment
 * Returns 32-byte key buffer
 * @throws Error in production if key not configured
 */
function getEncryptionKey(): Buffer {
  const key = process.env.SETTINGS_ENCRYPTION_KEY;
  if (!key) {
    // In production, encryption key is REQUIRED
    if (process.env.NODE_ENV === "production") {
      throw new Error("SETTINGS_ENCRYPTION_KEY must be set in production");
    }
    console.warn(
      "[crypto] SETTINGS_ENCRYPTION_KEY not set, using default (NOT SECURE FOR PRODUCTION)"
    );
    // Default key for development only - 32 bytes
    return Buffer.from("01234567890123456789012345678901");
  }
  if (key.length !== 64) {
    throw new Error("SETTINGS_ENCRYPTION_KEY must be 64 hex characters (32 bytes)");
  }
  return Buffer.from(key, "hex");
}

/**
 * Encrypt a plaintext string
 * Returns base64 string in format: iv:authTag:ciphertext
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, "utf8", "base64");
  encrypted += cipher.final("base64");

  const authTag = cipher.getAuthTag();

  return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted}`;
}

/**
 * Decrypt an encrypted string
 * Expects format: iv:authTag:ciphertext (all base64)
 */
export function decrypt(ciphertext: string): string {
  const key = getEncryptionKey();
  const parts = ciphertext.split(":");

  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
    throw new Error("Invalid encrypted format");
  }

  const iv = Buffer.from(parts[0], "base64");
  const authTag = Buffer.from(parts[1], "base64");
  const encrypted = parts[2];

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = decipher.update(encrypted, "base64", "utf8") + decipher.final("utf8");

  return decrypted;
}

/**
 * Check if a value appears to be encrypted (has our format)
 */
export function isEncrypted(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const parts = value.split(":");
  // Base64 IV of 16 bytes = 24 chars
  return parts.length === 3 && (parts[0]?.length ?? 0) === 24;
}
