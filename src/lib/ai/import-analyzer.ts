/**
 * Main Import Analyzer - Orchestrates AI analysis
 * Handles batch processing with rate limiting
 */
import { normalizeCompanyNames } from "./name-normalizer";
import { parsePlantPositions } from "./position-parser";
import { detectDuplicates } from "./duplicate-detector";
import type { ParsedSheet } from "@/lib/excel-parser";
import { sleep } from "@/lib/utils";

export type ConfidenceLevel = "high" | "medium" | "low";
export type RowStatus = "auto_approve" | "needs_review" | "needs_fix" | "error";

export interface AnalyzedRow {
  rowIndex: number;
  originalData: Record<string, unknown>;
  normalizedData: Record<string, unknown>;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  status: RowStatus;
  duplicateInfo?: {
    isDuplicate: boolean;
    matchId?: string;
    matchName?: string;
    suggestion: string;
  };
  aiSuggestions: string[];
  errors: string[];
}

export interface AnalysisResult {
  success: boolean;
  totalRows: number;
  analyzed: number;
  autoApprove: number;
  needsReview: number;
  needsFix: number;
  errors: number;
  rows: AnalyzedRow[];
}

const BATCH_SIZE = 50;
const RATE_LIMIT_DELAY = 12000; // 12 seconds between batches (5 RPM)

/**
 * Analyze customer import data
 */
export async function analyzeCustomerImport(
  sheet: ParsedSheet
): Promise<AnalysisResult> {
  const rows = sheet.rows;
  const results: AnalyzedRow[] = [];

  // Process in batches
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    // Extract company names - try multiple column names
    const names = batch.map((row) =>
      String(row.companyName || row["Tên công ty"] || row["Ten cong ty"] || "")
    );

    // Run AI analysis in parallel where possible
    const [normalizedNames, duplicateResults] = await Promise.all([
      normalizeCompanyNames(names.filter(Boolean)),
      detectDuplicates(names.filter(Boolean)),
    ]);

    // Map results back to rows
    for (let j = 0; j < batch.length; j++) {
      const row = batch[j];
      if (!row) continue;
      const normalized = normalizedNames[j];
      const duplicate = duplicateResults[j];

      const confidence = calculateConfidence(normalized, duplicate);
      const status = getStatus(confidence);

      results.push({
        rowIndex: i + j + 1,
        originalData: row,
        normalizedData: {
          ...row,
          companyName: normalized?.normalized || row.companyName,
          shortName: normalized?.shortName,
          businessType: normalized?.businessType,
        },
        confidence,
        confidenceLevel: getConfidenceLevel(confidence),
        status,
        duplicateInfo: duplicate
          ? {
              isDuplicate: duplicate.isDuplicate,
              matchId: duplicate.matches[0]?.existingId,
              matchName: duplicate.matches[0]?.existingName,
              suggestion: duplicate.suggestion,
            }
          : undefined,
        aiSuggestions: generateSuggestions(normalized, duplicate),
        errors: [],
      });
    }

    // Rate limit delay between batches
    if (i + BATCH_SIZE < rows.length) {
      await sleep(RATE_LIMIT_DELAY);
    }
  }

  return {
    success: true,
    totalRows: rows.length,
    analyzed: results.length,
    autoApprove: results.filter((r) => r.status === "auto_approve").length,
    needsReview: results.filter((r) => r.status === "needs_review").length,
    needsFix: results.filter((r) => r.status === "needs_fix").length,
    errors: results.filter((r) => r.status === "error").length,
    rows: results,
  };
}

/**
 * Analyze plant import data
 */
export async function analyzePlantImport(
  sheet: ParsedSheet
): Promise<AnalysisResult> {
  const rows = sheet.rows;
  const results: AnalyzedRow[] = [];

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    // Extract position notes
    const positions = batch.map((row) =>
      String(row.position || row["Vị trí"] || row["Vi tri"] || row.notes || "")
    );

    const parsed = await parsePlantPositions(positions.filter(Boolean));

    for (let j = 0; j < batch.length; j++) {
      const row = batch[j];
      if (!row) continue;
      const plant = parsed[j];

      const confidence = plant?.confidence || 0.3;
      const status = getStatus(confidence);

      results.push({
        rowIndex: i + j + 1,
        originalData: row,
        normalizedData: {
          ...row,
          quantity: plant?.quantity || 1,
          plantTypeCode: plant?.plantTypeCode,
          plantTypeName: plant?.plantTypeName,
          floor: plant?.floor,
          room: plant?.room,
          area: plant?.area,
          positionNote: plant?.positionNote,
        },
        confidence,
        confidenceLevel: getConfidenceLevel(confidence),
        status,
        aiSuggestions: [],
        errors: [],
      });
    }

    if (i + BATCH_SIZE < rows.length) {
      await sleep(RATE_LIMIT_DELAY);
    }
  }

  return {
    success: true,
    totalRows: rows.length,
    analyzed: results.length,
    autoApprove: results.filter((r) => r.status === "auto_approve").length,
    needsReview: results.filter((r) => r.status === "needs_review").length,
    needsFix: results.filter((r) => r.status === "needs_fix").length,
    errors: results.filter((r) => r.status === "error").length,
    rows: results,
  };
}

function calculateConfidence(
  normalized: { confidence?: number } | undefined,
  duplicate: { isDuplicate?: boolean; confidence?: number } | undefined
): number {
  let score = 0.5;

  if (normalized?.confidence) {
    score = normalized.confidence * 0.6;
  }

  if (duplicate) {
    if (duplicate.isDuplicate && (duplicate.confidence ?? 0) > 0.9) {
      score *= 0.9; // Reduce if likely duplicate
    } else if (!duplicate.isDuplicate) {
      score += 0.2; // Boost if no duplicate
    }
  }

  return Math.min(1, Math.max(0, score));
}

function getStatus(confidence: number): RowStatus {
  if (confidence >= 0.9) return "auto_approve";
  if (confidence >= 0.7) return "needs_review";
  if (confidence >= 0.3) return "needs_fix";
  return "error";
}

function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 0.9) return "high";
  if (confidence >= 0.7) return "medium";
  return "low";
}

function generateSuggestions(
  normalized: { businessType?: string | null } | undefined,
  duplicate:
    | {
        isDuplicate?: boolean;
        matches?: Array<{ existingName?: string }>;
        suggestion?: string;
      }
    | undefined
): string[] {
  const suggestions: string[] = [];

  if (duplicate?.isDuplicate) {
    suggestions.push(`Có thể trùng với: ${duplicate.matches?.[0]?.existingName}`);
    if (duplicate.suggestion === "merge") {
      suggestions.push("Đề xuất: Merge vào record hiện có");
    }
  }

  if (normalized?.businessType) {
    suggestions.push(`Loại hình: ${normalized.businessType}`);
  }

  return suggestions;
}
