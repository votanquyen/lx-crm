/**
 * Data Import Server Actions
 * Handle Excel file parsing and import operations
 */
"use server";

import { requireManager } from "@/lib/auth-utils";
import {
  parseExcelBuffer,
  validateExcelFile,
  type ParsedExcel,
} from "@/lib/excel-parser";
import {
  analyzeCustomerImport,
  analyzePlantImport,
  type AnalysisResult,
  type AnalyzedRow,
} from "@/lib/ai/import-analyzer";
import {
  executeCustomerImport,
  rollbackImport,
  type ImportResult,
} from "@/lib/import/customer-importer";

export type ImportType = "customers" | "plants" | "bangke" | "invoices" | "payments";

export interface ParseResult {
  success: boolean;
  data?: ParsedExcel;
  error?: string;
}

/**
 * Parse uploaded Excel file
 */
export async function parseExcelFile(formData: FormData): Promise<ParseResult> {
  await requireManager();

  const file = formData.get("file") as File;
  if (!file) {
    return { success: false, error: "Không tìm thấy file" };
  }

  // Validate file
  const validation = validateExcelFile(file);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  try {
    const buffer = await file.arrayBuffer();
    const parsed = parseExcelBuffer(buffer, file.name);

    return { success: true, data: parsed };
  } catch (error) {
    console.error("Excel parse error:", error);
    return {
      success: false,
      error: "Không thể đọc file Excel. Vui lòng kiểm tra định dạng.",
    };
  }
}

// Re-export types for use in components
export type { AnalysisResult, AnalyzedRow, ImportResult };

/**
 * Analyze parsed Excel data with AI
 */
export async function analyzeImportData(
  data: ParsedExcel,
  importType: ImportType
): Promise<AnalysisResult> {
  await requireManager();

  const sheet = data.sheets[0];
  if (!sheet || sheet.rowCount === 0) {
    return {
      success: false,
      totalRows: 0,
      analyzed: 0,
      autoApprove: 0,
      needsReview: 0,
      needsFix: 0,
      errors: 0,
      rows: [],
    };
  }

  switch (importType) {
    case "customers":
      return analyzeCustomerImport(sheet);
    case "plants":
      return analyzePlantImport(sheet);
    default:
      // For unsupported types, return basic analysis
      return {
        success: true,
        totalRows: sheet.rowCount,
        analyzed: sheet.rowCount,
        autoApprove: 0,
        needsReview: sheet.rowCount,
        needsFix: 0,
        errors: 0,
        rows: sheet.rows.map((row, index) => ({
          rowIndex: index + 1,
          originalData: row,
          normalizedData: row,
          confidence: 0.5,
          confidenceLevel: "medium" as const,
          status: "needs_review" as const,
          aiSuggestions: [],
          errors: [],
        })),
      };
  }
}

/**
 * Execute approved import rows
 */
export async function executeImport(
  rows: AnalyzedRow[],
  importType: ImportType
): Promise<ImportResult> {
  const session = await requireManager();

  if (importType !== "customers") {
    return {
      success: false,
      batchId: "",
      imported: 0,
      merged: 0,
      skipped: 0,
      errors: [{ rowIndex: 0, error: `Import type "${importType}" not yet supported` }],
      createdIds: [],
      mergedIds: [],
    };
  }

  return executeCustomerImport(rows, session.user.id);
}

/**
 * Rollback an import batch
 */
export async function rollbackImportBatch(batchId: string) {
  const session = await requireManager();
  return rollbackImport(batchId, session.user.id);
}

