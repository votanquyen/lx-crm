/**
 * Shared formatting utilities
 * Single source of truth for all formatting functions
 */

// Prisma Decimal-like type for compatibility
type DecimalLike = { toString(): string } | number | string;

/**
 * Format number as Vietnamese currency
 * Supports number, string, or Prisma Decimal
 */
export function formatCurrency(
  value: DecimalLike,
  options?: { compact?: boolean; style?: "currency" | "decimal" }
): string {
  const num = typeof value === "object" ? Number(value.toString()) : Number(value);
  if (isNaN(num)) return "0 ₫";

  return new Intl.NumberFormat("vi-VN", {
    style: options?.style ?? "currency",
    currency: "VND",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...(options?.compact && { notation: "compact" }),
  }).format(num);
}

/**
 * Format currency as numeric string only (no currency symbol)
 * For Excel/CSV exports
 */
export function formatCurrencyNumeric(value: DecimalLike): string {
  return formatCurrency(value, { style: "decimal" });
}

/**
 * Format currency for Excel CSV export
 * Uses regular spaces instead of non-breaking spaces for better compatibility
 */
export function formatCurrencyForExcel(amount: DecimalLike): string {
  const num = typeof amount === "object" ? Number(amount.toString()) : Number(amount);
  return num.toLocaleString("vi-VN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).replace(/\u00A0/g, " "); // Remove nbsp
}

/**
 * Format number with Vietnamese locale
 */
export function formatNumber(value: DecimalLike): string {
  const num = typeof value === "object" ? Number(value.toString()) : Number(value);
  return new Intl.NumberFormat("vi-VN").format(num);
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

/**
 * Format Vietnamese phone number
 * @param phone - Raw phone number
 * @returns Formatted phone (e.g., "090 123 4567")
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3");
  }
  if (cleaned.length === 11 && cleaned.startsWith("84")) {
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{3})/, "+$1 $2 $3 $4");
  }
  return phone;
}

/**
 * Format percentage
 * @param value - Decimal value (0-100)
 * @returns Formatted percentage (e.g., "8,5%")
 */
export function formatPercentage(value: DecimalLike): string {
  const num = typeof value === "object" ? Number(value.toString()) : Number(value);
  return new Intl.NumberFormat("vi-VN", {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(num / 100);
}

/**
 * Format relative time (e.g., "2 ngày trước", "3 giờ nữa")
 * @param date - Date to compare
 * @returns Relative time string
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  const rtf = new Intl.RelativeTimeFormat("vi", { numeric: "auto" });

  if (Math.abs(diffDays) < 1) {
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    if (Math.abs(diffHours) < 1) {
      const diffMinutes = Math.round(diffMs / (1000 * 60));
      return rtf.format(diffMinutes, "minute");
    }
    return rtf.format(diffHours, "hour");
  }

  if (Math.abs(diffDays) < 30) {
    return rtf.format(diffDays, "day");
  }

  const diffMonths = Math.round(diffDays / 30);
  return rtf.format(diffMonths, "month");
}
