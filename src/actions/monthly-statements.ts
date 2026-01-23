"use server";

import { createAction, createSimpleAction } from "@/lib/action-utils";
import { VAT_RATE } from "@/lib/constants/billing";
import {
  AppError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { createId } from "@paralleldrive/cuid2";
import {
  calculateStatementPeriod,
  getPreviousMonth,
  recalculateStatementAmounts,
} from "@/lib/statement-utils";
import {
  createMonthlyStatementSchema,
  updateMonthlyStatementSchema,
  confirmMonthlyStatementSchema,
  deleteMonthlyStatementSchema,
  restoreMonthlyStatementSchema,
  getMonthlyStatementSchema,
  getMonthlyStatementsSchema,
  autoRolloverSchema,
} from "@/lib/validations/monthly-statement";
import type { PlantItem, StatementDTO, StatementListItem } from "@/types/monthly-statement";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

/**
 * Get list of monthly statements with filters
 */
export const getMonthlyStatements = createAction(getMonthlyStatementsSchema, async (input) => {
  const { customerId, year, month, needsConfirmation, limit, offset } = input;

  const where: Prisma.MonthlyStatementWhereInput = {
    deletedAt: null, // Exclude soft-deleted records
  };

  if (customerId) where.customerId = customerId;
  if (year) where.year = year;
  if (month) where.month = month;
  if (needsConfirmation !== undefined) where.needsConfirmation = needsConfirmation;

  const [statements, total] = await Promise.all([
    prisma.monthlyStatement.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            code: true,
            companyName: true,
            shortName: true,
            district: true,
          },
        },
      },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      take: limit,
      skip: offset,
    }),
    prisma.monthlyStatement.count({ where }),
  ]);

  // Convert Decimal to number for frontend
  const items: StatementListItem[] = statements.map((stmt) => ({
    id: stmt.id,
    customerId: stmt.customerId,
    year: stmt.year,
    month: stmt.month,
    total: Number(stmt.total),
    needsConfirmation: stmt.needsConfirmation,
    companyName: stmt.customer.companyName,
    shortName: stmt.customer.shortName,
    district: stmt.customer.district,
    plantCount: Array.isArray(stmt.plants) ? stmt.plants.length : 0,
  }));

  return {
    items,
    total,
    limit,
    offset,
  };
});

/**
 * Get single monthly statement by ID
 */
