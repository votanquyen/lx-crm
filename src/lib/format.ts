/**
 * Shared formatting utilities
 */

/**
 * Format number as Vietnamese currency
 */
export function formatCurrency(value: number, compact = false): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    ...(compact && { notation: "compact" }),
  }).format(value);
}

/**
 * Format number with Vietnamese locale
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("vi-VN").format(value);
}

/**
 * Format date as Vietnamese format (dd/MM/yyyy)
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

/**
 * Format date with time (dd/MM/yyyy HH:mm)
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}
