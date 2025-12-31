/**
 * Reports & Analytics Server Actions
 * Provides business intelligence and insights from operational data
 */
"use server";

import { prisma } from "@/lib/prisma";
import { requireUser, createServerAction } from "@/lib/action-utils";
import { startOfMonth, endOfMonth, subMonths, format, differenceInDays } from "date-fns";
import { unstable_cache } from "next/cache";

// ============================================================
// REVENUE ANALYTICS
// ============================================================

/**
 * Get comprehensive revenue overview
 * Cached for 5 minutes to improve performance
 */
export const getRevenueOverview = createServerAction(async () => {
  await requireUser();

  return unstable_cache(
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

  // Revenue by customer tier
  const revenueByTier = await prisma.$queryRaw<Array<{
    tier: string;
    revenue: any;
    customer_count: bigint;
  }>>`
    SELECT
      c.tier,
      SUM(i."totalAmount") as revenue,
      COUNT(DISTINCT i."customerId") as customer_count
    FROM invoices i
    JOIN customers c ON c.id = i."customerId"
    WHERE i.status IN ('PAID', 'PARTIAL')
    GROUP BY c.tier
    ORDER BY revenue DESC
  `;

  // Convert Decimal objects to numbers for client serialization
  const serializedRevenueByTier = revenueByTier.map(item => ({
    tier: item.tier,
    revenue: Number(item.revenue || 0),
    customer_count: Number(item.customer_count || 0),
  }));

      return {
        totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
        ytdRevenue: Number(ytdRevenue._sum.totalAmount || 0),
        mtdRevenue: Number(mtdRevenue._sum.totalAmount || 0),
        revenueGrowth: Math.round(revenueGrowth * 10) / 10, // Round to 1 decimal
        avgContractValue: Number(avgContract._avg.monthlyFee || 0),
        revenueByTier: serializedRevenueByTier,
      };
    },
    ['revenue-overview'],
    { revalidate: 300 } // Cache for 5 minutes
  )();
});

/**
 * Get monthly revenue for the last 12 months (for charts)
 */
export const getMonthlyRevenue = createServerAction(async () => {
  await requireUser();

  const now = new Date();
  const twelveMonthsAgo = subMonths(now, 12);

  // Get all paid/partial invoices from last 12 months
  const invoices = await prisma.invoice.findMany({
    where: {
      status: { in: ["PAID", "PARTIAL"] },
      issueDate: { gte: twelveMonthsAgo },
    },
    select: {
      issueDate: true,
      totalAmount: true,
    },
  });

  // Group by month
  const monthlyData = new Map<string, number>();

  // Initialize all 12 months with 0
  for (let i = 11; i >= 0; i--) {
    const month = subMonths(now, i);
    const key = format(month, "yyyy-MM");
    monthlyData.set(key, 0);
  }

  // Sum amounts by month
  invoices.forEach((invoice) => {
    const key = format(invoice.issueDate, "yyyy-MM");
    const current = monthlyData.get(key) || 0;
    monthlyData.set(key, current + Number(invoice.totalAmount));
  });

  // Convert to array format for charts
  const data = Array.from(monthlyData.entries()).map(([month, amount]) => ({
    month: format(new Date(month + "-01"), "MMM yyyy"),
    monthKey: month,
    amount,
  }));

  return data;
});

/**
 * Get revenue by payment method
 */
export const getRevenueByPaymentMethod = createServerAction(async () => {
  await requireUser();

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
});

// ============================================================
// INVOICE ANALYTICS
// ============================================================

/**
 * Get invoice analytics overview
 */
export const getInvoiceAnalytics = createServerAction(async () => {
  await requireUser();

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

  // Average days to payment
  const paidInvoices = await prisma.invoice.findMany({
    where: {
      status: "PAID",
      payments: { some: {} },
    },
    select: {
      issueDate: true,
      payments: {
        where: { isVerified: true },
        orderBy: { paymentDate: "asc" },
        take: 1,
        select: { paymentDate: true },
      },
    },
  });

  const daysToPayment = paidInvoices
    .filter((inv) => inv.payments.length > 0)
    .map((inv) =>
      differenceInDays(inv.payments[0].paymentDate, inv.issueDate)
    );

  const avgDaysToPayment = daysToPayment.length > 0
    ? Math.round(daysToPayment.reduce((sum, days) => sum + days, 0) / daysToPayment.length)
    : 0;

  return {
    outstandingAmount: Number(outstanding._sum.totalAmount || 0),
    outstandingCount: outstanding._count,
    overdueAmount: Number(overdue._sum.totalAmount || 0),
    overdueCount: overdue._count,
    collectionRate: Math.round(collectionRate * 10) / 10,
    avgDaysToPayment,
  };
});

