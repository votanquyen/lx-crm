/**
 * Customer Filters Component
 * Filter dropdowns for status, tier, district
 */
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface CustomerFiltersProps {
  districts: string[];
}

const STATUS_OPTIONS = [
  { value: "LEAD", label: "Tiềm năng" },
  { value: "ACTIVE", label: "Hoạt động" },
  { value: "INACTIVE", label: "Tạm ngưng" },
];

export function CustomerFilters({ districts }: CustomerFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentStatus = searchParams.get("status") ?? "";
  const currentDistrict = searchParams.get("district") ?? "";
  const hasDebt = searchParams.get("hasDebt") === "true";

  const activeFilters = [
    currentStatus && "status",
    currentDistrict && "district",
    hasDebt && "hasDebt",
  ].filter(Boolean).length;

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");

    startTransition(() => {
      router.push(`/customers?${params.toString()}`);
    });
  };

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("status");
    params.delete("district");
    params.delete("hasDebt");
    params.delete("page");

    startTransition(() => {
      router.push(`/customers?${params.toString()}`);
    });
  };

  const toggleDebt = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (hasDebt) {
      params.delete("hasDebt");
    } else {
      params.set("hasDebt", "true");
    }
    params.delete("page");

    startTransition(() => {
      router.push(`/customers?${params.toString()}`);
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="text-muted-foreground flex items-center gap-1 text-sm">
        <Filter className="h-4 w-4" aria-hidden="true" />
        <span>Lọc:</span>
      </div>

      <Select value={currentStatus || "all"} onValueChange={(v) => updateFilter("status", v)}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Trạng thái" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả trạng thái</SelectItem>
          {STATUS_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={currentDistrict || "all"} onValueChange={(v) => updateFilter("district", v)}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Quận/Huyện" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả quận</SelectItem>
          {districts.map((d) => (
            <SelectItem key={d} value={d}>
              {d}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant={hasDebt ? "default" : "outline"}
        size="sm"
        onClick={toggleDebt}
        disabled={isPending}
      >
        Còn nợ
      </Button>

      {activeFilters > 0 && (
        <>
          <div className="bg-border mx-1 h-6 w-px" />
          {/* Individual filter badges */}
          {currentStatus && (
            <Badge
              variant="secondary"
              className="hover:bg-secondary/80 cursor-pointer gap-1 pr-1"
              onClick={() => updateFilter("status", "all")}
            >
              {STATUS_OPTIONS.find((o) => o.value === currentStatus)?.label}
              <X className="h-3 w-3" aria-hidden="true" />
            </Badge>
          )}
          {currentDistrict && (
            <Badge
              variant="secondary"
              className="hover:bg-secondary/80 cursor-pointer gap-1 pr-1"
              onClick={() => updateFilter("district", "all")}
            >
              {currentDistrict}
              <X className="h-3 w-3" aria-hidden="true" />
            </Badge>
          )}
          {hasDebt && (
            <Badge
              variant="secondary"
              className="hover:bg-secondary/80 cursor-pointer gap-1 pr-1"
              onClick={toggleDebt}
            >
              Còn nợ
              <X className="h-3 w-3" aria-hidden="true" />
            </Badge>
          )}
          {activeFilters > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              disabled={isPending}
              className="h-6 px-2 text-xs"
            >
              Xóa tất cả
            </Button>
          )}
        </>
      )}
    </div>
  );
}
