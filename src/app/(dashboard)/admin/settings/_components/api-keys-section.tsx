"use client";

/**
 * ApiKeysSection - Grid of API key cards for all providers
 * Renders cards for Groq, Gemini, Maps, OpenRouter
 */

import { ApiKeyCard } from "./api-key-card";

const API_PROVIDERS = [
  {
    id: "groq" as const,
    name: "Groq AI",
    keyName: "GROQ_API_KEY",
    helpUrl: "https://console.groq.com",
    description: "AI nhanh cho phân tích và gợi ý",
  },
  {
    id: "gemini" as const,
    name: "Google Gemini",
    keyName: "GOOGLE_AI_API_KEY",
    helpUrl: "https://aistudio.google.com",
    description: "AI đa năng từ Google",
  },
  {
    id: "maps" as const,
    name: "Google Maps",
    keyName: "GOOGLE_MAPS_API_KEY",
    helpUrl: "https://console.cloud.google.com",
    description: "Bản đồ và định vị khách hàng",
  },
  {
    id: "openrouter" as const,
    name: "OpenRouter",
    keyName: "OPENROUTER_API_KEY",
    helpUrl: "https://openrouter.ai/keys",
    description: "Truy cập nhiều mô hình AI",
  },
];

interface Setting {
  key: string;
  value: unknown;
}

interface ApiKeysSectionProps {
  settings: Setting[];
}

export function ApiKeysSection({ settings }: ApiKeysSectionProps) {
  // Create lookup map for current values
  const settingsMap = new Map(settings.map((s) => [s.key, s.value]));

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {API_PROVIDERS.map((provider) => {
        const currentValue = settingsMap.get(provider.keyName);
        const isConfigured = !!currentValue && String(currentValue).length > 0;

        return (
          <ApiKeyCard
            key={provider.id}
            provider={provider}
            currentValue={currentValue ? String(currentValue) : undefined}
            isConfigured={isConfigured}
          />
        );
      })}
    </div>
  );
}
