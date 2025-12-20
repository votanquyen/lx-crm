/**
 * Format Utilities
 * Helpers for formatting currency, dates, and other data types
 */

/**
 * Format number as currency for Excel CSV export
 * Uses regular spaces instead of non-breaking spaces for better compatibility
 */
export function formatCurrencyForExcel(amount: number): string {
  return amount.toLocaleString('vi-VN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).replace(/\u00A0/g, ' '); // Remove nbsp
}

/**
 * Format number as currency for PDF and UI display
 * Uses standard Vietnamese currency formatting
 */
export function formatCurrencyForPDF(amount: number): string {
  return amount.toLocaleString('vi-VN', {
    style: 'currency',
    currency: 'VND'
  });
}
