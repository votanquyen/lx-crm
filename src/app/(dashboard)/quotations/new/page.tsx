/**
 * Create Quotation Page
 * Page for creating new quotations
 */
import { getCustomers } from "@/actions/customers";
import { getPlantTypes } from "@/actions/plant-types";
import { QuotationForm } from "@/components/quotations/quotation-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewQuotationPage() {
  // Fetch customers and plant types for the form
  const [customersResult, plantTypesResult] = await Promise.all([
    getCustomers({ page: 1, limit: 100, sortBy: "companyName", sortOrder: "asc" }),
    getPlantTypes({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" }),
  ]);

  // Convert Decimal fields to numbers for client component compatibility
  // Uses type assertion as plant types from DB have Decimal fields that need conversion
  const serializedPlantTypes = plantTypesResult.plantTypes.map((pt) => ({
    ...pt,
    rentalPrice: Number(pt.rentalPrice),
    depositPrice: pt.depositPrice ? Number(pt.depositPrice) : null,
    salePrice: pt.salePrice ? Number(pt.salePrice) : null,
    replacementPrice: pt.replacementPrice ? Number(pt.replacementPrice) : null,
  }));

  return (
    <div className="container mx-auto max-w-4xl space-y-6 py-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tạo báo giá mới</h1>
        <p className="text-muted-foreground">
          Tạo báo giá cho khách hàng với các sản phẩm cây xanh
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin báo giá</CardTitle>
          <CardDescription>
            Điền thông tin báo giá và chọn sản phẩm
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QuotationForm
            customers={customersResult.data as Parameters<typeof QuotationForm>[0]["customers"]}
            plantTypes={serializedPlantTypes as Parameters<typeof QuotationForm>[0]["plantTypes"]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
