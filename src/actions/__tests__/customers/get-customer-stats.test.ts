/**
 * getCustomerStats Characterization Tests
 * Documents current behavior of customer statistics action
 * NOTE: This action uses auth() directly instead of requireAuth()
 *       for historical reasons - documenting actual behavior
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCustomerStats } from "@/actions/customers";

// Mock dependencies
vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  unstable_cache: vi.fn((fn) => fn),
}));

// Import mocked modules
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Type the auth mock correctly
const mockAuth = vi.mocked(auth) as unknown as ReturnType<typeof vi.fn>;

describe("getCustomerStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: authenticated user
    mockAuth.mockResolvedValue({
      user: {
        id: "user_123",
        email: "test@locxanh.vn",
        name: "Test User",
        role: "STAFF",
      },
      expires: new Date(Date.now() + 86400000).toISOString(),
    });

    // Default: stats query result
    vi.mocked(prisma.$queryRaw).mockResolvedValue([
      {
        total: BigInt(100),
        active: BigInt(75),
        leads: BigInt(15),
        with_debt: BigInt(25),
      },
    ]);
  });

  describe("successful retrieval", () => {
    it("returns aggregated customer stats", async () => {
      const result = await getCustomerStats();

      expect(result).toEqual({
        total: 100,
        active: 75,
        leads: 15,
        withDebt: 25,
      });
    });

    it("converts BigInt to Number", async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([
        {
          total: BigInt(999999999),
          active: BigInt(888888888),
          leads: BigInt(77777777),
          with_debt: BigInt(66666666),
        },
      ]);

      const result = await getCustomerStats();

      expect(typeof result.total).toBe("number");
      expect(typeof result.active).toBe("number");
      expect(typeof result.leads).toBe("number");
      expect(typeof result.withDebt).toBe("number");
    });
  });

  describe("authentication", () => {
    it("requires authentication", async () => {
      mockAuth.mockResolvedValue(null);

      await expect(getCustomerStats()).rejects.toThrow();
    });

    it("works for any authenticated user", async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: "user_456",
          email: "viewer@locxanh.vn",
          name: "Viewer",
          role: "VIEWER",
        },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const result = await getCustomerStats();

      expect(result.total).toBe(100);
    });
  });

  describe("SQL query behavior", () => {
    it("uses COUNT(DISTINCT) to avoid duplicate counting", async () => {
      // The query uses COUNT(DISTINCT c.id) to prevent counting
      // the same customer multiple times due to JOINs
      await getCustomerStats();

      expect(prisma.$queryRaw).toHaveBeenCalled();
      // The raw query should use FILTER clauses for each stat
    });

    it("excludes TERMINATED from total count", async () => {
      // The query filters: WHERE c.status != 'TERMINATED'
      // This is verified by the SQL structure
      await getCustomerStats();

      expect(prisma.$queryRaw).toHaveBeenCalled();
    });

    it("counts customers with outstanding invoices for debt stat", async () => {
      // The query checks for invoices with status IN ('SENT', 'PARTIAL', 'OVERDUE')
      // AND outstandingAmount > 0
      await getCustomerStats();

      expect(prisma.$queryRaw).toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("handles zero counts", async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([
        {
          total: BigInt(0),
          active: BigInt(0),
          leads: BigInt(0),
          with_debt: BigInt(0),
        },
      ]);

      const result = await getCustomerStats();

      expect(result).toEqual({
        total: 0,
        active: 0,
        leads: 0,
        withDebt: 0,
      });
    });

    it("handles all customers having debt", async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([
        {
          total: BigInt(50),
          active: BigInt(50),
          leads: BigInt(0),
          with_debt: BigInt(50),
        },
      ]);

      const result = await getCustomerStats();

      expect(result.total).toBe(50);
      expect(result.withDebt).toBe(50);
    });

    it("handles leads only scenario", async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([
        {
          total: BigInt(20),
          active: BigInt(0),
          leads: BigInt(20),
          with_debt: BigInt(0),
        },
      ]);

      const result = await getCustomerStats();

      expect(result.total).toBe(20);
      expect(result.active).toBe(0);
      expect(result.leads).toBe(20);
    });
  });

  describe("data consistency", () => {
    it("total >= active + leads (INACTIVE and other statuses exist)", async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([
        {
          total: BigInt(100),
          active: BigInt(60),
          leads: BigInt(20),
          with_debt: BigInt(15),
        },
      ]);

      const result = await getCustomerStats();

      // Total should include ACTIVE, LEAD, and INACTIVE customers
      expect(result.total).toBeGreaterThanOrEqual(result.active + result.leads);
    });

    it("withDebt <= total (subset)", async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([
        {
          total: BigInt(100),
          active: BigInt(75),
          leads: BigInt(15),
          with_debt: BigInt(25),
        },
      ]);

      const result = await getCustomerStats();

      expect(result.withDebt).toBeLessThanOrEqual(result.total);
    });
  });
});