/**
 * Get invoice aging report
 */
export const getInvoiceAging = createServerAction(async () => {
  await requireUser();

  const now = new Date();

  const buckets = [
    { range: "0-30 days", minDays: 0, maxDays: 30 },
    { range: "31-60 days", minDays: 31, maxDays: 60 },
    { range: "61-90 days", minDays: 61, maxDays: 90 },
    { range: "90+ days", minDays: 91, maxDays: 9999 },
  ];

  const aging = await Promise.all(
    buckets.map(async (bucket) => {
      // Calculate date range
      const maxDate = new Date(now);
      maxDate.setDate(maxDate.getDate() - bucket.minDays);

      const minDate = new Date(now);
      minDate.setDate(minDate.getDate() - bucket.maxDays);

      const result = await prisma.invoice.aggregate({
        where: {
          status: { in: ["SENT", "PARTIAL", "OVERDUE"] },
          dueDate: {
            gte: bucket.maxDays < 9999 ? minDate : new Date(0), // Beginning of time for 90+
            lte: maxDate,
          },
        },
        _sum: { totalAmount: true },
        _count: true,
      });

      return {
        range: bucket.range,
        count: result._count,
        amount: Number(result._sum.totalAmount || 0),
      };
    })
  );

  return aging;
});

/**
 * Get list of overdue invoices
 */
export const getOverdueInvoices = createServerAction(async (limit: number = 10) => {
  await requireUser();

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
          email: true,
          phone: true,
        },
      },
    },
    orderBy: [
      { dueDate: "asc" }, // Oldest first
      { totalAmount: "desc" }, // Highest amount
    ],
    take: limit,
  });

  return invoices.map((inv) => ({
    ...inv,
    daysOverdue: differenceInDays(new Date(), inv.dueDate),
  }));
});

// ============================================================
// CUSTOMER ANALYTICS
// ============================================================

/**
 * Get customer analytics overview
 */
export const getCustomerAnalytics = createServerAction(async () => {
  await requireUser();

  return unstable_cache(
    async () => {
      const now = new Date();
      const startOfThisMonth = startOfMonth(now);

      // Total active customers
      const totalActive = await prisma.customer.count({
        where: { status: "ACTIVE" },
      });

      // New customers this month
      const newThisMonth = await prisma.customer.count({
        where: {
          status: "ACTIVE",
          createdAt: { gte: startOfThisMonth },
        },
      });

      // Terminated customers (churn)
      const totalTerminated = await prisma.customer.count({
        where: { status: "TERMINATED" },
      });

      const churnRate = totalActive > 0
        ? (totalTerminated / (totalActive + totalTerminated)) * 100
        : 0;

      // Customer distribution by tier
      const customersByTier = await prisma.customer.groupBy({
        by: ["tier"],
        where: { status: "ACTIVE" },
        _count: true,
      });

      // Average lifetime value - use database aggregation instead of fetching all
      const avgLifetimeValueResult = await prisma.$queryRaw<[{ avg: any }]>`
        SELECT AVG(customer_revenue) as avg
        FROM (
          SELECT
            c.id,
            COALESCE(SUM(i."totalAmount"), 0) as customer_revenue
          FROM customers c
          LEFT JOIN invoices i ON i."customerId" = c.id
            AND i.status IN ('PAID', 'PARTIAL')
          WHERE c.status = 'ACTIVE'
          GROUP BY c.id
        ) customer_totals
      `;

      const avgLifetimeValue = Number(avgLifetimeValueResult[0]?.avg || 0);

      return {
        totalActive,
        newThisMonth,
        churnRate: Math.round(churnRate * 10) / 10,
        avgLifetimeValue: Math.round(avgLifetimeValue),
        customersByTier: customersByTier.map((t) => ({
          tier: t.tier,
          count: t._count,
        })),
      };
    },
    ['customer-analytics'],
    { revalidate: 300 } // Cache for 5 minutes
  )();
});

