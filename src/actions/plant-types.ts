/**
 * Plant Type Server Actions
 * CRUD operations for plant types and inventory management
 */
"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireManager } from "@/lib/auth-utils";
import { AppError, NotFoundError, ConflictError } from "@/lib/errors";
import { normalizeVietnamese } from "@/lib/utils";
import { toDecimal } from "@/lib/db-utils";
import {
  createPlantTypeSchema,
  updatePlantTypeSchema,
  plantTypeSearchSchema,
  updateInventorySchema,
  type PlantTypeSearchParams,
} from "@/lib/validations/plant-type";

/**
 * Get paginated list of plant types with optional search and filters
 */
export async function getPlantTypes(params: PlantTypeSearchParams) {
  await requireAuth();

  const validated = plantTypeSearchSchema.parse(params);
  const { page, limit, search, category, isActive, minPrice, maxPrice, sortBy, sortOrder } =
    validated;

  const skip = (page - 1) * limit;

  // Build where clause
  const where: Prisma.PlantTypeWhereInput = {};

  if (isActive !== undefined) where.isActive = isActive;
  if (category) where.category = category;
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.rentalPrice = {};
    if (minPrice !== undefined) where.rentalPrice.gte = toDecimal(minPrice);
    if (maxPrice !== undefined) where.rentalPrice.lte = toDecimal(maxPrice);
  }

  // Build order by
  const orderBy: Prisma.PlantTypeOrderByWithRelationInput = {
    [sortBy]: sortOrder,
  };

  // If search query exists, use trigram search
  if (search && search.trim()) {
    const normalized = normalizeVietnamese(search);

    // Use raw query for trigram similarity search
    const plantsRaw = await prisma.$queryRaw<
      Array<{
        id: string;
        code: string;
        name: string;
        name_normalized: string | null;
        description: string | null;
        category: string | null;
        rental_price: number;
        deposit_price: number | null;
        sale_price: number | null;
        replacement_price: number | null;
        image_url: string | null;
        thumbnail_url: string | null;
        is_active: boolean;
        created_at: Date;
        updated_at: Date;
        similarity: number;
      }>
    >`
      SELECT p.*,
             GREATEST(
               similarity(COALESCE(name_normalized, ''), ${normalized}),
               similarity(code, ${search.toUpperCase()}),
               similarity(COALESCE(category, ''), ${normalized})
             ) as similarity
      FROM plant_types p
      WHERE (
          COALESCE(p.name_normalized, '') % ${normalized}
          OR p.code ILIKE ${`%${search.toUpperCase()}%`}
          OR p.name ILIKE ${`%${search}%`}
        )
        ${isActive !== undefined ? Prisma.sql`AND p.is_active = ${isActive}` : Prisma.empty}
        ${category ? Prisma.sql`AND p.category = ${category}` : Prisma.empty}
        ${minPrice !== undefined ? Prisma.sql`AND p.rental_price >= ${minPrice}` : Prisma.empty}
        ${maxPrice !== undefined ? Prisma.sql`AND p.rental_price <= ${maxPrice}` : Prisma.empty}
      ORDER BY similarity DESC, p.name ASC
      LIMIT ${limit} OFFSET ${skip}
    `;

    // Get total count for pagination
    const totalResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM plant_types p
      WHERE (
          COALESCE(p.name_normalized, '') % ${normalized}
          OR p.code ILIKE ${`%${search.toUpperCase()}%`}
          OR p.name ILIKE ${`%${search}%`}
        )
        ${isActive !== undefined ? Prisma.sql`AND p.is_active = ${isActive}` : Prisma.empty}
        ${category ? Prisma.sql`AND p.category = ${category}` : Prisma.empty}
        ${minPrice !== undefined ? Prisma.sql`AND p.rental_price >= ${minPrice}` : Prisma.empty}
        ${maxPrice !== undefined ? Prisma.sql`AND p.rental_price <= ${maxPrice}` : Prisma.empty}
    `;

    const total = Number(totalResult[0]?.count || 0);
    const totalPages = Math.ceil(total / limit);

    // Map raw results to Prisma format
    const plantTypes = plantsRaw.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      description: p.description,
      category: p.category,
      rentalPrice: toDecimal(p.rental_price),
      depositPrice: p.deposit_price ? toDecimal(p.deposit_price) : null,
      salePrice: p.sale_price ? toDecimal(p.sale_price) : null,
      replacementPrice: p.replacement_price ? toDecimal(p.replacement_price) : null,
      imageUrl: p.image_url,
      thumbnailUrl: p.thumbnail_url,
      isActive: p.is_active,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));

    return {
      plantTypes,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  // Regular search without trigram
  const [plantTypesRaw, total] = await Promise.all([
    prisma.plantType.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        category: true,
        rentalPrice: true,
        depositPrice: true,
        salePrice: true,
        replacementPrice: true,
        imageUrl: true,
        thumbnailUrl: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        inventory: {
          select: {
            totalStock: true,
            availableStock: true,
            rentedStock: true,
          },
        },
      },
    }),
    prisma.plantType.count({ where }),
  ]);

  // Convert Decimal to number for client components
  const plantTypes = plantTypesRaw.map((pt) => ({
    ...pt,
    rentalPrice: pt.rentalPrice.toNumber(),
    depositPrice: pt.depositPrice?.toNumber() ?? null,
    salePrice: pt.salePrice?.toNumber() ?? null,
    replacementPrice: pt.replacementPrice?.toNumber() ?? null,
  }));

  const totalPages = Math.ceil(total / limit);

  return {
    plantTypes,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

/**
 * Get single plant type by ID with full details including inventory
 */
export async function getPlantTypeById(id: string) {
  await requireAuth();

  const plantType = await prisma.plantType.findUnique({
    where: { id },
    include: {
      inventory: true,
      contractItems: {
        select: {
          id: true,
          quantity: true,
          contract: {
            select: {
              id: true,
              contractNumber: true,
              status: true,
              customer: {
                select: {
                  companyName: true,
                },
              },
            },
          },
        },
        where: {
          contract: {
            status: { in: ["ACTIVE", "SIGNED"] },
          },
        },
        take: 10,
      },
      _count: {
        select: {
          contractItems: true,
          quotationItems: true,
          customerPlants: true,
        },
      },
    },
  });

  if (!plantType) {
    throw new NotFoundError(`Không tìm thấy loại cây có ID: ${id}`);
  }

  // Convert Decimal to number for client components
  return {
    ...plantType,
    rentalPrice: plantType.rentalPrice.toNumber(),
    depositPrice: plantType.depositPrice?.toNumber() ?? null,
    salePrice: plantType.salePrice?.toNumber() ?? null,
    replacementPrice: plantType.replacementPrice?.toNumber() ?? null,
  };
}

/**
 * Get plant type by code
 */
export async function getPlantTypeByCode(code: string) {
  await requireAuth();

  const plantType = await prisma.plantType.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      inventory: true,
    },
  });

  if (!plantType) {
    throw new NotFoundError(`Không tìm thấy loại cây có mã: ${code}`);
  }

  return plantType;
}

/**
 * Create new plant type
 */
export async function createPlantType(data: unknown) {
  await requireManager(); // Only managers can create plant types

  const validated = createPlantTypeSchema.parse(data);

  // Check if code already exists
  const existing = await prisma.plantType.findUnique({
    where: { code: validated.code.toUpperCase() },
  });

  if (existing) {
    throw new ConflictError(`Mã cây "${validated.code}" đã tồn tại`);
  }

  // Normalize Vietnamese for search
  const nameNormalized = normalizeVietnamese(validated.name);

  const plantType = await prisma.plantType.create({
    data: {
      ...validated,
      code: validated.code.toUpperCase(),
      nameNormalized,
      rentalPrice: toDecimal(validated.rentalPrice),
      depositPrice: validated.depositPrice ? toDecimal(validated.depositPrice) : null,
      salePrice: validated.salePrice ? toDecimal(validated.salePrice) : null,
      replacementPrice: validated.replacementPrice ? toDecimal(validated.replacementPrice) : null,
      // Create inventory record
      inventory: {
        create: {
          totalStock: 0,
          availableStock: 0,
          rentedStock: 0,
          reservedStock: 0,
          damagedStock: 0,
          maintenanceStock: 0,
        },
      },
    },
    include: {
      inventory: true,
    },
  });

  revalidatePath("/plant-types");
  return plantType;
}

/**
 * Update existing plant type
 */
export async function updatePlantType(id: string, data: unknown) {
  await requireManager();

  const validated = updatePlantTypeSchema.parse(data);

  // Check if plant type exists
  const existing = await prisma.plantType.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new NotFoundError(`Không tìm thấy loại cây có ID: ${id}`);
  }

  // If code is being updated, check for conflicts
  if (validated.code && validated.code.toUpperCase() !== existing.code) {
    const codeConflict = await prisma.plantType.findUnique({
      where: { code: validated.code.toUpperCase() },
    });

    if (codeConflict) {
      throw new ConflictError(`Mã cây "${validated.code}" đã tồn tại`);
    }
  }

  // Normalize Vietnamese if name is being updated
  const nameNormalized = validated.name ? normalizeVietnamese(validated.name) : undefined;

  const plantType = await prisma.plantType.update({
    where: { id },
    data: {
      ...validated,
      code: validated.code ? validated.code.toUpperCase() : undefined,
      nameNormalized,
      rentalPrice: validated.rentalPrice ? toDecimal(validated.rentalPrice) : undefined,
      depositPrice: validated.depositPrice ? toDecimal(validated.depositPrice) : undefined,
      salePrice: validated.salePrice ? toDecimal(validated.salePrice) : undefined,
      replacementPrice: validated.replacementPrice
        ? toDecimal(validated.replacementPrice)
        : undefined,
    },
    include: {
      inventory: true,
    },
  });

  revalidatePath("/plant-types");
  revalidatePath(`/plant-types/${id}`);
  return plantType;
}

/**
 * Delete plant type (soft delete by setting isActive = false)
 */
export async function deletePlantType(id: string) {
  await requireManager();

  const plantType = await prisma.plantType.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          contractItems: true,
          customerPlants: true,
        },
      },
    },
  });

  if (!plantType) {
    throw new NotFoundError(`Không tìm thấy loại cây có ID: ${id}`);
  }

  // Check if plant type is in use
  if (plantType._count.contractItems > 0 || plantType._count.customerPlants > 0) {
    throw new AppError(
      `Không thể xóa loại cây "${plantType.name}" vì đang được sử dụng trong ${plantType._count.contractItems} hợp đồng và ${plantType._count.customerPlants} vị trí khách hàng. Hãy đặt trạng thái "Không hoạt động" thay vì xóa.`,
      "PLANT_TYPE_IN_USE"
    );
  }

  // Soft delete
  await prisma.plantType.update({
    where: { id },
    data: { isActive: false },
  });

  revalidatePath("/plant-types");
  return { success: true };
}

/**
 * Update inventory for a plant type
 */
export async function updateInventory(data: unknown) {
  await requireManager();

  const validated = updateInventorySchema.parse(data);
  const { plantTypeId, ...inventoryData } = validated;

  // Check if plant type exists
  const plantType = await prisma.plantType.findUnique({
    where: { id: plantTypeId },
    include: { inventory: true },
  });

  if (!plantType) {
    throw new NotFoundError(`Không tìm thấy loại cây có ID: ${plantTypeId}`);
  }

  if (!plantType.inventory) {
    throw new AppError("Loại cây chưa có bản ghi tồn kho", "NO_INVENTORY");
  }

  const inventory = await prisma.inventory.update({
    where: { plantTypeId },
    data: inventoryData,
  });

  revalidatePath("/plant-types");
  revalidatePath(`/plant-types/${plantTypeId}`);
  return inventory;
}

/**
 * Get inventory stats across all plant types
 */
export async function getInventoryStats() {
  await requireAuth();

  const stats = await prisma.inventory.aggregate({
    _sum: {
      totalStock: true,
      availableStock: true,
      rentedStock: true,
      damagedStock: true,
      maintenanceStock: true,
    },
  });

  // Get low stock count
  const lowStockItems = await prisma.inventory.count({
    where: {
      OR: [
        { availableStock: { lte: prisma.inventory.fields.lowStockThreshold } },
        { availableStock: { lte: prisma.inventory.fields.reorderPoint } },
      ],
    },
  });

  return {
    ...stats,
    lowStockCount: lowStockItems,
  };
}

/**
 * Get all plant categories (unique values)
 */
export async function getPlantCategories() {
  await requireAuth();

  const categories = await prisma.plantType.findMany({
    where: {
      category: { not: null },
      isActive: true,
    },
    select: {
      category: true,
    },
    distinct: ["category"],
    orderBy: {
      category: "asc",
    },
  });

  return categories.map((c) => c.category).filter((c): c is string => c !== null);
}

/**
 * Search plant types for autocomplete (lightweight)
 * Returns plants grouped by category and price for bang-ke editing
 */
export async function searchPlantTypesForAutocomplete(query: string, limit = 20) {
  await requireAuth();

  const normalized = normalizeVietnamese(query);

  const plants = await prisma.plantType.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { nameNormalized: { contains: normalized, mode: "insensitive" } },
        { code: { contains: query.toUpperCase(), mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      code: true,
      name: true,
      category: true,
      sizeSpec: true,
      rentalPrice: true,
    },
    orderBy: [{ category: "asc" }, { rentalPrice: "desc" }],
    take: limit,
  });

  // Convert Decimal to number
  return plants.map((p) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    category: p.category,
    sizeSpec: p.sizeSpec,
    unitPrice: p.rentalPrice.toNumber(),
  }));
}

/**
 * Get all plant types for autocomplete dropdown (cached)
 * Used for bang-ke inline editing
 */
export async function getPlantTypesForAutocomplete() {
  await requireAuth();

  const plants = await prisma.plantType.findMany({
    where: { isActive: true },
    select: {
      id: true,
      code: true,
      name: true,
      category: true,
      sizeSpec: true,
      rentalPrice: true,
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  // Group by category
  const grouped: Record<
    string,
    Array<{
      id: string;
      code: string;
      name: string;
      sizeSpec: string | null;
      unitPrice: number;
    }>
  > = {};

  for (const p of plants) {
    const cat = p.category || "Khác";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push({
      id: p.id,
      code: p.code,
      name: p.name,
      sizeSpec: p.sizeSpec,
      unitPrice: p.rentalPrice.toNumber(),
    });
  }

  return grouped;
}
