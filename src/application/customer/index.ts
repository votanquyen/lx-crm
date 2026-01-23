/**
 * Customer Application Layer - Public Exports
 *
 * Use cases for customer aggregate orchestration.
 * These are framework-agnostic and fully testable.
 */

// Create
export {
  CreateCustomerUseCase,
  type CreateCustomerCommand,
  type CreateCustomerResult,
} from "./create-customer.use-case";

// Update
export {
  UpdateCustomerUseCase,
  type UpdateCustomerCommand,
  type UpdateCustomerResult,
} from "./update-customer.use-case";

// Delete
export { DeleteCustomerUseCase, type DeleteCustomerCommand } from "./delete-customer.use-case";

// Stats
export {
  GetCustomerStatsUseCase,
  type CustomerStats,
  type CustomerStatsProvider,
} from "./get-customer-stats.use-case";
