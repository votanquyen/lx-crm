/**
 * Customer Server Actions
 * CRUD operations with Vietnamese fuzzy search (pg_trgm)
 */
"use server";

import { revalidatePath, unstable_cache } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { requireAuth, requireManager } from "@/lib/auth-utils";
import { createAction, createSimpleAction } from "@/lib/action-utils";
import { AppError, NotFoundError, ConflictError } from "@/lib/errors";
import { normalizeVietnamese } from "@/lib/utils";
import { requireRateLimit } from "@/lib/rate-limit";
import { RATE_LIMITS, CACHE_TTL } from "@/lib/constants";
import { sanitizeText, sanitizePhone, sanitizeEmail } from "@/lib/sanitize";
import { CACHE_TAGS, invalidateCustomerCache } from "@/lib/cache-utils";
import {
  createCustomerSchema,
  updateCustomerSchema,
  customerSearchSchema,
  type CustomerSearchParams,
} from "@/lib/validations/customer";
import { getCustomerUseCases } from "@/infrastructure/factories";
import {
  DuplicateCustomerError,
  CustomerNotFoundError,
  CustomerHasActiveContractsError,
} from "@/domain/customer";

/**
 * Raw customer result type from trigram search
 * Note: PostgreSQL returns columns with exact case from schema (camelCase via Prisma)
 */
type CustomerRawResult = {
  id: string;
  code: string;
  companyName: string;
  companyNameNorm: string;
  address: string;
  addressNormalized: string | null;
  district: string | null;
  city: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  // Secondary contact
  contact2Name: string | null;
  contact2Phone: string | null;
  contact2Email: string | null;
  // Accounting contact
  accountingName: string | null;
  accountingPhone: string | null;
  accountingEmail: string | null;
  taxCode: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
  aiNotes: string | null;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
  similarity: number;
  total_count: bigint;
};

/**
 * Cached trigram search for Vietnamese fuzzy matching
 * Uses window function for single-query pagination
 * Cache TTL: 60s, invalidated on customer mutations
 */
const searchCustomersWithCache = unstable_cache(
  async (
    normalized: string,
    codePattern: string,
    status: string | null,
    district: string | null,
    limit: number,
    skip: number
  ): Promise<{ data: CustomerRawResult[]; total: number }> => {
    // Use window function for single-query pagination
    // Note: Column names use camelCase (Prisma default) - must quote in SQL
    const customersRaw = await prisma.$queryRaw<CustomerRawResult[]>`
      SELECT c.*,
             GREATEST(
               similarity("companyNameNorm", ${normalized}),
               similarity(COALESCE("addressNormalized", ''), ${normalized}),
               similarity(code, ${normalized})
             ) as similarity,
             COUNT(*) OVER() as total_count
      FROM customers c
      WHERE c.status != 'TERMINATED'
        AND (
          c."companyNameNorm" % ${normalized}
          OR c.code ILIKE ${codePattern}
          OR COALESCE(c."addressNormalized", '') % ${normalized}
        )
        ${status ? Prisma.sql`AND c.status = ${status}` : Prisma.empty}
        ${district ? Prisma.sql`AND c.district = ${district}` : Prisma.empty}
      ORDER BY similarity DESC, c."companyName" ASC
      LIMIT ${limit} OFFSET ${skip}
    `;

    const total = customersRaw.length > 0 ? Number(customersRaw[0]!.total_count) : 0;
    return { data: customersRaw, total };
  },
  [CACHE_TAGS.CUSTOMERS_LIST],
  { revalidate: 60, tags: [CACHE_TAGS.CUSTOMERS_LIST] }
);

/**
 * Get paginated list of customers with optional search and filters
 * Enhanced with financial aggregations for Enterprise view
 */
