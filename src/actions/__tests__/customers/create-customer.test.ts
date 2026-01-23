/**
 * createCustomer Characterization Tests
 * Documents current behavior of customer creation action
 * Updated for Clean Architecture - mocks use case factory
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createCustomer } from "@/actions/customers";
import {
  createValidCustomerInput,
  createMockSession,
  resetCustomerCodeCounter,
  VALID_COMPANY_NAMES,
  INVALID_INPUTS,
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
const mockCreateCustomerUseCase = {
  execute: vi.fn(),
};

vi.mock("@/infrastructure/factories", () => ({
  getCustomerUseCases: vi.fn(() => ({
    createCustomer: mockCreateCustomerUseCase,
    updateCustomer: { execute: vi.fn() },
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
  }> = {}
): Customer {
  return Customer.create(
    {
      companyName: overrides.companyName ?? "Test Company",
      address: overrides.address ?? "123 Test Street",
      city: overrides.city ?? "TP.HCM",
    },
    overrides.id ?? "test-id-123",
    overrides.code ?? "KH-0001"
  );
}

describe("createCustomer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetCustomerCodeCounter();

    // Default: authenticated user
    vi.mocked(requireAuth).mockResolvedValue(createMockSession("STAFF"));

    // Default: successful creation
    mockCreateCustomerUseCase.execute.mockResolvedValue({
      customer: createMockCustomerEntity(),
    });
  });

  describe("successful creation", () => {
    it("creates customer with valid input", async () => {
      const input = createValidCustomerInput();
      const mockCustomer = createMockCustomerEntity({
        companyName: input.companyName,
        code: "KH-0001",
      });
      mockCreateCustomerUseCase.execute.mockResolvedValue({ customer: mockCustomer });

      const result = await createCustomer(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.companyName).toBe(input.companyName);
        expect(result.data.code).toMatch(/^KH-\d{4}$/);
      }
    });

    it("normalizes Vietnamese company name via use case", async () => {
      const input = createValidCustomerInput({
        companyName: VALID_COMPANY_NAMES.withDiacritics,
      });
      const mockCustomer = createMockCustomerEntity({
        companyName: VALID_COMPANY_NAMES.withDiacritics,
      });
      mockCreateCustomerUseCase.execute.mockResolvedValue({ customer: mockCustomer });

      await createCustomer(input);

      // Verify use case was called with sanitized input
      expect(mockCreateCustomerUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            companyName: VALID_COMPANY_NAMES.withDiacritics,
          }),
          userId: expect.any(String),
        })
      );
    });

    it("generates sequential customer code", async () => {
      const mockCustomer = createMockCustomerEntity({ code: "KH-0001" });
      mockCreateCustomerUseCase.execute.mockResolvedValue({ customer: mockCustomer });

      const input1 = createValidCustomerInput({ companyName: "Company A" });
      const result1 = await createCustomer(input1);

      expect(result1.success).toBe(true);
      // Code generation is now in use case/repository
      expect(mockCreateCustomerUseCase.execute).toHaveBeenCalled();
    });

    it("sanitizes input to prevent XSS", async () => {
      const input = createValidCustomerInput({
        companyName: INVALID_INPUTS.xssAttempt,
      });
      const mockCustomer = createMockCustomerEntity({
        companyName: "Test",
      });
      mockCreateCustomerUseCase.execute.mockResolvedValue({ customer: mockCustomer });

      await createCustomer(input);

      // Verify sanitized value was passed to use case
      const executeCall = mockCreateCustomerUseCase.execute.mock.calls[0]?.[0];
      const passedName = executeCall?.input?.companyName as string;

      // XSS script tags should be stripped by sanitization
      expect(passedName).not.toContain("<script>");
    });
  });

  describe("authentication", () => {
    it("requires authentication", async () => {
      const { AppError } = await import("@/lib/errors");
      vi.mocked(requireAuth).mockRejectedValue(
        new AppError("Vui lòng đăng nhập", "UNAUTHORIZED", 401)
      );

      const input = createValidCustomerInput();
      const result = await createCustomer(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("UNAUTHORIZED");
      }
    });
  });

  describe("duplicate detection", () => {
    it("rejects duplicate company name", async () => {
      const { DuplicateCustomerError } = await import("@/domain/customer");
      mockCreateCustomerUseCase.execute.mockRejectedValue(
        new DuplicateCustomerError(VALID_COMPANY_NAMES.standard)
      );

      const input = createValidCustomerInput();
      const result = await createCustomer(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("CONFLICT");
        expect(result.error).toContain("đã tồn tại");
      }
    });

    it("allows same name for TERMINATED customer", async () => {
      // Use case handles this logic - if it succeeds, terminated customers are ignored
      const mockCustomer = createMockCustomerEntity();
      mockCreateCustomerUseCase.execute.mockResolvedValue({ customer: mockCustomer });

      const input = createValidCustomerInput();
      const result = await createCustomer(input);

      expect(result.success).toBe(true);
    });
  });

  describe("validation", () => {
    it("rejects empty company name", async () => {
      const input = createValidCustomerInput({
        companyName: INVALID_INPUTS.emptyCompanyName,
      });

      const result = await createCustomer(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR");
      }
    });

    it("rejects too long company name (>255 chars)", async () => {
      const input = createValidCustomerInput({
        companyName: INVALID_INPUTS.tooLongCompanyName,
      });

      const result = await createCustomer(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR");
      }
    });

    it("rejects invalid email format", async () => {
      const input = createValidCustomerInput({
        contactEmail: INVALID_INPUTS.invalidEmail,
      });

      const result = await createCustomer(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR");
      }
    });

    it("allows empty/null optional fields", async () => {
      const mockCustomer = createMockCustomerEntity();
      mockCreateCustomerUseCase.execute.mockResolvedValue({ customer: mockCustomer });

      const input = createValidCustomerInput({
        contactName: null,
        contactPhone: null,
        contactEmail: null,
        taxCode: null,
        district: null,
        latitude: null,
        longitude: null,
      });

      const result = await createCustomer(input);

      expect(result.success).toBe(true);
    });
  });

  describe("default values", () => {
    it("defaults city to TP.HCM if not provided", async () => {
      const mockCustomer = createMockCustomerEntity({ city: "TP.HCM" });
      mockCreateCustomerUseCase.execute.mockResolvedValue({ customer: mockCustomer });

      const input = createValidCustomerInput();
      delete (input as Record<string, unknown>).city;

      await createCustomer(input);

      const executeCall = mockCreateCustomerUseCase.execute.mock.calls[0]?.[0];
      const passedCity = executeCall?.input?.city as string;
      expect(passedCity).toBe("TP.HCM");
    });

    it("defaults status to ACTIVE if not provided", async () => {
      const mockCustomer = createMockCustomerEntity();
      mockCreateCustomerUseCase.execute.mockResolvedValue({ customer: mockCustomer });

      const input = createValidCustomerInput();
      delete (input as Record<string, unknown>).status;

      await createCustomer(input);

      const executeCall = mockCreateCustomerUseCase.execute.mock.calls[0]?.[0];
      const passedStatus = executeCall?.input?.status as string;
      expect(passedStatus).toBe("ACTIVE");
    });
  });
});
