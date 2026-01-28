"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Eye, Send, DollarSign, XCircle, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { sendInvoice, cancelInvoice } from "@/actions/invoices";
import { PaymentDialog } from "@/components/invoices/payment-dialog";
import type { InvoiceStatus } from "@prisma/client";

interface InvoiceActionsProps {
    invoice: {
        id: string;
        invoiceNumber: string;
        status: InvoiceStatus;
        outstandingAmount: number;
        _count: { payments: number };
    };
}

export function InvoiceActions({ invoice }: InvoiceActionsProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);

    const handleSend = () => {
        startTransition(async () => {
            try {
                await sendInvoice(invoice.id);
                router.refresh();
            } catch (error) {
                console.error("Failed to send invoice", error);
                alert("Gửi hóa đơn thất bại");
            }
        });
    };

    const handleCancel = () => {
        if (confirm("Bạn có chắc chắn muốn hủy hóa đơn này?")) {
            startTransition(async () => {
                try {
                    await cancelInvoice(invoice.id);
                    router.refresh();
                } catch (error) {
                    console.error("Failed to cancel invoice", error);
                    alert("Hủy hóa đơn thất bại");
                }
            });
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="hover:text-primary h-8 w-8 text-slate-400 transition-colors"
                        aria-label="Tùy chọn"
                        disabled={isPending}
                    >
                        {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <MoreHorizontal className="h-4 w-4" />
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem
                        asChild
                        className="py-2.5 font-sans text-xs font-bold tracking-tight uppercase cursor-pointer"
                    >
                        <Link href={`/invoices/${invoice.id}`}>
                            <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
                            Dữ liệu chi tiết
                        </Link>
                    </DropdownMenuItem>

                    {invoice.status === "DRAFT" && (
                        <>
                            <DropdownMenuItem
                                asChild
                                className="py-2.5 font-sans text-xs font-bold tracking-tight uppercase cursor-pointer"
                            >
                                <Link href={`/invoices/${invoice.id}/edit`}>
                                    <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
                                    Chỉnh sửa
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={handleSend}
                                className="py-2.5 font-sans text-xs font-bold tracking-tight uppercase cursor-pointer"
                            >
                                <Send className="mr-2 h-4 w-4" aria-hidden="true" />
                                Gửi đối tác
                            </DropdownMenuItem>
                        </>
                    )}

                    {["SENT", "PARTIAL", "OVERDUE"].includes(invoice.status) && (
                        <DropdownMenuItem
                            onClick={() => setShowPaymentDialog(true)}
                            className="text-primary py-2.5 font-sans text-xs font-bold tracking-tight uppercase cursor-pointer"
                        >
                            <DollarSign className="mr-2 h-4 w-4" aria-hidden="true" />
                            Ghi nhận thanh toán
                        </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />

                    {invoice.status !== "CANCELLED" && invoice._count.payments === 0 && (
                        <DropdownMenuItem
                            onClick={handleCancel}
                            className="py-2.5 font-sans text-xs font-bold tracking-tight text-rose-600 uppercase focus:text-rose-600 cursor-pointer"
                        >
                            <XCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                            Hủy hóa đơn
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <PaymentDialog
                open={showPaymentDialog}
                onOpenChange={setShowPaymentDialog}
                invoice={invoice}
            />
        </>
    );
}
