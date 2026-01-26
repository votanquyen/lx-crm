/**
 * Contract Validation Schemas
 * Zod schemas for contract, invoice, and payment operations
 */
import { z } from "zod";
import { ContractStatus, InvoiceStatus, PaymentMethod } from "@prisma/client";
import { sanitizeText } from "@/lib/sanitize";

/**
 * Contract item schema
 */
export const contractItemSchema = z.object({
  plantTypeId: z.string().cuid("ID loại cây không hợp lệ"),
  quantity: z.number().int().positive("Số lượng phải lớn hơn 0"),
  unitPrice: z.number().nonnegative("Đơn giá không được âm"),
  notes: z.string().max(500).transform(val => sanitizeText(val)).optional(),
});

/**
 * Create contract schema
 */
export const createContractSchema = z.object({
  customerId: z.string().cuid("ID khách hàng không hợp lệ"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  depositAmount: z.number().nonnegative().optional(),
  paymentTerms: z.string().max(500).optional(),
  notes: z.string().max(2000).transform(val => sanitizeText(val)).optional(),
  items: z.array(contractItemSchema).min(1, "Phải có ít nhất 1 loại cây"),
});

/**
 * Update contract schema
 */
export const updateContractSchema = z.object({
  id: z.string().cuid(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  depositAmount: z.number().nonnegative().optional(),
  paymentTerms: z.string().max(500).optional(),
  notes: z.string().max(2000).transform(val => sanitizeText(val)).optional(),
  items: z.array(contractItemSchema).min(1).optional(),
});

/**
 * Contract search params
 */
export const contractSearchSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  status: z.nativeEnum(ContractStatus).optional(),
  customerId: z.string().cuid().optional(),
  expiringDays: z.coerce.number().int().positive().optional(),
});

/**
 * Invoice item schema
 */
export const invoiceItemSchema = z.object({
  description: z.string().min(1, "Mô tả không được để trống").max(500),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
});

/**
 * Create invoice schema
 */
export const createInvoiceSchema = z.object({
  customerId: z.string().cuid(),
  contractId: z.string().cuid().optional(),
  issueDate: z.coerce.date().optional(),
  dueDate: z.coerce.date(),
  notes: z.string().max(2000).transform(val => sanitizeText(val)).optional(),
  items: z.array(invoiceItemSchema).min(1, "Phải có ít nhất 1 mục"),
});

/**
 * Invoice search params
 */
export const invoiceSearchSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  status: z.nativeEnum(InvoiceStatus).optional(),
  customerId: z.string().cuid().optional(),
  overdueOnly: z.coerce.boolean().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

/**
 * Payment schema
 */
export const paymentSchema = z.object({
  invoiceId: z.string().cuid(),
  amount: z.number().positive("Số tiền phải lớn hơn 0"),
  paymentDate: z.coerce.date().optional(),
  method: z.nativeEnum(PaymentMethod).default("BANK_TRANSFER"),
  reference: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});

/**
 * Type exports
 */
export type ContractItemInput = z.infer<typeof contractItemSchema>;
export type CreateContractInput = z.infer<typeof createContractSchema>;
export type UpdateContractInput = z.infer<typeof updateContractSchema>;
export type ContractSearchParams = z.input<typeof contractSearchSchema>;

export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type InvoiceSearchParams = z.input<typeof invoiceSearchSchema>;

export type PaymentInput = z.infer<typeof paymentSchema>;

/**
 * Link SmartVAS schema - for manually linking external invoice data
 */
export const linkSmartvasSchema = z.object({
  invoiceId: z.string().cuid("ID hóa đơn không hợp lệ"),
  smartvasInvoiceNumber: z.string().min(1, "Số hóa đơn bắt buộc").max(50),
  smartvasSerialNumber: z.string().min(1, "Ký hiệu hóa đơn bắt buộc").max(50),
  smartvasIssueDate: z.coerce.date(),
  smartvasPdfUrl: z.string().url("URL PDF không hợp lệ").max(500).optional(),
  smartvasXmlUrl: z.string().url("URL XML không hợp lệ").max(500).optional(),
});

/**
 * Update payment date schema
 */
export const updatePaymentDateSchema = z.object({
  invoiceId: z.string().cuid("ID hóa đơn không hợp lệ"),
  paymentDate: z.coerce.date(),
});

export type LinkSmartvasInput = z.infer<typeof linkSmartvasSchema>;
export type UpdatePaymentDateInput = z.infer<typeof updatePaymentDateSchema>;
