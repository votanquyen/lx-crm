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
  DEFAULT_PAGE_SIZE: 20,
  DEFAULT_LIMIT: 20,
  MIN_PAGE_SIZE: 1,
  MAX_PAGE_SIZE: 100,
  MAX_LIMIT: 100,
} as const;

/**
 * Validation limits
 */
export const VALIDATION_LIMITS = {
  MAX_AMOUNT_VND: 1_000_000_000, // 1 billion VND
  MAX_QUANTITY: 10_000,
  TEXT_MAX_LENGTH: 500,
  TEXTAREA_MAX_LENGTH: 2000,
  COMPANY_NAME_MAX: 255,
  ADDRESS_MAX: 500,
  PHONE_LENGTH: 10,
} as const;

/**
 * Input patterns for validation
 */
export const INPUT_PATTERNS = {
  PHONE_VN: /^(0)(3[2-9]|5[6|8|9]|7[0|6-9]|8[1-9]|9[0-9])[0-9]{7}$/,
  TAX_CODE: /^[0-9]{10}(-[0-9]{3})?$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
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
  /** Contracts expiring within this many days show critical warning */
  CRITICAL: 7,
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
  DEFAULT_WINDOW_MS: 60_000,
  DEFAULT_MAX_REQUESTS: 10,
} as const;

/**
 * Database transaction settings
 */
export const TRANSACTION = {
  /** Default timeout in milliseconds (10 seconds) */
  DEFAULT_TIMEOUT_MS: 10_000,
  /** Long-running transaction timeout (30 seconds) */
  LONG_TIMEOUT_MS: 30_000,
  /** Maximum wait time for transaction to start */
  MAX_WAIT_MS: 5_000,
  /** Maximum retries for transaction conflicts */
  MAX_RETRIES: 3,
} as const;

/**
 * PostgreSQL connection pool settings
 */
export const CONNECTION_POOL = {
  /** Minimum number of connections to maintain */
  MIN_CONNECTIONS: 2,
  /** Maximum number of connections allowed */
  MAX_CONNECTIONS: 10,
  /** Idle connection timeout in milliseconds (1 minute) */
  IDLE_TIMEOUT_MS: 60_000,
  /** Connection attempt timeout in milliseconds (5 seconds) */
  CONNECTION_TIMEOUT_MS: 5_000,
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
  "Quận 1",
  "Quận 3",
  "Quận 4",
  "Quận 5",
  "Quận 6",
  "Quận 7",
  "Quận 8",
  "Quận 10",
  "Quận 11",
  "Quận 12",
  "Bình Thạnh",
  "Gò Vấp",
  "Phú Nhuận",
  "Tân Bình",
  "Tân Phú",
  "Bình Tân",
  "Thủ Đức",
  "Nhà Bè",
  "Hóc Môn",
  "Củ Chi",
  "Bình Chánh",
  "Cần Giờ",
] as const;

export type HCMCDistrict = (typeof HCMC_DISTRICTS)[number];
