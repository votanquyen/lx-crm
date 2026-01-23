/**
 * Contract Checker Interface (Port)
 * Framework-agnostic interface for checking contract status
 */

/**
 * Port for checking if a customer has active contracts
 * Implementation will query contracts table in infrastructure layer
 */
export interface HasActiveContractsChecker {
  hasActiveContracts(customerId: string): Promise<boolean>;
}
