/**
 * PrismaCustomerRepository Integration Tests
 * Tests repository adapter with mocked Prisma client
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PrismaClient, CustomerStatus } from "@prisma/client";
import { PrismaCustomerRepository } from "@/infrastructure/repositories/prisma-customer.repository";
import { Customer } from "@/domain/customer";

// Mock Prisma client
vi.mock("@/lib/prisma", () => ({
  prisma: {
    customer: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    contract: {
      count: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}));

// Mock Next.js cache
vi.mock("next/cache", () => ({
  unstable_cache: vi.fn((fn) => fn),
  revalidateTag: vi.fn(),
}));

// Mock utils
vi.mock("@/lib/utils", () => ({
  normalizeVietnamese: vi.fn((str: string) =>
    str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase()
      .trim()
  ),
}));

// Mock cache utils
vi.mock("@/lib/cache-utils", () => ({
  CACHE_TAGS: {
    CUSTOMERS_LIST: "customers-list",
  },
  invalidateCustomerCache: vi.fn(),
}));

describe("PrismaCustomerRepository", () => {
  let repository: PrismaCustomerRepository;
  let mockPrisma: PrismaClient;

  const mockPrismaCustomer = {
    id: "cuid_123",
    code: "KH-0001",
    companyName: "Công ty ABC",
    companyNameNorm: "cong ty abc",
    shortName: null,
    taxCode: null,
    businessType: null,
    address: "123 Nguyễn Văn Linh",
    addressNormalized: "123 nguyen van linh",
    ward: null,
    district: "Quận 7",
    city: "Hồ Chí Minh",
    country: "Việt Nam",
    postalCode: null,
    latitude: null,
    longitude: null,
    contactName: "Nguyễn Văn A",
    contactPhone: "0912345678",
    contactEmail: null,
    contactPosition: null,
    contact2Name: null,
    contact2Phone: null,
    contact2Email: null,
    contact2Position: null,
    accountingName: null,
    accountingPhone: null,
    accountingEmail: null,
    status: "ACTIVE" as CustomerStatus,
    source: null,
    industry: null,
    careWeekday: 1,
    careTimeSlot: null,
    preferredStaffId: null,
    careFrequency: "weekly",
    requiresAppointment: false,
    buildingName: null,
    floorCount: null,
    hasElevator: true,
    parkingNote: null,
    securityNote: null,
    accessInstructions: null,
    billingCycle: "monthly",
    paymentTermDays: 30,
    preferredPayment: "BANK_TRANSFER" as const,
    notes: null,
    internalNotes: null,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-02"),
    firstContractDate: null,
    lastCareDate: null,
    lastContactDate: null,
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const { prisma } = await import("@/lib/prisma");
    mockPrisma = prisma as unknown as PrismaClient;
    repository = new PrismaCustomerRepository(mockPrisma);
  });

  describe("findById", () => {
    it("returns Customer entity for existing record", async () => {
      vi.mocked(mockPrisma.customer.findUnique).mockResolvedValue(mockPrismaCustomer);

      const result = await repository.findById("cuid_123");

      expect(result).toBeInstanceOf(Customer);
      expect(result?.id).toBe("cuid_123");
      expect(result?.companyName).toBe("Công ty ABC");
    });

    it("returns null for non-existent record", async () => {
      vi.mocked(mockPrisma.customer.findUnique).mockResolvedValue(null);

      const result = await repository.findById("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("findByCode", () => {
    it("returns Customer entity for existing code", async () => {
      vi.mocked(mockPrisma.customer.findUnique).mockResolvedValue(mockPrismaCustomer);

      const result = await repository.findByCode("KH-0001");

      expect(result?.code).toBe("KH-0001");
    });

    it("returns null for non-existent code", async () => {
      vi.mocked(mockPrisma.customer.findUnique).mockResolvedValue(null);

      const result = await repository.findByCode("KH-9999");

      expect(result).toBeNull();
    });
  });

  describe("findByNormalizedName", () => {
    it("finds customer by normalized name", async () => {
      vi.mocked(mockPrisma.customer.findFirst).mockResolvedValue(mockPrismaCustomer);

      const result = await repository.findByNormalizedName("cong ty abc");

      expect(result?.companyNameNorm).toBe("cong ty abc");
    });

    it("excludes specified ID from search", async () => {
      vi.mocked(mockPrisma.customer.findFirst).mockResolvedValue(null);

      await repository.findByNormalizedName("cong ty abc", "exclude_id");

      expect(mockPrisma.customer.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { not: "exclude_id" },
          }),
        })
      );
    });
  });

  describe("save", () => {
    it("creates new customer when not exists", async () => {
      vi.mocked(mockPrisma.customer.findUnique).mockResolvedValue(null);
      vi.mocked(mockPrisma.customer.create).mockResolvedValue(mockPrismaCustomer);

      const customer = Customer.create(
        {
          companyName: "Công ty Mới",
          address: "456 Lê Văn Việt",
          district: "Quận 9",
        },
        "new_cuid",
        "KH-0002"
      );

      await repository.save(customer);

      expect(mockPrisma.customer.create).toHaveBeenCalled();
      expect(mockPrisma.customer.update).not.toHaveBeenCalled();
    });

    it("updates existing customer", async () => {
      vi.mocked(mockPrisma.customer.findUnique).mockResolvedValue({ id: "cuid_123" } as never);
      vi.mocked(mockPrisma.customer.update).mockResolvedValue(mockPrismaCustomer);

      const customer = Customer.create(
        {
          companyName: "Công ty Cập Nhật",
          address: "789 Điện Biên Phủ",
        },
        "cuid_123",
        "KH-0001"
      );

      await repository.save(customer);

      expect(mockPrisma.customer.update).toHaveBeenCalled();
      expect(mockPrisma.customer.create).not.toHaveBeenCalled();
    });
  });

  describe("search", () => {
    it("uses Prisma query for non-search requests", async () => {
      vi.mocked(mockPrisma.customer.findMany).mockResolvedValue([mockPrismaCustomer]);
      vi.mocked(mockPrisma.customer.count).mockResolvedValue(1);

      const result = await repository.search({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(mockPrisma.customer.findMany).toHaveBeenCalled();
    });

    it("applies status filter", async () => {
      vi.mocked(mockPrisma.customer.findMany).mockResolvedValue([]);
      vi.mocked(mockPrisma.customer.count).mockResolvedValue(0);

      await repository.search({ status: "ACTIVE", page: 1, limit: 20 });

      expect(mockPrisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "ACTIVE",
          }),
        })
      );
    });

    it("applies district filter", async () => {
      vi.mocked(mockPrisma.customer.findMany).mockResolvedValue([]);
      vi.mocked(mockPrisma.customer.count).mockResolvedValue(0);

      await repository.search({ district: "Quận 7", page: 1, limit: 20 });

      expect(mockPrisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            district: "Quận 7",
          }),
        })
      );
    });

    it("paginates results correctly", async () => {
      vi.mocked(mockPrisma.customer.findMany).mockResolvedValue([]);
      vi.mocked(mockPrisma.customer.count).mockResolvedValue(50);

      const result = await repository.search({ page: 2, limit: 10 });

      expect(result.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 50,
        totalPages: 5,
      });
      expect(mockPrisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
    });
  });

  describe("generateNextCode", () => {
    it("generates KH-0001 when no customers exist", async () => {
      vi.mocked(mockPrisma.customer.findFirst).mockResolvedValue(null);

      const code = await repository.generateNextCode();

      expect(code).toBe("KH-0001");
    });

    it("increments last code", async () => {
      vi.mocked(mockPrisma.customer.findFirst).mockResolvedValue({ code: "KH-0042" } as never);

      const code = await repository.generateNextCode();

      expect(code).toBe("KH-0043");
    });
  });

  describe("hasActiveContracts", () => {
    it("returns true when customer has active contracts", async () => {
      vi.mocked(mockPrisma.contract.count).mockResolvedValue(2);

      const result = await repository.hasActiveContracts("cuid_123");

      expect(result).toBe(true);
    });

    it("returns false when customer has no active contracts", async () => {
      vi.mocked(mockPrisma.contract.count).mockResolvedValue(0);

      const result = await repository.hasActiveContracts("cuid_123");

      expect(result).toBe(false);
    });
  });
});
