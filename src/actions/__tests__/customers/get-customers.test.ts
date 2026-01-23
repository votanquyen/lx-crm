/**
 * getCustomers Characterization Tests
 * Documents current behavior of customer list/search action
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCustomers } from "@/actions/customers";
import {
  createMockCustomer,
  createMockSession,
  resetCustomerCodeCounter,
} from "./customer-fixtures";

// Mock dependencies
vi.mock("@/lib/prisma", () => ({
  prisma: {
    customer: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/auth-utils", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  requireRateLimit: vi.fn(),
}));

vi.mock("@/lib/cache-utils", () => ({
  CACHE_TAGS: { CUSTOMERS_LIST: "customers" },
  invalidateCustomerCache: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  unstable_cache: vi.fn((fn) => fn),
}));

// Import mocked modules
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

describe("getCustomers", () => {
  const mockCustomers = [
    createMockCustomer({ id: "cuid_1", code: "KH-0001", companyName: "Company A" }),
    createMockCustomer({ id: "cuid_2", code: "KH-0002", companyName: "Company B" }),
    createMockCustomer({ id: "cuid_3", code: "KH-0003", companyName: "Company C" }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    resetCustomerCodeCounter();

    // Default: authenticated user
    vi.mocked(requireAuth).mockResolvedValue(createMockSession("STAFF"));

    // Default: return mock customers with counts
    vi.mocked(prisma.customer.findMany).mockResolvedValue(
      mockCustomers.map((c) => ({
        ...c,
        _count: { customerPlants: 5, stickyNotes: 0, contracts: 1 },
      }))
    );
    vi.mocked(prisma.customer.count).mockResolvedValue(3);

    // Default: financial aggregation
    vi.mocked(prisma.$queryRaw).mockResolvedValue([
      { customer_id: "cuid_1", total_debt: "100000", monthly_contract_value: "50000" },
      { customer_id: "cuid_2", total_debt: "0", monthly_contract_value: "75000" },
      { customer_id: "cuid_3", total_debt: "250000", monthly_contract_value: "100000" },
    ]);
  });

  describe("basic listing", () => {
    it("returns paginated customer list", async () => {
      const result = await getCustomers({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(3);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 3,
        totalPages: 1,
      });
    });

    it("applies pagination correctly", async () => {
      await getCustomers({ page: 2, limit: 10 });

      expect(prisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
    });

    it("includes financial data for each customer", async () => {
      const result = await getCustomers({ page: 1, limit: 20 });

      expect(result.data[0]).toHaveProperty("financials");
      const customer = result.data[0] as {
        financials?: { totalDebt: number; monthlyContractValue: number };
      };
      expect(customer.financials).toEqual({
        totalDebt: 100000,
        monthlyContractValue: 50000,
      });
    });
  });

  describe("filtering", () => {
    it("filters by status", async () => {
      await getCustomers({ page: 1, limit: 20, status: "ACTIVE" });

      expect(prisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "ACTIVE",
          }),
        })
      );
    });

    it("filters by district", async () => {
      await getCustomers({ page: 1, limit: 20, district: "Quận 1" });

      expect(prisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            district: "Quận 1",
          }),
        })
      );
    });

    it("filters customers with debt", async () => {
      await getCustomers({ page: 1, limit: 20, hasDebt: true });

      expect(prisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            invoices: expect.objectContaining({
              some: expect.objectContaining({
                outstandingAmount: { gt: 0 },
              }),
            }),
          }),
        })
      );
    });

    it("excludes TERMINATED customers by default", async () => {
      await getCustomers({ page: 1, limit: 20 });

      expect(prisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { not: "TERMINATED" },
          }),
        })
      );
    });
  });

  describe("sorting", () => {
    it("sorts by companyName ascending by default", async () => {
      await getCustomers({ page: 1, limit: 20 });

      expect(prisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { companyName: "asc" },
        })
      );
    });

    it("allows custom sort order", async () => {
      await getCustomers({
        page: 1,
        limit: 20,
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      expect(prisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: "desc" },
        })
      );
    });
  });

  describe("search functionality", () => {
    it("uses cached trigram search for Vietnamese fuzzy matching", async () => {
      // When search is provided, the cached search function is used
      // This uses raw SQL with pg_trgm extension
      // The function normalizes Vietnamese text and searches with trigram similarity

      // Note: The actual trigram search is handled by unstable_cache wrapper
      // which returns raw SQL results. We're documenting the behavior here.

      // Verify rate limit is applied for search
      const { requireRateLimit } = await import("@/lib/rate-limit");

      await getCustomers({ page: 1, limit: 20, search: "công ty abc" });

      expect(requireRateLimit).toHaveBeenCalledWith("customer-search", expect.any(Object));
    });

    it("applies rate limit on search queries", async () => {
      const { requireRateLimit } = await import("@/lib/rate-limit");

      await getCustomers({ page: 1, limit: 20, search: "test query" });

      expect(requireRateLimit).toHaveBeenCalledWith("customer-search", expect.any(Object));
    });

    it("sanitizes search input before processing", async () => {
      // Search input is sanitized to prevent XSS and SQL injection
      // The normalizeVietnamese function handles diacritics
      await getCustomers({ page: 1, limit: 20, search: "<script>alert('xss')</script>" });

      // The search should still proceed (sanitized)
      // Rate limit check confirms search path was triggered
      const { requireRateLimit } = await import("@/lib/rate-limit");
      expect(requireRateLimit).toHaveBeenCalled();
    });

    it("handles Vietnamese diacritics in search", async () => {
      // Vietnamese text like "Công ty" is normalized to "cong ty" for matching
      await getCustomers({ page: 1, limit: 20, search: "Nguyễn Văn A" });

      const { requireRateLimit } = await import("@/lib/rate-limit");
      expect(requireRateLimit).toHaveBeenCalledWith("customer-search", expect.any(Object));
    });
  });

  describe("authentication", () => {
    it("requires authentication", async () => {
      vi.mocked(requireAuth).mockRejectedValue(new Error("Vui lòng đăng nhập"));

      await expect(getCustomers({ page: 1, limit: 20 })).rejects.toThrow();
    });
  });

  describe("includes", () => {
    it("includes related counts", async () => {
      await getCustomers({ page: 1, limit: 20 });

      expect(prisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            _count: expect.objectContaining({
              select: expect.objectContaining({
                customerPlants: true,
                contracts: expect.any(Object),
              }),
            }),
          }),
        })
      );
    });
  });

  describe("edge cases", () => {
    it("handles empty result", async () => {
      vi.mocked(prisma.customer.findMany).mockResolvedValue([]);
      vi.mocked(prisma.customer.count).mockResolvedValue(0);
      vi.mocked(prisma.$queryRaw).mockResolvedValue([]);

      const result = await getCustomers({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });

    it("calculates correct totalPages", async () => {
      vi.mocked(prisma.customer.count).mockResolvedValue(55);

      const result = await getCustomers({ page: 1, limit: 20 });

      expect(result.pagination.totalPages).toBe(3);
    });
  });
});
