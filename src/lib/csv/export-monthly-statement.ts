/**
 * Monthly Statement CSV Export
 * Generate Excel-compatible CSV export for Bảng Kê
 */

import { formatCurrencyForExcel } from "@/lib/format";
import type { StatementDTO } from "@/types/monthly-statement";
import { arrayToCSV, formatDateForCSV } from "./csv-utils";

/**
 * Export monthly statement to CSV format (Excel compatible)
 */
export function generateMonthlyStatementCSV(statement: StatementDTO): string {
  const { customer, periodStart, periodEnd, contactName, plants } = statement;

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
 * Format: BangKe_TenCongTy_T12-2025.csv
 */
export function getStatementFilename(companyName: string, year: number, month: number): string {
  // Comprehensive Vietnamese character replacement
  const vietnameseMap: Record<string, string> = {
    "à": "a", "á": "a", "ả": "a", "ã": "a", "ạ": "a",
    "ă": "a", "ằ": "a", "ắ": "a", "ẳ": "a", "ẵ": "a", "ặ": "a",
    "â": "a", "ầ": "a", "ấ": "a", "ẩ": "a", "ẫ": "a", "ậ": "a",
    "è": "e", "é": "e", "ẻ": "e", "ẽ": "e", "ẹ": "e",
    "ê": "e", "ề": "e", "ế": "e", "ể": "e", "ễ": "e", "ệ": "e",
    "ì": "i", "í": "i", "ỉ": "i", "ĩ": "i", "ị": "i",
    "ò": "o", "ó": "o", "ỏ": "o", "õ": "o", "ọ": "o",
    "ô": "o", "ồ": "o", "ố": "o", "ổ": "o", "ỗ": "o", "ộ": "o",
    "ơ": "o", "ờ": "o", "ớ": "o", "ở": "o", "ỡ": "o", "ợ": "o",
    "ù": "u", "ú": "u", "ủ": "u", "ũ": "u", "ụ": "u",
    "ư": "u", "ừ": "u", "ứ": "u", "ử": "u", "ữ": "u", "ự": "u",
    "ỳ": "y", "ý": "y", "ỷ": "y", "ỹ": "y", "ỵ": "y",
    "đ": "d", "Đ": "D",
    "À": "A", "Á": "A", "Ả": "A", "Ã": "A", "Ạ": "A",
    "Ă": "A", "Ằ": "A", "Ắ": "A", "Ẳ": "A", "Ẵ": "A", "Ặ": "A",
    "Â": "A", "Ầ": "A", "Ấ": "A", "Ẩ": "A", "Ẫ": "A", "Ậ": "A",
    "È": "E", "É": "E", "Ẻ": "E", "Ẽ": "E", "Ẹ": "E",
    "Ê": "E", "Ề": "E", "Ế": "E", "Ể": "E", "Ễ": "E", "Ệ": "E",
    "Ì": "I", "Í": "I", "Ỉ": "I", "Ĩ": "I", "Ị": "I",
    "Ò": "O", "Ó": "O", "Ỏ": "O", "Õ": "O", "Ọ": "O",
    "Ô": "O", "Ồ": "O", "Ố": "O", "Ổ": "O", "Ỗ": "O", "Ộ": "O",
    "Ơ": "O", "Ờ": "O", "Ớ": "O", "Ở": "O", "Ỡ": "O", "Ợ": "O",
    "Ù": "U", "Ú": "U", "Ủ": "U", "Ũ": "U", "Ụ": "U",
    "Ư": "U", "Ừ": "U", "Ứ": "U", "Ử": "U", "Ữ": "U", "Ự": "U",
    "Ỳ": "Y", "Ý": "Y", "Ỷ": "Y", "Ỹ": "Y", "Ỵ": "Y",
  };

  let safeCompanyName = companyName;

  // Replace Vietnamese characters
  for (const [vn, ascii] of Object.entries(vietnameseMap)) {
    safeCompanyName = safeCompanyName.replace(new RegExp(vn, "g"), ascii);
  }

  // Remove any remaining non-ASCII characters and special chars
  safeCompanyName = safeCompanyName
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .substring(0, 40);

  return `BangKe_${safeCompanyName}_T${month}_${year}.csv`;
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

export function generateStatementsSummaryCSV(statements: StatementSummary[]): string {
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
