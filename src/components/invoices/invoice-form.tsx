"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
    Trash2,
    Plus,
    Save,
    Loader2,
    Receipt,
    MapPin,
    Phone,
    User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createInvoice } from "@/actions/invoices";
import { createInvoiceSchema, type CreateInvoiceInput } from "@/lib/validations/contract";
import { formatCurrency } from "@/lib/format";

interface CustomerOption {
    id: string;
    code: string;
    companyName: string;
    address: string;
    taxCode: string | null;
    contactName: string | null;
    contactPhone: string | null;
    contactEmail: string | null;
}

interface InvoiceFormProps {
    customers: CustomerOption[];
}

export function InvoiceForm({ customers }: InvoiceFormProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const defaultCustomerId = searchParams.get("customerId") || undefined;

    const [isPending, startTransition] = useTransition();
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);

    const form = useForm<CreateInvoiceInput>({
        resolver: zodResolver(createInvoiceSchema) as any,
        defaultValues: {
            customerId: defaultCustomerId,
            issueDate: new Date(),
            dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // Default 15 days
            items: [{ description: "", quantity: 1, unitPrice: 0 }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    });

    // Watch items to calculate totals
    const items = form.watch("items");
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice || 0), 0);
    const taxAmount = 0; // Tax logic can be added later
    const totalAmount = subtotal + taxAmount;

    // Set initial selected customer if form has value (e.g. from query param in future)
    useEffect(() => {
        const customerId = form.getValues("customerId");
        if (customerId) {
            const customer = customers.find(c => c.id === customerId);
            if (customer) setSelectedCustomer(customer);
        }
    }, [customers, form]);

    const onCustomerChange = (value: string) => {
        form.setValue("customerId", value);
        const customer = customers.find((c) => c.id === value);
        setSelectedCustomer(customer || null);
    };

    const onSubmit = (data: CreateInvoiceInput) => {
        startTransition(async () => {
            try {
                const result = await createInvoice(data);
                if (result.success) {
                    router.push(`/invoices/${result.data.id}`);
                } else {
                    alert(`Lỗi: ${result.error}`);
                }
            } catch (error) {
                console.error("Failed to create invoice:", error);
                alert("Có lỗi xảy ra khi tạo hóa đơn.");
            }
        });
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Form Container (Paper UI) */}
            <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-slate-200">

                {/* Header */}
                <div className="bg-slate-900 text-white p-8 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-emerald-500 rounded-lg p-1.5">
                                <Receipt className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-xl font-black tracking-tight">TẠO HÓA ĐƠN MỚI</span>
                        </div>
                        <p className="text-slate-400 text-sm">
                            Nhập thông tin chi tiết để tạo hóa đơn GTGT.
                        </p>
                    </div>
                </div>

                <form onSubmit={form.handleSubmit(onSubmit)} className="p-8 space-y-8">

                    {/* Customer Selection Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nhà cung cấp</h3>
                            <div className="space-y-1 p-4 bg-slate-50 rounded-lg border border-slate-100">
                                <p className="font-bold text-slate-900">CÔNG TY TNHH LỘC XANH</p>
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <MapPin className="h-3 w-3" />
                                    123 Đường ABC, Quận XYZ, TP.HCM
                                </div>
                                <p className="text-sm text-slate-600 pl-5">MST: 0312345678</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                Khách hàng <span className="text-rose-500">*</span>
                            </h3>
                            <div className="space-y-3">
                                <Select onValueChange={onCustomerChange} disabled={isPending} defaultValue={selectedCustomer?.id || undefined}>
                                    <SelectTrigger className="w-full font-medium">
                                        <SelectValue placeholder="Chọn khách hàng..." />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[300px]">
                                        {customers.map((c) => (
                                            <SelectItem key={c.id} value={c.id} className="cursor-pointer">
                                                <span className="font-bold">{c.code}</span> - {c.companyName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {selectedCustomer && (
                                    <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100 space-y-2 animate-in fade-in zoom-in-95 duration-200">
                                        <p className="font-bold text-slate-900">{selectedCustomer.companyName}</p>
                                        <div className="flex items-start gap-2 text-sm text-slate-600">
                                            <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                                            <span>{selectedCustomer.address}</span>
                                        </div>
                                        {selectedCustomer.taxCode && (
                                            <p className="text-sm text-slate-600 pl-6">MST: {selectedCustomer.taxCode}</p>
                                        )}
                                        <div className="flex gap-4 pl-6 pt-1">
                                            {selectedCustomer.contactName && (
                                                <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-white px-2 py-1 rounded border">
                                                    <User className="h-3 w-3" /> {selectedCustomer.contactName}
                                                </div>
                                            )}
                                            {selectedCustomer.contactPhone && (
                                                <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-white px-2 py-1 rounded border">
                                                    <Phone className="h-3 w-3" /> {selectedCustomer.contactPhone}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {form.formState.errors.customerId && (
                                    <p className="text-xs font-medium text-rose-500">{form.formState.errors.customerId.message}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Dates Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="space-y-2">
                            <Label htmlFor="issueDate" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ngày phát hành</Label>
                            <Input
                                type="date"
                                id="issueDate"
                                {...form.register("issueDate", { valueAsDate: true })}
                                className="bg-white"
                                defaultValue={format(new Date(), 'yyyy-MM-dd')}
                            />
                            {form.formState.errors.issueDate && (
                                <p className="text-xs text-rose-500">{form.formState.errors.issueDate.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dueDate" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hạn thanh toán</Label>
                            <Input
                                type="date"
                                id="dueDate"
                                {...form.register("dueDate", { valueAsDate: true })}
                                className="bg-white"
                                defaultValue={format(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')}
                            />
                            {form.formState.errors.dueDate && (
                                <p className="text-xs text-rose-500">{form.formState.errors.dueDate.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-900 uppercase">Chi tiết dịch vụ</h3>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => append({ description: "", quantity: 1, unitPrice: 0 })}
                                className="gap-1 text-xs font-bold border-dashed"
                            >
                                <Plus className="h-3 w-3" /> Thêm dòng
                            </Button>
                        </div>

                        <div className="border rounded-lg overflow-hidden bg-white">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-bold text-slate-700 w-[50%]">Mô tả</th>
                                        <th className="px-4 py-3 text-center font-bold text-slate-700 w-[15%]">SL</th>
                                        <th className="px-4 py-3 text-right font-bold text-slate-700 w-[25%]">Đơn giá</th>
                                        <th className="px-4 py-3 text-center font-bold text-slate-700 w-[10%]">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {fields.map((field, index) => (
                                        <tr key={field.id} className="group hover:bg-slate-50/50">
                                            <td className="px-4 py-2">
                                                <Input
                                                    {...form.register(`items.${index}.description`)}
                                                    placeholder="Nhập mô tả dịch vụ..."
                                                    className="border-0 shadow-none focus-visible:ring-0 px-0 font-medium"
                                                />
                                                {form.formState.errors.items?.[index]?.description && (
                                                    <p className="text-xs text-rose-500 mt-1">{form.formState.errors.items[index]?.description?.message}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-2">
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    {...form.register(`items.${index}.quantity`, { valueAsNumber: true })}
                                                    className="border-0 shadow-none focus-visible:ring-0 px-0 text-center"
                                                />
                                            </td>
                                            <td className="px-4 py-2">
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    {...form.register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                                                    className="border-0 shadow-none focus-visible:ring-0 px-0 text-right font-mono"
                                                />
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                                {fields.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => remove(index)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Footer Totals */}
                    <div className="flex flex-col md:flex-row justify-between gap-8 pt-4 border-t border-slate-100">
                        <div className="w-full md:w-1/2">
                            <Label htmlFor="notes" className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Ghi chú hóa đơn</Label>
                            <Textarea
                                id="notes"
                                {...form.register("notes")}
                                placeholder="Nhập ghi chú (VD: Thông tin chuyển khoản, điều khoản...)"
                                className="resize-none bg-amber-50/50 border-amber-100 focus:border-amber-300 focus:ring-amber-200"
                                rows={4}
                            />
                        </div>

                        <div className="w-full md:w-5/12 space-y-3 pt-2">
                            <div className="flex justify-between text-sm text-slate-600">
                                <span>Tạm tính</span>
                                <span className="font-medium font-mono">{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-slate-600">
                                <span>Thuế GTGT (0%)</span>
                                <span className="font-medium font-mono">0 ₫</span>
                            </div>
                            <div className="h-px bg-slate-200 my-2" />
                            <div className="flex justify-between items-baseline">
                                <span className="font-bold text-slate-900 uppercase">TỔNG THANH TOÁN</span>
                                <span className="text-2xl font-black text-slate-900 tracking-tight">{formatCurrency(totalAmount)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Footer */}
                    <div className="flex justify-end pt-8 border-t">
                        <div className="flex gap-3">
                            <Button type="button" variant="outline" onClick={() => router.back()}>
                                Hủy bỏ
                            </Button>
                            <Button type="submit" disabled={isPending || !selectedCustomer} className="bg-blue-600 hover:bg-blue-700 min-w-[150px]">
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tạo...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" /> Tạo hóa đơn
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                </form>
            </div>
        </div>
    );
}
