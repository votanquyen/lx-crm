/**
 * Create Customer Use Case
 * Orchestrates customer creation with duplicate check and audit
 */
import {
  Customer,
  CustomerRepository,
  CreateCustomerInput,
  DuplicateCustomerError,
} from "@/domain/customer";
import type { AuditService } from "../shared/interfaces/audit-service";
import type { IdGenerator } from "../shared/interfaces/id-generator";
import { normalizeVietnamese } from "../shared/utils/normalize-vietnamese";

/**
 * Command for creating a new customer
 */
export interface CreateCustomerCommand {
  input: CreateCustomerInput;
  userId: string;
}

/**
 * Result of customer creation
 */
export interface CreateCustomerResult {
  customer: Customer;
}

/**
 * Use case for creating a new customer
 *
 * Responsibilities:
 * - Check for duplicate company names
 * - Generate sequential customer code
 * - Create customer entity with business rules
 * - Persist to repository
 * - Log audit trail
 */
export class CreateCustomerUseCase {
  constructor(
    private readonly customerRepo: CustomerRepository,
    private readonly auditService: AuditService,
    private readonly idGenerator: IdGenerator
  ) {}

  async execute(command: CreateCustomerCommand): Promise<CreateCustomerResult> {
    const { input, userId } = command;

    // 1. Check for duplicate company name (normalized)
    const existing = await this.customerRepo.findByNormalizedName(
      normalizeVietnamese(input.companyName)
    );
    if (existing) {
      throw new DuplicateCustomerError(input.companyName);
    }

    // 2. Generate next customer code (KH-XXXX)
    const code = await this.customerRepo.generateNextCode();

    // 3. Generate unique ID
    const id = this.idGenerator.generate();

    // 4. Create entity (business rules enforced in entity)
    const customer = Customer.create(input, id, code);

    // 5. Persist
    await this.customerRepo.save(customer);

    // 6. Audit log
    await this.auditService.log({
      action: "CREATE",
      entityType: "Customer",
      entityId: customer.id,
      userId,
      after: customer.toPersistence() as unknown as Record<string, unknown>,
    });

    return { customer };
  }
}
