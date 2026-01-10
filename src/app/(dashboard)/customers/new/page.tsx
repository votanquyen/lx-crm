/**
 * New Customer Page
 */
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomerForm } from "@/components/customers/customer-form";

export default function NewCustomerPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/customers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Thêm khách hàng mới</h1>
          <p className="text-muted-foreground">Điền thông tin để tạo khách hàng mới</p>
        </div>
      </div>

      <CustomerForm />
    </div>
  );
}
