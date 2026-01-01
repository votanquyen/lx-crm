/**
 * Customer Server Actions
 * CRUD operations with Vietnamese fuzzy search (pg_trgm)
 */
"use server";

import { revalidatePath, unstable_cache } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireManager } from "@/lib/auth-utils";
import { createAction, createSimpleAction } from "@/lib/action-utils";
import { AppError, NotFoundError, ConflictError } from "@/lib/errors";
import { normalizeVietnamese } from "@/lib/utils";
import {
  createCustomerSchema,
  updateCustomerSchema,
  customerSearchSchema,
  type CustomerSearchParams,
} from "@/lib/validations/customer";

/**
 * Get paginated list of customers with optional search and filters
 */
export async function getCustomers(params: CustomerSearchParams) {
  await requireAuth();

  const validated = customerSearchSchema.parse(params);
  const { page, limit, search, status, tier, district, hasDebt, sortBy, sortOrder } = validated;

  const skip = (page - 1) * limit;

  // Build where clause
  const where: Prisma.CustomerWhereInput = {
    status: status ?? { not: "TERMINATED" },
  };

  if (tier) where.tier = tier;
  if (district) where.district = district;

  // Has debt filter (customers with unpaid invoices)
  if (hasDebt) {
    where.invoices = {
      some: {
        status: { in: ["SENT", "PARTIAL", "OVERDUE"] },
        outstandingAmount: { gt: 0 },
      },
    };
  }

  // Use trigram search for Vietnamese fuzzy matching
  if (search && search.trim()) {
    const normalized = normalizeVietnamese(search);

    // Use raw query for trigram search
    const customersRaw = await prisma.$queryRaw<
      Array<{
        id: string;
        code: string;
        company_name: string;
        company_name_norm: string;
        address: string;
        address_normalized: string | null;
        district: string | null;
        city: string | null;
        contact_name: string | null;
        contact_phone: string | null;
        contact_email: string | null;
        tax_code: string | null;
        latitude: number | null;
        longitude: number | null;
        status: string;
        tier: string;
        ai_notes: string | null;
        created_by_id: string | null;
        created_at: Date;
        updated_at: Date;
        similarity: number;
      }>
    >`
      SELECT c.*,
             GREATEST(
               similarity(company_name_norm, ${normalized}),
               similarity(COALESCE(address_normalized, ''), ${normalized}),
               similarity(code, ${normalized})
             ) as similarity
      FROM customers c
      WHERE c.status != 'TERMINATED'
        AND (
          c.company_name_norm % ${normalized}
          OR c.code ILIKE ${`%${search}%`}
          OR COALESCE(c.address_normalized, '') % ${normalized}
        )
        ${status ? Prisma.sql`AND c.status = ${status}` : Prisma.empty}
        ${tier ? Prisma.sql`AND c.tier = ${tier}` : Prisma.empty}
        ${district ? Prisma.sql`AND c.district = ${district}` : Prisma.empty}
      ORDER BY similarity DESC, c.company_name ASC
      LIMIT ${limit} OFFSET ${skip}
    `;

    // Get total count for pagination
    const countResult = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM customers c
      WHERE c.status != 'TERMINATED'
        AND (
          c.company_name_norm % ${normalized}
          OR c.code ILIKE ${`%${search}%`}
          OR COALESCE(c.address_normalized, '') % ${normalized}
        )
        ${status ? Prisma.sql`AND c.status = ${status}` : Prisma.empty}
        ${tier ? Prisma.sql`AND c.tier = ${tier}` : Prisma.empty}
        ${district ? Prisma.sql`AND c.district = ${district}` : Prisma.empty}
    `;

    const total = Number(countResult[0].count);

    // Map raw results to Prisma model format
    const customers = customersRaw.map((c) => ({
      id: c.id,
      code: c.code,
      companyName: c.company_name,
      companyNameNorm: c.company_name_norm,
      address: c.address,
      addressNorm: c.address_normalized,
      district: c.district,
      city: c.city,
      contactName: c.contact_name,
      contactPhone: c.contact_phone,
      contactEmail: c.contact_email,
      taxCode: c.tax_code,
      latitude: c.latitude,
      longitude: c.longitude,
      status: c.status,
      tier: c.tier,
      aiNotes: c.ai_notes,
      createdById: c.created_by_id,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }));

    return {
      data: customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Standard Prisma query without search
  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        _count: {
          select: {
            customerPlants: true,
            stickyNotes: { where: { status: { not: "RESOLVED" } } }, // Use RESOLVED instead of CLOSED
            contracts: { where: { status: "ACTIVE" } },
          },
        },
      },
    }),
    prisma.customer.count({ where }),
  ]);

  return {
    data: customers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get a single customer by ID with related data
 */
export async function getCustomerById(id: string) {
  await requireAuth();

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      // createdBy doesn't exist in Customer schema
      _count: {
        select: {
          customerPlants: true,
          stickyNotes: true,
          contracts: true,
          invoices: true,
          careSchedules: true,
          exchangeRequests: true,
          quotations: true,
        },
      },
    },
  });

  if (!customer) {
    throw new NotFoundError("Khách hàng");
  }

  return customer;
}

/**
 * Generate next customer code (KH-XXXX)
 */
async function generateCustomerCode(): Promise<string> {
  const lastCustomer = await prisma.customer.findFirst({
    orderBy: { code: "desc" },
    select: { code: true },
  });

  let nextNumber = 1;
  if (lastCustomer?.code) {
    const match = lastCustomer.code.match(/KH-(\d+)/);
    if (match?.[1]) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  return `KH-${String(nextNumber).padStart(4, "0")}`;
}

/**
 * Create a new customer
 * Sanitizes all string inputs before database storage
 */
export const createCustomer = createAction(
  createCustomerSchema,
  async (input) => {
    const session = await requireAuth();

    // Sanitize string inputs
    const companyName = input.companyName.trim();
    const address = input.address.trim();
    const contactName = input.contactName?.trim() ?? null;
    const contactPhone = input.contactPhone?.replace(/\s/g, "") || null;
    const contactEmail = input.contactEmail?.toLowerCase().trim() || null;
    const taxCode = input.taxCode?.trim() ?? null;
    const district = input.district?.trim() ?? null;
    const city = input.city?.trim() ?? "TP.HCM";

    // Check for duplicate company name
    const normalized = normalizeVietnamese(companyName);
    const existing = await prisma.customer.findFirst({
      where: {
        companyNameNorm: normalized,
        status: { not: "TERMINATED" },
      },
    });

    if (existing) {
      throw new ConflictError(`Khách hàng "${companyName}" đã tồn tại`);
    }

    // Generate customer code
    const code = await generateCustomerCode();

    // Create customer with sanitized data
    const customer = await prisma.customer.create({
      data: {
        code,
        companyName,
        companyNameNorm: normalized,
        address,
        addressNormalized: normalizeVietnamese(address),
        district,
        city,
        contactName,
        contactPhone,
        contactEmail,
        taxCode,
        tier: input.tier,
        status: input.status ?? "ACTIVE",
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entityType: "Customer",
        entityId: customer.id,
        newValues: customer as unknown as Prisma.JsonObject,
      },
    });

    revalidatePath("/customers");
    return customer;
  }
);

/**
 * Update an existing customer
 * Sanitizes all string inputs before database storage
 */
export const updateCustomer = createAction(
  updateCustomerSchema,
  async (input) => {
    const session = await requireAuth();

    const { id, ...updateData } = input;

    // Check customer exists
    const existing = await prisma.customer.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError("Khách hàng");
    }

    // Sanitize string inputs
    const companyName = updateData.companyName?.trim();
    const address = updateData.address?.trim();

    // Check for duplicate company name (if changing)
    if (companyName && companyName !== existing.companyName) {
      const normalized = normalizeVietnamese(companyName);
      const duplicate = await prisma.customer.findFirst({
        where: {
          companyNameNorm: normalized,
          status: { not: "TERMINATED" },
          id: { not: id },
        },
      });

      if (duplicate) {
        throw new ConflictError(`Khách hàng "${companyName}" đã tồn tại`);
      }
    }

    // Build update data with sanitized values
    const data: Prisma.CustomerUpdateInput = {};

    if (companyName) {
      data.companyName = companyName;
      data.companyNameNorm = normalizeVietnamese(companyName);
    }
    if (address) {
      data.address = address;
      data.addressNormalized = normalizeVietnamese(address);
    }
    if (updateData.district !== undefined) data.district = updateData.district?.trim() ?? null;
    if (updateData.city !== undefined) data.city = updateData.city?.trim() ?? null;
    if (updateData.contactName !== undefined) data.contactName = updateData.contactName?.trim() ?? null;
    if (updateData.contactPhone !== undefined) data.contactPhone = updateData.contactPhone?.replace(/\s/g, "") || null;
    if (updateData.contactEmail !== undefined) data.contactEmail = updateData.contactEmail?.toLowerCase().trim() || null;
    if (updateData.taxCode !== undefined) data.taxCode = updateData.taxCode?.trim() ?? null;
    if (updateData.tier !== undefined) data.tier = updateData.tier;
    if (updateData.status !== undefined) data.status = updateData.status;
    if (updateData.latitude !== undefined) data.latitude = updateData.latitude;
    if (updateData.longitude !== undefined) data.longitude = updateData.longitude;

    // Update customer
    const customer = await prisma.customer.update({
      where: { id },
      data,
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entityType: "Customer",
        entityId: customer.id,
        oldValues: existing as unknown as Prisma.JsonObject,
        newValues: customer as unknown as Prisma.JsonObject,
      },
    });

    revalidatePath(`/customers/${id}`);
    revalidatePath("/customers");
    return customer;
  }
);

/**
 * Soft delete a customer (set status to TERMINATED)
 */
export const deleteCustomer = createSimpleAction(async (id: string) => {
  const session = await requireManager(); // Only ADMIN or MANAGER can delete

  // Check customer exists
  const existing = await prisma.customer.findUnique({
    where: { id },
    include: {
      contracts: { where: { status: "ACTIVE" } },
    },
  });

  if (!existing) {
    throw new NotFoundError("Khách hàng");
  }

  // Cannot delete if has active contracts
  if (existing.contracts.length > 0) {
    throw new AppError(
      "Không thể xóa khách hàng đang có hợp đồng hoạt động",
      "HAS_ACTIVE_CONTRACTS"
    );
  }

  // Soft delete
  const customer = await prisma.customer.update({
    where: { id },
    data: { status: "TERMINATED" },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "DELETE",
      entityType: "Customer",
      entityId: customer.id,
      oldValues: existing as unknown as Prisma.JsonObject,
    },
  });

  revalidatePath("/customers");
  return { success: true };
});

/**
 * Get all unique districts for filter dropdown
 * Cached for 5 minutes (districts rarely change)
 */
const getCachedDistricts = unstable_cache(
  async () => {
    const districts = await prisma.customer.findMany({
      where: {
        district: { not: null },
        status: { not: "TERMINATED" },
      },
      select: { district: true },
      distinct: ["district"],
      orderBy: { district: "asc" },
    });

    return districts
      .map((d) => d.district)
      .filter((d): d is string => d !== null);
  },
  ["districts"],
  { revalidate: 300 }
);

export async function getDistricts() {
  await requireAuth();
  return getCachedDistricts();
}

/**
 * Get customer stats for dashboard
 * Cached for 1 minute to improve performance
 */
const getCachedCustomerStats = unstable_cache(
  async () => {
    // Single query with FILTER instead of 5 separate COUNTs
    // Note: Must prefix status with table alias (c. or i.) to avoid ambiguity
    const stats = await prisma.$queryRaw<[{
      total: bigint;
      active: bigint;
      leads: bigint;
      vip: bigint;
      with_debt: bigint;
    }]>`
      SELECT
        COUNT(*) FILTER (WHERE c.status != 'TERMINATED') as total,
        COUNT(*) FILTER (WHERE c.status = 'ACTIVE') as active,
        COUNT(*) FILTER (WHERE c.status = 'LEAD') as leads,
        COUNT(*) FILTER (WHERE c.tier = 'VIP' AND c.status != 'TERMINATED') as vip,
        COUNT(DISTINCT CASE
          WHEN i.status IN ('SENT', 'PARTIAL', 'OVERDUE')
            AND i."outstandingAmount" > 0
          THEN c.id
        END) as with_debt
      FROM customers c
      LEFT JOIN invoices i ON i."customerId" = c.id
    `;

    return {
      total: Number(stats[0].total),
      active: Number(stats[0].active),
      leads: Number(stats[0].leads),
      vip: Number(stats[0].vip),
      withDebt: Number(stats[0].with_debt),
    };
  },
  ["customer-stats"],
  { revalidate: 60 }
);

export async function getCustomerStats() {
  await requireAuth();
  return getCachedCustomerStats();
}
