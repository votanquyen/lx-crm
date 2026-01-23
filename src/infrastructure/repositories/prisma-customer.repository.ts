/**
 * PrismaCustomerRepository
 * Implements CustomerRepository port using Prisma ORM
 *
 * Responsibilities:
 * - Execute database operations for Customer aggregate
 * - Translate between domain entities and persistence layer
 * - Handle caching and cache invalidation
 * - Throw domain errors instead of Prisma errors
 */
import { PrismaClient, Prisma, PaymentMethod, CustomerStatus } from "@prisma/client";
import { unstable_cache } from "next/cache";
import {
  Customer,
  CustomerRepository,
  CustomerSearchQuery,
  PaginatedResult,
} from "@/domain/customer";
import { CustomerMapper } from "../mappers/customer.mapper";
import { CACHE_TAGS, invalidateCustomerCache } from "@/lib/cache-utils";
import { normalizeVietnamese } from "@/lib/utils";

/**
 * Raw customer result from PostgreSQL with camelCase columns
 * Note: Prisma uses camelCase by default, PostgreSQL preserves quoted identifiers
 */
interface CustomerRawResult {
  id: string;
  code: string;
  companyName: string;
  companyNameNorm: string | null;
  shortName: string | null;
  taxCode: string | null;
  businessType: string | null;
  address: string;
  addressNormalized: string | null;
  ward: string | null;
  district: string | null;
  city: string;
  country: string;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  contactPosition: string | null;
  contact2Name: string | null;
  contact2Phone: string | null;
  contact2Email: string | null;
  contact2Position: string | null;
  accountingName: string | null;
  accountingPhone: string | null;
  accountingEmail: string | null;
  status: string;
  source: string | null;
  industry: string | null;
  careWeekday: number | null;
  careTimeSlot: string | null;
  preferredStaffId: string | null;
  careFrequency: string | null;
  requiresAppointment: boolean;
  buildingName: string | null;
  floorCount: number | null;
  hasElevator: boolean;
  parkingNote: string | null;
  securityNote: string | null;
  accessInstructions: string | null;
  billingCycle: string | null;
  paymentTermDays: number;
  preferredPayment: string;
  notes: string | null;
  internalNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
  firstContractDate: Date | null;
  lastCareDate: Date | null;
  lastContactDate: Date | null;
  // Extra columns from query
  similarity: number;
  total_count: bigint;
}

/**
 * Convert raw PostgreSQL camelCase result to Prisma model format
 */
function rawToPrismaCustomer(
  raw: CustomerRawResult
): Parameters<typeof CustomerMapper.toDomain>[0] {
  return {
    id: raw.id,
    code: raw.code,
    companyName: raw.companyName,
    companyNameNorm: raw.companyNameNorm,
    shortName: raw.shortName,
    taxCode: raw.taxCode,
    businessType: raw.businessType,
    address: raw.address,
    addressNormalized: raw.addressNormalized,
    ward: raw.ward,
    district: raw.district,
    city: raw.city,
    country: raw.country,
    postalCode: raw.postalCode,
    latitude: raw.latitude,
    longitude: raw.longitude,
    contactName: raw.contactName,
    contactPhone: raw.contactPhone,
    contactEmail: raw.contactEmail,
    contactPosition: raw.contactPosition,
    contact2Name: raw.contact2Name,
    contact2Phone: raw.contact2Phone,
    contact2Email: raw.contact2Email,
    contact2Position: raw.contact2Position,
    accountingName: raw.accountingName,
    accountingPhone: raw.accountingPhone,
    accountingEmail: raw.accountingEmail,
    status: raw.status as CustomerStatus,
    source: raw.source,
    industry: raw.industry,
    careWeekday: raw.careWeekday,
    careTimeSlot: raw.careTimeSlot,
    preferredStaffId: raw.preferredStaffId,
    careFrequency: raw.careFrequency,
    requiresAppointment: raw.requiresAppointment,
    buildingName: raw.buildingName,
    floorCount: raw.floorCount,
    hasElevator: raw.hasElevator,
    parkingNote: raw.parkingNote,
    securityNote: raw.securityNote,
    accessInstructions: raw.accessInstructions,
    billingCycle: raw.billingCycle,
    paymentTermDays: raw.paymentTermDays,
    preferredPayment: raw.preferredPayment as PaymentMethod,
    notes: raw.notes,
    internalNotes: raw.internalNotes,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    firstContractDate: raw.firstContractDate,
    lastCareDate: raw.lastCareDate,
    lastContactDate: raw.lastContactDate,
  };
}

