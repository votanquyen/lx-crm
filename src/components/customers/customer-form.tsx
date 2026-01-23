/**
 * Customer Form Component
 * Create/Edit customer with React Hook Form + Zod validation
 */
"use client";

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createCustomer, updateCustomer } from "@/actions/customers";
import {
  createCustomerSchema,
  updateCustomerSchema,
  type CreateCustomerInput,
  type UpdateCustomerInput,
} from "@/lib/validations/customer";
import type { CustomerStatus } from "@prisma/client";

interface CustomerFormProps {
  customer?: {
    id: string;
    companyName: string;
    address: string;
    district: string | null;
    city: string | null;
    contactName: string | null;
    contactPhone: string | null;
    contactEmail: string | null;
    taxCode: string | null;
    status: CustomerStatus;
    latitude: number | null;
    longitude: number | null;
  };
  onSuccess?: () => void;
}

const DISTRICTS = [
  "Quận 1",
  "Quận 2",
  "Quận 3",
  "Quận 4",
  "Quận 5",
  "Quận 6",
  "Quận 7",
  "Quận 8",
  "Quận 9",
  "Quận 10",
  "Quận 11",
  "Quận 12",
  "Bình Thạnh",
  "Gò Vấp",
  "Phú Nhuận",
  "Tân Bình",
  "Tân Phú",
  "Thủ Đức",
  "Bình Tân",
  "Nhà Bè",
  "Hóc Môn",
  "Củ Chi",
  "Cần Giờ",
  "Bình Chánh",
];

