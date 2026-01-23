/**
 * Billing Constants
 * Centralized configuration for billing calculations
 */

/** VAT rate in percent (8% for Vietnam) */
export const VAT_RATE = 8;

/** Year when business started (floor for year selectors) */
export const BUSINESS_START_YEAR = 2025;

/** Day of month when billing period starts (24th) */
export const BILLING_PERIOD_START_DAY = 24;

/** Day of month when billing period ends (23rd of next month) */
export const BILLING_PERIOD_END_DAY = 23;