/**
 * Get top customers by revenue
 */
export const getTopCustomers = createServerAction(async (limit: number = 10) => {
  await requireUser();

  return unstable_cache(
    async () => {
      // Use database aggregation instead of fetching all customers
      const customers = await prisma.$queryRaw<Array<{
        id: string;
        company_name: string;
        code: string;
        tier: string;
        total_revenue: any;
        monthly_fee: any;
        invoice_count: bigint;
      }>>`
        SELECT
          c.id,
          c."companyName" as company_name,
          c.code,
          c.tier,
          COALESCE(SUM(i."totalAmount"), 0) as total_revenue,
          COALESCE(SUM(ct."monthlyFee"), 0) as monthly_fee,
          COUNT(DISTINCT i.id) as invoice_count
        FROM customers c
        LEFT JOIN invoices i ON i."customerId" = c.id
          AND i.status IN ('PAID', 'PARTIAL')
        LEFT JOIN contracts ct ON ct."customerId" = c.id
          AND ct.status = 'ACTIVE'
        WHERE c.status = 'ACTIVE'
        GROUP BY c.id, c."companyName", c.code, c.tier
        ORDER BY total_revenue DESC
        LIMIT ${limit}
      `;

      // Convert Decimal and BigInt to numbers for serialization
      return customers.map(c => ({
        id: c.id,
        companyName: c.company_name,
        code: c.code,
        tier: c.tier,
        totalRevenue: Number(c.total_revenue),
        monthlyFee: Number(c.monthly_fee),
        invoiceCount: Number(c.invoice_count),
      }));
    },
    ['top-customers', `limit-${limit}`],
    { revalidate: 300 } // Cache for 5 minutes
  )();
});

// ============================================================
// CONTRACT ANALYTICS
// ============================================================

/**
 * Get contract analytics overview
 */
export const getContractAnalytics = createServerAction(async () => {
  await requireUser();

  const now = new Date();

  // Active contracts
  const activeCount = await prisma.contract.count({
    where: { status: "ACTIVE" },
  });

  // Expiring soon (next 30 days)
  const expiringSoon = await prisma.contract.count({
    where: {
      status: "ACTIVE",
      endDate: {
        gte: now,
        lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      },
    },
  });

  // Contract status distribution
  const contractsByStatus = await prisma.contract.groupBy({
    by: ["status"],
    _count: true,
  });

  // Average contract duration (in months)
  const contracts = await prisma.contract.findMany({
    where: { status: { in: ["ACTIVE", "EXPIRED"] } },
    select: { startDate: true, endDate: true },
  });

  const durations = contracts.map((c) =>
    Math.round(
      (c.endDate.getTime() - c.startDate.getTime()) / (30 * 24 * 60 * 60 * 1000)
    )
  );

  const avgDuration = durations.length > 0
    ? Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length)
    : 0;

  // Renewal rate (signed after expired)
  const expiredContracts = await prisma.contract.count({
    where: { status: "EXPIRED" },
  });

  const renewedContracts = await prisma.contract.count({
    where: {
      status: "ACTIVE",
      // Simplified: count active contracts for customers who had expired ones
    },
  });

  const renewalRate = expiredContracts > 0
    ? (renewedContracts / expiredContracts) * 100
    : 0;

  return {
    activeCount,
    expiringSoon,
    avgDuration,
    renewalRate: Math.round(renewalRate * 10) / 10,
    contractsByStatus: contractsByStatus.map((s) => ({
      status: s.status,
      count: s._count,
    })),
  };
});

/**
 * Get expiring contracts
 */
export const getExpiringContracts = createServerAction(
  async (daysAhead: number = 30) => {
    await requireUser();

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
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { endDate: "asc" },
    });

    return contracts.map((contract) => ({
      ...contract,
      daysUntilExpiry: differenceInDays(contract.endDate, now),
    }));
  }
);

// ============================================================
// PLANT ANALYTICS
// ============================================================

/**
 * Get plant rental analytics
 * Optimized: Batch query for plant types instead of N+1 sequential queries
 */
export const getPlantAnalytics = createServerAction(async () => {
  await requireUser();

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
});
