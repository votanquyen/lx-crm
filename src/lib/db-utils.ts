/**
 * Database Utility Functions (Server-only)
 * These utilities use Prisma Decimal type and should ONLY be imported in server components
 */
import { Decimal } from "@prisma/client/runtime/library";

// ============================================
// DECIMAL UTILITIES (for Prisma Decimal type)
// ============================================

/**
 * Convert number to Prisma Decimal
 * Use this when creating/updating database records with monetary values
 */
export function toDecimal(value: number | string): Decimal {
  return new Decimal(value);
}

/**
 * Convert Prisma Decimal to number
 * Use this when you need to perform JavaScript math operations
 */
export function toNumber(decimal: Decimal | number): number {
  return typeof decimal === "number" ? decimal : decimal.toNumber();
}

/**
 * Convert Prisma Decimal to string (for display)
 * Returns formatted number string without currency symbol
 */
export function decimalToString(decimal: Decimal): string {
  return decimal.toFixed(0);
}

/**
 * Add two Decimal values safely
 */
export function addDecimal(a: Decimal | number | string, b: Decimal | number | string): Decimal {
  const decimalA = a instanceof Decimal ? a : new Decimal(a);
  const decimalB = b instanceof Decimal ? b : new Decimal(b);
  return decimalA.plus(decimalB);
}

/**
 * Subtract Decimal values safely
 */
export function subtractDecimal(a: Decimal | number | string, b: Decimal | number | string): Decimal {
  const decimalA = a instanceof Decimal ? a : new Decimal(a);
  const decimalB = b instanceof Decimal ? b : new Decimal(b);
  return decimalA.minus(decimalB);
}

/**
 * Multiply Decimal values safely
 */
export function multiplyDecimal(a: Decimal | number | string, b: Decimal | number | string): Decimal {
  const decimalA = a instanceof Decimal ? a : new Decimal(a);
  const decimalB = b instanceof Decimal ? b : new Decimal(b);
  return decimalA.times(decimalB);
}

/**
 * Divide Decimal values safely
 */
export function divideDecimal(a: Decimal | number | string, b: Decimal | number | string): Decimal {
  const decimalA = a instanceof Decimal ? a : new Decimal(a);
  const decimalB = b instanceof Decimal ? b : new Decimal(b);
  return decimalA.dividedBy(decimalB);
}

/**
 * Compare two Decimal values
 * Returns: -1 if a < b, 0 if a === b, 1 if a > b
 */
export function compareDecimal(a: Decimal | number | string, b: Decimal | number | string): number {
  const decimalA = a instanceof Decimal ? a : new Decimal(a);
  const decimalB = b instanceof Decimal ? b : new Decimal(b);
  return decimalA.comparedTo(decimalB);
}

/**
 * Check if Decimal is zero
 */
export function isZeroDecimal(value: Decimal | number): boolean {
  const decimal = typeof value === "number" ? new Decimal(value) : value;
  return decimal.isZero();
}

/**
 * Get absolute value of Decimal
 */
export function absDecimal(value: Decimal | number): Decimal {
  const decimal = typeof value === "number" ? new Decimal(value) : value;
  return decimal.abs();
}

/**
 * Format currency in Vietnamese Dong (for Decimal type)
 * Supports both number and Prisma Decimal types
 */
export function formatCurrencyDecimal(amount: number | Decimal): string {
  const value = typeof amount === "number" ? amount : amount.toNumber();
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}
