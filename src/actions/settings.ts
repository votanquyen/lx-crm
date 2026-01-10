/**
 * Settings Server Actions
 * CRUD operations for system settings (ADMIN only)
 */
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { createAction, type ActionResponse } from "@/lib/action-utils";
import { AppError, NotFoundError } from "@/lib/errors";
import { encrypt, decrypt } from "@/lib/crypto";
import { clearSettingsCache } from "@/lib/settings-service";
import { createAuditLog } from "@/lib/audit";
import { maskValue } from "@/lib/mask-value";

// Schema definitions
const settingKeySchema = z.string().min(1).max(100);

const createSettingSchema = z.object({
  key: settingKeySchema,
  value: z.unknown(),
  description: z.string().optional(),
  category: z.string().optional(),
  isPublic: z.boolean().optional(),
  isSensitive: z.boolean().optional(),
});

// Keys that should be encrypted in DB
const SENSITIVE_KEYS = [
  "GROQ_API_KEY",
  "OPENROUTER_API_KEY",
  "GOOGLE_AI_API_KEY",
  "GOOGLE_MAPS_API_KEY",
  "SMTP_PASSWORD",
  "WEBHOOK_SECRET",
  "DATABASE_URL",
  "AUTH_SECRET",
];

/**
 * Get all settings (ADMIN only)
 * Masks sensitive values for display
 */
export async function getAllSettings() {
  await requireAdmin();

  const settings = await prisma.setting.findMany({
    orderBy: [{ category: "asc" }, { key: "asc" }],
  });

  // Mask sensitive values
  return settings.map((s) => ({
    ...s,
    value: SENSITIVE_KEYS.includes(s.key) ? maskValue(s.value) : s.value,
    isSensitive: SENSITIVE_KEYS.includes(s.key),
  }));
}

/**
 * Get settings by category (ADMIN only)
 */
export async function getSettingsByCategory(category: string) {
  await requireAdmin();

  const settings = await prisma.setting.findMany({
    where: { category },
    orderBy: { key: "asc" },
  });

  return settings.map((s) => ({
    ...s,
    value: SENSITIVE_KEYS.includes(s.key) ? maskValue(s.value) : s.value,
    isSensitive: SENSITIVE_KEYS.includes(s.key),
  }));
}

/**
 * Get a single setting value (INTERNAL USE ONLY)
 * Returns decrypted value if sensitive
 * @internal - Do not use outside of settings module
 */
async function _getSettingValueInternal(key: string): Promise<unknown> {
  const setting = await prisma.setting.findUnique({
    where: { key },
  });

  if (!setting) return null;

  if (SENSITIVE_KEYS.includes(key)) {
    try {
      return decrypt(setting.value as string);
    } catch {
      // Return as-is if not encrypted (legacy or plain value)
      return setting.value;
    }
  }

  return setting.value;
}

/**
 * Create or update a setting (ADMIN only)
 */
export const upsertSetting = createAction(createSettingSchema, async (input) => {
  const session = await requireAdmin();

  let value = input.value;

  // Encrypt sensitive values
  if (input.isSensitive || SENSITIVE_KEYS.includes(input.key)) {
    // Only encrypt if value is not empty and not already a masked value
    const strValue = String(value);
    if (strValue && !strValue.includes("****")) {
      value = encrypt(strValue);
    } else {
      // Skip update if trying to save masked value
      if (strValue.includes("****")) {
        return { success: true, key: input.key, skipped: true };
      }
    }
  }

  const setting = await prisma.setting.upsert({
    where: { key: input.key },
    create: {
      key: input.key,
      value: value as Prisma.InputJsonValue,
      description: input.description,
      category: input.category ?? "general",
      isPublic: input.isPublic ?? false,
      updatedById: session.user.id,
    },
    update: {
      value: value as Prisma.InputJsonValue,
      description: input.description,
      updatedById: session.user.id,
    },
  });

  // Audit log - mask sensitive values for logging
  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "Setting",
    entityId: setting.key,
    description: `Setting ${setting.key} updated`,
    newValues: {
      key: setting.key,
      category: setting.category,
      value: SENSITIVE_KEYS.includes(setting.key) ? "***" : setting.value,
    },
  });

  // Clear cache for this key
  clearSettingsCache(input.key);

  revalidatePath("/admin/settings");
  return { success: true, key: setting.key };
});

/**
 * Delete a setting (ADMIN only)
 */
export async function deleteSetting(key: string): Promise<ActionResponse<{ success: true }>> {
  try {
    const session = await requireAdmin();

    const existing = await prisma.setting.findUnique({ where: { key } });
    if (!existing) throw new NotFoundError("Cài đặt");

    await prisma.setting.delete({ where: { key } });

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      action: "DELETE",
      entityType: "Setting",
      entityId: key,
      description: `Setting ${key} deleted`,
      oldValues: {
        key: existing.key,
        category: existing.category,
        value: SENSITIVE_KEYS.includes(key) ? "***" : existing.value,
      },
    });

    // Clear cache
    clearSettingsCache(key);

    revalidatePath("/admin/settings");
    return { success: true, data: { success: true } };
  } catch (error) {
    if (error instanceof AppError) {
      return { success: false, error: error.message, code: error.code };
    }
    return { success: false, error: "Lỗi hệ thống" };
  }
}

/**
 * Test API key connection
 * Returns success/failure status with real API validation for Groq
 */
