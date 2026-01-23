/**
 * Monthly Statement PDF Generator - Pro Max Black & White Edition
 * 
 * Thiết kế tối ưu cho IN TRẮNG ĐEN:
 * - Không dùng màu nền (fill colors)
 * - Sử dụng bold, borders, và spacing để tạo hierarchy
 * - Text đen rõ ràng, dễ đọc
 * - Layout chuyên nghiệp theo mẫu gốc của công ty
 */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { StatementDTO, PlantItem } from "@/types/monthly-statement";
import { setupVietnameseFonts } from "@/lib/pdf-fonts";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

// Extend jsPDF with autoTable properties
interface JsPDFWithAutoTable extends jsPDF {
    lastAutoTable: { finalY: number };
}

/**
 * Format number with Vietnamese locale (no decimals)
 */
function formatNumber(value: number): string {
    return Math.round(value).toLocaleString("vi-VN");
}

/**
 * Calculate VAT percentage from decimal (0.08 -> 8)
 */
function getVatPercent(vatRate: number): number {
    // If vatRate is less than 1, it's decimal (0.08 = 8%)
    // If >= 1, it's already percent (8 = 8%)
    return vatRate < 1 ? Math.round(vatRate * 100) : Math.round(vatRate);
}

/**
 * Generate monthly statement PDF - Black & White Pro Max
 * Matches company templates for professional printing
 */
