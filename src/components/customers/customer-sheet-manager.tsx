"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { CustomerFormSheet } from "./customer-form-sheet";

export function CustomerSheetManager() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const action = searchParams.get("action");
  const id = searchParams.get("id");

  const isCreate = action === "new";
  const isEdit = action === "edit" && !!id;
  const isOpen = isCreate || isEdit;

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Remove query params to close
      router.push(pathname);
    }
  };

  if (!isOpen) return null;

  return (
    <CustomerFormSheet
      open={isOpen}
      onOpenChange={handleOpenChange}
      customerId={isEdit ? id : undefined}
    />
  );
}
