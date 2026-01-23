/**
 * CreateCustomerUseCase Unit Tests
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateCustomerUseCase } from "@/application/customer/create-customer.use-case";
import { Customer, CustomerRepository, DuplicateCustomerError } from "@/domain/customer";
import type { AuditService } from "@/application/shared";
import type { IdGenerator } from "@/application/shared";

describe("CreateCustomerUseCase", () => {
  let useCase: CreateCustomerUseCase;
  let mockRepo: CustomerRepository;
  let mockAudit: AuditService;
  let mockIdGenerator: IdGenerator;

  beforeEach(() => {
    mockRepo = {
      findById: vi.fn(),
      findByCode: vi.fn(),
      findByNormalizedName: vi.fn(),
      save: vi.fn(),
      search: vi.fn(),
      generateNextCode: vi.fn(),
      hasActiveContracts: vi.fn(),
    };
    mockAudit = { log: vi.fn() };
    mockIdGenerator = { generate: vi.fn().mockReturnValue("test-id-123") };
    useCase = new CreateCustomerUseCase(mockRepo, mockAudit, mockIdGenerator);
  });

  it("creates customer when no duplicate exists", async () => {
    vi.mocked(mockRepo.findByNormalizedName).mockResolvedValue(null);
    vi.mocked(mockRepo.generateNextCode).mockResolvedValue("KH-0001");
    vi.mocked(mockRepo.save).mockResolvedValue();

    const result = await useCase.execute({
      input: {
        companyName: "Công ty ABC",
        address: "123 Đường ABC",
        city: "Hồ Chí Minh",
      },
      userId: "user-1",
    });

    expect(result.customer).toBeInstanceOf(Customer);
    expect(result.customer.id).toBe("test-id-123");
    expect(result.customer.code).toBe("KH-0001");
    expect(result.customer.companyName).toBe("Công ty ABC");
    expect(mockRepo.save).toHaveBeenCalled();
    expect(mockAudit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "CREATE",
        entityType: "Customer",
        entityId: "test-id-123",
        userId: "user-1",
      })
    );
  });

  it("throws DuplicateCustomerError when duplicate exists", async () => {
    const existingCustomer = Customer.create(
      {
        companyName: "Công ty ABC",
        address: "456 Đường XYZ",
        city: "Hà Nội",
      },
      "existing-id",
      "KH-0001"
    );
    vi.mocked(mockRepo.findByNormalizedName).mockResolvedValue(existingCustomer);

    await expect(
      useCase.execute({
        input: {
          companyName: "Công ty ABC",
          address: "123 Đường ABC",
          city: "Hồ Chí Minh",
        },
        userId: "user-1",
      })
    ).rejects.toThrow(DuplicateCustomerError);

    expect(mockRepo.save).not.toHaveBeenCalled();
    expect(mockAudit.log).not.toHaveBeenCalled();
  });

  it("normalizes Vietnamese text for duplicate check", async () => {
    vi.mocked(mockRepo.findByNormalizedName).mockResolvedValue(null);
    vi.mocked(mockRepo.generateNextCode).mockResolvedValue("KH-0002");
    vi.mocked(mockRepo.save).mockResolvedValue();

    await useCase.execute({
      input: {
        companyName: "Công Ty Đặc Biệt",
        address: "789 Street",
        city: "Đà Nẵng",
      },
      userId: "user-2",
    });

    // Should have called findByNormalizedName with normalized text
    expect(mockRepo.findByNormalizedName).toHaveBeenCalledWith("cong ty dac biet");
  });

  it("generates sequential customer code", async () => {
    vi.mocked(mockRepo.findByNormalizedName).mockResolvedValue(null);
    vi.mocked(mockRepo.generateNextCode).mockResolvedValue("KH-0042");
    vi.mocked(mockRepo.save).mockResolvedValue();

    const result = await useCase.execute({
      input: {
        companyName: "New Company",
        address: "Address",
        city: "City",
      },
      userId: "user-1",
    });

    expect(result.customer.code).toBe("KH-0042");
    expect(mockRepo.generateNextCode).toHaveBeenCalled();
  });

  it("uses idGenerator for unique ID", async () => {
    vi.mocked(mockRepo.findByNormalizedName).mockResolvedValue(null);
    vi.mocked(mockRepo.generateNextCode).mockResolvedValue("KH-0001");
    vi.mocked(mockRepo.save).mockResolvedValue();
    vi.mocked(mockIdGenerator.generate).mockReturnValue("unique-cuid-xyz");

    const result = await useCase.execute({
      input: {
        companyName: "Test Company",
        address: "123 Street",
        city: "City",
      },
      userId: "user-1",
    });

    expect(mockIdGenerator.generate).toHaveBeenCalled();
    expect(result.customer.id).toBe("unique-cuid-xyz");
  });
});
