/**
 * Excel Parsing Utilities for Data Import
 * Handles .xlsx and .xls file parsing
 */
import * as XLSX from "xlsx";

export interface ParsedSheet {
  name: string;
  headers: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
}

export interface ParsedExcel {
  filename: string;
  sheets: ParsedSheet[];
  totalRows: number;
}

/**
 * Parse Excel buffer to structured data
 */
export function parseExcelBuffer(buffer: ArrayBuffer, filename: string): ParsedExcel {
  const workbook = XLSX.read(buffer, { type: "array" });

  const sheets: ParsedSheet[] = workbook.SheetNames.map((name) => {
    const sheet = workbook.Sheets[name];
    if (!sheet) {
      return { name, headers: [], rows: [], rowCount: 0 };
    }
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
    const headers = rows.length > 0 && rows[0] ? Object.keys(rows[0]) : [];

    return {
      name,
      headers,
      rows,
      rowCount: rows.length,
    };
  });

  return {
    filename,
    sheets,
    totalRows: sheets.reduce((sum, s) => sum + s.rowCount, 0),
  };
}

/**
 * Validate Excel file before parsing
 */
export function validateExcelFile(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_EXTENSIONS = [".xlsx", ".xls"];

  if (file.size > MAX_SIZE) {
    return { valid: false, error: "File quá lớn. Tối đa 10MB." };
  }

  const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: "Chỉ hỗ trợ file .xlsx hoặc .xls" };
  }

  return { valid: true };
}
