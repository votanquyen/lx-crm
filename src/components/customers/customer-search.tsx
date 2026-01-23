/**
 * Customer Search Component
 * Debounced search input that updates URL params
 */
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { useDebouncedCallback } from "use-debounce";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CustomerSearchProps {
  defaultValue?: string;
}

export function CustomerSearch({ defaultValue = "" }: CustomerSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (term.trim()) {
      params.set("search", term.trim());
    } else {
      params.delete("search");
    }
    // Reset to page 1 on new search
    params.delete("page");

    startTransition(() => {
      router.push(`/customers?${params.toString()}`);
    });
  }, 300);

  const handleClear = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    params.delete("page");

    const input = document.getElementById("customer-search") as HTMLInputElement;
    if (input) input.value = "";

    startTransition(() => {
      router.push(`/customers?${params.toString()}`);
    });
  }, [router, searchParams]);

  return (
    <div className="relative max-w-sm flex-1">
      <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" aria-hidden="true" />
      <Input
        id="customer-search"
        type="search"
        placeholder="Tìm khách hàng..."
        className="pr-9 pl-9"
        defaultValue={defaultValue}
        onChange={(e) => handleSearch(e.target.value)}
      />
      {isPending && (
        <Loader2 className="text-muted-foreground absolute top-1/2 right-9 h-4 w-4 -translate-y-1/2 animate-spin" aria-hidden="true" />
      )}
      {defaultValue && !isPending && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2"
          onClick={handleClear}
        >
          <X className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Xóa tìm kiếm</span>
        </Button>
      )}
    </div>
  );
}
