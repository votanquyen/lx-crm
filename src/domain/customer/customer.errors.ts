/**
 * Customer Domain Errors
 * Typed error classes for customer aggregate business rule violations
 */

/**
 * Base error for customer domain violations
 */
export class CustomerDomainError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = "CustomerDomainError";
  }
}

/**
 * Thrown when customer creation/update violates invariants
 */
export class InvalidCustomerError extends CustomerDomainError {
  constructor(reason: string) {
    super(reason, "INVALID_CUSTOMER");
    this.name = "InvalidCustomerError";
  }
}

/**
 * Thrown when duplicate company name detected
 */
export class DuplicateCustomerError extends CustomerDomainError {
  constructor(companyName: string) {
    super(`Khách hàng "${companyName}" đã tồn tại`, "DUPLICATE_CUSTOMER");
    this.name = "DuplicateCustomerError";
  }
}

/**
 * Thrown when status transition violates business rules
 */
export class InvalidStatusTransitionError extends CustomerDomainError {
  constructor(from: string, to: string) {
    super(`Không thể chuyển trạng thái từ ${from} sang ${to}`, "INVALID_STATUS_TRANSITION");
    this.name = "InvalidStatusTransitionError";
  }
}

/**
 * Thrown when customer not found
 */
export class CustomerNotFoundError extends CustomerDomainError {
  constructor(identifier: string) {
    super(`Khách hàng không tìm thấy: ${identifier}`, "CUSTOMER_NOT_FOUND");
    this.name = "CustomerNotFoundError";
  }
}

/**
 * Thrown when customer has active contracts and cannot be deleted
 */
export class CustomerHasActiveContractsError extends CustomerDomainError {
  constructor() {
    super("Không thể xóa khách hàng đang có hợp đồng hoạt động", "HAS_ACTIVE_CONTRACTS");
    this.name = "CustomerHasActiveContractsError";
  }
}
