/**
 * DeleteCustomerUseCase Unit Tests
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeleteCustomerUseCase } from "@/application/customer/delete-customer.use-case";
import {
  Customer,
  CustomerRepository,
  CustomerNotFoundError,
  CustomerHasActiveContractsError,
} from "@/domain/customer";
import type { AuditService, HasActiveContractsChecker } from "@/application/shared";

describe("DeleteCustomerUseCase", () => {
  let useCase: DeleteCustomerUseCase;
  let mockRepo: CustomerRepository;
  let mockContractChecker: HasActiveContractsChecker;
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
    mockContractChecker = {
      hasActiveContracts: vi.fn(),
    };
    mockAudit = { log: vi.fn() };
    useCase = new DeleteCustomerUseCase(mockRepo, mockContractChecker, mockAudit);
  });

  it("soft deletes customer when no active contracts", async () => {
    const customer = createTestCustomer();
    vi.mocked(mockRepo.findById).mockResolvedValue(customer);
    vi.mocked(mockContractChecker.hasActiveContracts).mockResolvedValue(false);
    vi.mocked(mockRepo.save).mockResolvedValue();

    await useCase.execute({
      id: "customer-123",
      userId: "user-1",
    });

    expect(mockRepo.save).toHaveBeenCalled();
    expect(mockAudit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "DELETE",
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
        userId: "user-1",
      })
    ).rejects.toThrow(CustomerNotFoundError);

    expect(mockContractChecker.hasActiveContracts).not.toHaveBeenCalled();
    expect(mockRepo.save).not.toHaveBeenCalled();
    expect(mockAudit.log).not.toHaveBeenCalled();
  });

  it("throws CustomerHasActiveContractsError when customer has active contracts", async () => {
    const customer = createTestCustomer();
    vi.mocked(mockRepo.findById).mockResolvedValue(customer);
    vi.mocked(mockContractChecker.hasActiveContracts).mockResolvedValue(true);

    await expect(
      useCase.execute({
        id: "customer-123",
        userId: "user-1",
      })
    ).rejects.toThrow(CustomerHasActiveContractsError);

    expect(mockRepo.save).not.toHaveBeenCalled();
    expect(mockAudit.log).not.toHaveBeenCalled();
  });

  it("terminates customer via entity method", async () => {
    const customer = createTestCustomer();
    const terminateSpy = vi.spyOn(customer, "terminate");
    vi.mocked(mockRepo.findById).mockResolvedValue(customer);
    vi.mocked(mockContractChecker.hasActiveContracts).mockResolvedValue(false);
    vi.mocked(mockRepo.save).mockResolvedValue();

    await useCase.execute({
      id: "customer-123",
      userId: "user-1",
    });

    expect(terminateSpy).toHaveBeenCalled();
    expect(customer.status).toBe("TERMINATED");
  });

  it("records before state in audit (no after state for delete)", async () => {
    const customer = createTestCustomer();
    vi.mocked(mockRepo.findById).mockResolvedValue(customer);
    vi.mocked(mockContractChecker.hasActiveContracts).mockResolvedValue(false);
    vi.mocked(mockRepo.save).mockResolvedValue();

    await useCase.execute({
      id: "customer-123",
      userId: "user-1",
    });

    expect(mockAudit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "DELETE",
        before: expect.objectContaining({
          id: "customer-123",
          companyName: "Công ty ABC",
        }),
      })
    );
    // Delete should not have 'after' state
    const logCall = vi.mocked(mockAudit.log).mock.calls[0]?.[0];
    expect(logCall?.after).toBeUndefined();
  });

  it("checks contracts before performing any mutation", async () => {
    const customer = createTestCustomer();
    vi.mocked(mockRepo.findById).mockResolvedValue(customer);
    vi.mocked(mockContractChecker.hasActiveContracts).mockResolvedValue(true);

    try {
      await useCase.execute({
        id: "customer-123",
        userId: "user-1",
      });
    } catch {
      // Expected to throw
    }

    // Verify contract check was called before save
    expect(mockContractChecker.hasActiveContracts).toHaveBeenCalledWith("customer-123");
    expect(mockRepo.save).not.toHaveBeenCalled();
  });
});
