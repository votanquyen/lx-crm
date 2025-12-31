/**
 * Morning Briefing PDF Generator
 * Generates printable daily route schedule for drivers
 */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import type { DailySchedule, ScheduledExchange, Customer } from "@prisma/client";
import { setupVietnameseFonts } from "@/lib/pdf-fonts";

interface ScheduleWithDetails extends DailySchedule {
  exchanges: (ScheduledExchange & {
    customer: Pick<Customer, "code" | "companyName" | "address" | "district" | "contactPhone">;
  })[];
}

/**
 * Generate morning briefing PDF for daily schedule
 */
export function generateMorningBriefingPDF(schedule: ScheduleWithDetails): jsPDF {
  const doc = new jsPDF();

  // Setup Vietnamese fonts
  setupVietnameseFonts(doc);

  // Calculate totals
  const totalStops = schedule.exchanges.length;
  const totalPlants = schedule.exchanges.reduce((sum, ex) => sum + ex.totalPlantCount, 0);
  const totalDuration = schedule.exchanges.reduce(
    (sum, ex) => sum + ex.estimatedDurationMins,
    0
  );

  // Header
  doc.setFontSize(20);
  doc.setFont("Roboto", "bold");
  doc.text("LỘC XANH - LỊCH TRÌNH HÔM NAY", 105, 20, { align: "center" });

  // Date
  doc.setFontSize(14);
  doc.setFont("Roboto", "normal");
  const dateStr = format(new Date(schedule.scheduleDate), "EEEE, dd/MM/yyyy", {
    locale: vi,
  });
  doc.text(dateStr.toUpperCase(), 105, 30, { align: "center" });

  // Summary Box
  doc.setFontSize(11);
  doc.setDrawColor(200);
  doc.setFillColor(240, 240, 240);
  doc.rect(15, 38, 180, 25, "FD");

  doc.setFont("Roboto", "bold");
  doc.text("TỔNG QUAN:", 20, 45);

  doc.setFont("Roboto", "normal");
  doc.text(`Số điểm dừng: ${totalStops}`, 20, 52);
  doc.text(`Tổng số cây: ${totalPlants}`, 75, 52);
  doc.text(`Thời gian dự kiến: ${totalDuration} phút`, 130, 52);

  doc.text(`Mã lịch trình: ${schedule.id.slice(0, 8).toUpperCase()}`, 20, 59);
  doc.text(
    `Trạng thái: ${schedule.status === "APPROVED" ? "ĐÃ DUYỆT" : schedule.status}`,
    130,
    59
  );

  // Stops Table
  const tableData = schedule.exchanges.map((ex) => {
    // Format estimated arrival time
    const estimatedTime = ex.estimatedArrival
      ? format(new Date(ex.estimatedArrival), "HH:mm")
      : "---";

    return [
      `${ex.stopOrder}`,
      ex.customer.companyName,
      `${ex.customer.address}, ${ex.customer.district}`,
      ex.customer.contactPhone || "---",
      `${ex.totalPlantCount}`,
      estimatedTime,
      `${ex.estimatedDurationMins}'`,
    ];
  });

  autoTable(doc, {
    startY: 70,
    head: [["#", "KHÁCH HÀNG", "ĐỊA CHỈ", "ĐIỆN THOẠI", "SỐ CÂY", "GIỜ", "T.GIAN"]],
    body: tableData,
    theme: "grid",
    styles: {
      font: "Roboto", // Use our custom font
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: "bold",
      halign: "center",
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 45 },
      2: { cellWidth: 50 },
      3: { cellWidth: 25 },
      4: { cellWidth: 15, halign: "center" },
      5: { cellWidth: 20, halign: "center" },
      6: { cellWidth: 20, halign: "center" },
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  });

  // Notes section
  const finalY = (doc as any).lastAutoTable.finalY || 150;

  doc.setFontSize(10);
  doc.setFont("Roboto", "bold");
  doc.text("GHI CHÚ:", 15, finalY + 10);

  doc.setFont("Roboto", "normal");
  doc.setDrawColor(200);
  doc.rect(15, finalY + 13, 180, 30);

  if (schedule.notes) {
    doc.setFontSize(9);
    const splitNotes = doc.splitTextToSize(schedule.notes, 170);
    doc.text(splitNotes, 20, finalY + 18);
  }

  // Signature section
  const signY = finalY + 50;

  doc.setFontSize(10);
  doc.setFont("Roboto", "bold");
  doc.text("LÁI XE:", 20, signY);
  doc.text("QUẢN LÝ:", 120, signY);

  doc.setFont("Roboto", "normal");
  doc.line(20, signY + 15, 80, signY + 15);
  doc.line(120, signY + 15, 180, signY + 15);

  doc.setFontSize(8);
  doc.text("(Ký và ghi rõ họ tên)", 35, signY + 20);
  doc.text("(Ký và ghi rõ họ tên)", 135, signY + 20);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128);
  doc.text(
    `In lúc: ${format(new Date(), "dd/MM/yyyy HH:mm")}`,
    105,
    280,
    { align: "center" }
  );
  doc.text("Lộc Xanh - Hệ thống quản lý chăm sóc cây thuê", 105, 285, {
    align: "center",
  });

  return doc;
}

/**
 * Generate and download PDF
 */
export function downloadMorningBriefing(schedule: ScheduleWithDetails): void {
  const doc = generateMorningBriefingPDF(schedule);
  const dateStr = format(new Date(schedule.scheduleDate), "yyyy-MM-dd");
  const filename = `lich-trinh-${dateStr}.pdf`;
  doc.save(filename);
}

/**
 * Generate PDF as blob for preview
 */
export function generateMorningBriefingBlob(schedule: ScheduleWithDetails): Blob {
  const doc = generateMorningBriefingPDF(schedule);
  return doc.output("blob");
}
