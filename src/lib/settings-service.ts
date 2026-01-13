/**
 * Settings Service
 * Typed getter for settings with in-memory caching and env fallback
 */
import { prisma } from "./prisma";
import { decrypt, isEncrypted } from "./crypto";

// In-memory cache with TTL
interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get a single setting value with type safety
 * Priority: Cache → DB → Environment → defaultValue
 */
export async function getSetting<T = string>(
  key: string,
  defaultValue?: T
): Promise<T | undefined> {
  // Check cache first
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value as T;
  }

  // Query DB
  try {
    const setting = await prisma.setting.findUnique({
      where: { key },
      select: { value: true },
    });

    if (setting?.value !== undefined && setting.value !== null) {
      let value = setting.value;

      // Decrypt if encrypted
      if (isEncrypted(value)) {
        try {
          value = decrypt(value as string);
        } catch (err) {
          console.error(`[settings] Failed to decrypt ${key}:`, err);
        }
      }

      // Cache result
      cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
      return value as T;
    }
  } catch (err) {
    console.error(`[settings] Failed to fetch ${key}:`, err);
  }

  // Fallback to environment variable
  const envValue = process.env[key];
  if (envValue !== undefined) {
    return envValue as unknown as T;
  }

  return defaultValue;
}

/**
 * Get API key with env fallback
 * Convenience method for AI providers
 */
export async function getApiKey(key: string): Promise<string | undefined> {
  return getSetting<string>(key);
}

/**
 * Clear settings cache
 * Call after updates to ensure fresh data
 */
export function clearSettingsCache(key?: string): void {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}

/**
 * Get multiple settings at once
 * Returns partial object with found values
 */
export async function getSettings<T extends Record<string, unknown>>(
  keys: string[]
): Promise<Partial<T>> {
  const result: Record<string, unknown> = {};

  for (const key of keys) {
    result[key] = await getSetting(key);
  }

  return result as Partial<T>;
}

/**
 * Check if a setting exists in DB
 */
export async function hasSetting(key: string): Promise<boolean> {
  const setting = await prisma.setting.findUnique({
    where: { key },
    select: { id: true },
  });
  return setting !== null;
}