export function CustomerForm({ customer, onSuccess }: CustomerFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isGeocoding, setIsGeocoding] = useState(false);
  const isEditing = !!customer;

  const form = useForm<CreateCustomerInput | UpdateCustomerInput>({
    resolver: zodResolver(isEditing ? updateCustomerSchema : createCustomerSchema) as Resolver<
      CreateCustomerInput | UpdateCustomerInput
    >,
    defaultValues: isEditing
      ? {
          id: customer.id,
          companyName: customer.companyName,
          address: customer.address,
          district: customer.district ?? undefined,
          city: customer.city ?? "TP.HCM",
          contactName: customer.contactName ?? undefined,
          contactPhone: customer.contactPhone ?? undefined,
          contactEmail: customer.contactEmail ?? undefined,
          taxCode: customer.taxCode ?? undefined,
          status: customer.status,
          latitude: customer.latitude ?? undefined,
          longitude: customer.longitude ?? undefined,
        }
      : {
          companyName: "",
          address: "",
          district: undefined,
          city: "TP.HCM",
          contactName: undefined,
          contactPhone: undefined,
          contactEmail: undefined,
          taxCode: undefined,
        },
  });

  const onSubmit = (data: CreateCustomerInput | UpdateCustomerInput) => {
    startTransition(async () => {
      try {
        const result = isEditing
          ? await updateCustomer(data as UpdateCustomerInput)
          : await createCustomer(data as CreateCustomerInput);

        if (result.success) {
          toast.success(isEditing ? "Cập nhật thành công" : "Thêm khách hàng thành công");
          if (onSuccess) {
            onSuccess();
          } else {
            router.push(isEditing ? `/customers/${customer.id}` : "/customers");
            router.refresh();
          }
        } else {
          toast.error(result.error);
        }
      } catch {
        toast.error("Đã xảy ra lỗi. Vui lòng thử lại.");
      }
    });
  };

  const geocodeAddress = useDebouncedCallback(
    async () => {
      const address = form.getValues("address");
      if (!address) {
        toast.error("Vui lòng nhập địa chỉ trước");
        return;
      }

      setIsGeocoding(true);
      try {
        const params = new URLSearchParams({
          q: `${address}, Ho Chi Minh, Vietnam`,
          format: "json",
          limit: "1",
        });

        const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
          headers: { "User-Agent": "LocXanh-CRM/4.0" },
        });

        if (!res.ok) {
          if (res.status === 429) {
            toast.error("Quá nhiều yêu cầu. Vui lòng thử lại sau 1 phút");
            return;
          }
          throw new Error(`Geocoding failed: ${res.status}`);
        }

        const data = await res.json();
        if (data.length === 0) {
          toast.warning("Không tìm thấy tọa độ cho địa chỉ này");
          return;
        }

        form.setValue("latitude", parseFloat(data[0].lat));
        form.setValue("longitude", parseFloat(data[0].lon));
        toast.success("Đã lấy tọa độ thành công");
      } catch {
        toast.error("Lỗi khi lấy tọa độ");
      } finally {
        setIsGeocoding(false);
      }
    },
    1000,
    { leading: true, trailing: false }
  );

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Company Info */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin công ty</CardTitle>
          <CardDescription>Thông tin cơ bản về khách hàng</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="companyName">Tên công ty *</Label>
            <Input
              id="companyName"
              placeholder="Công ty TNHH ABC"
              {...form.register("companyName")}
            />
            {form.formState.errors.companyName && (
              <p className="text-destructive text-sm">
                {form.formState.errors.companyName.message}
              </p>
            )}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Địa chỉ *</Label>
            <div className="flex gap-2">
              <Input
                id="address"
                placeholder="123 Nguyễn Văn A, Phường X"
                className="flex-1"
                {...form.register("address")}
              />
              <Button
                type="button"
                variant="outline"
                onClick={geocodeAddress}
                disabled={isGeocoding}
                aria-label={isGeocoding ? "Đang lấy tọa độ" : "Lấy tọa độ từ địa chỉ"}
              >
                {isGeocoding ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                )}
              </Button>
            </div>
            {form.formState.errors.address && (
              <p className="text-destructive text-sm">{form.formState.errors.address.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="district">Quận/Huyện</Label>
            <Select
              value={form.watch("district") ?? ""}
              onValueChange={(v) => form.setValue("district", v || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn quận/huyện" />
              </SelectTrigger>
              <SelectContent>
                {DISTRICTS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">Thành phố</Label>
            <Input id="city" placeholder="TP.HCM" {...form.register("city")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxCode">Mã số thuế</Label>
            <Input id="taxCode" placeholder="0123456789" {...form.register("taxCode")} />
          </div>

          {isEditing && (
            <div className="space-y-2">
              <Label htmlFor="status">Trạng thái</Label>
              <Select
                value={form.watch("status")}
                onValueChange={(v) => form.setValue("status", v as CustomerStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LEAD">Tiềm năng</SelectItem>
                  <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                  <SelectItem value="INACTIVE">Ngưng hoạt động</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Info */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin liên hệ</CardTitle>
          <CardDescription>Người liên hệ chính của khách hàng</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="contactName">Tên người liên hệ</Label>
            <Input id="contactName" placeholder="Nguyễn Văn A" {...form.register("contactName")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPhone">Số điện thoại</Label>
            <Input id="contactPhone" placeholder="0901234567" {...form.register("contactPhone")} />
            {form.formState.errors.contactPhone && (
              <p className="text-destructive text-sm">
                {form.formState.errors.contactPhone.message}
              </p>
            )}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="contactEmail">Email</Label>
            <Input
              id="contactEmail"
              type="email"
              placeholder="contact@company.com"
              {...form.register("contactEmail")}
            />
            {form.formState.errors.contactEmail && (
              <p className="text-destructive text-sm">
                {form.formState.errors.contactEmail.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Coordinates (hidden by default, shown if geocoded) */}
      {(form.watch("latitude") || form.watch("longitude")) && (
        <Card>
          <CardHeader>
            <CardTitle>Tọa độ</CardTitle>
            <CardDescription>Vị trí địa lý của khách hàng</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="latitude">Vĩ độ</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                {...form.register("latitude", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Kinh độ</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                {...form.register("longitude", { valueAsNumber: true })}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
          {isEditing ? "Cập nhật" : "Thêm khách hàng"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
          Hủy
        </Button>
      </div>
    </form>
  );
}
