"use server";

import { createAction, createSimpleAction } from "@/lib/action-utils";
import { prisma } from "@/lib/prisma";
import {
  createExpenseSchema,
  updateExpenseSchema,
  deleteExpenseSchema,
  getExpenseSchema,
  getExpensesSchema,
  getQuarterlyReportSchema,
} from "@/lib/validations/expense";
import { getQuarterFromDate } from "@/types/expense";
import type { ExpenseDTO, ExpenseListItem, QuarterlyReportData } from "@/types/expense";
import { Prisma, ExpenseCategory } from "@prisma/client";
import { revalidatePath } from "next/cache";

/**
 * Get list of expenses with filters
 */
export const getExpenses = createAction(getExpensesSchema, async (input) => {
  const { year, quarter, companyName, category, limit, offset } = input;

  const where: Prisma.ExpenseInvoiceWhereInput = {};

  if (year) where.year = year;
  if (quarter) where.quarter = quarter;
  if (companyName) {
    where.companyName = { contains: companyName, mode: "insensitive" };
  }
  if (category) where.category = category;

  const [expenses, total] = await Promise.all([
    prisma.expenseInvoice.findMany({
      where,
      orderBy: [{ invoiceDate: "desc" }],
      take: limit,
      skip: offset,
    }),
    prisma.expenseInvoice.count({ where }),
  ]);

  const items: ExpenseListItem[] = expenses.map((exp) => ({
    id: exp.id,
    companyName: exp.companyName,
    invoiceNumber: exp.invoiceNumber,
    invoiceDate: exp.invoiceDate.toISOString(),
    amount: Number(exp.amount),
    category: exp.category,
    quarter: exp.quarter,
    year: exp.year,
  }));

  return {
    items,
    total,
    limit,
    offset,
  };
});

/**
 * Get single expense by ID
 */
export const getExpense = createAction(getExpenseSchema, async ({ id }) => {
  const expense = await prisma.expenseInvoice.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!expense) {
    throw new Error("Không tìm thấy chi phí");
  }

  const dto: ExpenseDTO = {
    id: expense.id,
    companyName: expense.companyName,
    invoiceNumber: expense.invoiceNumber,
    invoiceDate: expense.invoiceDate.toISOString(),
    amount: Number(expense.amount),
    category: expense.category,
    description: expense.description,
    quarter: expense.quarter,
    year: expense.year,
    createdAt: expense.createdAt.toISOString(),
    createdBy: expense.createdBy,
  };

  return dto;
});

/**
 * Create new expense
 */
export const createExpense = createAction(createExpenseSchema, async (input, ctx) => {
  if (!ctx.user) {
    throw new Error("Bạn phải đăng nhập");
  }

  // Only ADMIN, MANAGER, ACCOUNTANT can create expenses
  if (!["ADMIN", "MANAGER", "ACCOUNTANT"].includes(ctx.user.role)) {
    throw new Error("Bạn không có quyền tạo chi phí");
  }

  const { companyName, invoiceNumber, invoiceDate, amount, category, description } = input;

  // Calculate quarter and year from invoiceDate
  const date = new Date(invoiceDate);
  const quarter = getQuarterFromDate(date);
  const year = date.getFullYear();

  const expense = await prisma.expenseInvoice.create({
    data: {
      companyName,
      invoiceNumber,
      invoiceDate: date,
      amount,
      category,
      description,
      quarter,
      year,
      createdById: ctx.user.id,
    },
  });

  revalidatePath("/expenses");

  return {
    id: expense.id,
    message: "Đã tạo chi phí mới",
  };
});

/**
 * Update expense
 */
export const updateExpense = createAction(updateExpenseSchema, async (input, ctx) => {
  if (!ctx.user) {
    throw new Error("Bạn phải đăng nhập");
  }

  if (!["ADMIN", "MANAGER", "ACCOUNTANT"].includes(ctx.user.role)) {
    throw new Error("Bạn không có quyền sửa chi phí");
  }

  const { id, companyName, invoiceNumber, invoiceDate, amount, category, description } = input;

  const existing = await prisma.expenseInvoice.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Không tìm thấy chi phí");
  }

  // Recalculate quarter and year
  const date = new Date(invoiceDate);
  const quarter = getQuarterFromDate(date);
  const year = date.getFullYear();

  const updated = await prisma.expenseInvoice.update({
    where: { id },
    data: {
      companyName,
      invoiceNumber,
      invoiceDate: date,
      amount,
      category,
      description,
      quarter,
      year,
    },
  });

  revalidatePath("/expenses");

  return {
    id: updated.id,
    message: "Đã cập nhật chi phí",
  };
});

/**
 * Delete expense (admin only)
 */
export const deleteExpense = createAction(deleteExpenseSchema, async ({ id }, ctx) => {
  if (!ctx.user) {
    throw new Error("Bạn phải đăng nhập");
  }

  if (ctx.user.role !== "ADMIN") {
    throw new Error("Chỉ Admin mới có quyền xóa chi phí");
  }

  const expense = await prisma.expenseInvoice.findUnique({ where: { id } });
  if (!expense) {
    throw new Error("Không tìm thấy chi phí");
  }

  await prisma.expenseInvoice.delete({ where: { id } });

  revalidatePath("/expenses");

  return {
    message: "Đã xóa chi phí",
  };
});

/**
 * Get quarterly report data
 */
export const getQuarterlyReport = createAction(
  getQuarterlyReportSchema,
  async ({ year, quarter }) => {
    const where: Prisma.ExpenseInvoiceWhereInput = { year };
    if (quarter) where.quarter = quarter;

    const expenses = await prisma.expenseInvoice.findMany({
      where,
      select: {
        amount: true,
        category: true,
        quarter: true,
      },
    });

    // Group by quarter
    const quarterData = new Map<number, QuarterlyReportData>();

    for (const exp of expenses) {
      const q = exp.quarter;
      if (!quarterData.has(q)) {
        quarterData.set(q, {
          year,
          quarter: q,
          total: 0,
          byCategory: {},
          count: 0,
        });
      }

      const data = quarterData.get(q)!;
      const amount = Number(exp.amount);
      data.total += amount;
      data.count += 1;

      const cat = exp.category || "OTHER";
      data.byCategory[cat] = (data.byCategory[cat] || 0) + amount;
    }

    // Convert to array sorted by quarter
    const reports = Array.from(quarterData.values()).sort((a, b) => a.quarter - b.quarter);

    // Calculate year total
    const yearTotal = reports.reduce((sum, r) => sum + r.total, 0);
    const yearCount = reports.reduce((sum, r) => sum + r.count, 0);

    return {
      year,
      reports,
      yearTotal,
      yearCount,
    };
  }
);

/**
 * Get expense categories for dropdown
 */
export const getExpenseCategories = createSimpleAction(async () => {
  const categories: Array<{ value: ExpenseCategory; label: string }> = [
    { value: "PURCHASE_PLANT", label: "Mua cây mới" },
    { value: "PURCHASE_POT", label: "Mua chậu" },
    { value: "MATERIALS", label: "Phân bón, đất, thuốc" },
    { value: "LOGISTICS", label: "Xăng xe, vận chuyển" },
    { value: "STAFF_COST", label: "Lương, phụ cấp" },
    { value: "OFFICE_UTILITIES", label: "Điện, nước, mặt bằng" },
    { value: "MARKETING", label: "Quảng cáo" },
    { value: "OTHER", label: "Khác" },
  ];

  return categories;
});
