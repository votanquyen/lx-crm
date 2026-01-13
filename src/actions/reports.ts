/**
 * Reports & Analytics Server Actions
 * Provides business intelligence and insights from operational data
 */
"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/action-utils";
import { startOfMonth, endOfMonth, subMonths, format, differenceInDays } from "date-fns";
import { unstable_cache } from "next/cache";
import { requireRateLimit } from "@/lib/rate-limit";
import { RATE_LIMITS, CACHE_TTL } from "@/lib/constants";

// ============================================================
// REVENUE ANALYTICS
// ============================================================

/**
 * Get comprehensive revenue overview
 * Cached for 5 minutes to improve performance
 */
const getCachedRevenueOverview = unstable_cache(
  async () => {
    const now = new Date();
    const startOfThisMonth = startOfMonth(now);
    const startOfThisYear = new Date(now.getFullYear(), 0, 1);

    // Total revenue (all-time from paid/partial invoices)
    const totalRevenue = await prisma.invoice.aggregate({
      where: {
        status: { in: ["PAID", "PARTIAL"] },
      },
      _sum: { totalAmount: true },
    });

    // Year-to-date revenue
    const ytdRevenue = await prisma.invoice.aggregate({
      where: {
        status: { in: ["PAID", "PARTIAL"] },
        issueDate: { gte: startOfThisYear },
      },
      _sum: { totalAmount: true },
    });

    // Month-to-date revenue
    const mtdRevenue = await prisma.invoice.aggregate({
      where: {
        status: { in: ["PAID", "PARTIAL"] },
        issueDate: { gte: startOfThisMonth },
      },
      _sum: { totalAmount: true },
    });

    // Previous month revenue for growth calculation
    const startOfLastMonth = startOfMonth(subMonths(now, 1));
    const endOfLastMonth = endOfMonth(subMonths(now, 1));

    const lastMonthRevenue = await prisma.invoice.aggregate({
      where: {
        status: { in: ["PAID", "PARTIAL"] },
        issueDate: {
          gte: startOfLastMonth,
          lte: endOfLastMonth,
        },
      },
      _sum: { totalAmount: true },
    });

    // Calculate growth rate
    const lastMonthTotal = Number(lastMonthRevenue._sum.totalAmount || 0);
    const thisMonthTotal = Number(mtdRevenue._sum.totalAmount || 0);
    const revenueGrowth = lastMonthTotal > 0
      ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
      : 0;

    // Average contract value
    const avgContract = await prisma.contract.aggregate({
      where: { status: "ACTIVE" },
      _avg: { monthlyFee: true },
    });

    return {
      totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
      ytdRevenue: Number(ytdRevenue._sum.totalAmount || 0),
      mtdRevenue: Number(mtdRevenue._sum.totalAmount || 0),
      revenueGrowth: Math.round(revenueGrowth * 10) / 10,
      avgContractValue: Number(avgContract._avg.monthlyFee || 0),
    };
  },
  ['revenue-overview'],
  { revalidate: CACHE_TTL.HEAVY_QUERY }
);

export async function getRevenueOverview() {
  await requireUser();
  await requireRateLimit("report-revenue", {
    max: RATE_LIMITS.REPORT.limit,
    windowMs: RATE_LIMITS.REPORT.window * 1000,
  });
  return getCachedRevenueOverview();
}

/**
 * Get monthly revenue for the last 12 months (for charts)
 * Optimized: Uses SQL DATE_TRUNC for grouping instead of JS processing
 * Cached for 5 minutes
 */
const getCachedMonthlyRevenue = unstable_cache(
  async () => {
    // Use SQL for efficient grouping instead of fetching all invoices
    const monthlyData = await prisma.$queryRaw<Array<{
      month: Date;
      amount: string | null;
    }>>`
      SELECT
        DATE_TRUNC('month', i."issueDate") as month,
        SUM(i."totalAmount") as amount
      FROM invoices i
      WHERE i.status IN ('PAID', 'PARTIAL')
        AND i."issueDate" >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', i."issueDate")
      ORDER BY month ASC
    `;

    // Initialize all 12 months with 0
    const now = new Date();
    const result: Array<{ month: string; monthKey: string; amount: number }> = [];

    for (let i = 11; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthKey = format(monthDate, "yyyy-MM");
      const monthLabel = format(monthDate, "MMM yyyy");

      // Find matching data from SQL result
      const matchingData = monthlyData.find(d => {
        const dataKey = format(new Date(d.month), "yyyy-MM");
        return dataKey === monthKey;
      });

      result.push({
        month: monthLabel,
        monthKey,
        amount: Number(matchingData?.amount || 0),
      });
    }

    return result;
  },
  ['monthly-revenue'],
  { revalidate: CACHE_TTL.HEAVY_QUERY }
);

