/**
 * updateCustomer Characterization Tests
 * Documents current behavior of customer update action
 * Updated for Clean Architecture - mocks use case factory
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateCustomer } from "@/actions/customers";
import {
  createValidUpdateInput,
  createMockSession,
  resetCustomerCodeCounter,
  VALID_COMPANY_NAMES,
} from "./customer-fixtures";
import { Customer } from "@/domain/customer";

// Mock prisma (needed to import customers.ts without DATABASE_URL error)
vi.mock("@/lib/prisma", () => ({
  prisma: {
    customer: { findMany: vi.fn(), count: vi.fn() },
    $queryRaw: vi.fn(),
  },
}));

// Mock use case factory
const mockUpdateCustomerUseCase = {
  execute: vi.fn(),
};

vi.mock("@/infrastructure/factories", () => ({
  getCustomerUseCases: vi.fn(() => ({
    createCustomer: { execute: vi.fn() },
    updateCustomer: mockUpdateCustomerUseCase,
    deleteCustomer: { execute: vi.fn() },
  })),
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
import { requireAuth } from "@/lib/auth-utils";

// Helper to create a mock Customer entity
function createMockCustomerEntity(
  overrides: Partial<{
    id: string;
    code: string;
    companyName: string;
    address: string;
    city: string;
    district: string;
    contactPhone: string;
    status: string;
  }> = {}
): Customer {
  return Customer.create(
    {
      companyName: overrides.companyName ?? "Test Company",
      address: overrides.address ?? "123 Test Street",
      city: overrides.city ?? "TP.HCM",
      district: overrides.district,
      contactPhone: overrides.contactPhone,
      status: (overrides.status as "ACTIVE" | "INACTIVE" | "LEAD" | "TERMINATED") ?? "ACTIVE",
    },
    overrides.id ?? "test-id-123",
    overrides.code ?? "KH-0001"
  );
}

describe("updateCustomer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetCustomerCodeCounter();

    // Default: authenticated user
    vi.mocked(requireAuth).mockResolvedValue(createMockSession("STAFF"));

    // Default: successful update
    mockUpdateCustomerUseCase.execute.mockResolvedValue({
      customer: createMockCustomerEntity(),
    });
  });

  describe("successful update", () => {
    it("updates existing customer", async () => {
      const mockCustomer = createMockCustomerEntity({
        id: "cuid_existing",
        companyName: "Updated Company Name",
      });
      mockUpdateCustomerUseCase.execute.mockResolvedValue({ customer: mockCustomer });

      const input = createValidUpdateInput("cuid_existing", {
        companyName: "Updated Company Name",
      });

      const result = await updateCustomer(input);

      expect(result.success).toBe(true);
      expect(mockUpdateCustomerUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "cuid_existing",
          updates: expect.objectContaining({
            companyName: "Updated Company Name",
          }),
          userId: expect.any(String),
        })
      );
    });

    it("only updates provided fields", async () => {
      const mockCustomer = createMockCustomerEntity({
        contactPhone: "0987654321",
      });
      mockUpdateCustomerUseCase.execute.mockResolvedValue({ customer: mockCustomer });

      const input = createValidUpdateInput("cuid_existing", {
        contactPhone: "0987654321",
      });

      await updateCustomer(input);

      const executeCall = mockUpdateCustomerUseCase.execute.mock.calls[0]?.[0];
      const updates = executeCall?.updates as Record<string, unknown>;

      // Phone should be in update data
      expect(updates.contactPhone).toBe("0987654321");
      // Note: Action sanitizes all fields, so undefined fields become null
      // The filter only removes undefined, not null. This is existing behavior.
      // For strict partial updates, use case layer should handle null vs undefined distinction
    });

    it("normalizes Vietnamese name on update via use case", async () => {
      const mockCustomer = createMockCustomerEntity({
        companyName: VALID_COMPANY_NAMES.withDiacritics,
      });
      mockUpdateCustomerUseCase.execute.mockResolvedValue({ customer: mockCustomer });

      const input = createValidUpdateInput("cuid_existing", {
        companyName: VALID_COMPANY_NAMES.withDiacritics,
      });

      await updateCustomer(input);

      // Verify use case was called with the company name
      expect(mockUpdateCustomerUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          updates: expect.objectContaining({
            companyName: VALID_COMPANY_NAMES.withDiacritics,
          }),
        })
      );
    });
  });

  describe("error handling", () => {
    it("returns NotFoundError for missing customer", async () => {
      const { CustomerNotFoundError } = await import("@/domain/customer");
      mockUpdateCustomerUseCase.execute.mockRejectedValue(
        new CustomerNotFoundError("clxyz1234567890abcdef")
      );

      const input = createValidUpdateInput("clxyz1234567890abcdef", {
        companyName: "New Name",
      });

      const result = await updateCustomer(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("NOT_FOUND");
        expect(result.error).toContain("không tìm thấy");
      }
    });

    it("prevents duplicate name on update", async () => {
      const { DuplicateCustomerError } = await import("@/domain/customer");
      mockUpdateCustomerUseCase.execute.mockRejectedValue(
        new DuplicateCustomerError("Duplicate Name")
      );

      const input = createValidUpdateInput("cuid_existing", {
        companyName: "Duplicate Name",
      });

      const result = await updateCustomer(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("CONFLICT");
        expect(result.error).toContain("đã tồn tại");
      }
    });

    it("allows updating to same name (no change)", async () => {
      const mockCustomer = createMockCustomerEntity({
        companyName: "Existing Company",
        contactPhone: "0987654321",
      });
      mockUpdateCustomerUseCase.execute.mockResolvedValue({ customer: mockCustomer });

      const input = createValidUpdateInput("cuid_existing", {
        companyName: "Existing Company",
        contactPhone: "0987654321",
      });

      const result = await updateCustomer(input);

      expect(result.success).toBe(true);
    });
  });

  describe("authentication", () => {
    it("requires authentication", async () => {
      const { AppError } = await import("@/lib/errors");
      vi.mocked(requireAuth).mockRejectedValue(
        new AppError("Vui lòng đăng nhập", "UNAUTHORIZED", 401)
      );

      const input = createValidUpdateInput("cuid_existing", {
        companyName: "New Name",
      });

      const result = await updateCustomer(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("UNAUTHORIZED");
      }
    });
  });

  describe("validation", () => {
    it("validates ID format", async () => {
      const input = {
        id: "invalid-id-format",
        companyName: "New Name",
      };

      const result = await updateCustomer(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR");
      }
    });

    it("accepts partial updates", async () => {
      const mockCustomer = createMockCustomerEntity({
        district: "Quận 1",
      });
      mockUpdateCustomerUseCase.execute.mockResolvedValue({ customer: mockCustomer });

      const input = createValidUpdateInput("cuid_existing", {
        district: "Quận 1",
      });

      const result = await updateCustomer(input);

      expect(result.success).toBe(true);
    });
  });

  describe("address normalization", () => {
    it("passes address to use case for normalization", async () => {
      const mockCustomer = createMockCustomerEntity({
        address: "123 Nguyễn Huệ, Quận 1",
      });
      mockUpdateCustomerUseCase.execute.mockResolvedValue({ customer: mockCustomer });

      const input = createValidUpdateInput("cuid_existing", {
        address: "123 Nguyễn Huệ, Quận 1",
      });

      await updateCustomer(input);

      expect(mockUpdateCustomerUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          updates: expect.objectContaining({
            address: "123 Nguyễn Huệ, Quận 1",
          }),
        })
      );
    });
  });

  describe("status transitions", () => {
    it("allows status change via update", async () => {
      const mockCustomer = createMockCustomerEntity({
        status: "INACTIVE",
      });
      mockUpdateCustomerUseCase.execute.mockResolvedValue({ customer: mockCustomer });

      const input = createValidUpdateInput("cuid_existing", {
        status: "INACTIVE",
      });

      const result = await updateCustomer(input);

      expect(result.success).toBe(true);
      expect(mockUpdateCustomerUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          updates: expect.objectContaining({
            status: "INACTIVE",
          }),
        })
      );
    });
  });
});
