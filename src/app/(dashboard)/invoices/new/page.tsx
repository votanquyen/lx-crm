import { getCustomers } from "@/actions/customers";
import { InvoiceForm } from "@/components/invoices/invoice-form";

export const metadata = {
    title: "Tạo hóa đơn mới | Lộc Xanh",
    description: "Tạo hóa đơn GTGT mới cho khách hàng",
};

export default async function NewInvoicePage() {
    // Fetch active customers for the dropdown
    // Limit to 100 to avoid performance issues with raw select
    const { data: customers } = await getCustomers({
        status: "ACTIVE",
        limit: 100,
        sortBy: "companyName",
        sortOrder: "asc"
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">Tạo hóa đơn</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">
                        Tạo mới hóa đơn VAT cho khách hàng
                    </p>
                </div>
            </div>

            <InvoiceForm customers={customers} />
        </div>
    );
}
