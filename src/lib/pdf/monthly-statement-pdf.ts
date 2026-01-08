/**
 * Monthly Statement PDF Generator
 * Generates printable Bảng Kê (Monthly Plant Statement)
 */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { StatementDTO, PlantItem } from "@/types/monthly-statement";
import { setupVietnameseFonts } from "@/lib/pdf-fonts";
import { formatPeriodLabel } from "@/lib/statement-utils";
import { formatNumber } from "@/lib/format";

// Extend jsPDF with autoTable properties
interface JsPDFWithAutoTable extends jsPDF {
  lastAutoTable: { finalY: number };
}

/**
 * Generate monthly statement PDF
 */
export function generateMonthlyStatementPDF(statement: StatementDTO): jsPDF {
  const doc = new jsPDF();

  // Setup Vietnamese fonts
  setupVietnameseFonts(doc);

  const { customer, year, month, periodStart, periodEnd, contactName, plants, subtotal, vatRate, vatAmount, total } = statement;

  // Company Header
  doc.setFontSize(14);
  doc.setFont("Roboto", "bold");
  doc.text("CÔNG TY TNHH DỊCH VỤ LỘC XANH", 105, 20, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("Roboto", "normal");
  doc.text("B20, Park Riverside, TP. Thủ Đức, TP.HCM", 105, 27, { align: "center" });
  doc.text("ĐT: 08.372 96371 / 0937 937 304", 105, 33, { align: "center" });
  doc.text("Website: www.locxanh.vn • Email: buivi@locxanh.vn", 105, 39, { align: "center" });

  // Title
  doc.setFontSize(16);
  doc.setFont("Roboto", "bold");
  doc.text(`DANH SÁCH CÂY XANH CÔNG TY ${customer?.companyName.toUpperCase() || ""}`, 105, 52, { align: "center" });

  // Customer Info
  doc.setFontSize(11);
  doc.setFont("Roboto", "normal");
  doc.text(customer?.address || "", 20, 62);

  const period = formatPeriodLabel(new Date(periodStart), new Date(periodEnd));
  doc.text(`Từ ${period}`, 20, 69);

  doc.text(contactName || customer?.contactName || "", 150, 69);

  // Plant Table
  const tableData = plants.map((plant: PlantItem, index: number) => [
    `${index + 1}`,
    plant.name,
    plant.sizeSpec,
    `${plant.quantity}`,
    formatNumber(plant.unitPrice),
    formatNumber(plant.total),
  ]);

  autoTable(doc, {
    startY: 78,
    head: [["STT", "TÊN CÂY", "QUY CÁCH", "SL", "ĐƠN GIÁ", "THÀNH TIỀN"]],
    body: tableData,
    foot: [
      ["", "", "", "", "Tổng cộng:", formatNumber(subtotal)],
      ["", "", "", "", `VAT (${vatRate}%):`, formatNumber(vatAmount)],
      ["", "", "", "", "Tổng thanh toán:", formatNumber(total)],
    ],
    theme: "grid",
    styles: {
      font: "Roboto",
      fontSize: 10,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [16, 185, 129], // emerald-500
      textColor: 255,
      fontStyle: "bold",
      halign: "center",
    },
    footStyles: {
      fillColor: [243, 244, 246], // gray-100
      textColor: [0, 0, 0],
      fontStyle: "bold",
      halign: "right",
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 15 }, // STT
      1: { halign: "left", cellWidth: 50 }, // Tên cây
      2: { halign: "center", cellWidth: 30 }, // Quy cách
      3: { halign: "center", cellWidth: 15 }, // SL
      4: { halign: "right", cellWidth: 35 }, // Đơn giá
      5: { halign: "right", cellWidth: 40 }, // Thành tiền
    },
  });

  // Signature Section
  const finalY = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 15;

  doc.setFontSize(11);
  doc.setFont("Roboto", "bold");
  doc.text("Cung cấp bởi", 40, finalY);
  doc.text("Xác nhận của Khách Hàng", 140, finalY);

  doc.setFont("Roboto", "normal");
  doc.text("CÔNG TY TNHH DỊCH VỤ", 30, finalY + 7);
  doc.text("LỘC XANH", 45, finalY + 14);
  doc.text("(Ký và ghi rõ họ tên)", 140, finalY + 7);

  // Footer
  doc.setFontSize(8);
  doc.setFont("Roboto", "italic");
  doc.text(
    `Bảng kê tháng ${month}/${year} • In ngày ${new Date().toLocaleDateString("vi-VN")}`,
    105,
    280,
    { align: "center" }
  );

  return doc;
}
