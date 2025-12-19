/**
 * CSV Export Utility
 * Generate CSV files from analytics data
 */

/**
 * Convert array of objects to CSV string
 */
export function arrayToCSV<T extends Record<string, unknown>>(
  data: T[],
  headers: { key: keyof T; label: string }[]
): string {
  if (data.length === 0) {
    return "";
  }

  // Header row
  const headerRow = headers.map((h) => h.label).join(",");

  // Data rows
  const dataRows = data.map((row) => {
    return headers
      .map((header) => {
        const value = row[header.key];
        // Escape and quote values
        return formatCSVCell(value);
      })
      .join(",");
  });

  return [headerRow, ...dataRows].join("\n");
}

/**
 * Format a single CSV cell value
 * Prevents CSV injection by sanitizing formula characters
 */
function formatCSVCell(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  let stringValue = String(value);

  // Prevent CSV injection: Neutralize formula characters (=, +, -, @, \t, \r)
  // Excel/Google Sheets execute formulas starting with these characters
  if (/^[=+\-@\t\r]/.test(stringValue)) {
    stringValue = "'" + stringValue; // Prepend single quote to disable formula execution
  }

  // If contains comma, newline, or quote, wrap in quotes and escape quotes
  if (
    stringValue.includes(",") ||
    stringValue.includes("\n") ||
    stringValue.includes('"')
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Format number as Vietnamese currency string (for CSV)
 */
export function formatCurrencyForCSV(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date for CSV (DD/MM/YYYY)
 */
export function formatDateForCSV(date: Date | string | null): string {
  if (!date) return "";

  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Download CSV file in browser
 */
export function downloadCSV(csv: string, filename: string): void {
  // Add UTF-8 BOM for Excel compatibility with Vietnamese characters
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
