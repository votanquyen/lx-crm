/**
 * Churn Analysis Server Actions
 * Fetches customer data and calculates churn risk
 */
"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import {
  calculateChurnRisk,
  type ChurnRiskInput,
  type ChurnRiskResult,
  type PaymentMetrics,
  type OperationalMetrics,
  type ContractMetrics,
} from "@/lib/ai/churn-prediction";

/**
 * Customer with churn risk analysis
 */
export interface CustomerChurnAnalysis {
  customerId: string;
  customerCode: string;
  customerName: string;
  tier: string;
  status: string;
  riskResult: ChurnRiskResult;
}

/**
 * Get payment metrics for a customer (last 6 months)
 */
async function getPaymentMetrics(customerId: string): Promise<PaymentMetrics> {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const invoices = await prisma.invoice.findMany({
    where: {
      customerId,
      createdAt: { gte: sixMonthsAgo },
    },
    select: {
      status: true,
      dueDate: true,
      paidDate: true,
      totalAmount: true,
      paidAmount: true,
    },
  });

  const overdueCount = invoices.filter((inv) => inv.status === "OVERDUE").length;

  // Calculate average days late for paid invoices
  let totalDaysLate = 0;
  let paidCount = 0;
  for (const inv of invoices) {
    if (inv.paidDate && inv.dueDate) {
      const daysLate = Math.max(
        0,
        (inv.paidDate.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysLate > 0) {
        totalDaysLate += daysLate;
        paidCount++;
      }
    }
  }
  const avgDaysLate = paidCount > 0 ? totalDaysLate / paidCount : 0;

  // Calculate partial payment ratio
  let partialCount = 0;
  for (const inv of invoices) {
    const paid = Number(inv.paidAmount || 0);
    const total = Number(inv.totalAmount || 0);
    if (total > 0 && paid > 0 && paid < total) {
      partialCount++;
    }
  }
  const partialPaymentRatio =
    invoices.length > 0 ? partialCount / invoices.length : 0;

  return {
    overdueCount,
    avgDaysLate,
    partialPaymentRatio,
  };
}

/**
 * Get contract metrics for a customer
 */
async function getContractMetrics(customerId: string): Promise<ContractMetrics> {
  const contracts = await prisma.contract.findMany({
    where: { customerId },
    orderBy: { startDate: "desc" },
    select: {
      startDate: true,
      monthlyFee: true,
    },
  });

  if (contracts.length === 0) {
    return {
      contractAgeMonths: 0,
      renewalCount: 0,
      currentMonthlyFee: 0,
    };
  }

  // Find oldest contract for age
  const oldestContract = contracts[contracts.length - 1];
  const contractAgeMs = oldestContract
    ? Date.now() - oldestContract.startDate.getTime()
    : 0;
  const contractAgeMonths = Math.floor(contractAgeMs / (1000 * 60 * 60 * 24 * 30));

  // Renewal count = total contracts - 1 (first contract is not a renewal)
  const renewalCount = Math.max(0, contracts.length - 1);

  // Current monthly fee from latest contract
  const latestContract = contracts[0];
  const currentMonthlyFee = latestContract
    ? Number(latestContract.monthlyFee || 0)
    : 0;

  return {
    contractAgeMonths,
    renewalCount,
    currentMonthlyFee,
  };
}

/**
 * Get operational metrics for a customer (last 30 days)
 */
async function getOperationalMetrics(
  customerId: string
): Promise<OperationalMetrics> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Count exchange requests in last 30 days
  const exchangeCount30Days = await prisma.exchangeRequest.count({
    where: {
      customerId,
      createdAt: { gte: thirtyDaysAgo },
    },
  });

  // Count care schedule complaints and get last rating
  const careSchedules = await prisma.careSchedule.findMany({
    where: {
      customerId,
      status: "COMPLETED",
    },
    orderBy: { scheduledDate: "desc" },
    take: 10,
    select: {
      satisfactionRating: true,
      notes: true,
    },
  });

  // Count complaints (notes containing negative keywords)
  const complaintKeywords = ["khiếu nại", "không hài lòng", "vấn đề", "lỗi"];
  let careComplaintCount = 0;
  for (const schedule of careSchedules) {
    if (schedule.notes) {
      const notesLower = schedule.notes.toLowerCase();
      if (complaintKeywords.some((kw) => notesLower.includes(kw))) {
        careComplaintCount++;
      }
    }
  }

  // Get last satisfaction rating
  const lastRating = careSchedules.find((s) => s.satisfactionRating !== null);
  const lastSatisfactionRating = lastRating?.satisfactionRating ?? null;

  return {
    exchangeCount30Days,
    careComplaintCount,
    lastSatisfactionRating,
  };
}