export function generateMonthlyStatementPDF(statement: StatementDTO): jsPDF {
    const doc = new jsPDF();

    // Setup Vietnamese fonts FIRST
    setupVietnameseFonts(doc);

    const {
        customer,
        periodStart,
        periodEnd,
        contactName,
        plants,
        subtotal,
        vatRate,
        vatAmount,
        total,
    } = statement;

    let y = 14;
    const leftMargin = 14;
    const rightEdge = 196;
    const pageWidth = 210;

    // ========== COMPANY HEADER (Left-aligned, bold) ==========
    doc.setFontSize(12);
    doc.setFont("Roboto", "bold");
    doc.text("CÔNG TY TNHH DỊCH VỤ LỘC XANH", leftMargin, y);

    y += 5;
    doc.setFontSize(9);
    doc.setFont("Roboto", "normal");
    doc.text("MST   :0315712748", leftMargin, y);

    y += 5;
    doc.text("ĐC: B20, Park Riverside, 101 Bưng Ông Thoàn, P Long Trường, TP.HCM", leftMargin, y);

    y += 5;
    doc.text("ĐT: 08. 372 96371 / 0 937 937 304  *  Fax: 08.372 96371", leftMargin, y);

    y += 5;
    doc.text("Website: www.locxanh.vn       Email : buivi@locxanh.vn", leftMargin, y);

    // ========== DOCUMENT TITLE (Centered) ==========
    y += 10;
    doc.setFontSize(12);
    doc.setFont("Roboto", "bold");
    doc.text("DANH SÁCH CÂY XANH VĂN PHÒNG", pageWidth / 2, y, { align: "center" });

    // ========== CUSTOMER NAME (Bold, underlined, centered) ==========
    y += 7;
    doc.setFontSize(11);
    doc.setFont("Roboto", "bold");
    const customerName = customer?.companyName?.toUpperCase() || "";
    doc.text(customerName, pageWidth / 2, y, { align: "center" });

    // Underline
    const textWidth = doc.getTextWidth(customerName);
    const underlineX = (pageWidth - textWidth) / 2;
    doc.setLineWidth(0.3);
    doc.line(underlineX, y + 1, underlineX + textWidth, y + 1);

    // ========== INVOICE REFERENCE ==========
    y += 8;
    doc.setFontSize(10);
    doc.setFont("Roboto", "normal");
    const invoiceDate = format(new Date(), "dd/MM/yyyy", { locale: vi });
    doc.text("Đính kèm hoá đơn số: _____ Ngày " + invoiceDate, pageWidth / 2, y, { align: "center" });

    // ========== CUSTOMER MST ==========
    y += 7;
    if (customer?.code) {
        doc.text("MST   :" + customer.code, leftMargin, y);
        y += 5;
    }

    // ========== CUSTOMER ADDRESS ==========
    if (customer?.address) {
        doc.text(customer.address, leftMargin, y);
        y += 6;
    }

    // ========== PERIOD & CONTACT ==========
    const startDate = format(new Date(periodStart), "dd/MM/yyyy", { locale: vi });
    const endDate = format(new Date(periodEnd), "dd/MM/yyyy", { locale: vi });

    doc.text("Đợt  : Từ " + startDate + "-" + endDate, leftMargin, y);

    // Contact on right
    const contact = contactName || customer?.contactName || "";
    if (contact) {
        doc.text("Ms.  " + contact, rightEdge, y, { align: "right" });
    }

    // ========== PLANT TABLE ==========
    y += 6;

    const tableData: (string | number)[][] = plants.map((plant: PlantItem, index: number) => [
        String(index + 1),
        plant.name,
        plant.sizeSpec || "",
        String(plant.quantity),
        formatNumber(plant.unitPrice),
        formatNumber(plant.total),
    ]);

    // Subtotal row inside table
    const subtotalRowNum = plants.length + 1;
    tableData.push([
        String(subtotalRowNum),
        "Tổng cộng",
        "",
        "",
        "",
        formatNumber(subtotal),
    ]);

    autoTable(doc, {
        startY: y,
        head: [["STT", "Tên Cây", "Quy Cách", "SL", "Đơn Giá/chậu/tháng", "Thành Tiền"]],
        body: tableData,
        theme: "grid",
        styles: {
            font: "Roboto",
            fontSize: 10,
            cellPadding: 3,
            lineColor: [0, 0, 0],
            lineWidth: 0.2,
            textColor: [0, 0, 0],
        },
        headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            fontStyle: "bold",
            halign: "center",
            lineWidth: 0.3,
        },
        bodyStyles: {
            fillColor: [255, 255, 255],
        },
        columnStyles: {
            0: { halign: "center", cellWidth: 12 },
            1: { halign: "left", cellWidth: 58 },
            2: { halign: "center", cellWidth: 25 },
            3: { halign: "center", cellWidth: 12 },
            4: { halign: "right", cellWidth: 40 },
            5: { halign: "right", cellWidth: 35 },
        },
        margin: { left: leftMargin, right: leftMargin },
        didParseCell: (data) => {
            // Make last row (subtotal) bold
            if (data.row.index === tableData.length - 1 && data.section === "body") {
                data.cell.styles.fontStyle = "bold";
            }
        },
    });

    // ========== VAT & TOTAL SECTION ==========
    let finalY = (doc as JsPDFWithAutoTable).lastAutoTable.finalY;

    const vatPercent = getVatPercent(vatRate);

    autoTable(doc, {
        startY: finalY,
        body: [
            [
                { content: "Thuế GTGT (" + vatPercent + "%)", styles: { fontStyle: "normal" } },
                { content: formatNumber(vatAmount), styles: { halign: "right" as const } },
            ],
            [
                { content: "Tổng giá trị thanh toán", styles: { fontStyle: "bold" } },
                { content: formatNumber(total), styles: { halign: "right" as const, fontStyle: "bold" } },
            ],
        ],
        theme: "grid",
        styles: {
            font: "Roboto",
            fontSize: 10,
            cellPadding: 3,
            lineColor: [0, 0, 0],
            lineWidth: 0.2,
            textColor: [0, 0, 0],
        },
        columnStyles: {
            0: { cellWidth: 147 },
            1: { cellWidth: 35 },
        },
        margin: { left: leftMargin, right: leftMargin },
    });

    // ========== SIGNATURE SECTION ==========
    finalY = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 12;

    doc.setFontSize(10);
    doc.setFont("Roboto", "normal");
    doc.text("Cung cấp bởi,", leftMargin, finalY);
    doc.text("Xác nhận của Khách Hàng", rightEdge - 40, finalY);

    finalY += 6;
    doc.setFont("Roboto", "bold");
    doc.text("CÔNG TY TNHH DỊCH VỤ LỘC XANH", leftMargin, finalY);

    doc.setFont("Roboto", "italic");
    doc.text("(Ký và ghi rõ họ tên)", rightEdge - 40, finalY);

    return doc;
}

/**
 * Generate PDF and return as Blob for download
 */
export function generateMonthlyStatementPDFBlob(statement: StatementDTO): Blob {
    const doc = generateMonthlyStatementPDF(statement);
    return doc.output("blob");
}