export class PrismaCustomerRepository implements CustomerRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Customer | null> {
    const data = await this.prisma.customer.findUnique({
      where: { id },
    });
    return data ? CustomerMapper.toDomain(data) : null;
  }

  async findByCode(code: string): Promise<Customer | null> {
    const data = await this.prisma.customer.findUnique({
      where: { code },
    });
    return data ? CustomerMapper.toDomain(data) : null;
  }

  async findByNormalizedName(nameNorm: string, excludeId?: string): Promise<Customer | null> {
    const data = await this.prisma.customer.findFirst({
      where: {
        companyNameNorm: nameNorm,
        status: { not: "TERMINATED" },
        ...(excludeId && { id: { not: excludeId } }),
      },
    });
    return data ? CustomerMapper.toDomain(data) : null;
  }

  async save(customer: Customer): Promise<void> {
    const existing = await this.prisma.customer.findUnique({
      where: { id: customer.id },
      select: { id: true },
    });

    if (existing) {
      // Update existing
      await this.prisma.customer.update({
        where: { id: customer.id },
        data: CustomerMapper.toPrismaUpdate(customer),
      });
    } else {
      // Create new
      await this.prisma.customer.create({
        data: CustomerMapper.toPrismaCreate(customer),
      });
    }

    // Invalidate cache after save
    invalidateCustomerCache();
  }

  async search(query: CustomerSearchQuery): Promise<PaginatedResult<Customer>> {
    const {
      search,
      status,
      district,
      page = 1,
      limit = 20,
      sortBy = "companyName",
      sortOrder = "asc",
    } = query;
    const skip = (page - 1) * limit;

    if (search?.trim()) {
      return this.searchWithTrigram(search, status, district, limit, skip);
    }

    return this.searchWithPrisma(status, district, limit, skip, sortBy, sortOrder);
  }

  async generateNextCode(): Promise<string> {
    const last = await this.prisma.customer.findFirst({
      orderBy: { code: "desc" },
      select: { code: true },
    });

    let next = 1;
    if (last?.code) {
      const match = last.code.match(/KH-(\d+)/);
      if (match?.[1]) {
        next = parseInt(match[1], 10) + 1;
      }
    }

    return `KH-${String(next).padStart(4, "0")}`;
  }

  async hasActiveContracts(customerId: string): Promise<boolean> {
    const count = await this.prisma.contract.count({
      where: {
        customerId,
        status: "ACTIVE",
      },
    });
    return count > 0;
  }

  // ============ Private Methods ============

  private async searchWithTrigram(
    search: string,
    status?: string,
    district?: string,
    limit: number = 20,
    skip: number = 0
  ): Promise<PaginatedResult<Customer>> {
    const normalized = normalizeVietnamese(search);
    const codePattern = `%${search}%`;

    // Use cached search for performance
    const cachedSearch = unstable_cache(
      async () => {
        const results = await this.prisma.$queryRaw<CustomerRawResult[]>`
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
        return results;
      },
      [CACHE_TAGS.CUSTOMERS_LIST, normalized, status ?? "", district ?? "", String(skip)],
      { revalidate: 60, tags: [CACHE_TAGS.CUSTOMERS_LIST] }
    );

    const results = await cachedSearch();
    const total = results.length > 0 ? Number(results[0]!.total_count) : 0;

    // Map raw results using proper snake_case to camelCase conversion
    const data = results.map((r) => CustomerMapper.toDomain(rawToPrismaCustomer(r)));

    return {
      data,
      pagination: {
        page: Math.floor(skip / limit) + 1,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private async searchWithPrisma(
    status?: string,
    district?: string,
    limit: number = 20,
    skip: number = 0,
    sortBy: string = "companyName",
    sortOrder: string = "asc"
  ): Promise<PaginatedResult<Customer>> {
    const where: Prisma.CustomerWhereInput = {
      status: status ? (status as Prisma.CustomerWhereInput["status"]) : { not: "TERMINATED" },
      ...(district && { district }),
    };

    const orderBy: Prisma.CustomerOrderByWithRelationInput = {
      [sortBy]: sortOrder as Prisma.SortOrder,
    };

    const [results, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      data: results.map(CustomerMapper.toDomain),
      pagination: {
        page: Math.floor(skip / limit) + 1,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
