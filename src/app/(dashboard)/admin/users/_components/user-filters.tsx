"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { useState, useTransition } from "react";

export function UserFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [role, setRole] = useState(searchParams.get("role") ?? "");
  const [isActive, setIsActive] = useState(searchParams.get("isActive") ?? "");

  const handleFilter = () => {
    startTransition(() => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (role) params.set("role", role);
      if (isActive) params.set("isActive", isActive);
      params.set("page", "1"); // Reset to page 1 when filtering

      router.push(`/admin/users?${params.toString()}`);
    });
  };

  const handleClear = () => {
    setSearch("");
    setRole("");
    setIsActive("");
    startTransition(() => {
      router.push("/admin/users");
    });
  };

  const hasFilters = search || role || isActive;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Tìm kiếm</Label>
          <Input
            id="search"
            placeholder="Tên hoặc email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleFilter()}
          />
        </div>

        {/* Role */}
        <div className="space-y-2">
          <Label htmlFor="role">Vai trò</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger id="role">
              <SelectValue placeholder="Tất cả vai trò" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tất cả vai trò</SelectItem>
              <SelectItem value="ADMIN">Quản trị viên</SelectItem>
              <SelectItem value="MANAGER">Quản lý</SelectItem>
              <SelectItem value="ACCOUNTANT">Kế toán</SelectItem>
              <SelectItem value="STAFF">Nhân viên</SelectItem>
              <SelectItem value="VIEWER">Người xem</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label htmlFor="isActive">Trạng thái</Label>
          <Select value={isActive} onValueChange={setIsActive}>
            <SelectTrigger id="isActive">
              <SelectValue placeholder="Tất cả trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tất cả trạng thái</SelectItem>
              <SelectItem value="true">Đang hoạt động</SelectItem>
              <SelectItem value="false">Bị vô hiệu hóa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Actions */}
        <div className="flex items-end gap-2">
          <Button onClick={handleFilter} disabled={isPending} className="flex-1">
            <Search className="mr-2 h-4 w-4" aria-hidden="true" />
            Lọc
          </Button>
          {hasFilters && (
            <Button onClick={handleClear} disabled={isPending} variant="outline" size="icon" aria-label="Xóa bộ lọc">
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
