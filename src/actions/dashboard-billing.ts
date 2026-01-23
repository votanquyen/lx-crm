"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { unstable_cache } from "next/cache";
import { CACHE_TTL } from "@/lib/constants";

/**
 * Get core financial KPIs for the dashboard
 * Cached for 5 minutes
 */
export async function getFinancialKPIs() {
  await requireAuth();

  return unstable_cache(
    async () => {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // Parallel execution for all independent queries (Vercel React Best Practices)
      const [paidThisMonth, paidLastMonth, receivables, currentPeriodStatements, currentPeriodInvoiced] =
        await Promise.all([
          // 1. Cash In Hand (Paid this month)
          prisma.payment.aggregate({
            _sum: { amount: true },
            where: {
              paymentDate: { gte: firstDayOfMonth },
            },
          }),
          // 2. Paid last month (for trend comparison)
          prisma.payment.aggregate({
            _sum: { amount: true },
            where: {
              paymentDate: { gte: lastMonthStart, lte: lastMonthEnd },
            },
          }),
          // 3. Accounts Receivable (Total Outstanding from Sent/Partial/Overdue)
          prisma.invoice.aggregate({
            _sum: { outstandingAmount: true },
            where: {
              status: { in: ["SENT", "PARTIAL", "OVERDUE"] },
            },
          }),
          // 4. Unbilled Work - Current period statements
          prisma.monthlyStatement.aggregate({
            _sum: { total: true },
            where: {
              year: now.getFullYear(),
              month: now.getMonth() + 1,
            },
          }),
          // 5. Current period invoiced
          prisma.invoice.aggregate({
            _sum: { totalAmount: true },
            where: {
              issueDate: { gte: firstDayOfMonth },
              status: { not: "CANCELLED" },
            },
          }),
        ]);

      // Rough approximation of Unbilled = Total Statements Value - Total Invoices Created This Month
      // If negative, it means we invoiced more than statements (e.g. quarterly) - clamp to 0 or handle logic
      let unbilledValue =
        Number(currentPeriodStatements._sum.total || 0) -
        Number(currentPeriodInvoiced._sum.totalAmount || 0);
      if (unbilledValue < 0) unbilledValue = 0; // Conservative

      return {
        cashInHand: {
          value: Number(paidThisMonth._sum.amount || 0),
          trend:
            Number(paidThisMonth._sum.amount || 0) >= Number(paidLastMonth._sum.amount || 0)
              ? "up"
              : "down",
          diff: Math.abs(
            Number(paidThisMonth._sum.amount || 0) - Number(paidLastMonth._sum.amount || 0)
          ),
        },
        receivables: {
          value: Number(receivables._sum.outstandingAmount || 0),
          count: 0, // Will fetch in detail query if needed
        },
        unbilled: {
          value: unbilledValue,
        },
      };
    },
    ["dashboard-financial-kpis"],
    { revalidate: CACHE_TTL.STATS }
  )();
}

/**
 * Get actionable items for the Billing Center
 * - Pending Statements (Ready to Bill)
 * - Overdue Invoices (Need Collection)
 */
export async function getBillingActionItems() {
  await requireAuth();

  const now = new Date();

  const [pendingStatements, overdueInvoices, draftInvoices] = await Promise.all([
    // 1. Statements that are Confirmed but likely not billed (just recent confirmed ones)
    // Actually, user wants "Pending Statements" -> maybe "Needs Confirmation" is the first step of billing?
    // "1 bang ke = 1 hoa don VAT" logic.
    // Let's fetch Statements that NEED confirmation (Step 1) AND Confirmed ones (Step 2 - Ready to Bill)
    prisma.monthlyStatement.findMany({
      where: {
        OR: [
          { needsConfirmation: true }, // Needs Review
          {
            needsConfirmation: false,
            updatedAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }, // Confirmed recently (last 7 days)
          },
        ],
      },
      take: 5,
      orderBy: { updatedAt: "desc" },
      include: { customer: { select: { id: true, companyName: true, code: true } } },
    }),

    // 2. Overdue Invoices
    prisma.invoice.findMany({
      where: {
        status: { in: ["SENT", "PARTIAL", "OVERDUE"] },
        dueDate: { lt: now },
      },
      take: 5,
      orderBy: { dueDate: "asc" }, // Oldest first
      include: {
        customer: { select: { id: true, companyName: true, contactPhone: true } },
        _count: { select: { payments: true } },
      },
    }),

    // 3. Draft Invoices (Created but not sent)
    prisma.invoice.findMany({
      where: { status: "DRAFT" },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { customer: { select: { id: true, companyName: true } } },
    }),
  ]);

  return {
    pendingStatements: pendingStatements.map((s) => ({
      id: s.id,
      type: "STATEMENT",
      customer: s.customer.companyName,
      customerId: s.customer.id,
      amount: Number(s.total),
      date: s.updatedAt,
      status: s.needsConfirmation ? "NEEDS_REVIEW" : "READY_TO_BILL",
      period: `${s.month}/${s.year}`,
    })),
    overdueInvoices: overdueInvoices.map((i) => ({
      id: i.id,
      type: "INVOICE_OVERDUE",
      customer: i.customer.companyName,
      customerId: i.customer.id,
      amount: Number(i.outstandingAmount),
      date: i.dueDate,
      invoiceNumber: i.invoiceNumber,
      phone: i.customer.contactPhone,
    })),
    draftInvoices: draftInvoices.map((i) => ({
      id: i.id,
      type: "INVOICE_DRAFT",
      customer: i.customer.companyName,
      customerId: i.customer.id,
      amount: Number(i.totalAmount),
      date: i.createdAt,
      invoiceNumber: i.invoiceNumber,
    })),
  };
}
