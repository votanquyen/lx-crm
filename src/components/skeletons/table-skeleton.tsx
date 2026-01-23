import { Skeleton } from "@/components/ui/skeleton";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 6 }: TableSkeletonProps) {
  return (
    <div className="rounded-md border">
      {/* Header */}
      <div className="bg-muted/50 flex gap-4 border-b p-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 border-b p-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className={`h-4 flex-1 ${colIndex === 0 ? "w-24" : ""}`} />
          ))}
        </div>
      ))}
    </div>
  );
}
