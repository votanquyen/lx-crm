/**
 * Analytics CSV Export Generators
 * Generate CSV exports for various analytics reports
 */
import { formatCurrencyForExcel } from "@/lib/format";
import {
  arrayToCSV,
  formatDateForCSV,
} from "./csv-utils";

/**
 * Monthly Revenue CSV Export
 */
export interface MonthlyRevenueData {
  month: string;
  totalRevenue: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
}

export function generateMonthlyRevenueCSV(data: MonthlyRevenueData[]): string {
  const formattedData = data.map((item) => ({
    ...item,
    totalRevenue: formatCurrencyForExcel(item.totalRevenue),
    paidAmount: formatCurrencyForExcel(item.paidAmount),
    pendingAmount: formatCurrencyForExcel(item.pendingAmount),
    overdueAmount: formatCurrencyForExcel(item.overdueAmount),
  }));

  return arrayToCSV(formattedData, [
    { key: "month", label: "Tháng" },
    { key: "totalRevenue", label: "Tổng doanh thu (VND)" },
    { key: "paidAmount", label: "Đã thanh toán (VND)" },
    { key: "pendingAmount", label: "Chờ thanh toán (VND)" },
    { key: "overdueAmount", label: "Quá hạn (VND)" },
  ]);
}

/**
 * Invoice Aging CSV Export
 */
export interface InvoiceAgingData {
  range: string;
  count: number;
  totalAmount: number;
  percentage: number;
}

export function generateInvoiceAgingCSV(data: InvoiceAgingData[]): string {
  const formattedData = data.map((item) => ({
    ...item,
    totalAmount: formatCurrencyForExcel(item.totalAmount),
  }));

  return arrayToCSV(formattedData, [
    { key: "range", label: "Khoảng thời gian" },
    { key: "count", label: "Số lượng hóa đơn" },
    { key: "totalAmount", label: "Tổng tiền (VND)" },
    { key: "percentage", label: "Tỷ lệ (%)" },
  ]);
}

/**
 * Top Customers CSV Export
 */
export interface TopCustomerData {
  code: string;
  companyName: string;
  totalRevenue: number;
  activeContracts: number;
  totalInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
}

export function generateTopCustomersCSV(data: TopCustomerData[]): string {
  const formattedData = data.map((item) => ({
    ...item,
    totalRevenue: formatCurrencyForExcel(item.totalRevenue),
  }));

  return arrayToCSV(formattedData, [
    { key: "code", label: "Mã khách hàng" },
    { key: "companyName", label: "Tên công ty" },
    { key: "totalRevenue", label: "Tổng doanh thu (VND)" },
    { key: "activeContracts", label: "Hợp đồng đang hoạt động" },
    { key: "totalInvoices", label: "Tổng số hóa đơn" },
    { key: "paidInvoices", label: "Đã thanh toán" },
    { key: "overdueInvoices", label: "Quá hạn" },
  ]);
}

/**
 * Overdue Invoices CSV Export
 */
export interface OverdueInvoiceData {
  invoiceNumber: string;
  customerCode: string;
  customerName: string;
  issueDate: Date;
  dueDate: Date;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  daysOverdue: number;
}

export function generateOverdueInvoicesCSV(
  data: OverdueInvoiceData[]
): string {
  const formattedData = data.map((invoice) => ({
    ...invoice,
    issueDate: formatDateForCSV(invoice.issueDate),
    dueDate: formatDateForCSV(invoice.dueDate),
    totalAmount: formatCurrencyForExcel(invoice.totalAmount),
    paidAmount: formatCurrencyForExcel(invoice.paidAmount),
    balanceDue: formatCurrencyForExcel(invoice.balanceDue),
  }));

  return arrayToCSV(formattedData, [
    { key: "invoiceNumber", label: "Số hóa đơn" },
    { key: "customerCode", label: "Mã khách hàng" },
    { key: "customerName", label: "Tên khách hàng" },
    { key: "issueDate", label: "Ngày phát hành" },
    { key: "dueDate", label: "Ngày đến hạn" },
    { key: "totalAmount", label: "Tổng tiền (VND)" },
    { key: "paidAmount", label: "Đã thanh toán (VND)" },
    { key: "balanceDue", label: "Còn lại (VND)" },
    { key: "daysOverdue", label: "Số ngày quá hạn" },
  ]);
}

/**
 * Contract Report CSV Export
 */
export interface ContractReportData {
  contractNumber: string;
  customerCode: string;
  customerName: string;
  status: string;
  startDate: Date;
  endDate: Date;
  monthlyValue: number;
  totalValue: number;
  plantCount: number;
}

export function generateContractReportCSV(data: ContractReportData[]): string {
  const formattedData = data.map((contract) => ({
    ...contract,
    startDate: formatDateForCSV(contract.startDate),
    endDate: formatDateForCSV(contract.endDate),
    monthlyValue: formatCurrencyForExcel(contract.monthlyValue),
    totalValue: formatCurrencyForExcel(contract.totalValue),
  }));

  return arrayToCSV(formattedData, [
    { key: "contractNumber", label: "Số hợp đồng" },
    { key: "customerCode", label: "Mã khách hàng" },
    { key: "customerName", label: "Tên khách hàng" },
    { key: "status", label: "Trạng thái" },
    { key: "startDate", label: "Ngày bắt đầu" },
    { key: "endDate", label: "Ngày kết thúc" },
    { key: "monthlyValue", label: "Giá trị/tháng (VND)" },
    { key: "totalValue", label: "Tổng giá trị (VND)" },
    { key: "plantCount", label: "Số lượng cây" },
  ]);
}

/**
 * Revenue Summary CSV Export
 */
export interface RevenueSummaryData {
  period: string;
  newRevenue: number;
  recurringRevenue: number;
  totalRevenue: number;
  invoiceCount: number;
  averageInvoiceValue: number;
}

export function generateRevenueSummaryCSV(data: RevenueSummaryData[]): string {
  const formattedData = data.map((item) => ({
    ...item,
    newRevenue: formatCurrencyForExcel(item.newRevenue),
    recurringRevenue: formatCurrencyForExcel(item.recurringRevenue),
    totalRevenue: formatCurrencyForExcel(item.totalRevenue),
    averageInvoiceValue: formatCurrencyForExcel(item.averageInvoiceValue),
  }));

  return arrayToCSV(formattedData, [
    { key: "period", label: "Kỳ" },
    { key: "newRevenue", label: "Doanh thu mới (VND)" },
    { key: "recurringRevenue", label: "Doanh thu định kỳ (VND)" },
    { key: "totalRevenue", label: "Tổng doanh thu (VND)" },
    { key: "invoiceCount", label: "Số hóa đơn" },
    { key: "averageInvoiceValue", label: "Giá trị TB (VND)" },
  ]);
}
