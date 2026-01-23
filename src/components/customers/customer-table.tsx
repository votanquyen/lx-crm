"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Phone,
  MoreHorizontal,
  ExternalLink,
  Receipt,
  Pencil,
  Eye,
  AlertCircle,
} from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import type { CustomerStatus } from "@prisma/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { CustomerPreviewSheet } from "./customer-sheet";

// Convert UPPERCASE text to Title Case (handles Vietnamese)
function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

interface CustomerFinancials {
  totalDebt: number;
  monthlyContractValue: number;
}

interface Customer {
  id: string;
  code: string;
  companyName: string;
  address: string;
  district: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  // Secondary contact
  contact2Name?: string | null;
  contact2Phone?: string | null;
  contact2Email?: string | null;
  // Accounting contact
  accountingName?: string | null;
  accountingPhone?: string | null;
  accountingEmail?: string | null;
  status: CustomerStatus;
  financials?: CustomerFinancials;
  _count?: {
    customerPlants: number;
    stickyNotes: number;
    contracts: number;
  };
}

interface CustomerTableProps {
  customers: Customer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function CustomerTable({ customers, pagination }: CustomerTableProps) {
  const [previewId, setPreviewId] = useState<string | null>(null);

  if (customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full border bg-slate-50 p-4 shadow-sm">
          <Pencil className="text-muted-foreground/50 h-8 w-8" aria-hidden="true" />
        </div>
        <h3 className="mt-4 text-base font-bold text-slate-900">Không tìm thấy khách hàng</h3>
        <p className="text-muted-foreground mt-1 text-sm">Thử thay đổi từ khóa tìm kiếm</p>
      </div>
    );
  }

