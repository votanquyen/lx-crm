"use client";

import * as React from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/utils";

interface VirtualTableProps<T> {
  data: T[];
  estimateSize?: number;
  overscan?: number;
  className?: string;
  maxHeight?: string;
  renderHeader: () => React.ReactNode;
  renderRow: (item: T, index: number, measureElement: (el: Element | null) => void, virtualStart: number) => React.ReactNode;
  getRowKey: (item: T) => string;
  emptyState?: React.ReactNode;
}

export function VirtualTable<T>({
  data,
  estimateSize = 52,
  overscan = 5,
  className,
  maxHeight = "calc(100vh - 300px)",
  renderHeader,
  renderRow,
  getRowKey,
  emptyState,
}: VirtualTableProps<T>) {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  const items = virtualizer.getVirtualItems();

  if (data.length === 0 && emptyState) {
    return (
      <div className={cn("rounded-md border", className)}>
        {emptyState}
      </div>
    );
  }

  return (
    <div className={cn("rounded-md border", className)} role="table" aria-label="Virtual table">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background border-b" role="rowgroup">
        <div className="flex font-medium text-sm text-muted-foreground" role="row">
          {renderHeader()}
        </div>
      </div>

      {/* Scrollable body */}
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ maxHeight }}
        role="rowgroup"
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {items.map((virtualRow) => {
            const item = data[virtualRow.index];
            if (!item) return null;
            return (
              <React.Fragment key={getRowKey(item)}>
                {renderRow(item, virtualRow.index, virtualizer.measureElement, virtualRow.start)}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Virtual table row wrapper with consistent styling
 */
interface VirtualTableRowProps {
  index: number;
  start: number;
  measureElement: (el: Element | null) => void;
  children: React.ReactNode;
  className?: string;
}

export const VirtualTableRow = React.memo(function VirtualTableRow({
  index,
  start,
  measureElement,
  children,
  className,
}: VirtualTableRowProps) {
  return (
    <div
      data-index={index}
      ref={measureElement}
      role="row"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        transform: `translateY(${start}px)`,
      }}
      className={cn(
        "flex items-center border-b hover:bg-muted/50 transition-colors",
        className
      )}
    >
      {children}
    </div>
  );
});

/**
 * Virtual table cell with consistent sizing
 */
interface VirtualTableCellProps {
  children: React.ReactNode;
  className?: string;
  width?: string;
  align?: "left" | "center" | "right";
}

export const VirtualTableCell = React.memo(function VirtualTableCell({
  children,
  className,
  width,
  align = "left",
}: VirtualTableCellProps) {
  return (
    <div
      role="cell"
      className={cn(
        "p-4",
        width ? "" : "flex-1",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className
      )}
      style={width ? { width } : undefined}
    >
      {children}
    </div>
  );
});

/**
 * Virtual table header cell
 */
export const VirtualTableHead = React.memo(function VirtualTableHead({
  children,
  className,
  width,
  align = "left",
}: VirtualTableCellProps) {
  return (
    <div
      role="columnheader"
      className={cn(
        "p-4 font-medium",
        width ? "" : "flex-1",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className
      )}
      style={width ? { width } : undefined}
    >
      {children}
    </div>
  );
});
