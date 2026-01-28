"use client";

import { useState } from "react";
import { Columns3, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface ColumnConfig {
    id: string;
    label: string;
    defaultVisible: boolean;
    required?: boolean;
}

interface ColumnToggleProps {
    columns: ColumnConfig[];
    visibleColumns: string[];
    onToggle: (columnId: string) => void;
    onReset?: () => void;
}

export function ColumnToggle({
    columns,
    visibleColumns,
    onToggle,
    onReset,
}: ColumnToggleProps) {
    const visibleCount = visibleColumns.length;
    const totalCount = columns.length;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-2 border-dashed text-xs font-bold"
                >
                    <Columns3 className="h-4 w-4" />
                    <span className="hidden sm:inline">Cột hiển thị</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black tabular-nums">
                        {visibleCount}/{totalCount}
                    </span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Tùy chỉnh cột
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-[300px] overflow-y-auto">
                    {columns.map((column) => {
                        const isVisible = visibleColumns.includes(column.id);
                        const isDisabled = column.required;

                        return (
                            <DropdownMenuCheckboxItem
                                key={column.id}
                                checked={isVisible}
                                onCheckedChange={() => !isDisabled && onToggle(column.id)}
                                disabled={isDisabled}
                                className="cursor-pointer text-sm font-medium"
                            >
                                <div className="flex items-center justify-between flex-1">
                                    <span>{column.label}</span>
                                    {column.required && (
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                                            Bắt buộc
                                        </span>
                                    )}
                                </div>
                            </DropdownMenuCheckboxItem>
                        );
                    })}
                </div>
                {onReset && (
                    <>
                        <DropdownMenuSeparator />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onReset}
                            className="w-full justify-start text-xs font-bold"
                        >
                            Đặt lại mặc định
                        </Button>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

// Hook to manage column visibility
export function useColumnVisibility(columns: ColumnConfig[]) {
    const [visibleColumns, setVisibleColumns] = useState<string[]>(() =>
        columns.filter((col) => col.defaultVisible).map((col) => col.id)
    );

    const toggleColumn = (columnId: string) => {
        setVisibleColumns((prev) =>
            prev.includes(columnId)
                ? prev.filter((id) => id !== columnId)
                : [...prev, columnId]
        );
    };

    const resetColumns = () => {
        setVisibleColumns(
            columns.filter((col) => col.defaultVisible).map((col) => col.id)
        );
    };

    const isColumnVisible = (columnId: string) => visibleColumns.includes(columnId);

    return {
        visibleColumns,
        toggleColumn,
        resetColumns,
        isColumnVisible,
    };
}