export async function getCustomers(params: CustomerSearchParams) {
  await requireAuth();

  const validated = customerSearchSchema.parse(params);
  const { page, limit, search, status, district, hasDebt, sortBy, sortOrder } = validated;

  // Rate limit search queries (expensive trigram operations)
  if (search && search.trim()) {
    await requireRateLimit("customer-search", {
      max: RATE_LIMITS.SEARCH.limit,
      windowMs: RATE_LIMITS.SEARCH.window * 1000,
    });
  }

  const skip = (page - 1) * limit;

  // Build where clause
  const where: Prisma.CustomerWhereInput = {
    status: status ?? { not: "TERMINATED" },
  };

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

  // Use cached trigram search for Vietnamese fuzzy matching
  if (search && search.trim()) {
    const sanitizedSearch = sanitizeText(search) ?? search.trim();
    const normalized = normalizeVietnamese(sanitizedSearch);
    const codePattern = `%${sanitizedSearch}%`;

    // Use cached search with window function (single query)
    const { data: customersRaw, total } = await searchCustomersWithCache(
      normalized,
      codePattern,
      status ?? null,
      district ?? null,
      limit,
      skip
    );

    // Map raw results to Prisma model format (already camelCase from PostgreSQL)
    const customers = customersRaw.map((c) => ({
      id: c.id,
      code: c.code,
      companyName: c.companyName,
      companyNameNorm: c.companyNameNorm,
      address: c.address,
      addressNormalized: c.addressNormalized,
      district: c.district,
      city: c.city,
      contactName: c.contactName,
      contactPhone: c.contactPhone,
      contactEmail: c.contactEmail,
      // Secondary contact
      contact2Name: c.contact2Name,
      contact2Phone: c.contact2Phone,
      contact2Email: c.contact2Email,
      // Accounting contact
      accountingName: c.accountingName,
      accountingPhone: c.accountingPhone,
      accountingEmail: c.accountingEmail,
      taxCode: c.taxCode,
      latitude: c.latitude,
      longitude: c.longitude,
      status: c.status,
      aiNotes: c.aiNotes,
      createdById: c.createdById,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
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

  // ---- ENTERPRISE ENHANCEMENT: Financial Aggregations ----
  // Fetch financial data for the paginated customers
  const customerIds = customers.map((c) => c.id);

  // Use a single raw query to get debt and monthly value for all customers at once
  const financials = await prisma.$queryRaw<
    { customer_id: string; total_debt: string | null; monthly_contract_value: string | null }[]
  >`
    SELECT
      c.id as customer_id,
      COALESCE(SUM(i."outstandingAmount") FILTER (WHERE i.status IN ('SENT', 'PARTIAL', 'OVERDUE')), 0) as total_debt,
      COALESCE(SUM(ct."monthlyFee") FILTER (WHERE ct.status = 'ACTIVE'), 0) as monthly_contract_value
    FROM customers c
    LEFT JOIN invoices i ON i."customerId" = c.id
    LEFT JOIN contracts ct ON ct."customerId" = c.id
    WHERE c.id = ANY(${customerIds})
    GROUP BY c.id
  `;

  // Create a lookup map for O(1) merge
  const financialMap = new Map(
    financials.map((f) => [
      f.customer_id,
      {
        totalDebt: Number(f.total_debt || 0),
        monthlyContractValue: Number(f.monthly_contract_value || 0),
      },
    ])
  );

  // Merge financial data into customer objects
  const customersWithFinancials = customers.map((c) => ({
    ...c,
    financials: financialMap.get(c.id) ?? { totalDebt: 0, monthlyContractValue: 0 },
  }));

  return {
    data: customersWithFinancials,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get a single customer by ID with related data.
 * Includes contracts, plants, invoices with payments, notes, and statements.
 *
 * @param id - Customer UUID
 * @returns Customer with all related data and counts
 * @throws {NotFoundError} If customer not found
 */
export async function getCustomerById(id: string) {
  await requireAuth();

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      // Include all contracts with items
      contracts: {
        orderBy: { startDate: "desc" },
        include: {
          items: {
            include: { plantType: true },
          },
          createdBy: { select: { id: true, name: true, email: true } },
        },
      },
      // Include all plants
      customerPlants: {
        include: { plantType: true },
        orderBy: { position: "asc" },
      },
      // Include recent invoices with payments
      invoices: {
        orderBy: { issueDate: "desc" },
        take: 50,
        include: {
          payments: {
            orderBy: { paymentDate: "desc" },
          },
        },
      },
      // Include sticky notes
      stickyNotes: {
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: { select: { id: true, name: true } },
        },
      },
      // Include latest monthly statement
      monthlyStatements: {
        orderBy: [{ year: "desc" }, { month: "desc" }],
        take: 1,
      },
      // Include counts for all relations
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

  // Serialize Decimal values to numbers for client components
  return {
    ...customer,
    invoices: customer.invoices.map((inv) => ({
      ...inv,
      totalAmount: Number(inv.totalAmount),
      paidAmount: Number(inv.paidAmount),
      outstandingAmount: Number(inv.outstandingAmount),
    })),
  };
}

/**
 * Create a new customer
 * Thin wrapper: auth + rate limit + sanitize + use case + cache
 */
export const createCustomer = createAction(createCustomerSchema, async (input) => {
  const session = await requireAuth();

  // Rate limit mutations
  await requireRateLimit("customer-create", {
    max: RATE_LIMITS.MUTATION.limit,
    windowMs: RATE_LIMITS.MUTATION.window * 1000,
  });

  // Sanitize string inputs (strips HTML and trims)
  // Convert null to undefined for domain compatibility
  const sanitizedInput = {
    companyName: sanitizeText(input.companyName) ?? input.companyName.trim(),
    address: sanitizeText(input.address) ?? input.address.trim(),
    city: sanitizeText(input.city) ?? "TP.HCM",
    contactName: sanitizeText(input.contactName) ?? undefined,
    contactPhone: sanitizePhone(input.contactPhone) ?? undefined,
    contactEmail: sanitizeEmail(input.contactEmail) ?? undefined,
    taxCode: sanitizeText(input.taxCode) ?? undefined,
    district: sanitizeText(input.district) ?? undefined,
    status: input.status ?? "ACTIVE",
    latitude: input.latitude ?? undefined,
    longitude: input.longitude ?? undefined,
  };

  try {
    // Delegate to use case
    const { createCustomer: useCase } = getCustomerUseCases();
    const { customer } = await useCase.execute({
      input: sanitizedInput,
      userId: session.user.id,
    });

    // Cache invalidation stays in action layer
    revalidatePath("/customers");
    invalidateCustomerCache();

    return customer.toPersistence();
  } catch (error) {
    // Map domain errors to action errors
    if (error instanceof DuplicateCustomerError) {
      throw new ConflictError(error.message);
    }
    throw error;
  }
});

/**
 * Update an existing customer
 * Thin wrapper: auth + rate limit + sanitize + use case + cache
 */
export const updateCustomer = createAction(updateCustomerSchema, async (input) => {
  const session = await requireAuth();

  // Rate limit mutations
  await requireRateLimit("customer-update", {
    max: RATE_LIMITS.MUTATION.limit,
    windowMs: RATE_LIMITS.MUTATION.window * 1000,
  });

  const { id, ...updateData } = input;

  // Sanitize string inputs (strips HTML and trims)
  const sanitizedUpdates = {
    companyName: sanitizeText(updateData.companyName),
    address: sanitizeText(updateData.address),
    district: sanitizeText(updateData.district),
    city: sanitizeText(updateData.city),
    contactName: sanitizeText(updateData.contactName),
    contactPhone: sanitizePhone(updateData.contactPhone),
    contactEmail: sanitizeEmail(updateData.contactEmail),
    taxCode: sanitizeText(updateData.taxCode),
    status: updateData.status,
    latitude: updateData.latitude,
    longitude: updateData.longitude,
  };

  // Remove undefined values
  const updates = Object.fromEntries(
    Object.entries(sanitizedUpdates).filter(([_, v]) => v !== undefined)
  );

  try {
    // Delegate to use case
    const { updateCustomer: useCase } = getCustomerUseCases();
    const { customer } = await useCase.execute({
      id,
      updates,
      userId: session.user.id,
    });

    // Cache invalidation stays in action layer
    revalidatePath(`/customers/${id}`);
    revalidatePath("/customers");
    invalidateCustomerCache();

    return customer.toPersistence();
  } catch (error) {
    // Map domain errors to action errors
    if (error instanceof DuplicateCustomerError) {
      throw new ConflictError(error.message);
    }
    if (error instanceof CustomerNotFoundError) {
      throw new NotFoundError("Khách hàng");
    }
    throw error;
  }
});

/**
 * Soft delete a customer (set status to TERMINATED)
 * Thin wrapper: auth + rate limit + use case + cache
 */
export const deleteCustomer = createSimpleAction(async (id: string) => {
  const session = await requireManager(); // Only ADMIN or MANAGER can delete

  // Rate limit mutations
  await requireRateLimit("customer-delete", {
    max: RATE_LIMITS.MUTATION.limit,
    windowMs: RATE_LIMITS.MUTATION.window * 1000,
  });

  try {
    // Delegate to use case
    const { deleteCustomer: useCase } = getCustomerUseCases();
    await useCase.execute({
      id,
      userId: session.user.id,
    });

    // Cache invalidation stays in action layer
    revalidatePath("/customers");
    invalidateCustomerCache();

    return { success: true };
  } catch (error) {
    // Map domain errors to action errors
    if (error instanceof CustomerNotFoundError) {
      throw new NotFoundError("Khách hàng");
    }
    if (error instanceof CustomerHasActiveContractsError) {
      throw new AppError(error.message, error.code);
    }
    throw error;
  }
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

    return districts.map((d) => d.district).filter((d): d is string => d !== null);
  },
  ["districts"],
  { revalidate: CACHE_TTL.HEAVY_QUERY }
);

export async function getDistricts() {
  await requireAuth();
  return getCachedDistricts();
}

/**
 * Get customer stats for dashboard
 * Cached for 1 minute to improve performance
 */
export async function getCustomerStats() {
  const session = await auth();
  if (!session?.user) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);

  // Single query with FILTER - use COUNT(DISTINCT c.id) to avoid counting join rows
  const stats = await prisma.$queryRaw<
    [
      {
        total: bigint;
        active: bigint;
        leads: bigint;
        with_debt: bigint;
      },
    ]
  >`
    SELECT
      COUNT(DISTINCT c.id) FILTER (WHERE c.status != 'TERMINATED') as total,
      COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'ACTIVE') as active,
      COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'LEAD') as leads,
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
    withDebt: Number(stats[0].with_debt),
  };
}

/**
 * Get customers for map display
 * Optimized query with only required fields for map markers
 */
export async function getCustomersForMap(filters?: {
  district?: string;
  status?: "ACTIVE" | "INACTIVE" | "LEAD" | "TERMINATED";
}) {
  await requireAuth();

  const where: Prisma.CustomerWhereInput = {
    status: filters?.status ?? { not: "TERMINATED" },
    latitude: { not: null },
    longitude: { not: null },
  };

  if (filters?.district) where.district = filters.district;

  // Parallel execution for independent queries (Vercel React Best Practices)
  const [customers, pendingExchanges] = await Promise.all([
    prisma.customer.findMany({
      where,
      select: {
        id: true,
        code: true,
        companyName: true,
        address: true,
        district: true,
        latitude: true,
        longitude: true,
        contactPhone: true,
        status: true,
        _count: {
          select: {
            customerPlants: { where: { status: "ACTIVE" } },
          },
        },
      },
      orderBy: { companyName: "asc" },
    }),
    // Get customers with pending exchanges
    prisma.exchangeRequest.findMany({
      where: {
        status: { in: ["PENDING", "SCHEDULED"] },
      },
      select: {
        customerId: true,
      },
    }),
  ]);

  const customersWithExchanges = new Set(pendingExchanges.map((e) => e.customerId));

  return customers.map((c) => ({
    id: c.id,
    code: c.code,
    companyName: c.companyName,
    address: c.address,
    district: c.district ?? "",
    latitude: c.latitude,
    longitude: c.longitude,
    contactPhone: c.contactPhone,
    status: c.status,
    plantCount: c._count.customerPlants,
    hasPendingExchange: customersWithExchanges.has(c.id),
  }));
}

/**
 * Get exchange requests for map display
 */
export async function getExchangeRequestsForMap() {
  await requireAuth();

  const requests = await prisma.exchangeRequest.findMany({
    where: {
      status: { in: ["PENDING", "SCHEDULED"] },
      customer: {
        latitude: { not: null },
        longitude: { not: null },
      },
    },
    select: {
      id: true,
      customerId: true,
      priority: true,
      priorityScore: true,
      status: true,
      customer: {
        select: {
          companyName: true,
          latitude: true,
          longitude: true,
        },
      },
    },
    orderBy: { priorityScore: "desc" },
  });

  return requests.map((r) => ({
    id: r.id,
    customerId: r.customerId,
    priority: r.priority,
    priorityScore: r.priorityScore,
    status: r.status,
    latitude: r.customer.latitude!,
    longitude: r.customer.longitude!,
    customerName: r.customer.companyName,
  }));
}
