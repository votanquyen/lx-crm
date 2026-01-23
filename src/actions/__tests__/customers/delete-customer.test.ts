/**
 * deleteCustomer Characterization Tests
 * Documents current behavior of customer deletion action
 * Updated for Clean Architecture - mocks use case factory
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { deleteCustomer } from "@/actions/customers";
import { createMockSession, resetCustomerCodeCounter } from "./customer-fixtures";

// Mock prisma (needed to import customers.ts without DATABASE_URL error)
vi.mock("@/lib/prisma", () => ({
  prisma: {
    customer: { findMany: vi.fn(), count: vi.fn() },
    $queryRaw: vi.fn(),
  },
}));

// Mock use case factory
const mockDeleteCustomerUseCase = {
  execute: vi.fn(),
};

vi.mock("@/infrastructure/factories", () => ({
  getCustomerUseCases: vi.fn(() => ({
    createCustomer: { execute: vi.fn() },
    updateCustomer: { execute: vi.fn() },
    deleteCustomer: mockDeleteCustomerUseCase,
  })),
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/auth-utils", () => ({
  requireManager: vi.fn(),
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
import { requireManager } from "@/lib/auth-utils";

describe("deleteCustomer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetCustomerCodeCounter();

    // Default: manager authenticated
    vi.mocked(requireManager).mockResolvedValue(createMockSession("MANAGER"));

    // Default: successful deletion
    mockDeleteCustomerUseCase.execute.mockResolvedValue(undefined);
  });

  describe("successful deletion", () => {
    it("soft deletes by calling use case", async () => {
      const result = await deleteCustomer("cuid_existing");

      expect(result.success).toBe(true);
      expect(mockDeleteCustomerUseCase.execute).toHaveBeenCalledWith({
        id: "cuid_existing",
        userId: expect.any(String),
      });
    });

    it("returns success object", async () => {
      const result = await deleteCustomer("cuid_existing");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ success: true });
      }
    });
  });

  describe("authorization", () => {
    it("requires MANAGER role", async () => {
      await deleteCustomer("cuid_existing");

      expect(requireManager).toHaveBeenCalled();
    });

    it("rejects STAFF role", async () => {
      const { AppError } = await import("@/lib/errors");
      vi.mocked(requireManager).mockRejectedValue(
        new AppError("Bạn không có quyền thực hiện thao tác này", "FORBIDDEN", 403)
      );

      const result = await deleteCustomer("cuid_existing");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("FORBIDDEN");
      }
    });

    it("allows ADMIN role", async () => {
      vi.mocked(requireManager).mockResolvedValue(createMockSession("ADMIN"));

      const result = await deleteCustomer("cuid_existing");

      expect(result.success).toBe(true);
    });
  });

  describe("error handling", () => {
    it("returns NotFoundError for missing customer", async () => {
      const { CustomerNotFoundError } = await import("@/domain/customer");
      mockDeleteCustomerUseCase.execute.mockRejectedValue(
        new CustomerNotFoundError("nonexistent_id")
      );

      const result = await deleteCustomer("nonexistent_id");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("NOT_FOUND");
        expect(result.error).toContain("không tìm thấy");
      }
    });

    it("blocks deletion with active contracts", async () => {
      const { CustomerHasActiveContractsError } = await import("@/domain/customer");
      mockDeleteCustomerUseCase.execute.mockRejectedValue(new CustomerHasActiveContractsError());

      const result = await deleteCustomer("cuid_existing");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("HAS_ACTIVE_CONTRACTS");
        expect(result.error).toContain("hợp đồng hoạt động");
      }
    });

    it("allows deletion with no contracts", async () => {
      // Use case succeeds when no active contracts
      mockDeleteCustomerUseCase.execute.mockResolvedValue(undefined);

      const result = await deleteCustomer("cuid_existing");

      expect(result.success).toBe(true);
    });

    it("allows deletion with only inactive contracts", async () => {
      // Use case handles contract checking - if it succeeds, there are no active contracts
      mockDeleteCustomerUseCase.execute.mockResolvedValue(undefined);

      const result = await deleteCustomer("cuid_existing");

      expect(result.success).toBe(true);
    });
  });

  describe("use case delegation", () => {
    it("delegates to DeleteCustomerUseCase", async () => {
      await deleteCustomer("cuid_existing");

      expect(mockDeleteCustomerUseCase.execute).toHaveBeenCalledWith({
        id: "cuid_existing",
        userId: "user_123",
      });
    });
  });

  describe("side effects", () => {
    it("invalidates customer cache on success", async () => {
      const { invalidateCustomerCache } = await import("@/lib/cache-utils");

      await deleteCustomer("cuid_existing");

      expect(invalidateCustomerCache).toHaveBeenCalled();
    });

    it("revalidates path on success", async () => {
      const { revalidatePath } = await import("next/cache");

      await deleteCustomer("cuid_existing");

      expect(revalidatePath).toHaveBeenCalledWith("/customers");
    });
  });
});
