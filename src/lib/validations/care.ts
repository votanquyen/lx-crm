/**
 * Care Schedule Validation Schemas
 * Zod schemas for care scheduling operations
 */
import { z } from "zod";
import { CareStatus } from "@prisma/client";

/**
 * Create care schedule schema
 */
export const createCareScheduleSchema = z.object({
  customerId: z.string().cuid("ID khách hàng không hợp lệ"),
  scheduledDate: z.coerce.date(),
  scheduledTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Thời gian phải có định dạng HH:mm")
    .optional(),
  staffId: z.string().cuid().optional(),
  notes: z.string().max(1000).optional(),
});

/**
 * Update care schedule schema
 */
export const updateCareScheduleSchema = z.object({
  id: z.string().cuid(),
  scheduledDate: z.coerce.date().optional(),
  scheduledTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  staffId: z.string().cuid().optional().nullable(),
  status: z.nativeEnum(CareStatus).optional(),
  notes: z.string().max(1000).optional(),
});

/**
 * Check-in schema
 */
export const checkInSchema = z.object({
  id: z.string().cuid(),
  latitude: z.number(),
  longitude: z.number(),
});

/**
 * Check-out/complete schema
 */
export const completeCareSchema = z.object({
  id: z.string().cuid(),
  workReport: z.string().min(1, "Báo cáo công việc không được để trống").max(2000),
  notes: z.string().max(1000).optional(),
  photos: z.array(z.string().url()).optional(),
});

/**
 * Care schedule search params
 */
export const careSearchSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.nativeEnum(CareStatus).optional(),
  staffId: z.string().cuid().optional(),
  customerId: z.string().cuid().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

/**
 * Type exports
 */
export type CreateCareScheduleInput = z.infer<typeof createCareScheduleSchema>;
export type UpdateCareScheduleInput = z.infer<typeof updateCareScheduleSchema>;
export type CheckInInput = z.infer<typeof checkInSchema>;
export type CompleteCareInput = z.infer<typeof completeCareSchema>;
export type CareSearchParams = z.input<typeof careSearchSchema>;
