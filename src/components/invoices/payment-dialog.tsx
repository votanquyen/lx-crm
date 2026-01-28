"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createPayment } from "@/actions/payments";
import { formatCurrency } from "@/lib/format";
import type { PaymentMethod } from "@prisma/client";

interface PaymentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    invoice: {
        id: string;
        invoiceNumber: string;
        outstandingAmount: number;
    };
    onSuccess?: () => void;
}

export function PaymentDialog({ open, onOpenChange, invoice, onSuccess }: PaymentDialogProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [paymentData, setPaymentData] = useState({
        amount: invoice.outstandingAmount,
        method: "BANK_TRANSFER" as PaymentMethod,
        bankRef: "",
        receivedBy: "",
        notes: "",
    });

    const handleRecordPayment = () => {
        startTransition(async () => {
            try {
                await createPayment({
                    invoiceId: invoice.id,
                    amount: paymentData.amount,
                    paymentDate: new Date(),
                    paymentMethod: paymentData.method,
                    bankRef: paymentData.method === "BANK_TRANSFER" ? paymentData.bankRef || undefined : undefined,
                    receivedBy: paymentData.method === "CASH" ? paymentData.receivedBy || undefined : undefined,
                    notes: paymentData.notes || undefined,
                });

                toast.success("Ghi nhận thanh toán thành công!");
                onOpenChange(false);
                router.refresh();
                onSuccess?.();
            } catch (error) {
                console.error("Payment error:", error);
                toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra khi ghi nhận thanh toán");
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Ghi nhận thanh toán - {invoice.invoiceNumber}</DialogTitle>
                    <DialogDescription>
                        Còn nợ: {formatCurrency(invoice.outstandingAmount)}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="amount">Số tiền *</Label>
                        <Input
                            id="amount"
                            type="number"
                            value={paymentData.amount}
                            onChange={(e) =>
                                setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) || 0 })
                            }
                            max={invoice.outstandingAmount}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="method">Phương thức</Label>
                        <Select
                            value={paymentData.method}
                            onValueChange={(value) =>
                                setPaymentData({ ...paymentData, method: value as PaymentMethod })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="BANK_TRANSFER">Chuyển khoản</SelectItem>
                                <SelectItem value="CASH">Tiền mặt</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Bank transfer: show bank ref field */}
                    {paymentData.method === "BANK_TRANSFER" && (
                        <div className="space-y-2">
                            <Label htmlFor="bankRef">Mã giao dịch</Label>
                            <Input
                                id="bankRef"
                                value={paymentData.bankRef}
                                onChange={(e) => setPaymentData({ ...paymentData, bankRef: e.target.value })}
                                placeholder="FT12345678..."
                            />
                        </div>
                    )}

                    {/* Cash: show received by field */}
                    {paymentData.method === "CASH" && (
                        <div className="space-y-2">
                            <Label htmlFor="receivedBy">Người nhận</Label>
                            <Input
                                id="receivedBy"
                                value={paymentData.receivedBy}
                                onChange={(e) => setPaymentData({ ...paymentData, receivedBy: e.target.value })}
                                placeholder="Nguyễn Văn A..."
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="notes">Ghi chú</Label>
                        <Textarea
                            id="notes"
                            value={paymentData.notes}
                            onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                            rows={2}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Hủy
                    </Button>
                    <Button onClick={handleRecordPayment} disabled={isPending || paymentData.amount <= 0}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                        Xác nhận
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
