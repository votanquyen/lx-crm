/**
 * View Toggle Component
 * Toggle between table and map views on customers page
 */
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TableIcon, MapIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ViewMode = "table" | "map";

interface ViewToggleProps {
  currentView: ViewMode;
}

export function ViewToggle({ currentView }: ViewToggleProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setView = (view: ViewMode) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", view);
    router.push(`/customers?${params.toString()}`);
  };

  return (
    <div className="flex items-center rounded-md border bg-white p-1">
      <Button
        variant={currentView === "table" ? "secondary" : "ghost"}
        size="sm"
        className={cn(
          "h-8 gap-1.5 text-xs font-medium",
          currentView === "table" && "bg-primary/10"
        )}
        onClick={() => setView("table")}
      >
        <TableIcon className="h-3.5 w-3.5" aria-hidden="true" />
        Bảng
      </Button>
      <Button
        variant={currentView === "map" ? "secondary" : "ghost"}
        size="sm"
        className={cn("h-8 gap-1.5 text-xs font-medium", currentView === "map" && "bg-primary/10")}
        onClick={() => setView("map")}
      >
        <MapIcon className="h-3.5 w-3.5" aria-hidden="true" />
        Bản đồ
      </Button>
    </div>
  );
}
