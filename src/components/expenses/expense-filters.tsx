"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { EXPENSE_CATEGORY_LABELS } from "@/types/expense";
import type { ExpenseCategory } from "@prisma/client";

interface ExpenseFiltersProps {
  year: number;
  quarter: number | null;
  companyName: string;
  category: string;
  onYearChange: (year: number) => void;
  onQuarterChange: (quarter: number | null) => void;
  onCompanyNameChange: (name: string) => void;
  onCategoryChange: (category: string) => void;
  onReset: () => void;
}

const CATEGORIES = Object.entries(EXPENSE_CATEGORY_LABELS) as [ExpenseCategory, string][];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);
const QUARTERS = [
  { value: 1, label: "Quý 1" },
  { value: 2, label: "Quý 2" },
  { value: 3, label: "Quý 3" },
  { value: 4, label: "Quý 4" },
];

export function ExpenseFilters({
  year,
  quarter,
  companyName,
  category,
  onYearChange,
  onQuarterChange,
  onCompanyNameChange,
  onCategoryChange,
  onReset,
}: ExpenseFiltersProps) {
  const hasFilters = quarter !== null || companyName || category;

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="space-y-1">
        <Label className="text-xs">Năm</Label>
        <Select
          value={year.toString()}
          onValueChange={(v) => onYearChange(Number(v))}
        >
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {YEARS.map((y) => (
              <SelectItem key={y} value={y.toString()}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Quý</Label>
        <Select
          value={quarter?.toString() ?? "all"}
          onValueChange={(v) => onQuarterChange(v === "all" ? null : Number(v))}
        >
          <SelectTrigger className="w-24">
            <SelectValue placeholder="Tất cả" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {QUARTERS.map((q) => (
              <SelectItem key={q.value} value={q.value.toString()}>
                {q.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Danh mục</Label>
        <Select value={category || "all"} onValueChange={(v) => onCategoryChange(v === "all" ? "" : v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tất cả" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {CATEGORIES.map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Tìm công ty</Label>
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            value={companyName}
            onChange={(e) => onCompanyNameChange(e.target.value)}
            placeholder="Nhập tên..."
            className="w-48 pl-9"
          />
        </div>
      </div>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onReset}>
          <X className="mr-1 h-4 w-4" />
          Xóa bộ lọc
        </Button>
      )}
    </div>
  );
}