export const getMonthlyStatement = createAction(getMonthlyStatementSchema, async ({ id }) => {
  const statement = await prisma.monthlyStatement.findUnique({
    where: { id },
    include: {
      customer: {
        select: {
          id: true,
          code: true,
          companyName: true,
          shortName: true,
          address: true,
          district: true,
          contactName: true,
          contactPhone: true,
        },
      },
      confirmedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!statement) {
    throw new NotFoundError("Bảng kê");
  }

  // Convert plants and ensure each has an ID
  // Handle both legacy (size, amount) and new (sizeSpec, total) field names
  interface RawPlant {
    id?: string;
    name?: string;
    size?: string;        // Legacy field from SQL import
    sizeSpec?: string;    // New field
    quantity?: number;
    unitPrice?: number;
    amount?: number;      // Legacy field from SQL import
    total?: number;       // New field
  }
  const rawPlants = statement.plants as unknown as RawPlant[];

  // Filter out summary rows (Tổng, Thuế GTGT, VAT, etc.) from legacy SQL import
  const SUMMARY_KEYWORDS = ['tổng', 'thuế gtgt', 'vat', 'thuế', 'gtgt'];
  const filteredPlants = rawPlants.filter((plant) => {
    const name = (plant.name ?? '').toLowerCase().trim();
    // Skip empty names
    if (!name) return false;
    // Skip summary/total rows
    if (SUMMARY_KEYWORDS.some(keyword => name.includes(keyword))) return false;
    // Skip rows with zero or negative quantity
    if ((plant.quantity ?? 0) <= 0) return false;
    return true;
  });

  const plantsWithIds: PlantItem[] = filteredPlants.map((plant) => ({
    id: plant.id ?? createId(),
    name: plant.name ?? "",
    sizeSpec: plant.sizeSpec ?? plant.size ?? "",  // Fallback to size
    quantity: plant.quantity ?? 0,
    unitPrice: plant.unitPrice ?? 0,
    total: plant.total ?? plant.amount ?? 0,       // Fallback to amount
  }));



  // Convert to DTO
  const dto: StatementDTO = {
    id: statement.id,
    customerId: statement.customerId,
    year: statement.year,
    month: statement.month,
    periodStart: statement.periodStart.toISOString(),
    periodEnd: statement.periodEnd.toISOString(),
    contactName: statement.contactName,
    plants: plantsWithIds,
    subtotal: Number(statement.subtotal),
    vatRate: Number(statement.vatRate),
    vatAmount: Number(statement.vatAmount),
    total: Number(statement.total),
    needsConfirmation: statement.needsConfirmation,
    confirmedAt: statement.confirmedAt?.toISOString() ?? null,
    notes: statement.notes,
    internalNotes: statement.internalNotes,
    createdAt: statement.createdAt.toISOString(),
    updatedAt: statement.updatedAt.toISOString(),
    customer: statement.customer,
    confirmedBy: statement.confirmedBy ?? undefined,
  };

  return dto;
});

/**
 * Create new monthly statement (manual or auto-rollover)
 */
export const createMonthlyStatement = createAction(
  createMonthlyStatementSchema,
  async (input, ctx) => {
    // Check authentication
    if (!ctx.user) {
      throw new UnauthorizedError("Bạn phải đăng nhập");
    }

    // Only ADMIN, MANAGER, ACCOUNTANT can create
    if (!["ADMIN", "MANAGER", "ACCOUNTANT"].includes(ctx.user.role)) {
      throw new ForbiddenError("Bạn không có quyền tạo bảng kê");
    }

    const { customerId, year, month, contactName, plants, notes, internalNotes } = input;

    // Check if statement already exists
    const existing = await prisma.monthlyStatement.findUnique({
      where: {
        customerId_year_month: { customerId, year, month },
      },
    });

    if (existing) {
      throw new ConflictError(`Bảng kê cho tháng ${month}/${year} đã tồn tại`);
    }

    // Calculate period dates
    const period = calculateStatementPeriod(year, month);

    // Calculate amounts
    const { subtotal, vatAmount, total } = recalculateStatementAmounts(plants);

    // Create statement
    const statement = await prisma.monthlyStatement.create({
      data: {
        customerId,
        year,
        month,
        periodStart: period.periodStart,
        periodEnd: period.periodEnd,
        contactName,
        plants: plants as unknown as Prisma.InputJsonValue,
        subtotal,
        vatRate: VAT_RATE,
        vatAmount,
        total,
        notes,
        internalNotes,
      },
      include: {
        customer: {
          select: {
            companyName: true,
          },
        },
      },
    });

    revalidatePath("/bang-ke");

    return {
      id: statement.id,
      message: `Đã tạo bảng kê tháng ${month}/${year} cho ${statement.customer.companyName}`,
    };
  }
);

/**
 * Update monthly statement (plants, amounts, notes)
 */
export const updateMonthlyStatement = createAction(
  updateMonthlyStatementSchema,
  async (input, ctx) => {
    // Check authentication
    if (!ctx.user) {
      throw new UnauthorizedError("Bạn phải đăng nhập");
    }

    // Only ADMIN, MANAGER, ACCOUNTANT can update
    if (!["ADMIN", "MANAGER", "ACCOUNTANT"].includes(ctx.user.role)) {
      throw new ForbiddenError("Bạn không có quyền sửa bảng kê");
    }

    const {
      id,
      contactName,
      periodStart,
      periodEnd,
      plants,
      vatRate = 8,
      notes,
      internalNotes,
    } = input;

    // Check if exists and not confirmed
    const existing = await prisma.monthlyStatement.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError("Bảng kê");
    }

    if (!existing.needsConfirmation && existing.confirmedAt) {
      throw new AppError(
        "Không thể sửa bảng kê đã xác nhận. Vui lòng liên hệ quản lý.",
        "STATEMENT_CONFIRMED"
      );
    }

    // Recalculate amounts with custom VAT rate
    const { subtotal, vatAmount, total } = recalculateStatementAmounts(plants, vatRate);

    // Update
    const updated = await prisma.monthlyStatement.update({
      where: { id },
      data: {
        contactName,
        ...(periodStart && { periodStart: new Date(periodStart) }),
        ...(periodEnd && { periodEnd: new Date(periodEnd) }),
        plants: plants as unknown as Prisma.InputJsonValue,
        subtotal,
        vatRate,
        vatAmount,
        total,
        notes,
        internalNotes,
      },
    });

    revalidatePath("/bang-ke");

    return {
      id: updated.id,
      message: "Đã cập nhật bảng kê",
    };
  }
);

/**
 * Confirm monthly statement (manager/accountant only)
 */
export const confirmMonthlyStatement = createAction(
  confirmMonthlyStatementSchema,
  async ({ id }, ctx) => {
    if (!ctx.user) {
      throw new UnauthorizedError("Bạn phải đăng nhập để xác nhận bảng kê");
    }

    // Check permissions
    if (!["ADMIN", "MANAGER", "ACCOUNTANT"].includes(ctx.user.role)) {
      throw new ForbiddenError(
        "Bạn không có quyền xác nhận bảng kê. Chỉ Manager/Accountant mới được xác nhận."
      );
    }

    const statement = await prisma.monthlyStatement.findUnique({
      where: { id },
      include: {
        customer: {
          select: { companyName: true },
        },
      },
    });

    if (!statement) {
      throw new NotFoundError("Bảng kê");
    }

    if (!statement.needsConfirmation) {
      throw new AppError("Bảng kê đã được xác nhận trước đó", "ALREADY_CONFIRMED");
    }

    // Confirm
    const confirmed = await prisma.monthlyStatement.update({
      where: { id },
      data: {
        needsConfirmation: false,
        confirmedAt: new Date(),
        confirmedById: ctx.user.id,
      },
    });

    revalidatePath("/bang-ke");

    return {
      id: confirmed.id,
      message: `Đã xác nhận bảng kê tháng ${statement.month}/${statement.year} cho ${statement.customer.companyName}`,
    };
  }
);

/**
 * Soft delete monthly statement (admin/manager only, before confirmation)
 * Marks the statement as deleted without permanently removing it from database
 */
export const deleteMonthlyStatement = createAction(
  deleteMonthlyStatementSchema,
  async ({ id }, ctx) => {
    if (!ctx.user) {
      throw new UnauthorizedError("Bạn phải đăng nhập");
    }

    // ADMIN and MANAGER can soft delete
    if (!["ADMIN", "MANAGER"].includes(ctx.user.role)) {
      throw new ForbiddenError("Chỉ Admin hoặc Manager mới có quyền xóa bảng kê");
    }

    const statement = await prisma.monthlyStatement.findUnique({
      where: { id },
    });

    if (!statement) {
      throw new NotFoundError("Bảng kê");
    }

    // Check if already soft-deleted
    if (statement.deletedAt) {
      throw new AppError("Bảng kê này đã được xóa trước đó", "ALREADY_DELETED");
    }

    if (!statement.needsConfirmation) {
      throw new AppError(
        "Không thể xóa bảng kê đã xác nhận. Vui lòng liên hệ IT support.",
        "STATEMENT_CONFIRMED"
      );
    }

    // Check if there are invoices referencing this statement
    const invoiceCount = await prisma.invoice.count({
      where: { monthlyStatementId: id },
    });

    if (invoiceCount > 0) {
      throw new AppError(
        `Không thể xóa bảng kê vì đã có ${invoiceCount} hóa đơn liên quan. Vui lòng xóa hóa đơn trước.`,
        "HAS_RELATED_INVOICES"
      );
    }

    // Soft delete
    await prisma.monthlyStatement.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: ctx.user.id,
      },
    });

    revalidatePath("/bang-ke");

    return {
      message: `Đã xóa bảng kê tháng ${statement.month}/${statement.year}. Bạn có thể khôi phục trong vòng 30 ngày.`,
    };
  }
);