/**
 * Get recent sticky notes for a customer
 */
async function getRecentStickyNotes(customerId: string): Promise<string[]> {
  const notes = await prisma.stickyNote.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { content: true },
  });

  return notes.map((n) => n.content);
}

// ============================================================================
// BATCH FETCH FUNCTIONS (Performance optimization - O(4) instead of O(n*4))
// ============================================================================

type BatchInvoiceData = {
  customerId: string;
  status: string;
  dueDate: Date | null;
  paidDate: Date | null;
  totalAmount: number | null;
  paidAmount: number | null;
};

type BatchContractData = {
  customerId: string;
  startDate: Date;
  monthlyFee: number | null;
};

type BatchCareData = {
  customerId: string;
  satisfactionRating: number | null;
  notes: string | null;
};

/**
 * Batch fetch all data needed for churn analysis in 5 queries
 */
async function batchFetchChurnData(customerIds: string[]): Promise<{
  invoices: Map<string, BatchInvoiceData[]>;
  contracts: Map<string, BatchContractData[]>;
  exchanges: Map<string, number>;
  careSchedules: Map<string, BatchCareData[]>;
  notes: Map<string, string[]>;
}> {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Fetch all data in parallel
  const [allInvoices, allContracts, allExchanges, allCareSchedules, allNotes] =
    await Promise.all([
      // 1. Invoices for payment metrics
      prisma.invoice.findMany({
        where: {
          customerId: { in: customerIds },
          createdAt: { gte: sixMonthsAgo },
        },
        select: {
          customerId: true,
          status: true,
          dueDate: true,
          paidDate: true,
          totalAmount: true,
          paidAmount: true,
        },
      }),
      // 2. Contracts for contract metrics
      prisma.contract.findMany({
        where: { customerId: { in: customerIds } },
        select: {
          customerId: true,
          startDate: true,
          monthlyFee: true,
        },
        orderBy: { startDate: "desc" },
      }),
      // 3. Exchange requests count (last 30 days)
      prisma.exchangeRequest.groupBy({
        by: ["customerId"],
        where: {
          customerId: { in: customerIds },
          createdAt: { gte: thirtyDaysAgo },
        },
        _count: true,
      }),
      // 4. Care schedules for satisfaction + complaints
      prisma.careSchedule.findMany({
        where: {
          customerId: { in: customerIds },
          status: "COMPLETED",
        },
        select: {
          customerId: true,
          satisfactionRating: true,
          notes: true,
        },
        orderBy: { scheduledDate: "desc" },
      }),
      // 5. Sticky notes
      prisma.stickyNote.findMany({
        where: { customerId: { in: customerIds } },
        select: {
          customerId: true,
          content: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  // Build lookup maps
  const invoiceMap = new Map<string, BatchInvoiceData[]>();
  const contractMap = new Map<string, BatchContractData[]>();
  const exchangeMap = new Map<string, number>();
  const careMap = new Map<string, BatchCareData[]>();
  const noteMap = new Map<string, string[]>();

  // Initialize maps for all customers
  for (const id of customerIds) {
    invoiceMap.set(id, []);
    contractMap.set(id, []);
    exchangeMap.set(id, 0);
    careMap.set(id, []);
    noteMap.set(id, []);
  }

  // Populate invoice map
  for (const inv of allInvoices) {
    const list = invoiceMap.get(inv.customerId) || [];
    list.push({
      customerId: inv.customerId,
      status: inv.status,
      dueDate: inv.dueDate,
      paidDate: inv.paidDate,
      totalAmount: inv.totalAmount ? Number(inv.totalAmount) : null,
      paidAmount: inv.paidAmount ? Number(inv.paidAmount) : null,
    });
    invoiceMap.set(inv.customerId, list);
  }

  // Populate contract map
  for (const c of allContracts) {
    const list = contractMap.get(c.customerId) || [];
    list.push({
      customerId: c.customerId,
      startDate: c.startDate,
      monthlyFee: c.monthlyFee ? Number(c.monthlyFee) : null,
    });
    contractMap.set(c.customerId, list);
  }

  // Populate exchange count map
  for (const ex of allExchanges) {
    exchangeMap.set(ex.customerId, ex._count);
  }

  // Populate care schedules map (limit to 10 per customer)
  const careCountMap = new Map<string, number>();
  for (const cs of allCareSchedules) {
    const currentCount = careCountMap.get(cs.customerId) || 0;
    if (currentCount < 10) {
      const list = careMap.get(cs.customerId) || [];
      list.push({
        customerId: cs.customerId,
        satisfactionRating: cs.satisfactionRating,
        notes: cs.notes,
      });
      careMap.set(cs.customerId, list);
      careCountMap.set(cs.customerId, currentCount + 1);
    }
  }

  // Populate notes map (limit to 5 per customer)
  const noteCountMap = new Map<string, number>();
  for (const n of allNotes) {
    const currentCount = noteCountMap.get(n.customerId) || 0;
    if (currentCount < 5) {
      const list = noteMap.get(n.customerId) || [];
      list.push(n.content);
      noteMap.set(n.customerId, list);
      noteCountMap.set(n.customerId, currentCount + 1);
    }
  }

  return {
    invoices: invoiceMap,
    contracts: contractMap,
    exchanges: exchangeMap,
    careSchedules: careMap,
    notes: noteMap,
  };
}

/**
 * Calculate payment metrics from batch data
 */
function calculatePaymentMetricsFromBatch(
  invoices: BatchInvoiceData[]
): PaymentMetrics {
  const overdueCount = invoices.filter((inv) => inv.status === "OVERDUE").length;

  let totalDaysLate = 0;
  let paidCount = 0;
  for (const inv of invoices) {
    if (inv.paidDate && inv.dueDate) {
      const daysLate = Math.max(
        0,
        (inv.paidDate.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysLate > 0) {
        totalDaysLate += daysLate;
        paidCount++;
      }
    }
  }
  const avgDaysLate = paidCount > 0 ? totalDaysLate / paidCount : 0;

  let partialCount = 0;
  for (const inv of invoices) {
    const paid = inv.paidAmount || 0;
    const total = inv.totalAmount || 0;
    if (total > 0 && paid > 0 && paid < total) {
      partialCount++;
    }
  }
  const partialPaymentRatio =
    invoices.length > 0 ? partialCount / invoices.length : 0;

  return { overdueCount, avgDaysLate, partialPaymentRatio };
}

/**
 * Calculate contract metrics from batch data
 */
function calculateContractMetricsFromBatch(
  contracts: BatchContractData[]
): ContractMetrics {
  if (contracts.length === 0) {
    return { contractAgeMonths: 0, renewalCount: 0, currentMonthlyFee: 0 };
  }

  const oldestContract = contracts[contracts.length - 1];
  const contractAgeMs = oldestContract
    ? Date.now() - oldestContract.startDate.getTime()
    : 0;
  const contractAgeMonths = Math.floor(contractAgeMs / (1000 * 60 * 60 * 24 * 30));
  const renewalCount = Math.max(0, contracts.length - 1);
  const latestContract = contracts[0];
  const currentMonthlyFee = latestContract?.monthlyFee || 0;

  return { contractAgeMonths, renewalCount, currentMonthlyFee };
}

/**
 * Calculate operational metrics from batch data
 */
function calculateOperationalMetricsFromBatch(
  exchangeCount30Days: number,
  careSchedules: BatchCareData[]
): OperationalMetrics {
  const complaintKeywords = ["khiếu nại", "không hài lòng", "vấn đề", "lỗi"];
  let careComplaintCount = 0;
  for (const schedule of careSchedules) {
    if (schedule.notes) {
      const notesLower = schedule.notes.toLowerCase();
      if (complaintKeywords.some((kw) => notesLower.includes(kw))) {
        careComplaintCount++;
      }
    }
  }

  const lastRating = careSchedules.find((s) => s.satisfactionRating !== null);
  const lastSatisfactionRating = lastRating?.satisfactionRating ?? null;

  return { exchangeCount30Days, careComplaintCount, lastSatisfactionRating };
}

/**
 * Analyze churn risk for a single customer
 */
export async function analyzeCustomerChurnRisk(
  customerId: string
): Promise<CustomerChurnAnalysis | null> {
  await requireAuth();

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      id: true,
      code: true,
      companyName: true,
      tier: true,
      status: true,
    },
  });

  if (!customer) {
    return null;
  }

  // Fetch all metrics in parallel
  const [paymentMetrics, contractMetrics, operationalMetrics, recentNotes] =
    await Promise.all([
      getPaymentMetrics(customerId),
      getContractMetrics(customerId),
      getOperationalMetrics(customerId),
      getRecentStickyNotes(customerId),
    ]);

  const input: ChurnRiskInput = {
    customerId: customer.id,
    customerName: customer.companyName,
    paymentMetrics,
    contractMetrics,
    operationalMetrics,
    recentNotes,
  };

  const riskResult = await calculateChurnRisk(input);

  return {
    customerId: customer.id,
    customerCode: customer.code,
    customerName: customer.companyName,
    tier: customer.tier,
    status: customer.status,
    riskResult,
  };
}

/**
 * Get all at-risk customers (sorted by risk score descending)
 * Only includes ACTIVE customers with risk score >= threshold
 * Uses batch fetching for O(5) queries instead of O(n*4)
 */
export async function getAtRiskCustomers(options?: {
  minRiskScore?: number;
  limit?: number;
}): Promise<CustomerChurnAnalysis[]> {
  await requireAuth();

  const minScore = options?.minRiskScore ?? 25; // Default: MEDIUM and above
  const limit = options?.limit ?? 20;

  // Get all active customers
  const customers = await prisma.customer.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      code: true,
      companyName: true,
      tier: true,
      status: true,
    },
    orderBy: { companyName: "asc" },
  });

  if (customers.length === 0) {
    return [];
  }

  // Batch fetch all metrics in 5 queries (instead of n*4)
  const customerIds = customers.map((c) => c.id);
  const batchData = await batchFetchChurnData(customerIds);

  const results: CustomerChurnAnalysis[] = [];

  for (const customer of customers) {
    try {
      // Calculate metrics from batch data
      const invoices = batchData.invoices.get(customer.id) || [];
      const contracts = batchData.contracts.get(customer.id) || [];
      const exchangeCount = batchData.exchanges.get(customer.id) || 0;
      const careSchedules = batchData.careSchedules.get(customer.id) || [];
      const recentNotes = batchData.notes.get(customer.id) || [];

      const paymentMetrics = calculatePaymentMetricsFromBatch(invoices);
      const contractMetrics = calculateContractMetricsFromBatch(contracts);
      const operationalMetrics = calculateOperationalMetricsFromBatch(
        exchangeCount,
        careSchedules
      );

      const input: ChurnRiskInput = {
        customerId: customer.id,
        customerName: customer.companyName,
        paymentMetrics,
        contractMetrics,
        operationalMetrics,
        recentNotes,
      };

      const riskResult = await calculateChurnRisk(input);

      if (riskResult.riskScore >= minScore) {
        results.push({
          customerId: customer.id,
          customerCode: customer.code,
          customerName: customer.companyName,
          tier: customer.tier,
          status: customer.status,
          riskResult,
        });
      }
    } catch (error) {
      console.error(
        `[ChurnAnalysis] Failed to analyze customer ${customer.id}:`,
        error
      );
      // Continue with other customers
    }
  }

  // Sort by risk score descending and limit
  return results
    .sort((a, b) => b.riskResult.riskScore - a.riskResult.riskScore)
    .slice(0, limit);
}

/**
 * Get churn risk summary statistics
 */
export async function getChurnRiskSummary(): Promise<{
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}> {
  await requireAuth();

  const results = await getAtRiskCustomers({ minRiskScore: 0, limit: 1000 });

  const summary = {
    total: results.length,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  for (const result of results) {
    switch (result.riskResult.riskLevel) {
      case "CRITICAL":
        summary.critical++;
        break;
      case "HIGH":
        summary.high++;
        break;
      case "MEDIUM":
        summary.medium++;
        break;
      case "LOW":
        summary.low++;
        break;
    }
  }

  return summary;
}