export async function getMonthlyRevenue() {
  await requireUser();
  await requireRateLimit("report-monthly", {
    max: RATE_LIMITS.REPORT.limit,
    windowMs: RATE_LIMITS.REPORT.window * 1000,
  });
  return getCachedMonthlyRevenue();
}

/**
 * Get revenue by payment method
 * Cached for 5 minutes
 */
const getCachedRevenueByPaymentMethod = unstable_cache(
  async () => {
    const paymentStats = await prisma.payment.groupBy({
      by: ["paymentMethod"],
      _sum: { amount: true },
      _count: true,
    });

    return paymentStats.map((stat) => ({
      method: stat.paymentMethod,
      amount: Number(stat._sum.amount || 0),
      count: stat._count,
    }));
  },
  ['revenue-by-payment'],
  { revalidate: CACHE_TTL.HEAVY_QUERY }
);

export async function getRevenueByPaymentMethod() {
  await requireUser();
  await requireRateLimit("report-payment-method", {
    max: RATE_LIMITS.REPORT.limit,
    windowMs: RATE_LIMITS.REPORT.window * 1000,
  });
  return getCachedRevenueByPaymentMethod();
}

// ============================================================
// INVOICE ANALYTICS
// ============================================================

/**
 * Get invoice analytics overview
 * Cached for 5 minutes
 */
const getCachedInvoiceAnalytics = unstable_cache(
  async () => {
    // Outstanding invoices (sent but not fully paid)
    const outstanding = await prisma.invoice.aggregate({
      where: {
        status: { in: ["SENT", "PARTIAL", "OVERDUE"] },
      },
      _sum: { totalAmount: true },
      _count: true,
    });

    // Overdue invoices
    const overdue = await prisma.invoice.aggregate({
      where: {
        status: "OVERDUE",
      },
      _sum: { totalAmount: true },
      _count: true,
    });

    // Collection rate (paid amount / total issued)
    const totalIssued = await prisma.invoice.aggregate({
      _sum: { totalAmount: true },
    });

    const totalPaid = await prisma.payment.aggregate({
      where: { isVerified: true },
      _sum: { amount: true },
    });

    const collectionRate = Number(totalIssued._sum.totalAmount || 0) > 0
      ? (Number(totalPaid._sum.amount || 0) / Number(totalIssued._sum.totalAmount || 0)) * 100
      : 0;

    // Average days to payment - optimized with SQL aggregate
    // Replaces unbounded findMany that fetched ALL paid invoices
    const avgDaysResult = await prisma.$queryRaw<[{ avg_days: string | null }]>`
      SELECT AVG(EXTRACT(DAY FROM (p."paymentDate" - i."issueDate"))) as avg_days
      FROM invoices i
      JOIN payments p ON p."invoiceId" = i.id
      WHERE i.status = 'PAID'
        AND p."isVerified" = true
    `;

    const avgDaysToPayment = Math.round(Number(avgDaysResult[0]?.avg_days || 0));

    return {
      outstandingAmount: Number(outstanding._sum.totalAmount || 0),
      outstandingCount: outstanding._count,
      overdueAmount: Number(overdue._sum.totalAmount || 0),
      overdueCount: overdue._count,
      collectionRate: Math.round(collectionRate * 10) / 10,
      avgDaysToPayment,
    };
  },
  ['invoice-analytics'],
  { revalidate: CACHE_TTL.HEAVY_QUERY }
);

export async function getInvoiceAnalytics() {
  await requireUser();
  await requireRateLimit("report-invoice-analytics", {
    max: RATE_LIMITS.REPORT.limit,
    windowMs: RATE_LIMITS.REPORT.window * 1000,
  });
  return getCachedInvoiceAnalytics();
}

/**
 * Get invoice aging report
 * Optimized: Single SQL query with FILTER instead of 4 parallel queries
 * Cached for 5 minutes
 */
