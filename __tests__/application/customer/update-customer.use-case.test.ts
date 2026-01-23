/**
 * UpdateCustomerUseCase Unit Tests
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { UpdateCustomerUseCase } from "@/application/customer/update-customer.use-case";
import {
  Customer,
  CustomerRepository,
  DuplicateCustomerError,
  CustomerNotFoundError,
} from "@/domain/customer";
import type { AuditService } from "@/application/shared";

describe("UpdateCustomerUseCase", () => {
  let useCase: UpdateCustomerUseCase;
  let mockRepo: CustomerRepository;
  let mockAudit: AuditService;

  const createTestCustomer = (overrides = {}) =>
    Customer.create(
      {
        companyName: "Công ty ABC",
        address: "123 Đường ABC",
        city: "Hồ Chí Minh",
        ...overrides,
      },
      "customer-123",
      "KH-0001"
    );

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
    useCase = new UpdateCustomerUseCase(mockRepo, mockAudit);
  });

  it("updates customer when no duplicate exists", async () => {
    const customer = createTestCustomer();
    vi.mocked(mockRepo.findById).mockResolvedValue(customer);
    vi.mocked(mockRepo.findByNormalizedName).mockResolvedValue(null);
    vi.mocked(mockRepo.save).mockResolvedValue();

    const result = await useCase.execute({
      id: "customer-123",
      updates: { contactName: "Nguyễn Văn A" },
      userId: "user-1",
    });

    expect(result.customer.contactName).toBe("Nguyễn Văn A");
    expect(mockRepo.save).toHaveBeenCalled();
    expect(mockAudit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "UPDATE",
        entityType: "Customer",
        entityId: "customer-123",
        userId: "user-1",
      })
    );
  });

  it("throws CustomerNotFoundError when customer does not exist", async () => {
    vi.mocked(mockRepo.findById).mockResolvedValue(null);

    await expect(
      useCase.execute({
        id: "non-existent-id",
        updates: { contactName: "Test" },
        userId: "user-1",
      })
    ).rejects.toThrow(CustomerNotFoundError);

    expect(mockRepo.save).not.toHaveBeenCalled();
    expect(mockAudit.log).not.toHaveBeenCalled();
  });

  it("checks for duplicate when company name changes", async () => {
    const customer = createTestCustomer();
    const duplicateCustomer = Customer.create(
      {
        companyName: "Công ty XYZ",
        address: "456 Đường XYZ",
        city: "Hà Nội",
      },
      "other-customer-456",
      "KH-0002"
    );
    vi.mocked(mockRepo.findById).mockResolvedValue(customer);
    vi.mocked(mockRepo.findByNormalizedName).mockResolvedValue(duplicateCustomer);

    await expect(
      useCase.execute({
        id: "customer-123",
        updates: { companyName: "Công ty XYZ" },
        userId: "user-1",
      })
    ).rejects.toThrow(DuplicateCustomerError);

    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it("allows update when company name unchanged", async () => {
    const customer = createTestCustomer();
    vi.mocked(mockRepo.findById).mockResolvedValue(customer);
    vi.mocked(mockRepo.save).mockResolvedValue();

    // Update without changing company name - should not check duplicates
    const result = await useCase.execute({
      id: "customer-123",
      updates: { contactPhone: "0901234567" },
      userId: "user-1",
    });

    expect(mockRepo.findByNormalizedName).not.toHaveBeenCalled();
    expect(result.customer.contactPhone).toBe("0901234567");
  });

  it("records before and after states in audit", async () => {
    const customer = createTestCustomer();
    vi.mocked(mockRepo.findById).mockResolvedValue(customer);
    vi.mocked(mockRepo.save).mockResolvedValue();

    await useCase.execute({
      id: "customer-123",
      updates: { address: "New Address" },
      userId: "user-1",
    });

    expect(mockAudit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "UPDATE",
        before: expect.objectContaining({
          address: "123 Đường ABC",
        }),
        after: expect.objectContaining({
          address: "New Address",
        }),
      })
    );
  });

  it("updates multiple fields at once", async () => {
    const customer = createTestCustomer();
    vi.mocked(mockRepo.findById).mockResolvedValue(customer);
    vi.mocked(mockRepo.save).mockResolvedValue();

    const result = await useCase.execute({
      id: "customer-123",
      updates: {
        contactName: "Trần Thị B",
        contactPhone: "0912345678",
        contactEmail: "contact@example.com",
      },
      userId: "user-1",
    });

    expect(result.customer.contactName).toBe("Trần Thị B");
    expect(result.customer.contactPhone).toBe("0912345678");
    expect(result.customer.contactEmail).toBe("contact@example.com");
  });
});
