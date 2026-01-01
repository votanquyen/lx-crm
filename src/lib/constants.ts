/**
 * Application Constants
 * Centralized constants for maintainability
 */

/**
 * Cache TTL values in seconds
 */
export const CACHE_TTL = {
  /** Short cache for frequently changing data */
  SHORT: 30,
  /** Stats/dashboard data - refresh every minute */
  STATS: 60,
  /** Report data - less frequent updates */
  REPORTS: 120,
  /** Heavy queries that rarely change */
  HEAVY_QUERY: 300,
  /** Analytics data - cached longer */
  ANALYTICS: 600,
} as const;

/**
 * Pagination defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

/**
 * Invoice aging buckets for reports
 */
export const INVOICE_AGING_BUCKETS = [
  { range: "0-30 ngày", label: "current", minDays: 0, maxDays: 30 },
  { range: "31-60 ngày", label: "overdue30", minDays: 31, maxDays: 60 },
  { range: "61-90 ngày", label: "overdue60", minDays: 61, maxDays: 90 },
  { range: "90+ ngày", label: "overdue90", minDays: 91, maxDays: 9999 },
] as const;

/**
 * Contract expiration thresholds in days
 */
export const CONTRACT_THRESHOLDS = {
  /** Contracts expiring within this many days are "expiring soon" */
  EXPIRING_SOON: 30,
  /** Contracts expiring within this many days show warning */
  WARNING: 60,
} as const;

/**
 * Care schedule priority thresholds
 */
export const CARE_PRIORITY = {
  /** High priority threshold */
  HIGH: 8,
  /** Medium priority threshold */
  MEDIUM: 5,
} as const;

/**
 * Rate limiting configurations
 */
export const RATE_LIMITS = {
  SEARCH: { limit: 10, window: 10 },
  REPORT: { limit: 5, window: 30 },
  LIST: { limit: 20, window: 10 },
  MUTATION: { limit: 30, window: 60 },
} as const;

/**
 * File upload limits
 */
export const UPLOAD_LIMITS = {
  /** Max file size in bytes (5MB) */
  MAX_FILE_SIZE: 5 * 1024 * 1024,
  /** Max files per upload */
  MAX_FILES: 10,
  /** Allowed image types */
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"],
} as const;

/**
 * Vietnamese districts in HCMC (for geocoding)
 */
export const HCMC_DISTRICTS = [
  "Quận 1", "Quận 3", "Quận 4", "Quận 5", "Quận 6", "Quận 7", "Quận 8",
  "Quận 10", "Quận 11", "Quận 12", "Bình Thạnh", "Gò Vấp", "Phú Nhuận",
  "Tân Bình", "Tân Phú", "Bình Tân", "Thủ Đức", "Nhà Bè", "Hóc Môn",
  "Củ Chi", "Bình Chánh", "Cần Giờ",
] as const;