/**
 * Restore soft-deleted monthly statement (admin/manager only)
 * Reverses the soft delete operation within 30-day grace period
 */
export const restoreMonthlyStatement = createAction(
  restoreMonthlyStatementSchema,
  async ({ id }, ctx) => {
    if (!ctx.user) {
      throw new UnauthorizedError("Bạn phải đăng nhập");
    }

    // ADMIN and MANAGER can restore
    if (!["ADMIN", "MANAGER"].includes(ctx.user.role)) {
      throw new ForbiddenError("Chỉ Admin hoặc Manager mới có quyền khôi phục bảng kê");
    }

    const statement = await prisma.monthlyStatement.findUnique({
      where: { id },
    });

    if (!statement) {
      throw new NotFoundError("Bảng kê");
    }

    if (!statement.deletedAt) {
      throw new AppError("Bảng kê này chưa bị xóa", "NOT_DELETED");
    }

    // Check 30-day grace period
    const daysSinceDeleted = Math.floor(
      (Date.now() - statement.deletedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceDeleted > 30) {
      throw new AppError(
        "Không thể khôi phục bảng kê đã bị xóa quá 30 ngày. Vui lòng liên hệ IT support.",
        "GRACE_PERIOD_EXPIRED"
      );
    }

    // Restore (clear soft delete fields)
    await prisma.monthlyStatement.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedById: null,
      },
    });

    revalidatePath("/bang-ke");

    return {
      message: `Đã khôi phục bảng kê tháng ${statement.month}/${statement.year}`,
    };
  }
);

