/**
 * Analytics Export API
 * GET /api/analytics/export?type=TYPE
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  generateMonthlyRevenueCSV,
  generateInvoiceAgingCSV,
  generateTopCustomersCSV,
  generateOverdueInvoicesCSV,
  generateContractReportCSV,
  type MonthlyRevenueData,
  type InvoiceAgingData,
  type TopCustomerData,
  type OverdueInvoiceData,
  type ContractReportData,
} from "@/lib/csv/export-analytics";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const exportType = searchParams.get("type");

    if (!exportType) {
      return NextResponse.json(
        { error: "Export type required" },
        { status: 400 }
      );
    }

    let csvData = "";
    let filename = "";

    switch (exportType) {
      case "monthly-revenue":
        ({ csvData, filename } = await exportMonthlyRevenue());
        break;

      case "invoice-aging":
        ({ csvData, filename } = await exportInvoiceAging());
        break;

      case "top-customers":
        ({ csvData, filename } = await exportTopCustomers());
        break;

      case "overdue-invoices":
        ({ csvData, filename } = await exportOverdueInvoices());
        break;

      case "contracts":
        ({ csvData, filename } = await exportContracts());
        break;

      default:
        return NextResponse.json(
          { error: "Invalid export type" },
          { status: 400 }
        );
    }

    // Return CSV file
    return new NextResponse(csvData, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    );
  }
}

/**
 * Export monthly revenue data
 */
async function exportMonthlyRevenue() {
  // Get last 12 months of data
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 11);
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);

  const invoices = await prisma.invoice.findMany({
    where: {
      issueDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      issueDate: true,
      totalAmount: true,
      paidAmount: true,
      status: true,
      dueDate: true,
    },
  });

  // Group by month
  const monthlyData = new Map<string, MonthlyRevenueData>();

  invoices.forEach((invoice) => {
    const monthKey = invoice.issueDate.toISOString().substring(0, 7); // YYYY-MM

    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, {
        month: monthKey,
        totalRevenue: 0,
        paidAmount: 0,
        pendingAmount: 0,
        overdueAmount: 0,
      });
    }

    const data = monthlyData.get(monthKey)!;
    data.totalRevenue += Number(invoice.totalAmount);

    if (invoice.status === "PAID" || invoice.status === "PARTIALLY_PAID") {
      data.paidAmount += Number(invoice.paidAmount);
    }

    if (invoice.status === "PENDING" || invoice.status === "PARTIALLY_PAID") {
      data.pendingAmount += Number(invoice.totalAmount) - Number(invoice.paidAmount);
    }

    if (invoice.status === "OVERDUE") {
      data.overdueAmount += Number(invoice.totalAmount) - Number(invoice.paidAmount);
    }
  });

  const data = Array.from(monthlyData.values()).sort((a, b) =>
    a.month.localeCompare(b.month)
  );

  const csvData = generateMonthlyRevenueCSV(data);
  const filename = `doanh-thu-theo-thang-${new Date().toISOString().split("T")[0]}.csv`;

  return { csvData, filename };
}

/**
 * Export invoice aging data
 */
