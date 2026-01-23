/**
 * Exchange Request List Component
 * Main list with pagination and filters
 */
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExchangeStatus, ExchangePriority } from "@prisma/client";
import { toast } from "sonner";
import { ExchangeRequestCard } from "./exchange-request-card";
import { ExchangeFilters } from "./exchange-filters";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { approveExchangeRequest, cancelExchangeRequest } from "@/actions/exchange-requests";
import type { ExchangeRequest, Customer } from "@prisma/client";

interface ExchangeRequestListProps {
  initialData: {
    data: (ExchangeRequest & {
      customer: Pick<Customer, "id" | "code" | "companyName" | "address" | "district">;
    })[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export function ExchangeRequestList({ initialData }: ExchangeRequestListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<ExchangeStatus | undefined>();
  const [priority, setPriority] = useState<ExchangePriority | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(initialData.pagination.page);

  const filteredData = initialData.data.filter((request) => {
    if (status && request.status !== status) return false;
    if (priority && request.priority !== priority) return false;
    if (
      searchQuery &&
      !request.customer.companyName.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleApprove = (id: string) => {
    startTransition(async () => {
      const result = await approveExchangeRequest(id);
      if (result.success) {
        toast.success("Đã duyệt yêu cầu đổi cây");
        router.refresh();
      } else {
        toast.error(result.error || "Không thể duyệt yêu cầu");
      }
    });
  };

  const handleCancel = async (id: string) => {
    const reason = prompt("Lý do hủy:");
    if (!reason) return;

    startTransition(async () => {
      const result = await cancelExchangeRequest({ id, reason });
      if (result.success) {
        toast.success("Đã hủy yêu cầu");
        router.refresh();
      } else {
        toast.error(result.error || "Không thể hủy yêu cầu");
      }
    });
  };

  const handleView = (id: string) => {
    window.location.href = `/exchanges/${id}`;
  };

  const handleClearFilters = () => {
    setStatus(undefined);
    setPriority(undefined);
    setSearchQuery("");
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <ExchangeFilters
        status={status}
        priority={priority}
        searchQuery={searchQuery}
        onStatusChange={setStatus}
        onPriorityChange={setPriority}
        onSearchChange={setSearchQuery}
        onClear={handleClearFilters}
      />

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Hiển thị <span className="font-semibold">{filteredData.length}</span> yêu cầu
        {initialData.pagination.total !== filteredData.length && (
          <span> (từ tổng số {initialData.pagination.total})</span>
        )}
      </div>

      {/* Request Cards */}
      {filteredData.length === 0 ? (
        <div className="rounded-lg bg-gray-50 py-12 text-center">
          <p className="text-gray-500">Không có yêu cầu đổi cây nào</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredData.map((request) => (
            <ExchangeRequestCard
              key={request.id}
              request={request}
              onApprove={handleApprove}
              onCancel={handleCancel}
              onView={handleView}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {initialData.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-4">
          <div className="text-sm text-gray-600">
            Trang {currentPage} / {initialData.pagination.totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === initialData.pagination.totalPages}
              onClick={() =>
                setCurrentPage((p) => Math.min(initialData.pagination.totalPages, p + 1))
              }
            >
              Sau
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}

      {isPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="rounded-lg bg-white px-6 py-4 shadow-lg">Đang xử lý...</div>
        </div>
      )}
    </div>
  );
}
