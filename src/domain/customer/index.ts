/**
 * Customer Domain - Public Exports
 */

// Entity
export { Customer } from "./customer.entity";

// Repository Port
export type {
  CustomerRepository,
  CustomerSearchQuery,
  PaginatedResult,
} from "./customer.repository";

// Types
export type {
  CustomerProps,
  CreateCustomerInput,
  UpdateCustomerInput,
  CustomerStatus,
  CustomerTier,
} from "./customer.types";
export { STATUS_TRANSITIONS } from "./customer.types";

// Errors
export {
  CustomerDomainError,
  InvalidCustomerError,
  DuplicateCustomerError,
  InvalidStatusTransitionError,
  CustomerNotFoundError,
  CustomerHasActiveContractsError,
} from "./customer.errors";
