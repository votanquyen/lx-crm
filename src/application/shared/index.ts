/**
 * Application Shared Interfaces - Public Exports
 */

export type { AuditService, AuditEntry, AuditAction } from "./interfaces/audit-service";
export type { IdGenerator } from "./interfaces/id-generator";
export type { HasActiveContractsChecker } from "./interfaces/contract-checker";

// Utilities
export { normalizeVietnamese } from "./utils/normalize-vietnamese";
