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
    <div className="relative flex-1 max-w-sm">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        id="customer-search"
        type="search"
        placeholder="Tìm khách hàng..."
        className="pl-9 pr-9"
        defaultValue={defaultValue}
        onChange={(e) => handleSearch(e.target.value)}
      />
      {isPending && (
        <Loader2 className="absolute right-9 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
      )}
      {defaultValue && !isPending && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
          onClick={handleClear}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Xóa tìm kiếm</span>
        </Button>
      )}
    </div>
  );
}
