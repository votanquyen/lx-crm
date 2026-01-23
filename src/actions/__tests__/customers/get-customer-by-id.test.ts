/**
 * getCustomerById Characterization Tests
 * Documents current behavior of single customer retrieval action
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCustomerById } from "@/actions/customers";
import {
  createMockCustomer,
  createMockSession,
  resetCustomerCodeCounter,
} from "./customer-fixtures";

// Mock dependencies
vi.mock("@/lib/prisma", () => ({
  prisma: {
    customer: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/auth-utils", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  unstable_cache: vi.fn((fn) => fn),
}));

// Import mocked modules
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

describe("getCustomerById", () => {
  const existingCustomer = {
    ...createMockCustomer({
      id: "cuid_existing",
      code: "KH-0001",
      companyName: "Test Company",
    }),
    invoices: [],
    _count: {
      customerPlants: 5,
      stickyNotes: 2,
      contracts: 1,
      invoices: 3,
      careSchedules: 10,
      exchangeRequests: 0,
      quotations: 1,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    resetCustomerCodeCounter();

    // Default: authenticated user
    vi.mocked(requireAuth).mockResolvedValue(createMockSession("STAFF"));

    // Default: customer exists with related data
    vi.mocked(prisma.customer.findUnique).mockResolvedValue(existingCustomer);
  });

  describe("successful retrieval", () => {
    it("returns customer with related data", async () => {
      const result = await getCustomerById("cuid_existing");

      expect(result.id).toBe("cuid_existing");
      expect(result.companyName).toBe("Test Company");
      expect(result._count).toBeDefined();
    });

    it("includes recent invoices", async () => {
      const customerWithInvoices = {
        ...existingCustomer,
        invoices: [
          {
            id: "inv_1",
            invoiceNumber: "INV-2024-001",
            status: "PAID",
            issueDate: new Date(),
            dueDate: new Date(),
            totalAmount: 1000000,
            paidAmount: 1000000,
            outstandingAmount: 0,
          },
        ],
      };
      vi.mocked(prisma.customer.findUnique).mockResolvedValue(customerWithInvoices);

      const result = await getCustomerById("cuid_existing");

      expect(result.invoices).toHaveLength(1);
      expect(result.invoices[0]?.invoiceNumber).toBe("INV-2024-001");
    });

    it("includes related entity counts", async () => {
      const result = await getCustomerById("cuid_existing");

      expect(result._count).toEqual({
        customerPlants: 5,
        stickyNotes: 2,
        contracts: 1,
        invoices: 3,
        careSchedules: 10,
        exchangeRequests: 0,
        quotations: 1,
      });
    });
  });

  describe("error handling", () => {
    it("throws NotFoundError for missing customer", async () => {
      vi.mocked(prisma.customer.findUnique).mockResolvedValue(null);

      await expect(getCustomerById("nonexistent")).rejects.toThrow("không tìm thấy");
    });
  });

  describe("authentication", () => {
    it("requires authentication", async () => {
      const { AppError } = await import("@/lib/errors");
      vi.mocked(requireAuth).mockRejectedValue(
        new AppError("Vui lòng đăng nhập", "UNAUTHORIZED", 401)
      );

      await expect(getCustomerById("cuid_existing")).rejects.toThrow();
    });

    it("allows any authenticated role", async () => {
      vi.mocked(requireAuth).mockResolvedValue(createMockSession("VIEWER" as "STAFF"));

      const result = await getCustomerById("cuid_existing");

      expect(result.id).toBe("cuid_existing");
    });
  });

  describe("query structure", () => {
    it("includes invoices with limited fields", async () => {
      await getCustomerById("cuid_existing");

      expect(prisma.customer.findUnique).toHaveBeenCalledWith({
        where: { id: "cuid_existing" },
        include: expect.objectContaining({
          invoices: expect.objectContaining({
            orderBy: { issueDate: "desc" },
            take: 50,
            select: expect.objectContaining({
              id: true,
              invoiceNumber: true,
              status: true,
            }),
          }),
        }),
      });
    });

    it("includes _count for related entities", async () => {
      await getCustomerById("cuid_existing");

      expect(prisma.customer.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            _count: expect.objectContaining({
              select: expect.objectContaining({
                customerPlants: true,
                contracts: true,
              }),
            }),
          }),
        })
      );
    });
  });
});
