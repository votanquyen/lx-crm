"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { InvoiceStatus } from "@prisma/client";

interface FilterTab {
    label: string;
    value?: InvoiceStatus | "OVERDUE";
    count?: number;
    href: string;
}

interface FilterTabsProps {
    tabs: FilterTab[];
    activeTab?: string;
    hasActiveFilters?: boolean;
    onClearFilters?: () => void;
}

export function FilterTabs({
    tabs,
    activeTab,
    hasActiveFilters = false,
    onClearFilters
}: FilterTabsProps) {
    return (
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            {/* Tab Pills */}
            <div className="flex flex-wrap gap-2 bg-slate-100/80 p-1.5 rounded-lg border border-slate-200">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.value || (!activeTab && !tab.value);

                    return (
                        <Link
                            key={tab.label}
                            href={tab.href}
                            className={cn(
                                "group relative flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all",
                                isActive
                                    ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                            )}
                        >
                            <span>{tab.label}</span>
                            {tab.count !== undefined && tab.count > 0 && (
                                <Badge
                                    variant="secondary"
                                    className={cn(
                                        "h-5 min-w-[20px] px-1.5 text-[10px] font-black tabular-nums",
                                        isActive
                                            ? "bg-blue-100 text-blue-700"
                                            : "bg-slate-200 text-slate-600 group-hover:bg-slate-300"
                                    )}
                                >
                                    {tab.count}
                                </Badge>
                            )}
                            {/* Active indicator */}
                            {isActive && (
                                <div className="absolute -bottom-1.5 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-blue-600" />
                            )}
                        </Link>
                    );
                })}
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && onClearFilters && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearFilters}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900"
                >
                    <X className="mr-1 h-3 w-3" />
                    Xóa bộ lọc
                </Button>
            )}
        </div>
    );
}
