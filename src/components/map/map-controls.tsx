"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Filter, X, Layers } from "lucide-react";

export interface MapFilters {
  district?: string;
  status?: string;
  showExchanges: boolean;
}

interface MapControlsProps {
  filters: MapFilters;
  onFiltersChange: (filters: MapFilters) => void;
  districts: string[];
  customerCount: number;
  exchangeCount: number;
}

export function MapControls({
  filters,
  onFiltersChange,
  districts,
  customerCount,
  exchangeCount,
}: MapControlsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasActiveFilters = filters.district || filters.status;

  const clearFilters = () => {
    onFiltersChange({
      district: undefined,
      status: undefined,
      showExchanges: filters.showExchanges,
    });
  };

  return (
    <div className="bg-card rounded-lg border shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-3">
        <div className="flex items-center gap-2">
          <Button
            variant={isOpen ? "secondary" : "outline"}
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
          >
            <Filter className="mr-1 h-4 w-4" aria-hidden="true" />
            Bộ lọc
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1 px-1.5">
                !
              </Badge>
            )}
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="mr-1 h-4 w-4" aria-hidden="true" />
              Xóa
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3 text-sm">
          <Badge variant="outline">{customerCount} khách hàng</Badge>
          {filters.showExchanges && <Badge variant="secondary">{exchangeCount} yêu cầu đổi</Badge>}
        </div>
      </div>

      {/* Filter Panel */}
      {isOpen && (
        <div className="grid grid-cols-2 gap-4 p-3 md:grid-cols-4">
          {/* District */}
          <div className="space-y-1.5">
            <Label className="text-xs">Quận/Huyện</Label>
            <Select
              value={filters.district || "ALL"}
              onValueChange={(v) =>
                onFiltersChange({ ...filters, district: v === "ALL" ? undefined : v })
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả</SelectItem>
                {districts.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label className="text-xs">Trạng thái</Label>
            <Select
              value={filters.status || "ALL"}
              onValueChange={(v) =>
                onFiltersChange({ ...filters, status: v === "ALL" ? undefined : v })
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả</SelectItem>
                <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                <SelectItem value="INACTIVE">Ngưng</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Exchange Layer Toggle */}
          <div className="flex items-center gap-2">
            <Switch
              id="show-exchanges"
              checked={filters.showExchanges}
              onCheckedChange={(checked: boolean) =>
                onFiltersChange({ ...filters, showExchanges: checked })
              }
            />
            <Label htmlFor="show-exchanges" className="flex items-center gap-1 text-xs">
              <Layers className="h-3 w-3" aria-hidden="true" />
              Yêu cầu đổi cây
            </Label>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 px-3 pb-3 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-green-600" />
          <span>Khach hang</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full border-2 border-amber-500" />
          <span>Co yeu cau doi</span>
        </div>
      </div>
    </div>
  );
}
