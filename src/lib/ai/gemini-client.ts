/**
 * Gemini API Client for Import Analysis
 * Wrapper for Gemini 2.0 Flash API calls
 */

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";

/**
 * Retry helper with exponential backoff for rate limit errors
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Check if rate limit error (429)
      const isRateLimit =
        error instanceof Error &&
        (error.message.includes("429") ||
          error.message.toLowerCase().includes("rate limit") ||
          error.message.toLowerCase().includes("quota") ||
          error.message.toLowerCase().includes("resource exhausted"));

      if (!isRateLimit || attempt === maxRetries - 1) {
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s...
      const delay = baseDelayMs * Math.pow(2, attempt);
      console.warn(
        `Gemini rate limit hit, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Call Gemini API with a prompt (with automatic retry on rate limit)
 */
export async function callGemini(prompt: string): Promise<string> {
  // Validate input
  if (!prompt?.trim()) {
    throw new Error("Gemini prompt cannot be empty");
  }

  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_AI_API_KEY not configured");
  }

  return withRetry(async () => {
    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
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
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("Empty response from Gemini");
    }

    return text;
  });
}

/**
 * Extract JSON from Gemini response text
 */
export function extractJson<T>(text: string): T {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error("No JSON found in response");
  }

  try {
    return JSON.parse(match[0]) as T;
  } catch (error) {
    console.error("Failed to parse JSON from Gemini response:", match[0]);
    throw new Error(
      `Invalid JSON in Gemini response: ${error instanceof Error ? error.message : "parse error"}`
    );
  }
}
