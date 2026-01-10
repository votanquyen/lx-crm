/**
 * Gemini API Client for Import Analysis
 * Wrapper for Gemini 2.0 Flash API calls
 */

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";

/**
 * Call Gemini API with a prompt
 */
export async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_AI_API_KEY not configured");
  }

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
    const error = await response.text();
    console.error("Gemini API error:", response.status, error);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("Empty response from Gemini");
  }

  return text;
}

/**
 * Extract JSON from Gemini response text
 */
export function extractJson<T>(text: string): T {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON found in response");
  return JSON.parse(match[0]) as T;
}
