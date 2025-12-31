/**
 * Payment Validation Schemas
 * Zod schemas for payment recording and management
 */
import { z } from "zod";
import { PaymentMethod } from "@prisma/client";

/**
 * Payment Method Schema
 */
export const paymentMethodSchema = z.nativeEnum(PaymentMethod);

/**
 * Create Payment Schema
 * For recording a new payment against an invoice
 */
export const createPaymentSchema = z
  .object({
    invoiceId: z.string().cuid("ID hóa đơn không hợp lệ"),

    // Payment details
    amount: z
      .number({ message: "Số tiền thanh toán là bắt buộc" })
      .positive("Số tiền phải lớn hơn 0")
      .max(1000000000, "Số tiền quá lớn"),

    paymentDate: z
      .date({ message: "Ngày thanh toán là bắt buộc" })
      .max(new Date(), "Ngày thanh toán không thể trong tương lai"),

    paymentMethod: paymentMethodSchema.default("BANK_TRANSFER"),

    // Bank transfer details
    bankRef: z.string().optional().nullable(),
    bankName: z.string().max(100).optional().nullable(),
    accountNumber: z.string().max(50).optional().nullable(),
    accountName: z.string().max(100).optional().nullable(),

    // Cash/other details
    receivedBy: z.string().max(100).optional().nullable(),
    receiptNumber: z.string().max(50).optional().nullable(),

    // Additional info
    notes: z.string().max(1000).optional().nullable(),
    receiptUrl: z.string().url("URL không hợp lệ").optional().nullable(),
  })
  .refine(
    (data) => {
      // If bank transfer, require bank reference
      if (data.paymentMethod === "BANK_TRANSFER") {
        return !!data.bankRef;
      }
      return true;
    },
    {
      message: "Số giao dịch ngân hàng là bắt buộc khi thanh toán bằng chuyển khoản",
      path: ["bankRef"],
    }
  )
  .refine(
    (data) => {
      // If cash, require received by
      if (data.paymentMethod === "CASH") {
        return !!data.receivedBy;
      }
      return true;
    },
    {
      message: "Người nhận tiền là bắt buộc khi thanh toán bằng tiền mặt",
      path: ["receivedBy"],
    }
  );

/**
 * Update Payment Schema
 * For updating existing payment details
 */
export const updatePaymentSchema = z
  .object({
    amount: z.number().positive().max(1000000000).optional(),
    paymentDate: z.date().max(new Date()).optional(),
    paymentMethod: paymentMethodSchema.optional(),

    // Bank transfer details
    bankRef: z.string().optional().nullable(),
    bankName: z.string().max(100).optional().nullable(),
    accountNumber: z.string().max(50).optional().nullable(),
    accountName: z.string().max(100).optional().nullable(),

    // Cash/other details
    receivedBy: z.string().max(100).optional().nullable(),
    receiptNumber: z.string().max(50).optional().nullable(),

    // Additional info
    notes: z.string().max(1000).optional().nullable(),
    receiptUrl: z.string().url("URL không hợp lệ").optional().nullable(),
  })
  .partial();

/**
 * Verify Payment Schema
 * For verifying a payment
 */
export const verifyPaymentSchema = z.object({
  paymentId: z.string().cuid("ID thanh toán không hợp lệ"),
  notes: z.string().max(500).optional().nullable(),
});

/**
 * Payment Search/Filter Schema
 */
export const paymentSearchSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  invoiceId: z.string().cuid().optional(),
  customerId: z.string().cuid().optional(),
  paymentMethod: paymentMethodSchema.optional(),
  isVerified: z.boolean().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  minAmount: z.number().positive().optional(),
  maxAmount: z.number().positive().optional(),
});

/**
 * Type exports
 */
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type PaymentSearchParams = z.infer<typeof paymentSearchSchema>;
