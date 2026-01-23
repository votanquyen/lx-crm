/**
 * Multi-Provider AI Client with Task-Specific Routing
 * Supports: Groq (Qwen, Llama), OpenRouter (DeepSeek), Gemini
 *
 * Task-specific chains:
 * - vietnamese_nlp: Qwen3 → DeepSeek → Llama 4 → Gemini (name normalization, note analysis)
 * - math_logic: DeepSeek → Qwen3 → Llama 4 (route optimization, predictions)
 * - fast_simple: Llama 4 → Qwen3 → DeepSeek (quick queries)
 * - multimodal: Gemini only (image/PDF analysis)
 */

import { getApiKey } from "@/lib/settings-service";

// Request timeout in milliseconds (30 seconds)
const REQUEST_TIMEOUT_MS = 30000;

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 2,
  backoffMs: [1000, 2000, 4000], // Exponential: 1s, 2s, 4s
  retryableStatusCodes: [429, 500, 502, 503, 504],
};

interface AIProvider {
  name: string;
  provider: "openrouter" | "groq" | "gemini";
  model: string;
  keyName: string; // Key name for settings lookup
}

// All available providers (without static API keys)
const ALL_PROVIDERS: Record<string, AIProvider> = {
  qwen3: {
    name: "Qwen3 32B",
    provider: "groq",
    model: "qwen/qwen3-32b",
    keyName: "GROQ_API_KEY",
  },
  deepseek: {
    name: "DeepSeek V3",
    provider: "openrouter",
    model: "deepseek/deepseek-chat",
    keyName: "OPENROUTER_API_KEY",
  },
  llama4: {
    name: "Llama 4 Scout",
    provider: "groq",
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    keyName: "GROQ_API_KEY",
  },
  gemini: {
    name: "Gemini 2.5 Flash",
    provider: "gemini",
    model: "gemini-2.5-flash",
    keyName: "GOOGLE_AI_API_KEY",
  },
};

/**
 * Task types for routing
 * - vietnamese_nlp: Best for Vietnamese text processing (Qwen first)
 * - math_logic: Best for calculations, optimization (DeepSeek first)
 * - fast_simple: Fast responses for simple queries (Llama first)
 * - multimodal: Image/PDF analysis (Gemini only)
 */
export type TaskType = "vietnamese_nlp" | "math_logic" | "fast_simple" | "multimodal";

// Task-specific provider chains
const TASK_CHAINS: Record<TaskType, string[]> = {
  // Vietnamese NLP: Qwen first (96.8% Vi-SQuAD benchmark)
  vietnamese_nlp: ["qwen3", "deepseek", "llama4", "gemini"],

  // Math/Logic: DeepSeek first (best reasoning for optimization)
  math_logic: ["deepseek", "qwen3", "llama4"],

  // Fast/Simple: Llama first (fastest inference ~300 tok/s)
  fast_simple: ["llama4", "qwen3", "deepseek"],

  // Multimodal: Gemini only (vision support)
  multimodal: ["gemini"],
};

// Default chain (backwards compatibility)
const DEFAULT_CHAIN: string[] = ["qwen3", "deepseek", "llama4", "gemini"];

/**
 * Get provider chain for a specific task type
 */
function getProviderChain(taskType?: TaskType): AIProvider[] {
  const chainKeys = taskType ? TASK_CHAINS[taskType] : DEFAULT_CHAIN;
  return chainKeys.map((key) => ALL_PROVIDERS[key]).filter((p): p is AIProvider => p !== undefined);
}

/**
 * Fetch with timeout wrapper
 * Prevents slow providers from blocking the fallback chain
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = REQUEST_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Sleep utility for retry backoff
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if error is retryable (rate limit or server error)
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    // Check for HTTP status codes in error message
    const statusMatch = error.message.match(/(\d{3}):/);
    if (statusMatch?.[1]) {
      const status = parseInt(statusMatch[1], 10);
      return RETRY_CONFIG.retryableStatusCodes.includes(status);
    }
  }
  return false;
}

/**
 * Call AI with task-specific routing and automatic fallback
 * @param prompt - The prompt to send
 * @param taskType - Optional task type for optimized model selection
 *   - vietnamese_nlp: Name normalization, note analysis, duplicate detection
 *   - math_logic: Route optimization, predictions, calculations
 *   - fast_simple: Quick queries, simple responses
 *   - multimodal: Image/PDF analysis
 */
