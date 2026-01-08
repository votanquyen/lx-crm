import { z } from "zod";

// Plant item schema
export const plantItemSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1, "Tên cây không được để trống"),
  sizeSpec: z.string().min(1, "Quy cách không được để trống"),
  quantity: z.number().int().positive("Số lượng phải lớn hơn 0"),
  unitPrice: z.number().int().min(0, "Đơn giá phải >= 0"),
  total: z.number().int().min(0, "Thành tiền phải >= 0"),
});

// Create monthly statement schema
export const createMonthlyStatementSchema = z.object({
  customerId: z.string().cuid("ID khách hàng không hợp lệ"),
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
  contactName: z.string().optional(),
  plants: z.array(plantItemSchema).default([]),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
});

// Update monthly statement schema
export const updateMonthlyStatementSchema = z.object({
  id: z.string().cuid("ID bảng kê không hợp lệ"),
  // Header fields
  contactName: z.string().optional(),
  // Plants
  plants: z.array(plantItemSchema),
  // VAT rate
  vatRate: z.number().min(0).max(20).default(8),
  // Notes
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
});

// Confirm monthly statement schema
export const confirmMonthlyStatementSchema = z.object({
  id: z.string().cuid("ID bảng kê không hợp lệ"),
});

// Delete monthly statement schema
export const deleteMonthlyStatementSchema = z.object({
  id: z.string().cuid("ID bảng kê không hợp lệ"),
});

// Get monthly statement schema
export const getMonthlyStatementSchema = z.object({
  id: z.string().cuid("ID bảng kê không hợp lệ"),
});

// Get monthly statements list schema
export const getMonthlyStatementsSchema = z.object({
  customerId: z.string().cuid().optional(),
  year: z.number().int().optional(),
  month: z.number().int().min(1).max(12).optional(),
  needsConfirmation: z.boolean().optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

// Auto-rollover schema
export const autoRolloverSchema = z.object({
  targetYear: z.number().int().min(2020).max(2100),
  targetMonth: z.number().int().min(1).max(12),
  customerIds: z.array(z.string().cuid()).optional(), // If not provided, rollover for all
});

// Export schemas types
export type CreateMonthlyStatementInput = z.infer<typeof createMonthlyStatementSchema>;
export type UpdateMonthlyStatementInput = z.infer<typeof updateMonthlyStatementSchema>;
export type ConfirmMonthlyStatementInput = z.infer<typeof confirmMonthlyStatementSchema>;
export type DeleteMonthlyStatementInput = z.infer<typeof deleteMonthlyStatementSchema>;
export type GetMonthlyStatementInput = z.infer<typeof getMonthlyStatementSchema>;
export type GetMonthlyStatementsInput = z.infer<typeof getMonthlyStatementsSchema>;
export type AutoRolloverInput = z.infer<typeof autoRolloverSchema>;
