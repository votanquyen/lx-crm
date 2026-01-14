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
  getMonthlyStatementSchema,
  getMonthlyStatementsSchema,
  autoRolloverSchema,
} from "@/lib/validations/monthly-statement";
import type {
  PlantItem,
  StatementDTO,
  StatementListItem,
} from "@/types/monthly-statement";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

/**
 * Get list of monthly statements with filters
 */
export const getMonthlyStatements = createAction(
  getMonthlyStatementsSchema,
  async (input) => {
    const { customerId, year, month, needsConfirmation, limit, offset } =
      input;

    const where: Prisma.MonthlyStatementWhereInput = {};

    if (customerId) where.customerId = customerId;
    if (year) where.year = year;
    if (month) where.month = month;
    if (needsConfirmation !== undefined)
      where.needsConfirmation = needsConfirmation;

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
  }
);

/**
 * Get single monthly statement by ID
 */
export const getMonthlyStatement = createAction(
  getMonthlyStatementSchema,
  async ({ id }) => {
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

    // Convert to DTO
    const dto: StatementDTO = {
      id: statement.id,
      customerId: statement.customerId,
      year: statement.year,
      month: statement.month,
      periodStart: statement.periodStart.toISOString(),
      periodEnd: statement.periodEnd.toISOString(),
      contactName: statement.contactName,
      plants: statement.plants as unknown as PlantItem[],
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
  }
);

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

    const { customerId, year, month, contactName, plants, notes, internalNotes } =
      input;

    // Check if statement already exists
    const existing = await prisma.monthlyStatement.findUnique({
      where: {
        customerId_year_month: { customerId, year, month },
      },
    });

    if (existing) {
      throw new ConflictError(
        `Bảng kê cho tháng ${month}/${year} đã tồn tại`
      );
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

    const { id, contactName, plants, notes, internalNotes } = input;

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

    // Recalculate amounts
    const { subtotal, vatAmount, total } = recalculateStatementAmounts(plants);

    // Update
    const updated = await prisma.monthlyStatement.update({
      where: { id },
      data: {
        contactName,
        plants: plants as unknown as Prisma.InputJsonValue,
        subtotal,
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
 * Delete monthly statement (admin only, before confirmation)
 */
export const deleteMonthlyStatement = createAction(
  deleteMonthlyStatementSchema,
  async ({ id }, ctx) => {
    if (!ctx.user) {
      throw new UnauthorizedError("Bạn phải đăng nhập");
    }

    // Only ADMIN can delete
    if (ctx.user.role !== "ADMIN") {
      throw new ForbiddenError("Chỉ Admin mới có quyền xóa bảng kê");
    }

    const statement = await prisma.monthlyStatement.findUnique({
      where: { id },
    });

    if (!statement) {
      throw new NotFoundError("Bảng kê");
    }

    if (!statement.needsConfirmation) {
      throw new AppError(
        "Không thể xóa bảng kê đã xác nhận. Vui lòng liên hệ IT support.",
        "STATEMENT_CONFIRMED"
      );
    }

    await prisma.monthlyStatement.delete({
      where: { id },
    });

    revalidatePath("/bang-ke");

    return {
      message: `Đã xóa bảng kê tháng ${statement.month}/${statement.year}`,
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
    const { year: prevYear, month: prevMonth} = getPreviousMonth(
      targetYear,
      targetMonth
    );

    // Get customers to rollover
    const customerFilter: Prisma.MonthlyStatementWhereInput = {
      year: prevYear,
      month: prevMonth,
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

    // Create new statements
    const created: string[] = [];
    const skipped: string[] = [];

    for (const prevStmt of previousStatements) {
      // Check if already exists
      const existing = await prisma.monthlyStatement.findUnique({
        where: {
          customerId_year_month: {
            customerId: prevStmt.customerId,
            year: targetYear,
            month: targetMonth,
          },
        },
      });

      if (existing) {
        skipped.push(prevStmt.customer.id);
        continue;
      }

      // Create new statement from previous
      const newStatement = await prisma.monthlyStatement.create({
        data: {
          customerId: prevStmt.customerId,
          year: targetYear,
          month: targetMonth,
          periodStart: newPeriod.periodStart,
          periodEnd: newPeriod.periodEnd,
          contactName: prevStmt.contactName ?? prevStmt.customer.contactName,
          plants: prevStmt.plants as Prisma.InputJsonValue, // Copy plants from previous month
          subtotal: prevStmt.subtotal,
          vatRate: VAT_RATE,
          vatAmount: prevStmt.vatAmount,
          total: prevStmt.total,
          needsConfirmation: true, // Require confirmation
          copiedFromId: prevStmt.id,
        },
      });

      created.push(newStatement.id);
    }

    revalidatePath("/bang-ke");

    return {
      created: created.length,
      skipped: skipped.length,
      message: `Đã tạo ${created.length} bảng kê mới cho tháng ${targetMonth}/${targetYear}. Bỏ qua ${skipped.length} bảng kê đã tồn tại.`,
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
    },
    select: {
      id: true,
      code: true,
      companyName: true,
      shortName: true,
      district: true,
      contactName: true,
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
    },
  });

  return count;
});
