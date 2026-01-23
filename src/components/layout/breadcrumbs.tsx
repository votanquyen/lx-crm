"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Vietnamese labels for route segments
 * Maps URL segments to readable Vietnamese labels
 */
const ROUTE_LABELS: Record<string, string> = {
  // Main sections
  customers: "Khách hàng",
  invoices: "Hóa đơn",
  "bang-ke": "Bảng Kê",
  quotations: "Báo giá",
  "plant-types": "Cây xanh",
  contracts: "Hợp đồng",
  payments: "Thanh toán",
  care: "Lịch chăm sóc",
  exchanges: "Đổi cây",
  analytics: "Báo cáo",
  admin: "Quản trị",
  users: "Người dùng",

  // Sub-pages
  new: "Tạo mới",
  edit: "Chỉnh sửa",
  "record-payment": "Ghi nhận thanh toán",
  complete: "Hoàn thành",
  today: "Hôm nay",
  "daily-schedule": "Lịch hàng ngày",
  execute: "Thực hiện",
};

interface BreadcrumbItem {
  label: string;
  href: string;
  isLast: boolean;
}

/**
 * Dynamic breadcrumb component that auto-generates from URL pathname
 * Supports Vietnamese labels and ID detection
 */
export function Breadcrumbs() {
  const pathname = usePathname();

  // Skip breadcrumbs on homepage
  if (pathname === "/") {
    return null;
  }

  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];

  let currentPath = "";

  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;

    // Check if segment is an ID (UUID or numeric)
    const isId = /^[0-9a-f-]{36}$/.test(segment) || /^\d+$/.test(segment);

    // Get label from mapping or format the segment
    let label = ROUTE_LABELS[segment];

    if (!label) {
      if (isId) {
        // For IDs, use a generic label based on parent context
        const parentSegment = segments[index - 1];
        label = getIdLabel(parentSegment);
      } else {
        // Format unknown segments: kebab-case to Title Case
        label = segment
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      }
    }

    breadcrumbs.push({
      label,
      href: currentPath,
      isLast,
    });
  });

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm">
        {/* Home link */}
        <li>
          <Link
            href="/"
            className="hover:text-foreground flex items-center transition-colors"
            aria-label="Trang chủ"
          >
            <Home className="h-4 w-4" />
          </Link>
        </li>
        <li>
          <ChevronRight className="h-3.5 w-3.5" />
        </li>

        {/* Dynamic segments */}
        {breadcrumbs.map((crumb) => (
          <li key={crumb.href} className="flex items-center gap-1.5">
            {crumb.isLast ? (
              <span className="text-foreground font-medium" aria-current="page">
                {crumb.label}
              </span>
            ) : (
              <>
                <Link
                  href={crumb.href}
                  className={cn(
                    "hover:text-foreground transition-colors",
                    "max-w-[150px] truncate"
                  )}
                >
                  {crumb.label}
                </Link>
                <ChevronRight className="h-3.5 w-3.5" />
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/**
 * Get a Vietnamese label for ID-based routes
 */
function getIdLabel(parentSegment: string | undefined): string {
  switch (parentSegment) {
    case "customers":
      return "Chi tiết khách hàng";
    case "invoices":
      return "Chi tiết hóa đơn";
    case "quotations":
      return "Chi tiết báo giá";
    case "contracts":
      return "Chi tiết hợp đồng";
    case "payments":
      return "Chi tiết thanh toán";
    case "plant-types":
      return "Chi tiết cây";
    case "care":
      return "Chi tiết lịch";
    case "exchanges":
      return "Chi tiết yêu cầu";
    default:
      return "Chi tiết";
  }
}