  return (
    <>
      <TooltipProvider>
        <div className="w-full">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-border border-b bg-slate-50/50">
                  <th className="w-[40%] px-4 py-3 text-xs font-semibold text-slate-500">
                    Khách hàng
                  </th>
                  <th className="hidden px-4 py-3 text-xs font-semibold text-slate-500 lg:table-cell">
                    Liên hệ
                  </th>
                  <th className="hidden px-4 py-3 text-right text-xs font-semibold text-slate-500 xl:table-cell">
                    Công nợ
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500">Trạng thái</th>
                  <th className="w-[60px] px-4 py-3 text-right text-xs font-semibold text-slate-500"></th>
                </tr>
              </thead>
              <tbody className="divide-border/50 divide-y">
                {customers.map((customer) => {
                  const hasDebt = (customer.financials?.totalDebt ?? 0) > 0;
                  return (
                    <tr
                      key={customer.id}
                      className="data-table-row group cursor-pointer transition-colors hover:bg-slate-50/50"
                      onClick={(e) => {
                        // Prevent opening preview if clicking links or buttons
                        if ((e.target as HTMLElement).closest("a, button")) return;
                        setPreviewId(customer.id);
                      }}
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex min-w-0 flex-col">
                          <Link
                            href={`/customers/${customer.id}`}
                            className="hover:text-primary truncate text-sm font-semibold text-slate-900 transition-colors hover:underline"
                            title={customer.companyName}
                          >
                            {toTitleCase(customer.companyName)}
                          </Link>
                          <div className="text-muted-foreground max-w-[400px] truncate text-xs">
                            {customer.address}
                          </div>
                        </div>
                      </td>
                      <td className="hidden px-4 py-2.5 lg:table-cell">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex cursor-help flex-col gap-0.5">
                              <div className="flex items-center gap-1 text-xs font-medium text-slate-700">
                                <span className="truncate">
                                  {customer.contactName || (
                                    <Badge
                                      variant="outline"
                                      className="text-muted-foreground text-[10px] font-normal"
                                    >
                                      Chưa cập nhật
                                    </Badge>
                                  )}
                                </span>
                              </div>
                              {customer.contactPhone && (
                                <div className="text-muted-foreground flex items-center gap-2 text-[11px]">
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" aria-hidden="true" /> {customer.contactPhone}
                                  </span>
                                </div>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-[300px]">
                            <div className="space-y-2.5 text-xs">
                              {/* Primary Contact */}
                              <div>
                                <p className="mb-1 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                                  Liên hệ chính
                                </p>
                                <p className="font-medium text-slate-900">
                                  {customer.contactName || "Chưa có"}
                                </p>
                                {customer.contactPhone && (
                                  <p className="text-muted-foreground">{customer.contactPhone}</p>
                                )}
                                {customer.contactEmail && (
                                  <p className="text-muted-foreground">{customer.contactEmail}</p>
                                )}
                              </div>
                              {/* Secondary Contact */}
                              {customer.contact2Name && (
                                <div className="border-t pt-2">
                                  <p className="mb-1 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                                    Liên hệ phụ
                                  </p>
                                  <p className="font-medium text-slate-900">
                                    {customer.contact2Name}
                                  </p>
                                  {customer.contact2Phone && (
                                    <p className="text-muted-foreground">
                                      {customer.contact2Phone}
                                    </p>
                                  )}
                                  {customer.contact2Email && (
                                    <p className="text-muted-foreground">
                                      {customer.contact2Email}
                                    </p>
                                  )}
                                </div>
                              )}
                              {/* Accounting Contact */}
                              {customer.accountingName && (
                                <div className="border-t pt-2">
                                  <p className="mb-1 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                                    Kế toán
                                  </p>
                                  <p className="font-medium text-slate-900">
                                    {customer.accountingName}
                                  </p>
                                  {customer.accountingPhone && (
                                    <p className="text-muted-foreground">
                                      {customer.accountingPhone}
                                    </p>
                                  )}
                                  {customer.accountingEmail && (
                                    <p className="text-muted-foreground">
                                      {customer.accountingEmail}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </td>

                      <td className="hidden px-4 py-2.5 text-right xl:table-cell">
                        {hasDebt ? (
                          <span className="inline-flex items-center gap-1 text-sm font-semibold text-rose-600">
                            <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                            {formatCurrency(customer.financials?.totalDebt ?? 0)}
                          </span>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-emerald-200 bg-emerald-50 text-[10px] font-normal text-emerald-600"
                          >
                            Không nợ
                          </Badge>
                        )}
                      </td>

                      <td className="px-4 py-2.5">
                        <div
                          className={cn(
                            "inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-medium",
                            customer.status === "ACTIVE"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : customer.status === "LEAD"
                                ? "border-blue-200 bg-blue-50 text-blue-700"
                                : customer.status === "INACTIVE"
                                  ? "border-amber-200 bg-amber-50 text-amber-700"
                                  : "border-slate-200 bg-slate-50 text-slate-600"
                          )}
                        >
                          {customer.status === "ACTIVE"
                            ? "Hoạt động"
                            : customer.status === "LEAD"
                              ? "Tiềm năng"
                              : customer.status === "INACTIVE"
                                ? "Tạm ngưng"
                                : "Đã hủy"}
                        </div>
                      </td>

                      <td className="px-4 py-2.5 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => setPreviewId(customer.id)}>
                              <Eye className="mr-2 h-4 w-4" aria-hidden="true" /> Xem nhanh
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/customers/${customer.id}`}
                                className="flex items-center"
                              >
                                <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" /> Chi tiết
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/customers?action=edit&id=${customer.id}`}
                                className="flex items-center"
                              >
                                <Pencil className="mr-2 h-4 w-4" aria-hidden="true" /> Chỉnh sửa
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/invoices?customerId=${customer.id}`}
                                className="flex items-center"
                              >
                                <Receipt className="mr-2 h-4 w-4" aria-hidden="true" /> Hóa đơn
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="border-t bg-slate-50/30 p-4">
            <Pagination {...pagination} />
          </div>
        </div>
      </TooltipProvider>

      <CustomerPreviewSheet
        customerId={previewId}
        open={!!previewId}
        onOpenChange={(open) => !open && setPreviewId(null)}
      />
    </>
  );
}
