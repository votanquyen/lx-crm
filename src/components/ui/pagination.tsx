/**
 * Pagination Component
 * For data tables and lists
 */
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PaginationProps {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function Pagination({ page, limit, total, totalPages }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const goToPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  const changeLimit = (newLimit: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("limit", newLimit);
    params.delete("page"); // Reset to page 1
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <span>
          Hiển thị {start}-{end} / {total} kết quả
        </span>
        <Select value={String(limit)} onValueChange={changeLimit}>
          <SelectTrigger className="h-8 w-[70px]">
            <SelectValue placeholder={String(limit)} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
        <span>/ trang</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="text-muted-foreground text-sm">
          Trang {page} / {totalPages}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => goToPage(1)}
            disabled={page <= 1 || isPending}
          >
            <ChevronsLeft className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Trang đầu</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1 || isPending}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Trang trước</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages || isPending}
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Trang sau</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => goToPage(totalPages)}
            disabled={page >= totalPages || isPending}
          >
            <ChevronsRight className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Trang cuối</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