export async function testApiKey(
  provider: "groq" | "openrouter" | "gemini" | "maps"
): Promise<ActionResponse<{ valid: boolean; message: string }>> {
  try {
    await requireAdmin();

    const keyMap = {
      groq: "GROQ_API_KEY",
      openrouter: "OPENROUTER_API_KEY",
      gemini: "GOOGLE_AI_API_KEY",
      maps: "GOOGLE_MAPS_API_KEY",
    } as const;

    const keyName = keyMap[provider];
    const apiKey = await _getSettingValueInternal(keyName);
    const keyStr = String(apiKey || process.env[keyName] || "");

    if (!keyStr || keyStr.length < 10) {
      return {
        success: true,
        data: { valid: false, message: `${keyName} chưa được cấu hình` },
      };
    }

    // Perform real API validation for each provider
    switch (provider) {
      case "groq":
        return await testGroqApiKey(keyStr);
      case "gemini":
        return await testGeminiApiKey(keyStr);
      case "maps":
        return await testMapsApiKey(keyStr);
      case "openrouter":
        return await testOpenRouterApiKey(keyStr);
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Lỗi kiểm tra",
    };
  }
}

/**
 * Test Groq API key by calling /models endpoint
 * Uses 5-second timeout to prevent hanging
 */
async function testGroqApiKey(
  apiKey: string
): Promise<ActionResponse<{ valid: boolean; message: string }>> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch("https://api.groq.com/openai/v1/models", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      return {
        success: true,
        data: { valid: true, message: "Kết nối Groq thành công" },
      };
    }

    if (response.status === 401) {
      return {
        success: true,
        data: { valid: false, message: "API key không hợp lệ hoặc đã hết hạn" },
      };
    }

    return {
      success: true,
      data: { valid: false, message: `Lỗi Groq API: ${response.status}` },
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return {
        success: true,
        data: { valid: false, message: "Timeout - Groq không phản hồi" },
      };
    }
    return {
      success: true,
      data: { valid: false, message: "Lỗi kết nối mạng" },
    };
  }
}

/**
 * Test Gemini API key by calling /models endpoint
 */
async function testGeminiApiKey(
  apiKey: string
): Promise<ActionResponse<{ valid: boolean; message: string }>> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (response.ok) {
      return {
        success: true,
        data: { valid: true, message: "Kết nối Gemini thành công" },
      };
    }

    if (response.status === 400 || response.status === 403) {
      return {
        success: true,
        data: { valid: false, message: "API key không hợp lệ" },
      };
    }

    return {
      success: true,
      data: { valid: false, message: `Lỗi Gemini API: ${response.status}` },
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return {
        success: true,
        data: { valid: false, message: "Timeout - Gemini không phản hồi" },
      };
    }
    return {
      success: true,
      data: { valid: false, message: "Lỗi kết nối mạng" },
    };
  }
}

/**
 * Test Google Maps API key by calling Geocoding endpoint
 */
async function testMapsApiKey(
  apiKey: string
): Promise<ActionResponse<{ valid: boolean; message: string }>> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=Hanoi&key=${apiKey}`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);
    const data = await response.json();

    if (data.status === "OK" || data.status === "ZERO_RESULTS") {
      return {
        success: true,
        data: { valid: true, message: "Kết nối Google Maps thành công" },
      };
    }

    if (data.status === "REQUEST_DENIED") {
      return {
        success: true,
        data: { valid: false, message: "API key không hợp lệ hoặc chưa bật Geocoding API" },
      };
    }

    return {
      success: true,
      data: { valid: false, message: `Lỗi Maps API: ${data.status}` },
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return {
        success: true,
        data: { valid: false, message: "Timeout - Maps không phản hồi" },
      };
    }
    return {
      success: true,
      data: { valid: false, message: "Lỗi kết nối mạng" },
    };
  }
}

/**
 * Test OpenRouter API key by calling /models endpoint
 */
async function testOpenRouterApiKey(
  apiKey: string
): Promise<ActionResponse<{ valid: boolean; message: string }>> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch("https://openrouter.ai/api/v1/models", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      return {
        success: true,
        data: { valid: true, message: "Kết nối OpenRouter thành công" },
      };
    }

    if (response.status === 401) {
      return {
        success: true,
        data: { valid: false, message: "API key không hợp lệ" },
      };
    }

    return {
      success: true,
      data: { valid: false, message: `Lỗi OpenRouter: ${response.status}` },
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return {
        success: true,
        data: { valid: false, message: "Timeout - OpenRouter không phản hồi" },
      };
    }
    return {
      success: true,
      data: { valid: false, message: "Lỗi kết nối mạng" },
    };
  }
}

/**
 * Seed default settings (for initial setup)
 */
export async function seedDefaultSettings(): Promise<ActionResponse<{ count: number }>> {
  try {
    await requireAdmin();

    const defaults = [
      { key: "COMPANY_NAME", value: "Lộc Xanh", category: "general", description: "Tên công ty" },
      { key: "COMPANY_EMAIL", value: "contact@locxanh.vn", category: "general", description: "Email công ty" },
      { key: "AI_ENABLED", value: true, category: "ai", description: "Bật/tắt tính năng AI" },
      { key: "AI_PROVIDER", value: "auto", category: "ai", description: "Nhà cung cấp AI (auto/groq/openrouter/gemini)" },
    ];

    let count = 0;
    for (const d of defaults) {
      await prisma.setting.upsert({
        where: { key: d.key },
        create: {
          key: d.key,
          value: d.value as Prisma.InputJsonValue,
          category: d.category,
          description: d.description,
        },
        update: {},
      });
      count++;
    }

    clearSettingsCache();
    revalidatePath("/admin/settings");

    return { success: true, data: { count } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Lỗi hệ thống",
    };
  }
}
