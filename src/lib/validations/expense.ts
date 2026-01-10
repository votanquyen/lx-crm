import { z } from "zod";

// Valid expense categories matching Prisma enum
const EXPENSE_CATEGORIES = [
  "PURCHASE_PLANT",
  "PURCHASE_POT",
  "MATERIALS",
  "LOGISTICS",
  "STAFF_COST",
  "OFFICE_UTILITIES",
  "MARKETING",
  "OTHER",
] as const;

// Create expense schema
export const createExpenseSchema = z.object({
  companyName: z.string().min(1, "Tên công ty không được để trống"),
  invoiceNumber: z.string().optional(),
  invoiceDate: z.coerce.date(),
  amount: z.coerce.number().positive("Số tiền phải lớn hơn 0"),
  category: z.enum(EXPENSE_CATEGORIES).optional(),
  description: z.string().optional(),
});

// Update expense schema
export const updateExpenseSchema = createExpenseSchema.extend({
  id: z.string().cuid("ID chi phí không hợp lệ"),
});

// Get expense by ID schema
export const getExpenseSchema = z.object({
  id: z.string().cuid("ID chi phí không hợp lệ"),
});

// Delete expense schema
export const deleteExpenseSchema = z.object({
  id: z.string().cuid("ID chi phí không hợp lệ"),
});

// Get expenses list schema
export const getExpensesSchema = z.object({
  year: z.number().int().optional(),
  quarter: z.number().int().min(1).max(4).optional(),
  companyName: z.string().optional(),
  category: z.enum(EXPENSE_CATEGORIES).optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

// Get quarterly report schema
export const getQuarterlyReportSchema = z.object({
  year: z.number().int(),
  quarter: z.number().int().min(1).max(4).optional(),
});

// Export types
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type GetExpenseInput = z.infer<typeof getExpenseSchema>;
export type DeleteExpenseInput = z.infer<typeof deleteExpenseSchema>;
export type GetExpensesInput = z.infer<typeof getExpensesSchema>;
export type GetQuarterlyReportInput = z.infer<typeof getQuarterlyReportSchema>;