const getCachedInvoiceAging = unstable_cache(
  async () => {
    // Single SQL query with FILTER for all aging buckets
    const agingData = await prisma.$queryRaw<Array<{
      bucket_0_30_count: bigint;
      bucket_0_30_amount: string | null;
      bucket_31_60_count: bigint;
      bucket_31_60_amount: string | null;
      bucket_61_90_count: bigint;
      bucket_61_90_amount: string | null;
      bucket_90_plus_count: bigint;
      bucket_90_plus_amount: string | null;
    }>>`
      SELECT
        COUNT(*) FILTER (WHERE NOW() - "dueDate" <= INTERVAL '30 days') as bucket_0_30_count,
        COALESCE(SUM("totalAmount") FILTER (WHERE NOW() - "dueDate" <= INTERVAL '30 days'), 0) as bucket_0_30_amount,
        COUNT(*) FILTER (WHERE NOW() - "dueDate" > INTERVAL '30 days' AND NOW() - "dueDate" <= INTERVAL '60 days') as bucket_31_60_count,
        COALESCE(SUM("totalAmount") FILTER (WHERE NOW() - "dueDate" > INTERVAL '30 days' AND NOW() - "dueDate" <= INTERVAL '60 days'), 0) as bucket_31_60_amount,
        COUNT(*) FILTER (WHERE NOW() - "dueDate" > INTERVAL '60 days' AND NOW() - "dueDate" <= INTERVAL '90 days') as bucket_61_90_count,
        COALESCE(SUM("totalAmount") FILTER (WHERE NOW() - "dueDate" > INTERVAL '60 days' AND NOW() - "dueDate" <= INTERVAL '90 days'), 0) as bucket_61_90_amount,
        COUNT(*) FILTER (WHERE NOW() - "dueDate" > INTERVAL '90 days') as bucket_90_plus_count,
        COALESCE(SUM("totalAmount") FILTER (WHERE NOW() - "dueDate" > INTERVAL '90 days'), 0) as bucket_90_plus_amount
      FROM invoices
      WHERE status IN ('SENT', 'PARTIAL', 'OVERDUE')
    `;

    const data = agingData[0];

    // Handle case where no data (empty table)
    if (!data) {
      return [
        { range: "0-30 days", count: 0, amount: 0 },
        { range: "31-60 days", count: 0, amount: 0 },
        { range: "61-90 days", count: 0, amount: 0 },
        { range: "90+ days", count: 0, amount: 0 },
      ];
    }

    return [
      {
        range: "0-30 days",
        count: Number(data.bucket_0_30_count),
        amount: Number(data.bucket_0_30_amount || 0),
      },
      {
        range: "31-60 days",
        count: Number(data.bucket_31_60_count),
        amount: Number(data.bucket_31_60_amount || 0),
      },
      {
        range: "61-90 days",
        count: Number(data.bucket_61_90_count),
        amount: Number(data.bucket_61_90_amount || 0),
      },
      {
        range: "90+ days",
        count: Number(data.bucket_90_plus_count),
        amount: Number(data.bucket_90_plus_amount || 0),
      },
    ];
  },
  ['invoice-aging'],
  { revalidate: CACHE_TTL.HEAVY_QUERY }
);

export async function getInvoiceAging() {
  await requireUser();
  await requireRateLimit("report-invoice-aging", {
    max: RATE_LIMITS.REPORT.limit,
    windowMs: RATE_LIMITS.REPORT.window * 1000,
  });
  return getCachedInvoiceAging();
}

/**
 * Get list of overdue invoices
 * Cached for 1 minute (shorter TTL for time-sensitive data)
 */
const getCachedOverdueInvoicesDefault = unstable_cache(
  async () => {
    const invoices = await prisma.invoice.findMany({
      where: {
        status: "OVERDUE",
      },
      include: {
        customer: {
          select: {
            id: true,
            companyName: true,
            code: true,
            contactEmail: true,
            contactPhone: true,
          },
        },
      },
      orderBy: [
        { dueDate: "asc" },
        { totalAmount: "desc" },
      ],
      take: 10,
    });

    const now = new Date();
    return invoices.map((inv) => ({
      ...inv,
      daysOverdue: differenceInDays(now, inv.dueDate),
    }));
  },
  ['overdue-invoices', 'limit-10'],
  { revalidate: CACHE_TTL.STATS }
);

