/**
 * Exchange Request Filters Component
 * Filters for status, priority, and customer search
 */
"use client";

import { ExchangeStatus, ExchangePriority } from "@prisma/client";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface ExchangeFiltersProps {
  status?: ExchangeStatus;
  priority?: ExchangePriority;
  searchQuery?: string;
  onStatusChange: (status?: ExchangeStatus) => void;
  onPriorityChange: (priority?: ExchangePriority) => void;
  onSearchChange: (query: string) => void;
  onClear: () => void;
}

export function ExchangeFilters({
  status,
  priority,
  searchQuery,
  onStatusChange,
  onPriorityChange,
  onSearchChange,
  onClear,
}: ExchangeFiltersProps) {
  const hasFilters = status || priority || searchQuery;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Tìm theo khách hàng..."
          value={searchQuery || ""}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Status Filter */}
      <Select
        value={status || "all"}
        onValueChange={(value) =>
          onStatusChange(value === "all" ? undefined : (value as ExchangeStatus))
        }
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Trạng thái" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả trạng thái</SelectItem>
          <SelectItem value="PENDING">Chờ duyệt</SelectItem>
          <SelectItem value="SCHEDULED">Đã lên lịch</SelectItem>
          <SelectItem value="IN_PROGRESS">Đang thực hiện</SelectItem>
          <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
          <SelectItem value="CANCELLED">Đã hủy</SelectItem>
        </SelectContent>
      </Select>

      {/* Priority Filter */}
      <Select
        value={priority || "all"}
        onValueChange={(value) =>
          onPriorityChange(value === "all" ? undefined : (value as ExchangePriority))
        }
      >
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder="Độ ưu tiên" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả mức độ</SelectItem>
          <SelectItem value="URGENT">Khẩn cấp</SelectItem>
          <SelectItem value="HIGH">Cao</SelectItem>
          <SelectItem value="MEDIUM">Trung bình</SelectItem>
          <SelectItem value="LOW">Thấp</SelectItem>
        </SelectContent>
      </Select>

      {/* Clear Filters */}
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onClear} className="gap-2">
          <X className="h-4 w-4" />
          Xóa bộ lọc
        </Button>
      )}
    </div>
  );
}
