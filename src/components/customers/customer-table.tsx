import Link from "next/link";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  MoreHorizontal,
  ExternalLink,
  Receipt,
  AlertTriangle,
} from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import type { CustomerStatus } from "@prisma/client";

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
  if (customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-slate-50 p-4 border shadow-sm">
          <Building2 className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <h3 className="mt-4 text-base font-bold text-slate-900">Không tìm thấy khách hàng</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-border">
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Mã/Tên Công Ty</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hidden md:table-cell">Khu vực</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hidden lg:table-cell">Liên hệ</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hidden xl:table-cell text-right">Doanh thu/Tháng</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hidden xl:table-cell text-right">Công nợ</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Trạng thái</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right w-[100px]">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {customers.map((customer) => {
              const hasDebt = (customer.financials?.totalDebt ?? 0) > 0;
              return (
                <tr key={customer.id} className="data-table-row group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-9 w-9 rounded flex items-center justify-center text-xs font-bold border",
                        hasDebt ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-primary/5 text-primary border-primary/10"
                      )}>
                        {customer.companyName.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <Link
                          href={`/customers/${customer.id}`}
                          className="text-sm font-bold text-slate-900 hover:text-primary transition-colors truncate"
                        >
                          {customer.companyName}
                        </Link>
                        <span className="text-[10px] font-bold text-muted-foreground tracking-tight">{customer.code}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="truncate">{customer.district || "---"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1 text-xs font-semibold text-slate-700">
                        <span className="truncate">{customer.contactName || "---"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
                        {customer.contactPhone && (
                          <span className="flex items-center gap-1"><Phone className="h-2.5 w-2.5" /> {customer.contactPhone}</span>
                        )}
                        {customer.contactEmail && (
                          <span className="flex items-center gap-1"><Mail className="h-2.5 w-2.5" /> ✉</span>
                        )}
                      </div>
                    </div>
                  </td>
                  {/* Financial Columns */}
                  <td className="px-4 py-3 hidden xl:table-cell text-right">
                    <span className="text-sm font-black text-emerald-600">
                      {formatCurrency(customer.financials?.monthlyContractValue ?? 0)}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell text-right">
                    {hasDebt ? (
                      <span className="flex items-center justify-end gap-1 text-sm font-black text-rose-600">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {formatCurrency(customer.financials?.totalDebt ?? 0)}
                      </span>
                    ) : (
                      <span className="text-sm font-medium text-slate-400">0đ</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className={cn(
                      "status-badge",
                      customer.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        customer.status === "LEAD" ? "bg-blue-50 text-blue-700 border-blue-200" :
                          customer.status === "INACTIVE" ? "bg-amber-50 text-amber-700 border-amber-200" :
                            "bg-slate-50 text-slate-600 border-slate-200"
                    )}>
                      {customer.status === "ACTIVE" ? "Hoạt động" :
                        customer.status === "LEAD" ? "Tiềm năng" :
                          customer.status === "INACTIVE" ? "Tạm ngưng" : "Đã hủy"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                      {/* Quick Action: View Invoices */}
                      <Link
                        href={`/invoices?customerId=${customer.id}`}
                        className="p-1.5 rounded hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                        title="Xem hóa đơn"
                      >
                        <Receipt className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/customers/${customer.id}`}
                        className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-primary transition-colors"
                        title="Xem chi tiết"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/customers/${customer.id}/edit`}
                        className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors"
                        title="Chỉnh sửa"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t bg-slate-50/30">
        <Pagination {...pagination} />
      </div>
    </div>
  );
}
