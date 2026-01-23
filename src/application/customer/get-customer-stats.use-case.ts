/**
 * Get Customer Stats Use Case
 * Retrieves dashboard statistics for customer aggregate
 */

/**
 * Customer statistics for dashboard
 */
export interface CustomerStats {
  total: number;
  active: number;
  leads: number;
  withDebt: number;
}

/**
 * Port for retrieving customer statistics
 * Implementation will be an optimized database query
 */
export interface CustomerStatsProvider {
  getStats(): Promise<CustomerStats>;
}

/**
 * Use case for getting customer statistics
 *
 * Responsibilities:
 * - Delegate to stats provider for optimized query
 * - Return typed statistics
 *
 * Note: Thin wrapper - stats computation is in infrastructure
 * for performance (single optimized SQL query)
 */
export class GetCustomerStatsUseCase {
  constructor(private readonly statsProvider: CustomerStatsProvider) {}

  async execute(): Promise<CustomerStats> {
    return this.statsProvider.getStats();
  }
}