export async function getOverdueInvoices(limit: number = 10) {
  await requireUser();
  await requireRateLimit("report-overdue", {
    max: RATE_LIMITS.REPORT.limit,
    windowMs: RATE_LIMITS.REPORT.window * 1000,
  });

  // Use pre-cached version for default limit
  if (limit === 10) {
    return getCachedOverdueInvoicesDefault();
  }

  // For custom limits, create dynamic cache
  return unstable_cache(
    async () => {
      const invoices = await prisma.invoice.findMany({
        where: {
          status: "OVERDUE",
        },
        include: {
          customer: {
            select: {
              id: true,
              companyName: true,
              code: true,
              contactEmail: true,
              contactPhone: true,
            },
          },
        },
        orderBy: [
          { dueDate: "asc" },
          { totalAmount: "desc" },
        ],
        take: limit,
      });

      const now = new Date();
      return invoices.map((inv) => ({
        ...inv,
        daysOverdue: differenceInDays(now, inv.dueDate),
      }));
    },
    ['overdue-invoices', `limit-${limit}`],
    { revalidate: CACHE_TTL.STATS }
  )();
}

// ============================================================
// CUSTOMER ANALYTICS
// ============================================================

/**
 * Get customer analytics overview
 * Cached for 5 minutes
 */
const getCachedCustomerAnalytics = unstable_cache(
  async () => {
    const now = new Date();
    const startOfThisMonth = startOfMonth(now);

    // Consolidated customer analytics query (4 queries → 1)
    const stats = await prisma.$queryRaw<[{
      total_active: bigint;
      new_this_month: bigint;
      total_terminated: bigint;
      avg_lifetime_value: string | null;
    }]>`
      SELECT
        COUNT(*) FILTER (WHERE c.status = 'ACTIVE') as total_active,
        COUNT(*) FILTER (WHERE c.status = 'ACTIVE' AND c."createdAt" >= ${startOfThisMonth}) as new_this_month,
        COUNT(*) FILTER (WHERE c.status = 'TERMINATED') as total_terminated,
        (
          SELECT COALESCE(AVG(customer_revenue), 0)::text
          FROM (
            SELECT COALESCE(SUM(i."totalAmount"), 0) as customer_revenue
            FROM customers c2
            LEFT JOIN invoices i ON i."customerId" = c2.id AND i.status IN ('PAID', 'PARTIAL')
            WHERE c2.status = 'ACTIVE'
            GROUP BY c2.id
          ) customer_totals
        ) as avg_lifetime_value
      FROM customers c
    `;

    const totalActive = Number(stats[0].total_active);
    const totalTerminated = Number(stats[0].total_terminated);
    const churnRate = totalActive > 0
      ? (totalTerminated / (totalActive + totalTerminated)) * 100
      : 0;

    return {
      totalActive,
      newThisMonth: Number(stats[0].new_this_month),
      churnRate: Math.round(churnRate * 10) / 10,
      avgLifetimeValue: Math.round(Number(stats[0].avg_lifetime_value || 0)),
    };
  },
  ['customer-analytics'],
  { revalidate: CACHE_TTL.HEAVY_QUERY }
);

export async function getCustomerAnalytics() {
  await requireUser();
  await requireRateLimit("report-customer-analytics", {
    max: RATE_LIMITS.REPORT.limit,
    windowMs: RATE_LIMITS.REPORT.window * 1000,
  });
  return getCachedCustomerAnalytics();
}

/**
 * Get top customers by revenue
 * Cached for 5 minutes (with factory pattern for parameterized limit)
 */
const getCachedTopCustomersDefault = unstable_cache(
  async () => {
    // Use database aggregation instead of fetching all customers
    const customers = await prisma.$queryRaw<Array<{
      id: string;
      company_name: string;
      code: string;
      total_revenue: string | null;
      monthly_fee: string | null;
      invoice_count: bigint;
    }>>`
      SELECT
        c.id,
        c."companyName" as company_name,
        c.code,
        COALESCE(SUM(i."totalAmount"), 0) as total_revenue,
        COALESCE(SUM(ct."monthlyFee"), 0) as monthly_fee,
        COUNT(DISTINCT i.id) as invoice_count
      FROM customers c
      LEFT JOIN invoices i ON i."customerId" = c.id
        AND i.status IN ('PAID', 'PARTIAL')
      LEFT JOIN contracts ct ON ct."customerId" = c.id
        AND ct.status = 'ACTIVE'
      WHERE c.status = 'ACTIVE'
      GROUP BY c.id, c."companyName", c.code
      ORDER BY total_revenue DESC
      LIMIT 10
    `;

    return customers.map(c => ({
      id: c.id,
      companyName: c.company_name,
      code: c.code,
      totalRevenue: Number(c.total_revenue),
      monthlyFee: Number(c.monthly_fee),
      invoiceCount: Number(c.invoice_count),
    }));
  },
  ['top-customers', 'limit-10'],
  { revalidate: CACHE_TTL.HEAVY_QUERY }
);

