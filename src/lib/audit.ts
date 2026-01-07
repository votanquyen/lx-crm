/**
 * Audit Log Utilities
 * Centralized audit logging with IP and user agent capture
 */
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/** Supported entity types for audit logging */
export type EntityType = "Customer" | "Contract" | "Invoice" | "Payment" | "CareSchedule" | "User" | "PlantType";

/** Supported action types for audit logging */
export type ActionType = "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "EXPORT" | "IMPORT";

interface AuditLogParams {
  userId: string;
  action: ActionType;
  entityType: EntityType | string;
  entityId: string;
  description?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Create an audit log entry with IP and user agent
 * This is the main function - use this for all audit logging
 * @param params - Audit log parameters
 */
export async function createAuditLog(params: AuditLogParams): Promise<void> {
  const headersList = await headers();

  // Extract IP address from headers (handles proxied requests)
  const forwardedFor = headersList.get("x-forwarded-for");
  const ipAddress = forwardedFor?.split(",")[0]?.trim()
    ?? headersList.get("x-real-ip")
    ?? "unknown";

  // Extract user agent
  const userAgent = headersList.get("user-agent") ?? "unknown";

  await prisma.activityLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      description: params.description ?? null,
      oldValues: params.oldValues as Prisma.JsonObject ?? null,
      newValues: params.newValues as Prisma.JsonObject ?? null,
      metadata: params.metadata as Prisma.JsonObject ?? null,
      ipAddress,
      userAgent,
    },
  });
}

/**
 * Generic entity action logger
 * Single function to replace entity-specific loggers
 */
export async function logEntityAction(
  userId: string,
  action: "CREATE" | "UPDATE" | "DELETE",
  entityType: EntityType,
  entityId: string,
  oldValues?: Record<string, unknown>,
  newValues?: Record<string, unknown>
): Promise<void> {
  await createAuditLog({
    userId,
    action,
    entityType,
    entityId,
    oldValues,
    newValues,
  });
}

// Convenience aliases for backward compatibility
/** @deprecated Use logEntityAction(userId, action, "Customer", ...) instead */
export const logCustomerAction = (
  userId: string,
  action: "CREATE" | "UPDATE" | "DELETE",
  entityId: string,
  oldValues?: object,
  newValues?: object
) => logEntityAction(userId, action, "Customer", entityId, oldValues as Record<string, unknown>, newValues as Record<string, unknown>);

/** @deprecated Use logEntityAction(userId, action, "Contract", ...) instead */
export const logContractAction = (
  userId: string,
  action: "CREATE" | "UPDATE" | "DELETE",
  entityId: string,
  oldValues?: object,
  newValues?: object
) => logEntityAction(userId, action, "Contract", entityId, oldValues as Record<string, unknown>, newValues as Record<string, unknown>);

/** @deprecated Use logEntityAction(userId, action, "Invoice", ...) instead */
export const logInvoiceAction = (
  userId: string,
  action: "CREATE" | "UPDATE" | "DELETE",
  entityId: string,
  oldValues?: object,
  newValues?: object
) => logEntityAction(userId, action, "Invoice", entityId, oldValues as Record<string, unknown>, newValues as Record<string, unknown>);

