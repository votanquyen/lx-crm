/**
 * Duplicate Detection using pg_trgm + Multi-Provider AI
 */
import { prisma } from "@/lib/prisma";
import { callAI, extractJson } from "./multi-provider-client";

export interface DuplicateMatch {
  existingId: string;
  existingName: string;
  matchScore: number;
  matchReason: string;
}

export interface DuplicateResult {
  inputName: string;
  isDuplicate: boolean;
  confidence: number;
  matches: DuplicateMatch[];
  suggestion: "merge" | "new" | "review";
}

interface AIVerifyResponse {
  isDuplicate: boolean;
  confidence: number;
  matchIndex: number | null;
  reason: string;
  suggestion: "merge" | "new" | "review";
}

/**
 * Detect duplicates for a batch of company names
 * Uses parallel queries for better performance
 */
export async function detectDuplicates(
  names: string[]
): Promise<DuplicateResult[]> {
  if (names.length === 0) return [];

  // Step 1: Run all pg_trgm queries in parallel
  const fuzzyMatchPromises = names.map((name) =>
    prisma.$queryRaw<
      Array<{ id: string; companyName: string; similarity: number }>
    >`
      SELECT id, "companyName",
             similarity("companyName", ${name}) as similarity
      FROM customers
      WHERE similarity("companyName", ${name}) > 0.3
      ORDER BY similarity DESC
      LIMIT 5
    `.then((matches) => ({ name, matches }))
  );

  const fuzzyResults = await Promise.all(fuzzyMatchPromises);

  // Step 2: Process results - AI verification for matches, direct result for no matches
  const resultPromises = fuzzyResults.map(({ name, matches }) => {
    if (matches.length === 0) {
      return Promise.resolve({
        inputName: name,
        isDuplicate: false,
        confidence: 0.9,
        matches: [],
        suggestion: "new" as const,
      });
    }
    return verifyDuplicatesWithAI(name, matches);
  });

  return Promise.all(resultPromises);
}

async function verifyDuplicatesWithAI(
  inputName: string,
  candidates: Array<{ id: string; companyName: string; similarity: number }>
): Promise<DuplicateResult> {
  const prompt = `Kiểm tra xem "${inputName}" có trùng với công ty nào dưới đây không?

DANH SÁCH CÔNG TY HIỆN CÓ:
${candidates
  .map(
    (c, i) =>
      `${i + 1}. "${c.companyName}" (similarity: ${(c.similarity * 100).toFixed(0)}%)`
  )
  .join("\n")}

QUY TẮC:
- "Cty ABC" và "Công ty ABC TNHH" = CÙNG công ty
- "ABC Company" và "ABC Corporation" = CÙNG công ty
- "ABC" và "ABC XYZ" = KHÁC công ty (trừ khi XYZ là TNHH/CP/Ltd)
- Cùng số điện thoại/địa chỉ = CÙNG công ty

TRẢ VỀ JSON:
{
  "isDuplicate": true,
  "confidence": 0.9,
  "matchIndex": 1,
  "reason": "Giải thích ngắn",
  "suggestion": "merge"
}`;

  try {
    const response = await callAI(prompt);
    const json = extractJson<AIVerifyResponse>(response);

    const matches: DuplicateMatch[] = [];
    if (json.isDuplicate && json.matchIndex) {
      const match = candidates[json.matchIndex - 1];
      if (match) {
        matches.push({
          existingId: match.id,
          existingName: match.companyName,
          matchScore: json.confidence,
          matchReason: json.reason,
        });
      }
    }

    return {
      inputName,
      isDuplicate: json.isDuplicate,
      confidence: json.confidence,
      matches,
      suggestion: json.suggestion || "review",
    };
  } catch {
    // Fallback to pg_trgm only
    const topMatch = candidates[0];
    if (!topMatch) {
      return {
        inputName,
        isDuplicate: false,
        confidence: 0,
        matches: [],
        suggestion: "new",
      };
    }
    return {
      inputName,
      isDuplicate: topMatch.similarity > 0.8,
      confidence: topMatch.similarity,
      matches: [
        {
          existingId: topMatch.id,
          existingName: topMatch.companyName,
          matchScore: topMatch.similarity,
          matchReason: "Fuzzy match (AI unavailable)",
        },
      ],
      suggestion: topMatch.similarity > 0.8 ? "merge" : "review",
    };
  }
}
