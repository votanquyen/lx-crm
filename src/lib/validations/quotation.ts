/**
 * Quotation Validation Schemas
 * Zod schemas for quotation management
 */
import { z } from "zod";
import { QuotationStatus } from "@prisma/client";

/**
 * Quotation Status Schema
 */
export const quotationStatusSchema = z.nativeEnum(QuotationStatus);

/**
 * Quotation Item Schema
 * For adding/editing items in a quotation
 */
export const quotationItemSchema = z.object({
  plantTypeId: z.string().cuid("ID loại cây không hợp lệ"),
  quantity: z
    .number({ message: "Số lượng là bắt buộc" })
    .int("Số lượng phải là số nguyên")
    .positive("Số lượng phải lớn hơn 0")
    .max(10000, "Số lượng quá lớn"),
  unitPrice: z
    .number({ message: "Đơn giá là bắt buộc" })
    .nonnegative("Đơn giá không thể âm")
    .max(1000000000, "Đơn giá quá lớn"),
  discountRate: z
    .number()
    .min(0, "Chiết khấu không thể âm")
    .max(100, "Chiết khấu không thể vượt quá 100%")
    .default(0),
  locationNote: z.string().max(200).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

/**
 * Create Quotation Schema
 */
export const createQuotationSchema = z
  .object({
    // Customer
    customerId: z.string().cuid("ID khách hàng không hợp lệ"),

    // Basic info
    title: z
      .string()
      .min(1, "Tiêu đề là bắt buộc")
      .max(200, "Tiêu đề quá dài")
      .optional()
      .nullable(),
    description: z.string().max(2000).optional().nullable(),

    // Validity period
    validFrom: z.date({ message: "Ngày bắt đầu hiệu lực là bắt buộc" }),
    validUntil: z.date({ message: "Ngày hết hiệu lực là bắt buộc" }),

    // Pricing (calculated fields - optional on create)
    subtotal: z.number().nonnegative().default(0),
    discountRate: z
      .number()
      .min(0, "Chiết khấu không thể âm")
      .max(100, "Chiết khấu không thể vượt quá 100%")
      .default(0),
    discountAmount: z.number().nonnegative().default(0),
    vatRate: z
      .number()
      .min(0, "VAT không thể âm")
      .max(100, "VAT không thể vượt quá 100%")
      .default(10),
    vatAmount: z.number().nonnegative().default(0),
    totalAmount: z.number().nonnegative().default(0),

    // Proposed contract terms
    proposedStartDate: z.date().optional().nullable(),
    proposedDuration: z
      .number()
      .int("Thời hạn phải là số nguyên")
      .positive("Thời hạn phải lớn hơn 0")
      .max(120, "Thời hạn tối đa 120 tháng")
      .optional()
      .nullable(),
    proposedMonthlyFee: z
      .number()
      .nonnegative("Phí hàng tháng không thể âm")
      .max(1000000000, "Phí hàng tháng quá lớn")
      .optional()
      .nullable(),
    proposedDeposit: z
      .number()
      .nonnegative("Tiền cọc không thể âm")
      .max(1000000000, "Tiền cọc quá lớn")
      .optional()
      .nullable(),

    // Notes
    notes: z.string().max(2000).optional().nullable(),
    termsConditions: z.string().max(5000).optional().nullable(),
    internalNotes: z.string().max(2000).optional().nullable(),

    // Items
    items: z
      .array(quotationItemSchema)
      .min(1, "Báo giá phải có ít nhất 1 sản phẩm")
      .max(100, "Quá nhiều sản phẩm"),
  })
  .refine(
    (data) => {
      // Valid until must be after valid from
      return data.validUntil > data.validFrom;
    },
    {
      message: "Ngày hết hiệu lực phải sau ngày bắt đầu",
      path: ["validUntil"],
    }
  )
  .refine(
    (data) => {
      // If proposed start date exists, it should be after valid from
      if (data.proposedStartDate) {
        return data.proposedStartDate >= data.validFrom;
      }
      return true;
    },
    {
      message: "Ngày bắt đầu hợp đồng đề xuất phải sau ngày bắt đầu hiệu lực",
      path: ["proposedStartDate"],
    }
  );

/**
 * Base quotation schema (without refinements for partial updates)
 */
const baseQuotationSchema = z.object({
  // Customer
  customerId: z.string().cuid("ID khách hàng không hợp lệ"),

  // Basic info
  title: z.string().min(1, "Tiêu đề là bắt buộc").max(200, "Tiêu đề quá dài").optional().nullable(),
  description: z.string().max(2000).optional().nullable(),

  // Validity period
  validFrom: z.date({ message: "Ngày bắt đầu hiệu lực là bắt buộc" }),
  validUntil: z.date({ message: "Ngày hết hiệu lực là bắt buộc" }),

  // Pricing (calculated fields - optional on create)
  subtotal: z.number().nonnegative().default(0),
  discountRate: z
    .number()
    .min(0, "Chiết khấu không thể âm")
    .max(100, "Chiết khấu không thể vượt quá 100%")
    .default(0),
  discountAmount: z.number().nonnegative().default(0),
  vatRate: z
    .number()
    .min(0, "VAT không thể âm")
    .max(100, "VAT không thể vượt quá 100%")
    .default(10),
  vatAmount: z.number().nonnegative().default(0),
  totalAmount: z.number().nonnegative().default(0),

  // Proposed contract terms
  proposedStartDate: z.date().optional().nullable(),
  proposedDuration: z
    .number()
    .int("Thời hạn phải là số nguyên")
    .positive("Thời hạn phải lớn hơn 0")
    .max(120, "Thời hạn tối đa 120 tháng")
    .optional()
    .nullable(),
  proposedMonthlyFee: z
    .number()
    .nonnegative("Phí hàng tháng không thể âm")
    .max(1000000000, "Phí hàng tháng quá lớn")
    .optional()
    .nullable(),
  proposedDeposit: z
    .number()
    .nonnegative("Tiền cọc không thể âm")
    .max(1000000000, "Tiền cọc quá lớn")
    .optional()
    .nullable(),

  // Notes
  notes: z.string().max(2000).optional().nullable(),
  termsConditions: z.string().max(5000).optional().nullable(),
  internalNotes: z.string().max(2000).optional().nullable(),

  // Items
  items: z
    .array(quotationItemSchema)
    .min(1, "Báo giá phải có ít nhất 1 sản phẩm")
    .max(100, "Quá nhiều sản phẩm"),
});

/**
 * Update Quotation Schema
 * Similar to create but allows partial updates
 */
export const updateQuotationSchema = baseQuotationSchema
  .partial()
  .extend({
    id: z.string().cuid("ID báo giá không hợp lệ"),
  })
  .refine(
    (data) => {
      // If both dates provided, valid until must be after valid from
      if (data.validFrom && data.validUntil) {
        return data.validUntil > data.validFrom;
      }
      return true;
    },
    {
      message: "Ngày hết hiệu lực phải sau ngày bắt đầu",
      path: ["validUntil"],
    }
  );

/**
 * Update Quotation Status Schema
 */
export const updateQuotationStatusSchema = z.object({
  id: z.string().cuid("ID báo giá không hợp lệ"),
  status: quotationStatusSchema,
  rejectionReason: z.string().max(500).optional().nullable(),
  customerResponse: z.string().max(1000).optional().nullable(),
});

/**
 * Add/Update Quotation Item Schema
 */
export const addQuotationItemSchema = z.object({
  quotationId: z.string().cuid("ID báo giá không hợp lệ"),
  ...quotationItemSchema.shape,
});

export const updateQuotationItemSchema = z.object({
  id: z.string().cuid("ID mục báo giá không hợp lệ"),
  ...quotationItemSchema.partial().shape,
});

/**
 * Remove Quotation Item Schema
 */
export const removeQuotationItemSchema = z.object({
  id: z.string().cuid("ID mục báo giá không hợp lệ"),
});

/**
 * Quotation Search/Filter Schema
 */
export const quotationSearchSchema = z.object({
  // Pagination
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),

  // Search
  search: z.string().max(200).optional(),

  // Filters
  status: quotationStatusSchema.optional(),
  customerId: z.string().cuid().optional(),
  createdById: z.string().cuid().optional(),

  // Date range
  validFromStart: z.date().optional(),
  validFromEnd: z.date().optional(),
  validUntilStart: z.date().optional(),
  validUntilEnd: z.date().optional(),

  // Amount range
  minAmount: z.number().nonnegative().optional(),
  maxAmount: z.number().nonnegative().optional(),

  // Sorting
  sortBy: z
    .enum(["quoteNumber", "validFrom", "validUntil", "totalAmount", "createdAt", "updatedAt"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

/**
 * Convert to Contract Schema
 */
export const convertToContractSchema = z.object({
  quotationId: z.string().cuid("ID báo giá không hợp lệ"),
  startDate: z.date({ message: "Ngày bắt đầu hợp đồng là bắt buộc" }),
  duration: z
    .number({ message: "Thời hạn hợp đồng là bắt buộc" })
    .int("Thời hạn phải là số nguyên")
    .positive("Thời hạn phải lớn hơn 0")
    .max(120, "Thời hạn tối đa 120 tháng"),
  monthlyFee: z
    .number({ message: "Phí hàng tháng là bắt buộc" })
    .positive("Phí hàng tháng phải lớn hơn 0")
    .max(1000000000, "Phí hàng tháng quá lớn"),
  deposit: z
    .number({ message: "Tiền cọc là bắt buộc" })
    .nonnegative("Tiền cọc không thể âm")
    .max(1000000000, "Tiền cọc quá lớn"),
  notes: z.string().max(2000).optional().nullable(),
});

/**
 * Send Quotation Schema
 */
export const sendQuotationSchema = z.object({
  quotationId: z.string().cuid("ID báo giá không hợp lệ"),
  recipientEmail: z.string().email("Email không hợp lệ").optional(),
  recipientName: z.string().max(100).optional(),
  message: z.string().max(1000).optional().nullable(),
});

/**
 * Type exports for TypeScript
 */
export type QuotationItemInput = z.infer<typeof quotationItemSchema>;
export type CreateQuotationInput = z.infer<typeof createQuotationSchema>;
export type UpdateQuotationInput = z.infer<typeof updateQuotationSchema>;
export type UpdateQuotationStatusInput = z.infer<typeof updateQuotationStatusSchema>;
export type AddQuotationItemInput = z.infer<typeof addQuotationItemSchema>;
export type UpdateQuotationItemInput = z.infer<typeof updateQuotationItemSchema>;
export type RemoveQuotationItemInput = z.infer<typeof removeQuotationItemSchema>;
export type QuotationSearchInput = z.infer<typeof quotationSearchSchema>;
export type ConvertToContractInput = z.infer<typeof convertToContractSchema>;
export type SendQuotationInput = z.infer<typeof sendQuotationSchema>;
