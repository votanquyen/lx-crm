/**
 * Plant Type Validation Schemas
 * Zod schemas for plant type and inventory CRUD operations
 */
import { z } from "zod";

/**
 * Create Plant Type Schema
 */
export const createPlantTypeSchema = z.object({
  // Basic Info
  code: z
    .string()
    .min(1, "Mã cây không được để trống")
    .max(10, "Mã cây tối đa 10 ký tự")
    .regex(/^[A-Z0-9]+$/, "Mã cây chỉ được chứa chữ in hoa và số (VD: KT, PT01)"),
  name: z.string().min(1, "Tên cây không được để trống").max(255, "Tên cây tối đa 255 ký tự"),
  description: z.string().max(2000, "Mô tả tối đa 2000 ký tự").optional().nullable(),
  category: z.string().max(50).optional().nullable(),

  // Specifications
  sizeSpec: z.string().max(100).optional().nullable(),
  heightMin: z.number().int().positive().optional().nullable(),
  heightMax: z.number().int().positive().optional().nullable(),
  potSize: z.string().max(20).optional().nullable(),
  potDiameter: z.number().int().positive().optional().nullable(),

  // Pricing (VND)
  rentalPrice: z.number().nonnegative("Giá thuê phải >= 0").default(50000),
  depositPrice: z.number().nonnegative().optional().nullable(),
  salePrice: z.number().nonnegative().optional().nullable(),
  replacementPrice: z.number().nonnegative().optional().nullable(),

  // Care Information
  avgLifespanDays: z.number().int().positive().default(30),
  wateringFrequency: z.string().max(100).optional().nullable(),
  lightRequirement: z.string().max(100).optional().nullable(),
  temperatureRange: z.string().max(50).optional().nullable(),
  careInstructions: z.string().max(2000).optional().nullable(),
  careLevel: z.enum(["Easy", "Medium", "Hard"]).optional().nullable(),

  // Media
  imageUrl: z.string().url("URL hình ảnh không hợp lệ").optional().nullable(),
  thumbnailUrl: z.string().url("URL thumbnail không hợp lệ").optional().nullable(),

  // Status
  isActive: z.boolean().default(true),
});

/**
 * Update Plant Type Schema (partial of create)
 */
export const updatePlantTypeSchema = createPlantTypeSchema.partial();

/**
 * Plant Type Search Parameters
 */
export const plantTypeSearchSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  category: z.string().optional(),
  isActive: z.boolean().optional(),
  minPrice: z.number().nonnegative().optional(),
  maxPrice: z.number().nonnegative().optional(),
  sortBy: z.enum(["name", "code", "rentalPrice", "createdAt"]).default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export type PlantTypeSearchParams = z.infer<typeof plantTypeSearchSchema>;

/**
 * Inventory Update Schema
 */
export const updateInventorySchema = z
  .object({
    plantTypeId: z.string().cuid(),
    totalStock: z.number().int().nonnegative().optional(),
    availableStock: z.number().int().nonnegative().optional(),
    rentedStock: z.number().int().nonnegative().optional(),
    reservedStock: z.number().int().nonnegative().optional(),
    damagedStock: z.number().int().nonnegative().optional(),
    maintenanceStock: z.number().int().nonnegative().optional(),
    lowStockThreshold: z.number().int().nonnegative().optional(),
    reorderPoint: z.number().int().nonnegative().optional(),
    reorderQuantity: z.number().int().positive().optional(),
    warehouseLocation: z.string().max(100).optional().nullable(),
    shelfNumber: z.string().max(50).optional().nullable(),
    notes: z.string().max(1000).optional().nullable(),
  })
  .refine(
    (data) => {
      // Validate: totalStock >= availableStock + rentedStock + reservedStock + damagedStock + maintenanceStock
      if (data.totalStock !== undefined) {
        const allocated =
          (data.availableStock || 0) +
          (data.rentedStock || 0) +
          (data.reservedStock || 0) +
          (data.damagedStock || 0) +
          (data.maintenanceStock || 0);
        return data.totalStock >= allocated;
      }
      return true;
    },
    {
      message:
        "Tổng tồn kho phải >= tổng phân bổ (available + rented + reserved + damaged + maintenance)",
    }
  );

/**
 * Bulk Import Plant Types Schema
 */
export const bulkImportPlantTypesSchema = z.array(
  z.object({
    code: z.string().min(1).max(10),
    name: z.string().min(1).max(255),
    category: z.string().max(50).optional(),
    rentalPrice: z.number().nonnegative(),
    description: z.string().max(2000).optional(),
    sizeSpec: z.string().max(100).optional(),
    careLevel: z.enum(["Easy", "Medium", "Hard"]).optional(),
  })
);
