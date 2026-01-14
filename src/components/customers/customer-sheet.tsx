"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
    Building2,
    MapPin,
    Phone,
    ExternalLink,
    Receipt,
    Trees,
    FileText,
} from "lucide-react";
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
    onOpenChange
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
            <SheetContent className="w-full sm:max-w-md p-0 flex flex-col gap-0 border-l-slate-200">
                {isPending || !data ? (
                    <div className="h-full flex flex-col p-6 space-y-4">
                        <VisuallyHidden>
                            <SheetTitle>Đang tải thông tin khách hàng</SheetTitle>
                        </VisuallyHidden>
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <div className="space-y-2 mt-8">
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-24 w-full" />
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="p-6 bg-slate-50 border-b">
                            <SheetHeader>
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <SheetTitle className="text-xl font-bold text-slate-900 leading-tight">
                                            {data.companyName}
                                        </SheetTitle>
                                        <SheetDescription className="flex items-center gap-2">
                                            <span className="font-mono text-xs font-semibold bg-slate-200/50 px-1.5 py-0.5 rounded text-slate-600">
                                                {data.code}
                                            </span>
                                        </SheetDescription>
                                    </div>
                                    <Badge variant={
                                        data.status === "ACTIVE" ? "default" :
                                            data.status === "LEAD" ? "secondary" : "outline"
                                    } className={cn(
                                        "ml-2 capitalize shadow-sm",
                                        data.status === "ACTIVE" && "bg-emerald-500 hover:bg-emerald-600",
                                        data.status === "LEAD" && "bg-blue-500 hover:bg-blue-600 text-white"
                                    )}>
                                        {data.status === "ACTIVE" ? "Hoạt động" :
                                            data.status === "LEAD" ? "Tiềm năng" :
                                                data.status === "INACTIVE" ? "Tạm ngưng" : "Đã hủy"}
                                    </Badge>
                                </div>
                            </SheetHeader>
                        </div>

                        <ScrollArea className="flex-1">
                            <div className="p-6 space-y-6">
                                {/* Metrics */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-slate-50 border p-3 rounded-lg text-center space-y-1">
                                        <Trees className="h-5 w-5 mx-auto text-emerald-600 opacity-80" />
                                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-tight">Cây xanh</p>
                                        <p className="text-lg font-bold text-slate-900">{data._count.customerPlants}</p>
                                    </div>
                                    <div className="bg-slate-50 border p-3 rounded-lg text-center space-y-1">
                                        <FileText className="h-5 w-5 mx-auto text-blue-600 opacity-80" />
                                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-tight">Hợp đồng</p>
                                        <p className="text-lg font-bold text-slate-900">{data._count.contracts}</p>
                                    </div>
                                    <div className="bg-slate-50 border p-3 rounded-lg text-center space-y-1">
                                        <Receipt className="h-5 w-5 mx-auto text-amber-600 opacity-80" />
                                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-tight">Hóa đơn</p>
                                        <p className="text-lg font-bold text-slate-900">{data._count.invoices}</p>
                                    </div>
                                </div>

                                <Separator />

                                {/* Info */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Thông tin liên hệ</h4>

                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5 bg-slate-100 p-1.5 rounded-md">
                                                <MapPin className="h-4 w-4 text-slate-500" />
                                            </div>
                                            <div className="text-sm">
                                                <p className="font-medium text-slate-900">Địa chỉ</p>
                                                <p className="text-slate-500 leading-relaxed">{data.address}</p>
                                                {data.district && <p className="text-slate-500">{data.district}, {data.city}</p>}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="bg-slate-100 p-1.5 rounded-md">
                                                <Building2 className="h-4 w-4 text-slate-500" />
                                            </div>
                                            <div className="text-sm">
                                                <p className="font-medium text-slate-900">Mã số thuế</p>
                                                <p className="text-slate-500 font-mono">{data.taxCode || "N/A"}</p>
                                            </div>
                                        </div>

                                        {(data.contactName || data.contactPhone) && (
                                            <div className="flex items-start gap-3">
                                                <div className="mt-0.5 bg-slate-100 p-1.5 rounded-md">
                                                    <Phone className="h-4 w-4 text-slate-500" />
                                                </div>
                                                <div className="text-sm">
                                                    <p className="font-medium text-slate-900">Người liên hệ</p>
                                                    <p className="text-slate-500">{data.contactName || "---"}</p>
                                                    {data.contactPhone && (
                                                        <a href={`tel:${data.contactPhone}`} className="text-blue-600 hover:underline block mt-0.5">
                                                            {data.contactPhone}
                                                        </a>
                                                    )}
                                                    {data.contactEmail && (
                                                        <a href={`mailto:${data.contactEmail}`} className="text-slate-500 hover:text-slate-900 block mt-0.5">
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
                        <div className="p-4 bg-slate-50 border-t gap-3 flex flex-col sm:flex-row">
                            <Button className="flex-1 gap-2 font-bold" asChild>
                                <Link href={`/customers/${data.id}`}>
                                    <ExternalLink className="h-4 w-4" />
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
