"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { CustomerForm } from "./customer-form";
import { getCustomerById } from "@/actions/customers";
import { Skeleton } from "@/components/ui/skeleton";

interface CustomerFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId?: string | null; // If null/undefined -> Create mode
}

export function CustomerFormSheet({ open, onOpenChange, customerId }: CustomerFormSheetProps) {
  const router = useRouter();
  const [data, setData] = useState<any>(null); // Using any to bypass strict type matching for now, or import type
  const [isLoading, startTransition] = useTransition();

  useEffect(() => {
    if (customerId && open) {
      startTransition(async () => {
        try {
          const result = await getCustomerById(customerId);
          setData(result);
        } catch (error) {
          console.error("Failed to fetch customer for edit", error);
        }
      });
    } else {
      setData(null);
    }
  }, [customerId, open]);

  const handleSuccess = () => {
    onOpenChange(false);
    router.refresh();
  };

  const isEditing = !!customerId;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl" side="right">
        <SheetHeader className="mb-6">
          <SheetTitle>{isEditing ? "Chỉnh sửa khách hàng" : "Thêm khách hàng mới"}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? "Cập nhật thông tin khách hàng. Nhấn Lưu để áp dụng thay đổi."
              : "Điền thông tin để tạo khách hàng mới."}
          </SheetDescription>
        </SheetHeader>

        {isEditing && (isLoading || !data) ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <CustomerForm customer={data} onSuccess={handleSuccess} />
        )}
      </SheetContent>
    </Sheet>
  );
}
