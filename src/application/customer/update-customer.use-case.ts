/**
 * Update Customer Use Case
 * Orchestrates customer update with duplicate check and audit
 */
import {
  Customer,
  CustomerRepository,
  UpdateCustomerInput,
  DuplicateCustomerError,
  CustomerNotFoundError,
} from "@/domain/customer";
import type { AuditService } from "../shared/interfaces/audit-service";
import { normalizeVietnamese } from "../shared/utils/normalize-vietnamese";

/**
 * Command for updating a customer
 */
export interface UpdateCustomerCommand {
  id: string;
  updates: UpdateCustomerInput;
  userId: string;
}

/**
 * Result of customer update
 */
export interface UpdateCustomerResult {
  customer: Customer;
}

/**
 * Use case for updating an existing customer
 *
 * Responsibilities:
 * - Find existing customer
 * - Check for duplicate if name changed
 * - Apply updates via entity
 * - Persist changes
 * - Log audit trail with before/after
 */
export class UpdateCustomerUseCase {
  constructor(
    private readonly customerRepo: CustomerRepository,
    private readonly auditService: AuditService
  ) {}

  async execute(command: UpdateCustomerCommand): Promise<UpdateCustomerResult> {
    const { id, updates, userId } = command;

    // 1. Find existing customer
    const customer = await this.customerRepo.findById(id);
    if (!customer) {
      throw new CustomerNotFoundError(id);
    }

    // Capture state before update for audit
    const before = customer.toPersistence();

    // 2. Check for duplicate if company name changed
    if (updates.companyName && updates.companyName !== customer.companyName) {
      const normalized = normalizeVietnamese(updates.companyName);
      const duplicate = await this.customerRepo.findByNormalizedName(normalized, id);
      if (duplicate) {
        throw new DuplicateCustomerError(updates.companyName);
      }
    }

    // 3. Apply updates via entity (entity enforces business rules)
    customer.update(updates);

    // 4. Persist
    await this.customerRepo.save(customer);

    // 5. Audit log with before/after
    await this.auditService.log({
      action: "UPDATE",
      entityType: "Customer",
      entityId: id,
      userId,
      before: before as unknown as Record<string, unknown>,
      after: customer.toPersistence() as unknown as Record<string, unknown>,
    });

    return { customer };
  }
}
