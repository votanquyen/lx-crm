/**
 * Exchange Request Validation Schemas
 */
import { z } from "zod";
import { ExchangeStatus, ExchangePriority } from "@prisma/client";

/**
 * Plant to replace schema
 */
export const plantToReplaceSchema = z.object({
  plantTypeId: z.string().cuid(),
  quantity: z.number().int().positive(),
  reason: z.string().max(500).optional(),
});

/**
 * Create exchange request schema
 */
export const createExchangeRequestSchema = z.object({
  customerId: z.string().cuid("ID khách hàng không hợp lệ"),
  priority: z.nativeEnum(ExchangePriority).default("MEDIUM"),
  reason: z.string().max(1000).optional(),
  preferredDate: z.coerce.date().optional(),
  quantity: z.number().int().positive().default(1),
  currentPlant: z.string().max(200).optional(),
  requestedPlant: z.string().max(200).optional(),
  plantLocation: z.string().max(200).optional(),
});

/**
 * Update exchange request schema
 */
export const updateExchangeRequestSchema = z.object({
  id: z.string().cuid(),
  priority: z.nativeEnum(ExchangePriority).optional(),
  status: z.nativeEnum(ExchangeStatus).optional(),
  reason: z.string().max(1000).optional(),
  preferredDate: z.coerce.date().optional(),
  quantity: z.number().int().positive().optional(),
});

/**
 * Exchange search params
 */
export const exchangeSearchSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.nativeEnum(ExchangeStatus).optional(),
  priority: z.nativeEnum(ExchangePriority).optional(),
  customerId: z.string().cuid().optional(),
});

/**
 * Type exports
 */
export type PlantToReplaceInput = z.infer<typeof plantToReplaceSchema>;
export type CreateExchangeRequestInput = z.infer<typeof createExchangeRequestSchema>;
export type UpdateExchangeRequestInput = z.infer<typeof updateExchangeRequestSchema>;
export type ExchangeSearchParams = z.input<typeof exchangeSearchSchema>;