/**
 * Auto-rollover: Create statements for new month from previous month
 * Triggered by cron job or manual button
 */
export const autoRolloverStatements = createAction(
  autoRolloverSchema,
  async ({ targetYear, targetMonth, customerIds }, ctx) => {
    // Check authentication - auto-rollover should be restricted to ADMIN
    if (!ctx.user) {
      throw new UnauthorizedError("Bạn phải đăng nhập");
    }

    // Allow ADMIN, MANAGER, ACCOUNTANT to auto-rollover statements
    if (!["ADMIN", "MANAGER", "ACCOUNTANT"].includes(ctx.user.role)) {
      throw new ForbiddenError("Bạn không có quyền tự động tạo bảng kê");
    }

    // Get previous month
    const { year: prevYear, month: prevMonth } = getPreviousMonth(targetYear, targetMonth);

    // Get customers to rollover
    const customerFilter: Prisma.MonthlyStatementWhereInput = {
      year: prevYear,
      month: prevMonth,
      deletedAt: null, // Exclude soft-deleted statements
    };

    if (customerIds && customerIds.length > 0) {
      customerFilter.customerId = { in: customerIds };
    }

    const previousStatements = await prisma.monthlyStatement.findMany({
      where: customerFilter,
      include: {
        customer: {
          select: {
            id: true,
            contactName: true,
            accountingName: true, // Prefer for billing statements
          },
        },
      },
    });

    if (previousStatements.length === 0) {
      return {
        created: 0,
        message: `Không tìm thấy bảng kê tháng ${prevMonth}/${prevYear} để rollover`,
      };
    }

    // Calculate new period
    const newPeriod = calculateStatementPeriod(targetYear, targetMonth);

    // Pre-fetch all existing statements for target period in one query (N+1 fix)
    const existingStatements = await prisma.monthlyStatement.findMany({
      where: {
        customerId: { in: previousStatements.map((s) => s.customerId) },
        year: targetYear,
        month: targetMonth,
        deletedAt: null, // Exclude soft-deleted statements
      },
      select: { customerId: true },
    });
    const existingCustomerIds = new Set(existingStatements.map((s) => s.customerId));

    // Filter out already existing statements
    const statementsToCreate = previousStatements.filter(
      (prevStmt) => !existingCustomerIds.has(prevStmt.customerId)
    );
    const skippedCount = previousStatements.length - statementsToCreate.length;

    // Batch create new statements
    if (statementsToCreate.length > 0) {
      await prisma.monthlyStatement.createMany({
        data: statementsToCreate.map((prevStmt) => ({
          customerId: prevStmt.customerId,
          year: targetYear,
          month: targetMonth,
          periodStart: newPeriod.periodStart,
          periodEnd: newPeriod.periodEnd,
          contactName:
            prevStmt.contactName ??
            prevStmt.customer.accountingName ??
            prevStmt.customer.contactName,
          plants: prevStmt.plants as Prisma.InputJsonValue,
          subtotal: prevStmt.subtotal,
          vatRate: VAT_RATE,
          vatAmount: prevStmt.vatAmount,
          total: prevStmt.total,
          needsConfirmation: true,
          copiedFromId: prevStmt.id,
        })),
        skipDuplicates: true, // Extra safety for race conditions
      });
    }

    revalidatePath("/bang-ke");

    return {
      created: statementsToCreate.length,
      skipped: skippedCount,
      message: `Đã tạo ${statementsToCreate.length} bảng kê mới cho tháng ${targetMonth}/${targetYear}. Bỏ qua ${skippedCount} bảng kê đã tồn tại.`,
    };
  }
);

