/**
 * Morning Briefing PDF Generator
 * Generates printable daily route schedule for drivers
 */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import type { DailySchedule, ScheduledExchange, Customer } from "@prisma/client";

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

  // Calculate totals
  const totalStops = schedule.exchanges.length;
  const totalPlants = schedule.exchanges.reduce((sum, ex) => sum + ex.totalPlantCount, 0);
  const totalDuration = schedule.exchanges.reduce(
    (sum, ex) => sum + ex.estimatedDurationMins,
    0
  );

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("LOC XANH - LICH TRINH HOM NAY", 105, 20, { align: "center" });

  // Date
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  const dateStr = format(new Date(schedule.scheduleDate), "EEEE, dd/MM/yyyy", {
    locale: vi,
  });
  doc.text(dateStr.toUpperCase(), 105, 30, { align: "center" });

  // Summary Box
  doc.setFontSize(11);
  doc.setDrawColor(200);
  doc.setFillColor(240, 240, 240);
  doc.rect(15, 38, 180, 25, "FD");

  doc.setFont("helvetica", "bold");
  doc.text("TONG QUAN:", 20, 45);

  doc.setFont("helvetica", "normal");
  doc.text(`So diem dung: ${totalStops}`, 20, 52);
  doc.text(`Tong so cay: ${totalPlants}`, 75, 52);
  doc.text(`Thoi gian du kien: ${totalDuration} phut`, 130, 52);

  doc.text(`Ma lich trinh: ${schedule.id.slice(0, 8).toUpperCase()}`, 20, 59);
  doc.text(
    `Trang thai: ${schedule.status === "APPROVED" ? "DA DUYET" : schedule.status}`,
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
    head: [["#", "KHACH HANG", "DIA CHI", "DIEN THOAI", "SO CAY", "GIO", "THOI GIAN"]],
    body: tableData,
    theme: "grid",
    styles: {
      font: "helvetica",
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
  doc.setFont("helvetica", "bold");
  doc.text("GHI CHU:", 15, finalY + 10);

  doc.setFont("helvetica", "normal");
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
  doc.setFont("helvetica", "bold");
  doc.text("LAI XE:", 20, signY);
  doc.text("QUAN LY:", 120, signY);

  doc.setFont("helvetica", "normal");
  doc.line(20, signY + 15, 80, signY + 15);
  doc.line(120, signY + 15, 180, signY + 15);

  doc.setFontSize(8);
  doc.text("(Ky va ghi ro ho ten)", 35, signY + 20);
  doc.text("(Ky va ghi ro ho ten)", 135, signY + 20);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128);
  doc.text(
    `In luc: ${format(new Date(), "dd/MM/yyyy HH:mm")}`,
    105,
    280,
    { align: "center" }
  );
  doc.text("Loc Xanh - He thong quan ly cham soc cay thue", 105, 285, {
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
