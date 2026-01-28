import { notFound } from "next/navigation";
import { getInvoiceById } from "@/actions/invoices";
import { getCustomers } from "@/actions/customers";
import { InvoiceForm } from "@/components/invoices/invoice-form";

export const metadata = {
    title: "Chỉnh sửa hóa đơn | Lộc Xanh",
    description: "Cập nhật thông tin hóa đơn GTGT",
};

interface EditInvoicePageProps {
    params: Promise<{ id: string }>;
}

export default async function EditInvoicePage({ params }: EditInvoicePageProps) {
    const { id } = await params;

    const [invoice, { data: customers }] = await Promise.all([
        getInvoiceById(id),
        getCustomers({
            status: "ACTIVE",
            limit: 100,
            sortBy: "companyName",
            sortOrder: "asc"
        })
    ]);

    if (!invoice) {
        notFound();
    }

    if (invoice.status !== "DRAFT") {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                <h1 className="text-2xl font-bold text-slate-900 mb-4">Không thể chỉnh sửa</h1>
                <p className="text-slate-600 mb-8">
                    Hóa đơn này đã được gửi hoặc thanh toán (Trạng thái: {invoice.status}).
                    <br />
                    Chỉ có thể chỉnh sửa hóa đơn ở trạng thái Nháp.
                </p>
                {/* Back button handled by browser or navigation */}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">Chỉnh sửa hóa đơn</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">
                        Cập nhật thông tin hóa đơn #{invoice.invoiceNumber}
                    </p>
                </div>
            </div>

            <InvoiceForm customers={customers} initialData={invoice} />
        </div>
    );
}
