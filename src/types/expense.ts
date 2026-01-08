import type { ExpenseCategory } from "@prisma/client";

// Expense DTO for frontend
export interface ExpenseDTO {
  id: string;
  companyName: string;
  invoiceNumber: string | null;
  invoiceDate: string;
  amount: number;
  category: ExpenseCategory | null;
  description: string | null;
  quarter: number;
  year: number;
  createdAt: string;
  createdBy?: {
    id: string;
    name: string | null;
  };
}

// List item for table
export interface ExpenseListItem {
  id: string;
  companyName: string;
  invoiceNumber: string | null;
  invoiceDate: string;
  amount: number;
  category: ExpenseCategory | null;
  quarter: number;
  year: number;
}

// Quarterly report data
export interface QuarterlyReportData {
  year: number;
  quarter: number;
  total: number;
  byCategory: Record<string, number>;
  count: number;
}

// Category labels in Vietnamese
export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  PURCHASE_PLANT: "Mua cây mới",
  PURCHASE_POT: "Mua chậu",
  MATERIALS: "Phân bón, đất, thuốc",
  LOGISTICS: "Xăng xe, vận chuyển",
  STAFF_COST: "Lương, phụ cấp",
  OFFICE_UTILITIES: "Điện, nước, mặt bằng",
  MARKETING: "Quảng cáo",
  OTHER: "Khác",
};

// Helper to get quarter from date
export function getQuarterFromDate(date: Date): number {
  const month = date.getMonth() + 1; // 1-12
  return Math.ceil(month / 3);
}
