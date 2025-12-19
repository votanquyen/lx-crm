/**
 * Analytics Export Buttons Component
 * Client-side export triggers for analytics data
 */
"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export type ExportType =
  | "monthly-revenue"
  | "invoice-aging"
  | "top-customers"
  | "overdue-invoices"
  | "contracts";

const exportOptions: { type: ExportType; label: string }[] = [
  { type: "monthly-revenue", label: "Doanh thu theo tháng" },
  { type: "invoice-aging", label: "Phân tích công nợ" },
  { type: "top-customers", label: "Khách hàng hàng đầu" },
  { type: "overdue-invoices", label: "Hóa đơn quá hạn" },
  { type: "contracts", label: "Báo cáo hợp đồng" },
];

interface AnalyticsExportButtonsProps {
  variant?: "default" | "outline";
}

export function AnalyticsExportButtons({
  variant = "outline",
}: AnalyticsExportButtonsProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (type: ExportType) => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/analytics/export?type=${type}`);

      if (!response.ok) {
        throw new Error("Export failed");
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || `export-${type}-${Date.now()}.csv`;

      // Download file
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);

      toast.success("Đã xuất file CSV thành công");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Không thể xuất dữ liệu");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} disabled={isExporting}>
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? "Đang xuất..." : "Xuất CSV"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Chọn báo cáo xuất</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {exportOptions.map((option) => (
          <DropdownMenuItem
            key={option.type}
            onClick={() => handleExport(option.type)}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Single export button for specific type
 */
interface SingleExportButtonProps {
  type: ExportType;
  label?: string;
  variant?: "default" | "outline" | "ghost";
}

export function SingleExportButton({
  type,
  label,
  variant = "outline",
}: SingleExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/analytics/export?type=${type}`);

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || `export-${type}-${Date.now()}.csv`;

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);

      toast.success("Đã xuất file CSV");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Không thể xuất dữ liệu");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant={variant}
      size="sm"
      onClick={handleExport}
      disabled={isExporting}
    >
      <Download className="h-3 w-3 mr-1" />
      {isExporting ? "..." : label || "Xuất CSV"}
    </Button>
  );
}
