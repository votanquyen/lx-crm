/**
 * Common Validation Schemas
 * Shared Zod schemas for consistent validation across the application
 */
import { z } from "zod";
import { PAGINATION } from "../constants";

/**
 * CUID validation for entity IDs
 */
export const idSchema = z.string().cuid("ID không hợp lệ");

/**
 * Common ID parameter schema for actions that take just an ID
 */
export const idParamSchema = z.object({
  id: idSchema,
});

/**
 * Pagination schema with defaults
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce
    .number()
    .int()
    .min(PAGINATION.MIN_PAGE_SIZE)
    .max(PAGINATION.MAX_PAGE_SIZE)
    .default(PAGINATION.DEFAULT_PAGE_SIZE),
});

/**
 * Date range schema
 */
export const dateRangeSchema = z
  .object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "Ngày kết thúc phải sau ngày bắt đầu",
    path: ["endDate"],
  });

/**
 * Vietnamese phone number validation
 * Supports: 0901234567, 090 123 4567, +84 901234567
 */
export const phoneSchema = z
  .string()
  .regex(/^(\+84|0)(3[2-9]|5[6|8|9]|7[0|6-9]|8[1-9]|9[0-9])[0-9]{7}$/, "Số điện thoại không hợp lệ")
  .transform((val) => val.replace(/\s+/g, ""));

/**
 * Vietnamese tax code validation
 * 10 or 13 digits
 */
export const taxCodeSchema = z
  .string()
  .regex(/^\d{10}(-\d{3})?$/, "Mã số thuế phải có 10 hoặc 13 chữ số");

/**
 * Currency amount schema (VND - no decimals)
 */
export const currencySchema = z.coerce
  .number()
  .int("Số tiền phải là số nguyên")
  .min(0, "Số tiền không thể âm");

/**
 * Percentage schema (0-100)
 */
export const percentageSchema = z.coerce
  .number()
  .min(0, "Phần trăm không thể âm")
  .max(100, "Phần trăm tối đa là 100%");

/**
 * Safe limit function for queries
 * Ensures limit is within acceptable range
 */
export function safeLimit(limit: number, max: number = PAGINATION.MAX_PAGE_SIZE): number {
  return Math.min(Math.max(PAGINATION.MIN_PAGE_SIZE, limit), max);
}
