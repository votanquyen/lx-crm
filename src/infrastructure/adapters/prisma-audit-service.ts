/**
 * Prisma Audit Service Adapter
 * Implements AuditService port using existing audit.ts infrastructure
 */
import { createAuditLog } from "@/lib/audit";
import type { AuditService, AuditEntry } from "@/application/shared";

/**
 * Adapter that wraps existing audit infrastructure
 * Implements the AuditService port for use cases
 */
export class PrismaAuditService implements AuditService {
  async log(entry: AuditEntry): Promise<void> {
    await createAuditLog({
      userId: entry.userId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      oldValues: entry.before,
      newValues: entry.after,
    });
  }
}
