/**
 * Quotation PDF Generator
 * Generates professional quotation documents for customers
 */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { setupVietnameseFonts } from "@/lib/pdf-fonts";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

/**
 * Quotation data structure for PDF generation
 */
export interface QuotationPDFData {
  quoteNumber: string;
  title: string | null;
  validFrom: Date;
  validUntil: Date;
  notes: string | null;
  customer: {
    code: string;
    companyName: string;
    address: string;
    contactPhone: string | null;
    contactEmail: string | null;
    taxCode: string | null;
  };
  createdBy: {
    name: string | null;
  } | null;
  items: Array<{
    plantType: {
      code: string;
      name: string;
      description: string | null;
    };
    quantity: number;
    unitPrice: number;
    discountRate: number;
    totalPrice: number;
    notes: string | null;
  }>;
  subtotal: number;
  discountRate: number;
  discountAmount: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
}

/**
 * Generate quotation PDF document
 */
export function generateQuotationPDF(data: QuotationPDFData): jsPDF {
  const doc = new jsPDF();

  // Setup Vietnamese fonts
  setupVietnameseFonts(doc);

  const {
    quoteNumber,
    title,
    validFrom,
    validUntil,
    notes,
    customer,
    createdBy,
    items,
    subtotal,
    discountRate,
    discountAmount,
    vatRate,
    vatAmount,
    totalAmount,
  } = data;

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
  doc.text("BÁO GIÁ DỊCH VỤ CHO THUÊ CÂY XANH", 105, 52, { align: "center" });

  // Quote Number and Date
  doc.setFontSize(11);
  doc.setFont("Roboto", "normal");
  doc.text(`Số: ${quoteNumber}`, 105, 60, { align: "center" });

  // Customer Info Section
  doc.setFontSize(11);
  doc.setFont("Roboto", "bold");
  doc.text("Kính gửi:", 20, 72);

  doc.setFont("Roboto", "normal");
  doc.text(`Công ty: ${customer.companyName}`, 20, 80);
  doc.text(`Địa chỉ: ${customer.address}`, 20, 87);
  if (customer.contactPhone) {
    doc.text(`Điện thoại: ${customer.contactPhone}`, 20, 94);
  }
  if (customer.taxCode) {
    doc.text(`Mã số thuế: ${customer.taxCode}`, 120, 94);
  }

  // Title line
  if (title) {
    doc.setFont("Roboto", "bold");
    doc.text(`Tiêu đề: ${title}`, 20, 104);
  }

  // Validity period
  const validFromStr = format(new Date(validFrom), "dd/MM/yyyy", { locale: vi });
  const validUntilStr = format(new Date(validUntil), "dd/MM/yyyy", { locale: vi });
  doc.setFont("Roboto", "normal");
  doc.text(`Hiệu lực: ${validFromStr} - ${validUntilStr}`, 20, title ? 111 : 104);

  // Items Table
  const tableStartY = title ? 118 : 111;
  const tableData = items.map((item, index) => [
    `${index + 1}`,
    item.plantType.code,
    item.plantType.name,
    `${item.quantity}`,
    formatCurrency(item.unitPrice),
    item.discountRate > 0 ? `${item.discountRate}%` : "-",
    formatCurrency(item.totalPrice),
  ]);

  autoTable(doc, {
    startY: tableStartY,
    head: [["STT", "Mã cây", "Tên cây", "SL", "Đơn giá/tháng", "CK", "Thành tiền"]],
    body: tableData,
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
    columnStyles: {
      0: { halign: "center", cellWidth: 12 }, // STT
      1: { halign: "center", cellWidth: 20 }, // Mã cây
      2: { halign: "left", cellWidth: 55 }, // Tên cây
      3: { halign: "center", cellWidth: 15 }, // SL
      4: { halign: "right", cellWidth: 30 }, // Đơn giá
      5: { halign: "center", cellWidth: 15 }, // CK
      6: { halign: "right", cellWidth: 35 }, // Thành tiền
    },
  });

  // Summary Section
  let finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // Subtotal
  doc.setFontSize(11);
  doc.setFont("Roboto", "normal");
  doc.text("Tổng cộng:", 130, finalY);
  doc.text(formatCurrency(subtotal), 190, finalY, { align: "right" });

  // Discount (if any)
  if (discountRate > 0 && discountAmount > 0) {
    finalY += 7;
    doc.text(`Chiết khấu (${discountRate}%):`, 130, finalY);
    doc.text(`-${formatCurrency(discountAmount)}`, 190, finalY, { align: "right" });
  }

  // VAT
  finalY += 7;
  doc.text(`Thuế VAT (${vatRate}%):`, 130, finalY);
  doc.text(formatCurrency(vatAmount), 190, finalY, { align: "right" });

  // Total
  finalY += 7;
  doc.setFont("Roboto", "bold");
  doc.text("TỔNG THANH TOÁN:", 130, finalY);
  doc.text(formatCurrency(totalAmount), 190, finalY, { align: "right" });

  // Notes
  if (notes) {
    finalY += 15;
    doc.setFont("Roboto", "bold");
    doc.text("Ghi chú:", 20, finalY);
    doc.setFont("Roboto", "normal");
    finalY += 7;

    // Split notes into lines if too long
    const noteLines = doc.splitTextToSize(notes, 170);
    doc.text(noteLines, 20, finalY);
    finalY += noteLines.length * 5;
  }

  // Terms
  finalY += 15;
  doc.setFontSize(10);
  doc.setFont("Roboto", "bold");
  doc.text("Điều kiện:", 20, finalY);
  doc.setFont("Roboto", "normal");
  finalY += 6;
  doc.text("• Giá trên chưa bao gồm VAT (nếu không ghi chú)", 20, finalY);
  finalY += 5;
  doc.text("• Thanh toán hàng tháng theo chu kỳ hợp đồng", 20, finalY);
  finalY += 5;
  doc.text("• Bao gồm dịch vụ chăm sóc và thay thế cây định kỳ", 20, finalY);

  // Signature Section
  finalY += 20;
  doc.setFontSize(11);
  doc.setFont("Roboto", "bold");
  doc.text("ĐẠI DIỆN LỘC XANH", 50, finalY, { align: "center" });
  doc.text("ĐẠI DIỆN KHÁCH HÀNG", 160, finalY, { align: "center" });

  doc.setFont("Roboto", "normal");
  doc.text("(Ký và ghi rõ họ tên)", 50, finalY + 7, { align: "center" });
  doc.text("(Ký và ghi rõ họ tên)", 160, finalY + 7, { align: "center" });

  if (createdBy?.name) {
    doc.text(createdBy.name, 50, finalY + 30, { align: "center" });
  }

  // Footer
  doc.setFontSize(8);
  doc.setFont("Roboto", "italic");
  doc.text(
    `Báo giá ${quoteNumber} • In ngày ${format(new Date(), "dd/MM/yyyy", { locale: vi })}`,
    105,
    285,
    { align: "center" }
  );

  return doc;
}

/**
 * Format currency for PDF display
 */
function formatCurrency(amount: number): string {
  return amount.toLocaleString("vi-VN") + " đ";
}

/**
 * Generate PDF and return as base64 string
 */
export function generateQuotationPDFBase64(data: QuotationPDFData): string {
  const doc = generateQuotationPDF(data);
  return doc.output("datauristring");
}

/**
 * Generate PDF and return as Blob
 */
export function generateQuotationPDFBlob(data: QuotationPDFData): Blob {
  const doc = generateQuotationPDF(data);
  return doc.output("blob");
}