/**
 * Get customers with active contracts for dropdown
 */
export const getCustomersForStatements = createSimpleAction(async () => {
  const customers = await prisma.customer.findMany({
    where: {
      // Include both ACTIVE and LEAD customers (LEAD is default status for new customers)
      status: { in: ["ACTIVE", "LEAD"] },
      // Note: Customer model doesn't have deletedAt, no need to filter
    },
    select: {
      id: true,
      code: true,
      companyName: true,
      shortName: true,
      address: true,
      district: true,
      address: true,
      contactName: true,
      accountingName: true, // For billing - prefer over contactName
    },
    orderBy: {
      companyName: "asc",
    },
  });

  return customers;
});

/**
 * Get statements needing confirmation count
 */
export const getUnconfirmedCount = createSimpleAction(async () => {
  const count = await prisma.monthlyStatement.count({
    where: {
      needsConfirmation: true,
      deletedAt: null, // Exclude soft-deleted statements
    },
  });

  return count;
});

/**
 * Get available year-months that have statement records
 * Returns distinct year-month combinations with record counts
 */
export const getAvailableYearMonths = createSimpleAction(async () => {
  const results = await prisma.monthlyStatement.groupBy({
    by: ["year", "month"],
    where: {
      deletedAt: null, // Exclude soft-deleted statements
    },
    _count: {
      id: true,
    },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });

  return results.map((r) => ({
    year: r.year,
    month: r.month,
    count: r._count.id,
  }));
});

/**
 * Get soft-deleted monthly statements (within 30-day grace period)
 * Similar to getMonthlyStatements but filters for deletedAt IS NOT NULL
 */
export const getDeletedMonthlyStatements = createAction(
  getMonthlyStatementsSchema,
  async (input, ctx) => {
    // Only ADMIN and MANAGER can view deleted statements
    if (!ctx.user || !["ADMIN", "MANAGER"].includes(ctx.user.role)) {
      throw new ForbiddenError("Chỉ Admin hoặc Manager mới có quyền xem bảng kê đã xóa");
    }

    const { customerId, year, month, limit, offset } = input;

    const where: Prisma.MonthlyStatementWhereInput = {
      deletedAt: { not: null }, // Only soft-deleted records
    };

    if (customerId) where.customerId = customerId;
    if (year) where.year = year;
    if (month) where.month = month;

    const [statements, total] = await Promise.all([
      prisma.monthlyStatement.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              code: true,
              companyName: true,
              shortName: true,
              district: true,
            },
          },
          deletedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: [{ deletedAt: "desc" }, { year: "desc" }, { month: "desc" }],
        take: limit,
        skip: offset,
      }),
      prisma.monthlyStatement.count({ where }),
    ]);

    // Calculate days since deletion and if restore is allowed
    const now = new Date();
    const itemsWithMeta = statements.map((stmt) => {
      const daysSinceDeleted = stmt.deletedAt
        ? Math.floor((now.getTime() - stmt.deletedAt.getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      const canRestore = daysSinceDeleted <= 30;

      return {
        ...stmt,
        daysSinceDeleted,
        canRestore,
      };
    });

    return {
      items: itemsWithMeta,
      total,
      limit,
      offset,
    };
  }
);
