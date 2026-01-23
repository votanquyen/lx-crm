/**
 * Validation schemas for Sticky Notes
 * Vietnamese error messages for user-facing errors
 */
import { z } from "zod";

// ============================================================
// ENUMS
// ============================================================

export const noteCategoryEnum = z.enum([
  "GENERAL",
  "URGENT",
  "COMPLAINT",
  "REQUEST",
  "FEEDBACK",
  "EXCHANGE",
  "CARE",
  "PAYMENT",
]);

export const noteStatusEnum = z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CANCELLED"]);

export const noteSourceEnum = z.enum(["PHONE", "EMAIL", "TELEGRAM", "CARE_VISIT", "MANUAL", "WEB"]);

// ============================================================
// CREATE STICKY NOTE
// ============================================================

export const createStickyNoteSchema = z.object({
  customerId: z.string({
    message: "Vui lòng chọn khách hàng",
  }),
  title: z.string().optional(),
  content: z
    .string({
      message: "Vui lòng nhập nội dung ghi chú",
    })
    .min(1, "Nội dung không được để trống"),
  category: noteCategoryEnum.default("GENERAL"),
  priority: z.coerce
    .number()
    .min(1, "Mức độ ưu tiên từ 1-10")
    .max(10, "Mức độ ưu tiên từ 1-10")
    .default(5),
  priorityReason: z.string().optional(),
  source: noteSourceEnum.optional(),
  sourceRef: z.string().optional(),
  callerName: z.string().optional(),
  callerPhone: z.string().optional(),
  dueDate: z.coerce.date().optional(),
  reminderDate: z.coerce.date().optional(),
  assignedToId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  linkedCareId: z.string().optional(),
  linkedExchangeId: z.string().optional(),
  linkedInvoiceId: z.string().optional(),
  linkedQuotationId: z.string().optional(),
});

export type CreateStickyNoteInput = z.infer<typeof createStickyNoteSchema>;

// ============================================================
// UPDATE STICKY NOTE
// ============================================================

export const updateStickyNoteSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1, "Nội dung không được để trống").optional(),
  category: noteCategoryEnum.optional(),
  priority: z.coerce
    .number()
    .min(1, "Mức độ ưu tiên từ 1-10")
    .max(10, "Mức độ ưu tiên từ 1-10")
    .optional(),
  priorityReason: z.string().optional(),
  status: noteStatusEnum.optional(),
  source: noteSourceEnum.optional(),
  sourceRef: z.string().optional(),
  callerName: z.string().optional(),
  callerPhone: z.string().optional(),
  dueDate: z.coerce.date().optional(),
  reminderDate: z.coerce.date().optional(),
  assignedToId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  linkedCareId: z.string().optional(),
  linkedExchangeId: z.string().optional(),
  linkedInvoiceId: z.string().optional(),
  linkedQuotationId: z.string().optional(),
});

export type UpdateStickyNoteInput = z.infer<typeof updateStickyNoteSchema>;

// ============================================================
// RESOLVE STICKY NOTE
// ============================================================

export const resolveStickyNoteSchema = z.object({
  resolution: z
    .string({
      message: "Vui lòng nhập giải pháp",
    })
    .min(1, "Giải pháp không được để trống"),
});

export type ResolveStickyNoteInput = z.infer<typeof resolveStickyNoteSchema>;

// ============================================================
// ASSIGN STICKY NOTE
// ============================================================

export const assignStickyNoteSchema = z.object({
  assignedToId: z.string({
    message: "Vui lòng chọn nhân viên",
  }),
});

export type AssignStickyNoteInput = z.infer<typeof assignStickyNoteSchema>;

// ============================================================
// CANCEL STICKY NOTE
// ============================================================

export const cancelStickyNoteSchema = z.object({
  reason: z.string().optional(),
});

export type CancelStickyNoteInput = z.infer<typeof cancelStickyNoteSchema>;

// ============================================================
// SEARCH / FILTER STICKY NOTES
// ============================================================

export const stickyNoteSearchSchema = z.object({
  // Customer filter
  customerId: z.string().optional(),

  // Status filter
  status: noteStatusEnum.optional(),

  // Category filter
  category: noteCategoryEnum.optional(),

  // Priority filter
  priorityMin: z.coerce.number().min(1).max(10).optional(),
  priorityMax: z.coerce.number().min(1).max(10).optional(),

  // Assignment filter
  assignedToId: z.string().optional(),
  unassignedOnly: z.coerce.boolean().optional(),
  myNotesOnly: z.coerce.boolean().optional(),

  // Date filters
  createdFrom: z.coerce.date().optional(),
  createdTo: z.coerce.date().optional(),
  dueFrom: z.coerce.date().optional(),
  dueTo: z.coerce.date().optional(),

  // Search
  search: z.string().optional(), // Search in title and content

  // Tag filter
  tags: z.array(z.string()).optional(),

  // Show overdue only
  overdueOnly: z.coerce.boolean().optional(),

  // Pagination
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),

  // Sorting
  sortBy: z.enum(["createdAt", "dueDate", "priority", "updatedAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type StickyNoteSearchInput = z.infer<typeof stickyNoteSearchSchema>;

// ============================================================
// LINK NOTE TO RECORD
// ============================================================

export const linkNoteSchema = z
  .object({
    linkedCareId: z.string().optional(),
    linkedExchangeId: z.string().optional(),
    linkedInvoiceId: z.string().optional(),
    linkedQuotationId: z.string().optional(),
  })
  .refine(
    (data) => {
      // At least one link must be provided
      return Boolean(
        data.linkedCareId || data.linkedExchangeId || data.linkedInvoiceId || data.linkedQuotationId
      );
    },
    { message: "Vui lòng chọn ít nhất một liên kết" }
  );

export type LinkNoteInput = z.infer<typeof linkNoteSchema>;
