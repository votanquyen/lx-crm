/**
 * Audit Service Interface (Port)
 * Framework-agnostic interface for audit logging
 */

/** Supported action types for audit logging */
export type AuditAction = "CREATE" | "UPDATE" | "DELETE";

/** Audit entry for logging entity changes */
export interface AuditEntry {
  action: AuditAction;
  entityType: string;
  entityId: string;
  userId: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}

/**
 * Port for audit logging operations
 * Implementation will be in infrastructure layer
 */
export interface AuditService {
  log(entry: AuditEntry): Promise<void>;
}
