import { Skeleton } from "@/components/ui/skeleton";

export function CustomerSidebarSkeleton() {
  return (
    <div className="bg-card h-full w-80 border-r">
      <div className="space-y-4 border-b p-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2 p-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
