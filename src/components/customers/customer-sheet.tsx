"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Building2, MapPin, Phone, ExternalLink, Receipt, Trees, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { getCustomerById } from "@/actions/customers";
import { cn } from "@/lib/utils";

interface CustomerPreviewSheetProps {
  customerId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomerPreviewSheet({
  customerId,
  open,
  onOpenChange,
}: CustomerPreviewSheetProps) {
  const [data, setData] = useState<Awaited<ReturnType<typeof getCustomerById>> | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (customerId && open) {
      startTransition(async () => {
        try {
          const result = await getCustomerById(customerId);
          setData(result);
        } catch (error) {
          console.error("Failed to fetch customer", error);
        }
      });
    } else {
      setData(null);
    }
  }, [customerId, open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 border-l-slate-200 p-0 sm:max-w-md">
        {isPending || !data ? (
          <div className="flex h-full flex-col space-y-4 p-6">
            <VisuallyHidden>
              <SheetTitle>Đang tải thông tin khách hàng</SheetTitle>
            </VisuallyHidden>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="mt-8 space-y-2">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="border-b bg-slate-50 p-6">
              <SheetHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <SheetTitle className="text-xl leading-tight font-bold text-slate-900">
                      {data.companyName}
                    </SheetTitle>
                    <SheetDescription className="flex items-center gap-2">
                      <span className="rounded bg-slate-200/50 px-1.5 py-0.5 font-mono text-xs font-semibold text-slate-600">
                        {data.code}
                      </span>
                    </SheetDescription>
                  </div>
                  <Badge
                    variant={
                      data.status === "ACTIVE"
                        ? "default"
                        : data.status === "LEAD"
                          ? "secondary"
                          : "outline"
                    }
                    className={cn(
                      "ml-2 capitalize shadow-sm",
                      data.status === "ACTIVE" && "bg-emerald-500 hover:bg-emerald-600",
                      data.status === "LEAD" && "bg-blue-500 text-white hover:bg-blue-600"
                    )}
                  >
                    {data.status === "ACTIVE"
                      ? "Hoạt động"
                      : data.status === "LEAD"
                        ? "Tiềm năng"
                        : data.status === "INACTIVE"
                          ? "Tạm ngưng"
                          : "Đã hủy"}
                  </Badge>
                </div>
              </SheetHeader>
            </div>

            <ScrollArea className="flex-1">
              <div className="space-y-6 p-6">
                {/* Metrics */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1 rounded-lg border bg-slate-50 p-3 text-center">
                    <Trees className="mx-auto h-5 w-5 text-emerald-600 opacity-80" aria-hidden="true" />
                    <p className="text-muted-foreground text-xs font-medium tracking-tight uppercase">
                      Cây xanh
                    </p>
                    <p className="text-lg font-bold text-slate-900">{data._count.customerPlants}</p>
                  </div>
                  <div className="space-y-1 rounded-lg border bg-slate-50 p-3 text-center">
                    <FileText className="mx-auto h-5 w-5 text-blue-600 opacity-80" aria-hidden="true" />
                    <p className="text-muted-foreground text-xs font-medium tracking-tight uppercase">
                      Hợp đồng
                    </p>
                    <p className="text-lg font-bold text-slate-900">{data._count.contracts}</p>
                  </div>
                  <div className="space-y-1 rounded-lg border bg-slate-50 p-3 text-center">
                    <Receipt className="mx-auto h-5 w-5 text-amber-600 opacity-80" aria-hidden="true" />
                    <p className="text-muted-foreground text-xs font-medium tracking-tight uppercase">
                      Hóa đơn
                    </p>
                    <p className="text-lg font-bold text-slate-900">{data._count.invoices}</p>
                  </div>
                </div>

                <Separator />

                {/* Info */}
                <div className="space-y-4">
                  <h4 className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
                    Thông tin liên hệ
                  </h4>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-md bg-slate-100 p-1.5">
                        <MapPin className="h-4 w-4 text-slate-500" aria-hidden="true" />
                      </div>
                      <div className="text-sm">
                        <p className="font-medium text-slate-900">Địa chỉ</p>
                        <p className="leading-relaxed text-slate-500">{data.address}</p>
                        {data.district && (
                          <p className="text-slate-500">
                            {data.district}, {data.city}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="rounded-md bg-slate-100 p-1.5">
                        <Building2 className="h-4 w-4 text-slate-500" aria-hidden="true" />
                      </div>
                      <div className="text-sm">
                        <p className="font-medium text-slate-900">Mã số thuế</p>
                        <p className="font-mono text-slate-500">{data.taxCode || "N/A"}</p>
                      </div>
                    </div>

                    {(data.contactName || data.contactPhone) && (
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-md bg-slate-100 p-1.5">
                          <Phone className="h-4 w-4 text-slate-500" aria-hidden="true" />
                        </div>
                        <div className="text-sm">
                          <p className="font-medium text-slate-900">Người liên hệ</p>
                          <p className="text-slate-500">{data.contactName || "---"}</p>
                          {data.contactPhone && (
                            <a
                              href={`tel:${data.contactPhone}`}
                              className="mt-0.5 block text-blue-600 hover:underline"
                            >
                              {data.contactPhone}
                            </a>
                          )}
                          {data.contactEmail && (
                            <a
                              href={`mailto:${data.contactEmail}`}
                              className="mt-0.5 block text-slate-500 hover:text-slate-900"
                            >
                              {data.contactEmail}
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>

            {/* Footer Actions */}
            <div className="flex flex-col gap-3 border-t bg-slate-50 p-4 sm:flex-row">
              <Button className="flex-1 gap-2 font-bold" asChild>
                <Link href={`/customers/${data.id}`}>
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  Xem chi tiết
                </Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