async function exportInvoiceAging() {
  const today = new Date();

  const unpaidInvoices = await prisma.invoice.findMany({
    where: {
      status: {
        in: ["PENDING", "PARTIALLY_PAID", "OVERDUE"],
      },
    },
    select: {
      totalAmount: true,
      paidAmount: true,
      dueDate: true,
    },
  });

  // Aging buckets
  const aging: InvoiceAgingData[] = [
    { range: "Chưa đến hạn", count: 0, totalAmount: 0, percentage: 0 },
    { range: "0-30 ngày", count: 0, totalAmount: 0, percentage: 0 },
    { range: "31-60 ngày", count: 0, totalAmount: 0, percentage: 0 },
    { range: "61-90 ngày", count: 0, totalAmount: 0, percentage: 0 },
    { range: "Trên 90 ngày", count: 0, totalAmount: 0, percentage: 0 },
  ];

  let totalBalance = 0;

  unpaidInvoices.forEach((invoice) => {
    const balance = Number(invoice.totalAmount) - Number(invoice.paidAmount);
    totalBalance += balance;

    const daysOverdue = Math.floor(
      (today.getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    let bucket: InvoiceAgingData;
    if (daysOverdue < 0) {
      bucket = aging[0]; // Not due yet
    } else if (daysOverdue <= 30) {
      bucket = aging[1];
    } else if (daysOverdue <= 60) {
      bucket = aging[2];
    } else if (daysOverdue <= 90) {
      bucket = aging[3];
    } else {
      bucket = aging[4];
    }

    bucket.count++;
    bucket.totalAmount += balance;
  });

  // Calculate percentages
  aging.forEach((bucket) => {
    bucket.percentage = totalBalance > 0 ? (bucket.totalAmount / totalBalance) * 100 : 0;
  });

  const csvData = generateInvoiceAgingCSV(aging);
  const filename = `phan-tich-cong-no-${new Date().toISOString().split("T")[0]}.csv`;

  return { csvData, filename };
}

/**
 * Export top customers data
 */
async function exportTopCustomers() {
  const customers = await prisma.customer.findMany({
    where: {
      status: "ACTIVE",
    },
    select: {
      code: true,
      companyName: true,
      tier: true,
      invoices: {
        select: {
          totalAmount: true,
          status: true,
        },
      },
      contracts: {
        where: {
          status: "ACTIVE",
        },
      },
    },
  });

  const data: TopCustomerData[] = customers.map((customer) => {
    const totalRevenue = customer.invoices.reduce(
      (sum, inv) => sum + Number(inv.totalAmount),
      0
    );
    const paidInvoices = customer.invoices.filter((i) => i.status === "PAID").length;
    const overdueInvoices = customer.invoices.filter((i) => i.status === "OVERDUE").length;

    return {
      code: customer.code,
      companyName: customer.companyName,
      tier: customer.tier,
      totalRevenue,
      activeContracts: customer.contracts.length,
      totalInvoices: customer.invoices.length,
      paidInvoices,
      overdueInvoices,
    };
  });

  // Sort by revenue descending
  data.sort((a, b) => b.totalRevenue - a.totalRevenue);

  const csvData = generateTopCustomersCSV(data.slice(0, 100)); // Top 100
  const filename = `khach-hang-hang-dau-${new Date().toISOString().split("T")[0]}.csv`;

  return { csvData, filename };
}

/**
 * Export overdue invoices
 */
async function exportOverdueInvoices() {
  const today = new Date();

  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      status: {
        in: ["OVERDUE", "PARTIALLY_PAID"],
      },
      dueDate: {
        lt: today,
      },
    },
    select: {
      invoiceNumber: true,
      customer: {
        select: {
          code: true,
          companyName: true,
        },
      },
      issueDate: true,
      dueDate: true,
      totalAmount: true,
      paidAmount: true,
    },
    orderBy: {
      dueDate: "asc",
    },
  });

  const data: OverdueInvoiceData[] = overdueInvoices.map((invoice) => {
    const balance = Number(invoice.totalAmount) - Number(invoice.paidAmount);
    const daysOverdue = Math.floor(
      (today.getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      invoiceNumber: invoice.invoiceNumber,
      customerCode: invoice.customer.code,
      customerName: invoice.customer.companyName,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      totalAmount: Number(invoice.totalAmount),
      paidAmount: Number(invoice.paidAmount),
      balanceDue: balance,
      daysOverdue,
    };
  });

  const csvData = generateOverdueInvoicesCSV(data);
  const filename = `hoa-don-qua-han-${new Date().toISOString().split("T")[0]}.csv`;

  return { csvData, filename };
}

/**
 * Export contracts data
 */
async function exportContracts() {
  const contracts = await prisma.contract.findMany({
    select: {
      contractNumber: true,
      customer: {
        select: {
          code: true,
          companyName: true,
        },
      },
      status: true,
      startDate: true,
      endDate: true,
      monthlyValue: true,
      totalValue: true,
      items: {
        select: {
          quantity: true,
        },
      },
    },
    orderBy: {
      startDate: "desc",
    },
  });

  const data: ContractReportData[] = contracts.map((contract) => {
    const plantCount = contract.items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      contractNumber: contract.contractNumber,
      customerCode: contract.customer.code,
      customerName: contract.customer.companyName,
      status: contract.status,
      startDate: contract.startDate,
      endDate: contract.endDate,
      monthlyValue: Number(contract.monthlyValue),
      totalValue: Number(contract.totalValue),
      plantCount,
    };
  });

  const csvData = generateContractReportCSV(data);
  const filename = `hop-dong-${new Date().toISOString().split("T")[0]}.csv`;

  return { csvData, filename };
}