export async function getTopCustomers(limit: number = 10) {
  await requireUser();
  await requireRateLimit("report-top-customers", {
    max: RATE_LIMITS.REPORT.limit,
    windowMs: RATE_LIMITS.REPORT.window * 1000,
  });

  // Use pre-cached version for default limit
  if (limit === 10) {
    return getCachedTopCustomersDefault();
  }

  // For custom limits, create dynamic cache
  return unstable_cache(
    async () => {
      const customers = await prisma.$queryRaw<Array<{
        id: string;
        company_name: string;
        code: string;
        total_revenue: string | null;
        monthly_fee: string | null;
        invoice_count: bigint;
      }>>`
        SELECT
          c.id,
          c."companyName" as company_name,
          c.code,
          COALESCE(SUM(i."totalAmount"), 0) as total_revenue,
          COALESCE(SUM(ct."monthlyFee"), 0) as monthly_fee,
          COUNT(DISTINCT i.id) as invoice_count
        FROM customers c
        LEFT JOIN invoices i ON i."customerId" = c.id
          AND i.status IN ('PAID', 'PARTIAL')
        LEFT JOIN contracts ct ON ct."customerId" = c.id
          AND ct.status = 'ACTIVE'
        WHERE c.status = 'ACTIVE'
        GROUP BY c.id, c."companyName", c.code
        ORDER BY total_revenue DESC
        LIMIT ${limit}
      `;

      return customers.map(c => ({
        id: c.id,
        companyName: c.company_name,
        code: c.code,
        totalRevenue: Number(c.total_revenue),
        monthlyFee: Number(c.monthly_fee),
        invoiceCount: Number(c.invoice_count),
      }));
    },
    ['top-customers', `limit-${limit}`],
    { revalidate: CACHE_TTL.HEAVY_QUERY }
  )();
}

// ============================================================
// CONTRACT ANALYTICS
// ============================================================

/**
 * Get contract analytics overview
 * Optimized: Uses SQL AVG for duration calculation instead of JS
 * Cached for 5 minutes
 */
const getCachedContractAnalytics = unstable_cache(
  async () => {
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Consolidated contract analytics query (6 queries → 2)
    const [stats, contractsByStatus] = await Promise.all([
      prisma.$queryRaw<[{
        active_count: bigint;
        expiring_soon: bigint;
        expired_count: bigint;
        avg_months: string | null;
      }]>`
        SELECT
          COUNT(*) FILTER (WHERE status = 'ACTIVE') as active_count,
          COUNT(*) FILTER (WHERE status = 'ACTIVE' AND "endDate" >= ${now} AND "endDate" <= ${thirtyDaysLater}) as expiring_soon,
          COUNT(*) FILTER (WHERE status = 'EXPIRED') as expired_count,
          ROUND(AVG(EXTRACT(EPOCH FROM ("endDate" - "startDate")) / (30 * 24 * 60 * 60)) FILTER (WHERE status IN ('ACTIVE', 'EXPIRED'))) as avg_months
        FROM contracts
      `,
      prisma.contract.groupBy({
        by: ["status"],
        _count: true,
      }),
    ]);

    const activeCount = Number(stats[0].active_count);
    const expiredCount = Number(stats[0].expired_count);
    const renewalRate = expiredCount > 0
      ? (activeCount / expiredCount) * 100
      : 0;

    return {
      activeCount,
      expiringSoon: Number(stats[0].expiring_soon),
      avgDuration: Number(stats[0].avg_months || 0),
      renewalRate: Math.round(renewalRate * 10) / 10,
      contractsByStatus: contractsByStatus.map((s) => ({
        status: s.status,
        count: s._count,
      })),
    };
  },
  ['contract-analytics'],
  { revalidate: CACHE_TTL.HEAVY_QUERY }
);

export async function getContractAnalytics() {
  await requireUser();
  await requireRateLimit("report-contract-analytics", {
    max: RATE_LIMITS.REPORT.limit,
    windowMs: RATE_LIMITS.REPORT.window * 1000,
  });
  return getCachedContractAnalytics();
}

