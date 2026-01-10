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
import type { CustomerTier } from "@prisma/client";

export interface MapFilters {
  district?: string;
  tier?: CustomerTier | "ALL";
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

  const hasActiveFilters =
    filters.district || (filters.tier && filters.tier !== "ALL") || filters.status;

  const clearFilters = () => {
    onFiltersChange({
      district: undefined,
      tier: "ALL",
      status: undefined,
      showExchanges: filters.showExchanges,
    });
  };

  return (
    <div className="bg-card border rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <Button
            variant={isOpen ? "secondary" : "outline"}
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
          >
            <Filter className="h-4 w-4 mr-1" />
            Bộ lọc
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1 px-1.5">
                !
              </Badge>
            )}
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Xóa
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3 text-sm">
          <Badge variant="outline">{customerCount} khách hàng</Badge>
          {filters.showExchanges && (
            <Badge variant="secondary">{exchangeCount} yêu cầu đổi</Badge>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      {isOpen && (
        <div className="p-3 grid grid-cols-2 md:grid-cols-4 gap-4">
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

          {/* Tier */}
          <div className="space-y-1.5">
            <Label className="text-xs">Hạng khách hàng</Label>
            <Select
              value={filters.tier || "ALL"}
              onValueChange={(v) =>
                onFiltersChange({
                  ...filters,
                  tier: v === "ALL" ? "ALL" : (v as CustomerTier),
                })
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả</SelectItem>
                <SelectItem value="VIP">VIP</SelectItem>
                <SelectItem value="PREMIUM">Premium</SelectItem>
                <SelectItem value="STANDARD">Standard</SelectItem>
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
            <Label htmlFor="show-exchanges" className="text-xs flex items-center gap-1">
              <Layers className="h-3 w-3" />
              Yêu cầu đổi cây
            </Label>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="px-3 pb-3 flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-600" />
          <span>VIP</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-blue-600" />
          <span>Premium</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-green-600" />
          <span>Standard</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full border-2 border-amber-500" />
          <span>Có yêu cầu đổi</span>
        </div>
      </div>
    </div>
  );
}
