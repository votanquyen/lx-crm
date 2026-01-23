/**
 * Delete Customer Use Case
 * Orchestrates customer soft-delete with business rule checks and audit
 */
import {
  CustomerRepository,
  CustomerNotFoundError,
  CustomerHasActiveContractsError,
} from "@/domain/customer";
import type { AuditService } from "../shared/interfaces/audit-service";
import type { HasActiveContractsChecker } from "../shared/interfaces/contract-checker";

/**
 * Command for deleting a customer
 */
export interface DeleteCustomerCommand {
  id: string;
  userId: string;
}

/**
 * Use case for soft-deleting a customer
 *
 * Responsibilities:
 * - Find existing customer
 * - Verify no active contracts exist
 * - Soft delete via entity method
 * - Persist changes
 * - Log audit trail
 */
export class DeleteCustomerUseCase {
  constructor(
    private readonly customerRepo: CustomerRepository,
    private readonly contractChecker: HasActiveContractsChecker,
    private readonly auditService: AuditService
  ) {}

  async execute(command: DeleteCustomerCommand): Promise<void> {
    const { id, userId } = command;

    // 1. Find existing customer
    const customer = await this.customerRepo.findById(id);
    if (!customer) {
      throw new CustomerNotFoundError(id);
    }

    // Capture state before delete for audit
    const before = customer.toPersistence();

    // 2. Check business rule: no active contracts
    const hasActive = await this.contractChecker.hasActiveContracts(id);
    if (hasActive) {
      throw new CustomerHasActiveContractsError();
    }

    // 3. Soft delete via entity method
    customer.terminate();

    // 4. Persist
    await this.customerRepo.save(customer);

    // 5. Audit log
    await this.auditService.log({
      action: "DELETE",
      entityType: "Customer",
      entityId: id,
      userId,
      before: before as unknown as Record<string, unknown>,
    });
  }
}