/**
 * Get expiring contracts
 * Cached for 5 minutes (with factory pattern for parameterized daysAhead)
 */
const getCachedExpiringContractsDefault = unstable_cache(
  async () => {
    const now = new Date();
    const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const contracts = await prisma.contract.findMany({
      where: {
        status: "ACTIVE",
        endDate: {
          gte: now,
          lte: futureDate,
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            companyName: true,
            code: true,
            contactEmail: true,
            contactPhone: true,
          },
        },
      },
      orderBy: { endDate: "asc" },
    });

    return contracts.map((contract) => ({
      ...contract,
      daysUntilExpiry: differenceInDays(contract.endDate, now),
    }));
  },
  ['expiring-contracts', 'days-30'],
  { revalidate: CACHE_TTL.HEAVY_QUERY }
);

export async function getExpiringContracts(daysAhead: number = 30) {
  await requireUser();
  await requireRateLimit("report-expiring-contracts", {
    max: RATE_LIMITS.REPORT.limit,
    windowMs: RATE_LIMITS.REPORT.window * 1000,
  });

  // Use pre-cached version for default 30 days
  if (daysAhead === 30) {
    return getCachedExpiringContractsDefault();
  }

  // For custom days, create dynamic cache
  return unstable_cache(
    async () => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

      const contracts = await prisma.contract.findMany({
        where: {
          status: "ACTIVE",
          endDate: {
            gte: now,
            lte: futureDate,
          },
        },
        include: {
          customer: {
            select: {
              id: true,
              companyName: true,
              code: true,
              contactEmail: true,
              contactPhone: true,
            },
          },
        },
        orderBy: { endDate: "asc" },
      });

      return contracts.map((contract) => ({
        ...contract,
        daysUntilExpiry: differenceInDays(contract.endDate, now),
      }));
    },
    ['expiring-contracts', `days-${daysAhead}`],
    { revalidate: CACHE_TTL.HEAVY_QUERY }
  )();
}

// ============================================================
// PLANT ANALYTICS
// ============================================================

/**
 * Get plant rental analytics
 * Optimized: Batch query for plant types instead of N+1 sequential queries
 * Cached for 5 minutes
 */
const getCachedPlantAnalytics = unstable_cache(
  async () => {
    // Most rented plant types
    const plantRentals = await prisma.contractItem.groupBy({
      by: ["plantTypeId"],
      _sum: { quantity: true },
      _count: true,
    });

    // Batch fetch all plant types in single query (fixes N+1)
    const plantTypeIds = plantRentals.map((r) => r.plantTypeId);
    const plantTypes = await prisma.plantType.findMany({
      where: { id: { in: plantTypeIds } },
      select: { id: true, code: true, name: true, rentalPrice: true },
    });

    // Map plant types by ID for O(1) lookup
    const plantTypeMap = new Map(plantTypes.map((pt) => [pt.id, pt]));

    // Build plant details using map lookup
    const plantDetails = plantRentals.map((rental) => {
      const plantType = plantTypeMap.get(rental.plantTypeId);
      return {
        plantTypeId: rental.plantTypeId,
        code: plantType?.code || "N/A",
        name: plantType?.name || "Unknown",
        rentalPrice: Number(plantType?.rentalPrice || 0),
        totalQuantity: rental._sum.quantity || 0,
        contractCount: rental._count,
      };
    });

    // Sort by total quantity
    const mostRented = plantDetails
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 10);

    // Total plants in circulation
    const totalInCirculation = plantDetails.reduce(
      (sum, p) => sum + p.totalQuantity,
      0
    );

    // Average plants per contract
    const activeContracts = await prisma.contract.count({
      where: { status: "ACTIVE" },
    });

    const avgPlantsPerContract = activeContracts > 0
      ? Math.round(totalInCirculation / activeContracts)
      : 0;

    return {
      mostRented,
      totalInCirculation,
      avgPlantsPerContract,
    };
  },
  ['plant-analytics'],
  { revalidate: CACHE_TTL.HEAVY_QUERY }
);

export async function getPlantAnalytics() {
  await requireUser();
  await requireRateLimit("report-plant-analytics", {
    max: RATE_LIMITS.REPORT.limit,
    windowMs: RATE_LIMITS.REPORT.window * 1000,
  });
  return getCachedPlantAnalytics();
}
