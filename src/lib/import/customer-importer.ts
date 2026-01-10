/**
 * Customer Import Execution
 * Handles batch import with transaction safety
 */
import { prisma } from "@/lib/prisma";
import { normalizeVietnamese } from "@/lib/utils";
import type { AnalyzedRow } from "@/lib/ai/import-analyzer";

export interface ImportResult {
  success: boolean;
  batchId: string;
  imported: number;
  merged: number;
  skipped: number;
  errors: Array<{ rowIndex: number; error: string }>;
  createdIds: string[];
  mergedIds: string[];
}

/**
 * Execute customer import
 */
export async function executeCustomerImport(
  rows: AnalyzedRow[],
  userId: string
): Promise<ImportResult> {
  const batchId = `IMPORT-${Date.now()}`;
  const result: ImportResult = {
    success: false,
    batchId,
    imported: 0,
    merged: 0,
    skipped: 0,
    errors: [],
    createdIds: [],
    mergedIds: [],
  };

  // Filter approved rows only
  const approvedRows = rows.filter(
    (r) => r.status === "auto_approve" || r.status === "needs_review"
  );

  if (approvedRows.length === 0) {
    result.success = true;
    return result;
  }

  try {
    // Execute in transaction
    await prisma.$transaction(async (tx) => {
      for (const row of approvedRows) {
        try {
          const data = row.normalizedData;

          // Check if merge or new
          if (row.duplicateInfo?.isDuplicate && row.duplicateInfo.matchId) {
            // Merge: Update existing record
            await tx.customer.update({
              where: { id: row.duplicateInfo.matchId },
              data: {
                companyName: String(data.companyName || ""),
                companyNameNorm: normalizeVietnamese(String(data.companyName || "")),
                shortName: data.shortName ? String(data.shortName) : undefined,
                address: String(data.address || data["Địa chỉ"] || ""),
                district: data.district ? String(data.district) : undefined,
                contactName: data.contactName ? String(data.contactName) : undefined,
                contactPhone: data.contactPhone ? String(data.contactPhone) : undefined,
                contactEmail: data.contactEmail ? String(data.contactEmail) : undefined,
                taxCode: data.taxCode ? String(data.taxCode) : undefined,
                updatedAt: new Date(),
              },
            });

            result.merged++;
            result.mergedIds.push(row.duplicateInfo.matchId);

            // Log merge action
            await tx.activityLog.create({
              data: {
                userId,
                action: "IMPORT_MERGE",
                entityType: "Customer",
                entityId: row.duplicateInfo.matchId,
                description: `Merged import row #${row.rowIndex} into existing customer`,
                newValues: { batchId, rowIndex: row.rowIndex },
              },
            });
          } else {
            // New: Create record
            const code = await generateCustomerCode(tx);

            const customer = await tx.customer.create({
              data: {
                code,
                companyName: String(data.companyName || ""),
                companyNameNorm: normalizeVietnamese(String(data.companyName || "")),
                shortName: data.shortName ? String(data.shortName) : null,
                address: String(data.address || data["Địa chỉ"] || ""),
                district: data.district ? String(data.district) : null,
                contactName: data.contactName ? String(data.contactName) : null,
                contactPhone: data.contactPhone ? String(data.contactPhone) : null,
                contactEmail: data.contactEmail ? String(data.contactEmail) : null,
                taxCode: data.taxCode ? String(data.taxCode) : null,
                status: "LEAD",
                businessType: data.businessType ? String(data.businessType) : null,
              },
            });

            result.imported++;
            result.createdIds.push(customer.id);

            // Log create action
            await tx.activityLog.create({
              data: {
                userId,
                action: "IMPORT_CREATE",
                entityType: "Customer",
                entityId: customer.id,
                description: `Created customer from import row #${row.rowIndex}`,
                newValues: { batchId, rowIndex: row.rowIndex, code },
              },
            });
          }
        } catch (error) {
          result.errors.push({
            rowIndex: row.rowIndex,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      // Log batch summary
      await tx.activityLog.create({
        data: {
          userId,
          action: "IMPORT_BATCH",
          entityType: "Customer",
          description: `Import batch completed: ${result.imported} created, ${result.merged} merged`,
          newValues: {
            batchId,
            totalRows: approvedRows.length,
            imported: result.imported,
            merged: result.merged,
            errors: result.errors.length,
          },
        },
      });
    });

    result.success = true;
    result.skipped = rows.length - approvedRows.length;
  } catch (error) {
    result.errors.push({
      rowIndex: 0,
      error: `Transaction failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    });
  }

  return result;
}

/**
 * Generate next customer code (KH-0001, KH-0002, etc.)
 */
async function generateCustomerCode(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
): Promise<string> {
  const lastCustomer = await tx.customer.findFirst({
    where: { code: { startsWith: "KH-" } },
    orderBy: { code: "desc" },
    select: { code: true },
  });

  if (!lastCustomer) {
    return "KH-0001";
  }

  const lastNumber = parseInt(lastCustomer.code.replace("KH-", ""), 10);
  const nextNumber = lastNumber + 1;
  return `KH-${String(nextNumber).padStart(4, "0")}`;
}

/**
 * Rollback import batch
 */
export async function rollbackImport(
  batchId: string,
  userId: string
): Promise<{ success: boolean; deleted: number; reverted: number }> {
  // Get all activity logs for this batch
  const logs = await prisma.activityLog.findMany({
    where: {
      action: { in: ["IMPORT_CREATE", "IMPORT_MERGE"] },
    },
  });

  // Filter by batchId from newValues JSON
  const batchLogs = logs.filter((log) => {
    const newValues = log.newValues as Record<string, unknown> | null;
    return newValues?.batchId === batchId;
  });

  const createdIds = batchLogs
    .filter((l) => l.action === "IMPORT_CREATE")
    .map((l) => l.entityId)
    .filter((id): id is string => id !== null);

  // Delete created records
  const deleted = await prisma.customer.deleteMany({
    where: { id: { in: createdIds } },
  });

  // Log rollback
  await prisma.activityLog.create({
    data: {
      userId,
      action: "IMPORT_ROLLBACK",
      entityType: "Customer",
      description: `Rolled back import batch ${batchId}: ${deleted.count} deleted`,
      newValues: { batchId, deletedIds: createdIds },
    },
  });

  return {
    success: true,
    deleted: deleted.count,
    reverted: 0, // Merge rollback not implemented
  };
}
