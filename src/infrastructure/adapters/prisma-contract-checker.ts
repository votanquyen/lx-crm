/**
 * Prisma Contract Checker Adapter
 * Implements HasActiveContractsChecker port using Prisma
 */
import type { PrismaClient } from "@prisma/client";
import type { HasActiveContractsChecker } from "@/application/shared";

/**
 * Adapter that checks for active contracts using Prisma
 * Implements the HasActiveContractsChecker port for use cases
 */
export class PrismaContractChecker implements HasActiveContractsChecker {
  constructor(private readonly prisma: PrismaClient) {}

  async hasActiveContracts(customerId: string): Promise<boolean> {
    const count = await this.prisma.contract.count({
      where: {
        customerId,
        status: "ACTIVE",
      },
    });
    return count > 0;
  }
}
