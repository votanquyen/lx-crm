/**
 * Infrastructure Factories
 * Simple factory functions for creating repository and use case instances
 *
 * Note: Using simple factory pattern instead of IoC container
 * to keep complexity low per YAGNI principle.
 */
import { prisma } from "@/lib/prisma";
import { PrismaCustomerRepository } from "./repositories/prisma-customer.repository";
import { PrismaAuditService, CuidGenerator, PrismaContractChecker } from "./adapters";
import { CustomerRepository } from "@/domain/customer";
import {
  CreateCustomerUseCase,
  UpdateCustomerUseCase,
  DeleteCustomerUseCase,
} from "@/application/customer";
import type { AuditService, IdGenerator, HasActiveContractsChecker } from "@/application/shared";

// Singleton instances for adapters (stateless, can be shared)
let auditServiceInstance: AuditService | null = null;
let idGeneratorInstance: IdGenerator | null = null;
let contractCheckerInstance: HasActiveContractsChecker | null = null;

/**
 * Get customer repository instance
 * Uses shared Prisma client from lib
 */
export function getCustomerRepository(): CustomerRepository {
  return new PrismaCustomerRepository(prisma);
}

/**
 * Get audit service instance (singleton)
 */
export function getAuditService(): AuditService {
  if (!auditServiceInstance) {
    auditServiceInstance = new PrismaAuditService();
  }
  return auditServiceInstance;
}

/**
 * Get ID generator instance (singleton)
 */
export function getIdGenerator(): IdGenerator {
  if (!idGeneratorInstance) {
    idGeneratorInstance = new CuidGenerator();
  }
  return idGeneratorInstance;
}

/**
 * Get contract checker instance (singleton)
 */
export function getContractChecker(): HasActiveContractsChecker {
  if (!contractCheckerInstance) {
    contractCheckerInstance = new PrismaContractChecker(prisma);
  }
  return contractCheckerInstance;
}

/**
 * Get all customer use cases
 * Factory method for dependency injection
 */
export function getCustomerUseCases() {
  const customerRepo = getCustomerRepository();
  const auditService = getAuditService();
  const idGenerator = getIdGenerator();
  const contractChecker = getContractChecker();

  return {
    createCustomer: new CreateCustomerUseCase(customerRepo, auditService, idGenerator),
    updateCustomer: new UpdateCustomerUseCase(customerRepo, auditService),
    deleteCustomer: new DeleteCustomerUseCase(customerRepo, contractChecker, auditService),
    // Note: GetCustomerStatsUseCase needs CustomerStatsProvider - defer to future
  };
}