export async function callAI(prompt: string, taskType?: TaskType): Promise<string> {
  const providers = getProviderChain(taskType);
  const errors: Array<{ provider: string; error: string }> = [];

  for (const provider of providers) {
    // Fetch API key dynamically (DB first, then env fallback)
    const apiKey = await getApiKey(provider.keyName);

    // Skip if API key not configured
    if (!apiKey) {
      continue;
    }

    // Retry loop for current provider
    for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
      try {
        if (attempt === 0) {
          console.warn(`[AI] Trying ${provider.name}...`);
        } else {
          console.warn(`[AI] Retry ${attempt}/${RETRY_CONFIG.maxRetries} for ${provider.name}...`);
        }

        let response: string;
        if (provider.provider === "openrouter") {
          response = await callOpenRouter(prompt, provider.model, apiKey);
        } else if (provider.provider === "groq") {
          response = await callGroq(prompt, provider.model, apiKey);
        } else if (provider.provider === "gemini") {
          response = await callGemini(prompt, apiKey);
        } else {
          break; // Unknown provider, try next
        }

        console.warn(`[AI] Success with ${provider.name}`);
        return response;
      } catch (error) {
        const errorMsg =
          error instanceof Error
            ? error.name === "AbortError"
              ? "Request timeout"
              : error.message
            : "Unknown error";

        // Check if retryable and we have retries left
        if (isRetryableError(error) && attempt < RETRY_CONFIG.maxRetries) {
          const backoffMs = RETRY_CONFIG.backoffMs[attempt] || 4000;
          console.warn(`[AI] ${provider.name} failed (${errorMsg}), retrying in ${backoffMs}ms...`);
          await sleep(backoffMs);
          continue; // Retry same provider
        }

        // Not retryable or max retries reached, log and try next provider
        console.warn(`[AI] ${provider.name} failed: ${errorMsg}`);
        errors.push({ provider: provider.name, error: errorMsg });
        break; // Exit retry loop, try next provider
      }
    }
  }

  // All providers failed
  throw new Error(
    `All AI providers failed:\n${errors.map((e) => `- ${e.provider}: ${e.error}`).join("\n")}`
  );
}

/**
 * OpenRouter API (DeepSeek V3, Qwen 2.5)
 */
async function callOpenRouter(prompt: string, model: string, apiKey: string): Promise<string> {
  const response = await fetchWithTimeout("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "Lộc Xanh CRM",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter ${response.status}: ${error}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Empty response from OpenRouter");
  }

  return content;
}

/**
 * Groq API (Llama 3.3 70B)
 */
async function callGroq(prompt: string, model: string, apiKey: string): Promise<string> {
  const response = await fetchWithTimeout("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq ${response.status}: ${error}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Empty response from Groq");
  }

  return content;
}

/**
 * Gemini API (Fallback)
 * Note: Gemini API uses key-in-URL by design (Google's API spec)
 */
async function callGemini(prompt: string, apiKey: string): Promise<string> {
  const GEMINI_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

  const response = await fetchWithTimeout(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2048,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini ${response.status}: ${error}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("Empty response from Gemini");
  }

  return text;
}

/**
 * Extract JSON from AI response
 * Handles both direct JSON and markdown-wrapped JSON
 */
export function extractJson<T>(text: string): T {
  // Try direct parse first
  try {
    return JSON.parse(text) as T;
  } catch {
    // Extract from markdown code block or raw JSON
    const match = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || text.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("No JSON found in response");
    }
    return JSON.parse(match[1] || match[0]) as T;
  }
}
