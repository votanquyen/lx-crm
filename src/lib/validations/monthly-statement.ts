import { z } from "zod";

// Plant item schema - relaxed ID for imported data
export const plantItemSchema = z.object({
  id: z.string().min(1, "ID không được để trống"),
  name: z.string().min(1, "Tên cây không được để trống"),
  sizeSpec: z.string(),  // Allow empty sizeSpec
  quantity: z.number().int().positive("Số lượng phải lớn hơn 0"),
  unitPrice: z.number().int().min(0, "Đơn giá phải >= 0"),
  total: z.number().int().min(0, "Thành tiền phải >= 0"),
});

// Create monthly statement schema
export const createMonthlyStatementSchema = z.object({
  customerId: z.string().min(1, "ID khách hàng không hợp lệ"),
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
  contactName: z.string().optional(),
  plants: z.array(plantItemSchema).default([]),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
});

// Update monthly statement schema - relaxed ID for UUID support
export const updateMonthlyStatementSchema = z.object({
  id: z.string().min(1, "ID bảng kê không hợp lệ"),
  contactName: z.string().optional(),
  plants: z.array(plantItemSchema),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
});

// Confirm monthly statement schema - relaxed ID for UUID support
export const confirmMonthlyStatementSchema = z.object({
  id: z.string().min(1, "ID bảng kê không hợp lệ"),
});

// Delete monthly statement schema - relaxed ID for UUID support
export const deleteMonthlyStatementSchema = z.object({
  id: z.string().min(1, "ID bảng kê không hợp lệ"),
});

// Restore monthly statement schema (undo soft delete)
export const restoreMonthlyStatementSchema = z.object({
  id: z.string().min(1, "ID bảng kê không hợp lệ"),
});

// Get monthly statement schema - relaxed ID for UUID support
export const getMonthlyStatementSchema = z.object({
  id: z.string().min(1, "ID bảng kê không hợp lệ"),
});

// Get monthly statements list schema
export const getMonthlyStatementsSchema = z.object({
  customerId: z.string().min(1).optional(),
  year: z.number().int().optional(),
  month: z.number().int().min(1).max(12).optional(),
  needsConfirmation: z.boolean().optional(),
  limit: z.number().int().positive().max(500).default(50),
  offset: z.number().int().min(0).default(0),
});

// Auto-rollover schema - relaxed customer IDs for UUID support
export const autoRolloverSchema = z.object({
  targetYear: z.number().int().min(2020).max(2100),
  targetMonth: z.number().int().min(1).max(12),
  customerIds: z.array(z.string().min(1)).optional(), // If not provided, rollover for all
});

// Export schemas types
export type CreateMonthlyStatementInput = z.infer<typeof createMonthlyStatementSchema>;
export type UpdateMonthlyStatementInput = z.infer<typeof updateMonthlyStatementSchema>;
export type ConfirmMonthlyStatementInput = z.infer<typeof confirmMonthlyStatementSchema>;
export type DeleteMonthlyStatementInput = z.infer<typeof deleteMonthlyStatementSchema>;
export type RestoreMonthlyStatementInput = z.infer<typeof restoreMonthlyStatementSchema>;
export type GetMonthlyStatementInput = z.infer<typeof getMonthlyStatementSchema>;
export type GetMonthlyStatementsInput = z.infer<typeof getMonthlyStatementsSchema>;
export type AutoRolloverInput = z.infer<typeof autoRolloverSchema>;
