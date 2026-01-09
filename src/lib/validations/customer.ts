/**
 * Customer Validation Schemas
 * Zod schemas for customer CRUD operations
 */
import { z } from "zod";
import { CustomerStatus } from "@prisma/client";

/**
 * Vietnamese phone number regex: 0[0-9]{9}
 */
const phoneRegex = /^0[0-9]{9}$/;

/**
 * Base customer schema for create/update operations
 */
export const customerSchema = z.object({
  // Basic Info
  companyName: z
    .string()
    .min(1, "Tên công ty không được để trống")
    .max(255, "Tên công ty tối đa 255 ký tự"),
  address: z.string().min(1, "Địa chỉ không được để trống").max(500, "Địa chỉ tối đa 500 ký tự"),
  district: z.string().max(100).optional().nullable(),
  city: z.string().max(100).default("TP.HCM").optional(),
  taxCode: z.string().max(20).optional().nullable(),
  status: z.nativeEnum(CustomerStatus).optional(),

  // Primary Contact
  contactName: z.string().max(100).optional().nullable(),
  contactPhone: z
    .string()
    .regex(phoneRegex, "Số điện thoại không hợp lệ (VD: 0901234567)")
    .optional()
    .nullable()
    .or(z.literal("")),
  contactEmail: z.string().email("Email không hợp lệ").optional().nullable().or(z.literal("")),
  contactTitle: z.string().max(100).optional().nullable(),

  // Secondary Contact
  contact2Name: z.string().max(100).optional().nullable(),
  contact2Phone: z
    .string()
    .regex(phoneRegex, "Số điện thoại không hợp lệ")
    .optional()
    .nullable()
    .or(z.literal("")),
  contact2Email: z.string().email("Email không hợp lệ").optional().nullable().or(z.literal("")),
  contact2Title: z.string().max(100).optional().nullable(),

  // Accounting Contact
  accountingContactName: z.string().max(100).optional().nullable(),
  accountingContactPhone: z
    .string()
    .regex(phoneRegex, "Số điện thoại không hợp lệ")
    .optional()
    .nullable()
    .or(z.literal("")),
  accountingContactEmail: z
    .string()
    .email("Email không hợp lệ")
    .optional()
    .nullable()
    .or(z.literal("")),

  // Building Details
  floorCount: z.number().int().positive().optional().nullable(),
  hasElevator: z.boolean().optional().nullable(),
  parkingNote: z.string().max(500).optional().nullable(),
  accessNote: z.string().max(500).optional().nullable(),

  // Care Preferences
  careWeekday: z.number().int().min(0).max(6).optional().nullable(), // 0=Sunday, 6=Saturday
  careTimeSlot: z.string().max(50).optional().nullable(),
  preferredStaffId: z.string().cuid().optional().nullable(),
  specialRequests: z.string().max(1000).optional().nullable(),

  // Billing
  billingCycle: z.string().max(50).optional().nullable(),
  paymentTermDays: z.number().int().positive().optional().nullable(),

  // Location
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),

  // Notes
  internalNotes: z.string().max(2000).optional().nullable(),
});

/**
 * Schema for creating a new customer
 */
export const createCustomerSchema = customerSchema;

/**
 * Schema for updating an existing customer
 */
export const updateCustomerSchema = customerSchema.partial().extend({
  id: z.string().cuid("ID không hợp lệ"),
});

/**
 * Schema for customer search/filter params
 */
export const customerSearchSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  status: z.nativeEnum(CustomerStatus).optional(),
  district: z.string().optional(),
  hasDebt: z.coerce.boolean().optional(),
  sortBy: z.enum(["companyName", "createdAt", "updatedAt", "code"]).default("companyName"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

/**
 * Type exports
 */
export type CustomerInput = z.infer<typeof customerSchema>;
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CustomerSearchParams = z.input<typeof customerSearchSchema>;
