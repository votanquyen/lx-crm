/**
 * Infrastructure Layer - Public Exports
 */

// Repositories
export { PrismaCustomerRepository } from "./repositories/prisma-customer.repository";

// Mappers
export { CustomerMapper } from "./mappers/customer.mapper";

// Adapters
export { PrismaAuditService, CuidGenerator, PrismaContractChecker } from "./adapters";

// Factories
export {
  getCustomerRepository,
  getAuditService,
  getIdGenerator,
  getContractChecker,
  getCustomerUseCases,
} from "./factories";
