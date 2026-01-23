import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function StatementPanelSkeleton() {
  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Year & Month Selector */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-24" />
        <div className="flex gap-1">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-12" />
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>

      {/* Statement Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="space-y-2 text-right">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="ml-auto h-3 w-16" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Table header */}
          <div className="flex gap-4 border-b pb-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>

          {/* Table rows */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-4 py-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}

          {/* Summary */}
          <div className="space-y-2 border-t pt-4">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex justify-between border-t pt-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-36" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
