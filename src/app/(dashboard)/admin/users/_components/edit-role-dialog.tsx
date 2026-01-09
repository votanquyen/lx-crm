"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateUserRole } from "@/actions/users";
import { toast } from "sonner";
import type { UserRole } from "@prisma/client";

interface EditRoleDialogProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const roleLabels: Record<UserRole, { label: string; description: string }> = {
  ADMIN: {
    label: "Quản trị viên",
    description: "Toàn quyền quản lý hệ thống",
  },
  MANAGER: {
    label: "Quản lý",
    description: "Xem tất cả, sửa hạn chế",
  },
  ACCOUNTANT: {
    label: "Kế toán",
    description: "Quản lý hóa đơn và thanh toán",
  },
  STAFF: {
    label: "Nhân viên",
    description: "Chăm sóc cây và lịch làm việc",
  },
  VIEWER: {
    label: "Người xem",
    description: "Chỉ xem, không chỉnh sửa",
  },
};

export function EditRoleDialog({ user, open, onOpenChange }: EditRoleDialogProps) {
  const [role, setRole] = useState<UserRole>(user.role);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async () => {
    if (role === user.role) {
      toast.info("Vai trò không thay đổi");
      onOpenChange(false);
      return;
    }

    startTransition(async () => {
      const result = await updateUserRole({ userId: user.id, role });

      if (result.success) {
        toast.success(`Đã cập nhật vai trò thành ${roleLabels[role].label}`);
        onOpenChange(false);
      } else {
        toast.error(result.error ?? "Có lỗi xảy ra");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thay đổi Vai trò</DialogTitle>
          <DialogDescription>
            Thay đổi vai trò của <span className="font-medium">{user.name}</span> ({user.email})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="role">Vai trò mới</Label>
            <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(roleLabels).map(([value, { label, description }]) => (
                  <SelectItem key={value} value={value}>
                    <div>
                      <div className="font-medium">{label}</div>
                      <div className="text-muted-foreground text-xs">{description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {role !== user.role && (
            <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
              ⚠️ Người dùng sẽ bị đăng xuất và cần đăng nhập lại để áp dụng vai trò mới.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || role === user.role}>
            {isPending ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
