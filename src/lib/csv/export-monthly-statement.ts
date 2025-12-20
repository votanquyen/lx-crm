/**
 * Monthly Statement CSV Export
 * Generate Excel-compatible CSV export for Bảng Kê
 */

import { formatCurrencyForExcel } from "@/lib/format-utils";
import type { StatementDTO } from "@/types/monthly-statement";
import { arrayToCSV, formatDateForCSV } from "./csv-utils";

/**
 * Export monthly statement to CSV format (Excel compatible)
 */
export function generateMonthlyStatementCSV(statement: StatementDTO): string {
  const { customer, periodStart, periodEnd, contactName, plants } =
    statement;

  // Company header (3 lines)
  const companyHeader = [
    "CÔNG TY TNHH DỊCH VỤ LỘC XANH",
    "B20, Park Riverside, TP. Thủ Đức, TP.HCM",
    "ĐT: 08.372 96371 / 0937 937 304",
    "Website: www.locxanh.vn • Email: buivi@locxanh.vn",
    "",
  ].join("\\n");

  // Title
  const title = `DANH SÁCH CÂY XANH CÔNG TY ${customer?.companyName.toUpperCase() || ""}`;

  // Customer info
  const customerInfo = [
    customer?.address || "",
    `Từ ${formatDateForCSV(periodStart)} - ${formatDateForCSV(periodEnd)}`,
    contactName || customer?.contactName || "",
    "",
  ].join("\\n");

  // Plant table
  const plantData = plants.map((plant, index) => ({
    stt: index + 1,
    tenCay: plant.name,
    quyCach: plant.sizeSpec,
    soLuong: plant.quantity,
    donGia: formatCurrencyForExcel(plant.unitPrice),
    thanhTien: formatCurrencyForExcel(plant.total),
  }));

  const plantTable = arrayToCSV(plantData, [
    { key: "stt", label: "STT" },
    { key: "tenCay", label: "Tên Cây" },
    { key: "quyCach", label: "Quy Cách" },
    { key: "soLuong", label: "SL" },
    { key: "donGia", label: "Đơn Giá" },
    { key: "thanhTien", label: "Thành Tiền" },
  ]);

  // Summary
  const summary = [
    "",
    `Tổng cộng,,,,${formatCurrencyForExcel(statement.subtotal)}`,
    `Thuế GTGT (${statement.vatRate}%),,,,${formatCurrencyForExcel(statement.vatAmount)}`,
    `Tổng giá trị thanh toán,,,,${formatCurrencyForExcel(statement.total)}`,
    "",
    "Cung cấp bởi,,,Xác nhận của Khách Hàng",
    "CÔNG TY TNHH DỊCH VỤ LỘC XANH,,,(Ký và ghi rõ họ tên)",
  ].join("\\n");

  // Combine all parts
  return [companyHeader, title, customerInfo, plantTable, summary].join("\\n");
}

/**
 * Generate filename for monthly statement export
 */
export function getStatementFilename(
  companyName: string,
  year: number,
  month: number
): string {
  const safeCompanyName = companyName
    .replace(/[^a-zA-Z0-9]/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 30);

  return `bang-ke-${safeCompanyName}-${year}-${String(month).padStart(2, "0")}.csv`;
}

/**
 * Export multiple statements summary (for management view)
 */
export interface StatementSummary {
  companyName: string;
  companyCode: string;
  district: string | null;
  month: string;
  plantCount: number;
  subtotal: number;
  vatAmount: number;
  total: number;
  needsConfirmation: boolean;
  confirmedAt: string | null;
}

export function generateStatementsSummaryCSV(
  statements: StatementSummary[]
): string {
  const formattedData = statements.map((stmt) => ({
    ...stmt,
    needsConfirmation: stmt.needsConfirmation ? "Chưa xác nhận" : "Đã xác nhận",
    confirmedAt: stmt.confirmedAt ? formatDateForCSV(stmt.confirmedAt) : "",
    subtotal: formatCurrencyForExcel(stmt.subtotal),
    vatAmount: formatCurrencyForExcel(stmt.vatAmount),
    total: formatCurrencyForExcel(stmt.total),
  }));

  return arrayToCSV(formattedData, [
    { key: "companyCode", label: "Mã KH" },
    { key: "companyName", label: "Tên công ty" },
    { key: "district", label: "Quận/Huyện" },
    { key: "month", label: "Tháng" },
    { key: "plantCount", label: "Số cây" },
    { key: "subtotal", label: "Tạm tính (VND)" },
    { key: "vatAmount", label: "VAT (VND)" },
    { key: "total", label: "Tổng cộng (VND)" },
    { key: "needsConfirmation", label: "Trạng thái" },
    { key: "confirmedAt", label: "Ngày xác nhận" },
  ]);
}
