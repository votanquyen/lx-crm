"use client";

import { useState } from "react";
import { Calendar, Filter, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface QuickFilter {
    label: string;
    value: string;
    days?: number;
}

const QUICK_FILTERS: QuickFilter[] = [
    { label: "Hôm nay", value: "today", days: 0 },
    { label: "7 ngày qua", value: "7days", days: 7 },
    { label: "30 ngày qua", value: "30days", days: 30 },
    { label: "90 ngày qua", value: "90days", days: 90 },
    { label: "Năm nay", value: "thisYear" },
];

const AMOUNT_RANGES = [
    { label: "Tất cả", value: "all" },
    { label: "< 10 triệu", value: "0-10000000" },
    { label: "10-50 triệu", value: "10000000-50000000" },
    { label: "50-100 triệu", value: "50000000-100000000" },
    { label: "> 100 triệu", value: "100000000-999999999999" },
];

interface InvoiceToolbarProps {
    onRefresh?: () => void;
    onExport?: () => void;
    onDateRangeChange?: (range: { from: Date; to: Date }) => void;
    onAmountRangeChange?: (range: string) => void;
    activeFilters?: number;
}

export function InvoiceToolbar({
    onRefresh,
    onExport,
    onDateRangeChange,
    onAmountRangeChange,
    activeFilters = 0,
}: InvoiceToolbarProps) {
    const [selectedDateFilter, setSelectedDateFilter] = useState<string>("");
    const [selectedAmountRange, setSelectedAmountRange] = useState<string>("all");

    const handleQuickDateFilter = (value: string) => {
        setSelectedDateFilter(value);
        const filter = QUICK_FILTERS.find((f) => f.value === value);

        if (filter && onDateRangeChange) {
            const to = new Date();
            const from = new Date();

            if (filter.days !== undefined) {
                from.setDate(from.getDate() - filter.days);
            } else if (filter.value === "thisYear") {
                from.setMonth(0, 1);
            }

            onDateRangeChange({ from, to });
        }
    };

    const handleAmountRangeChange = (value: string) => {
        setSelectedAmountRange(value);
        if (onAmountRangeChange) {
            onAmountRangeChange(value);
        }
    };

    return (
        <div className="flex items-center justify-between gap-3 rounded-lg border bg-white p-3">
            {/* Left side - Filters */}
            <div className="flex items-center gap-2">
                {/* Date Range Quick Filter */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 gap-2 text-xs font-bold"
                        >
                            <Calendar className="h-4 w-4" />
                            <span className="hidden sm:inline">Ngày xuất</span>
                            {selectedDateFilter && (
                                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                                    {QUICK_FILTERS.find((f) => f.value === selectedDateFilter)?.label}
                                </Badge>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56" align="start">
                        <div className="space-y-3">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Lọc nhanh theo ngày
                            </Label>
                            <div className="space-y-1">
                                {QUICK_FILTERS.map((filter) => (
                                    <Button
                                        key={filter.value}
                                        variant={selectedDateFilter === filter.value ? "default" : "ghost"}
                                        size="sm"
                                        className="w-full justify-start text-xs font-medium"
                                        onClick={() => handleQuickDateFilter(filter.value)}
                                    >
                                        {filter.label}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

                {/* Amount Range Filter */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 gap-2 text-xs font-bold"
                        >
                            <Filter className="h-4 w-4" />
                            <span className="hidden sm:inline">Số tiền</span>
                            {selectedAmountRange !== "all" && (
                                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                                    {AMOUNT_RANGES.find((r) => r.value === selectedAmountRange)?.label}
                                </Badge>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56" align="start">
                        <div className="space-y-3">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Lọc theo số tiền
                            </Label>
                            <Select value={selectedAmountRange} onValueChange={handleAmountRangeChange}>
                                <SelectTrigger className="text-xs font-medium">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {AMOUNT_RANGES.map((range) => (
                                        <SelectItem key={range.value} value={range.value} className="text-xs">
                                            {range.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </PopoverContent>
                </Popover>

                {/* Active Filters Badge */}
                {activeFilters > 0 && (
                    <Badge variant="default" className="h-6 px-2 text-xs font-bold">
                        {activeFilters} bộ lọc
                    </Badge>
                )}
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-2">
                {/* Refresh */}
                {onRefresh && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onRefresh}
                        className="h-9 gap-2 text-xs font-bold"
                    >
                        <RefreshCw className="h-4 w-4" />
                        <span className="hidden sm:inline">Làm mới</span>
                    </Button>
                )}

                {/* Export */}
                {onExport && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onExport}
                        className="h-9 gap-2 text-xs font-bold"
                    >
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">Xuất Excel</span>
                    </Button>
                )}
            </div>
        </div>
    );
}
