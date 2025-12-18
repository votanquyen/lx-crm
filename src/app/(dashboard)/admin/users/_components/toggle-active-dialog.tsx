"use client";

import { useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toggleUserActive } from "@/actions/users";
import { toast } from "sonner";
import type { UserRole } from "@prisma/client";

interface ToggleActiveDialogProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    isActive: boolean;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ToggleActiveDialog({ user, open, onOpenChange }: ToggleActiveDialogProps) {
  const [isPending, startTransition] = useTransition();
  const newStatus = !user.isActive;

  const handleSubmit = async () => {
    startTransition(async () => {
      const result = await toggleUserActive({ userId: user.id, isActive: newStatus });

      if (result.success) {
        toast.success(
          newStatus
            ? `Đã kích hoạt tài khoản ${user.name}`
            : `Đã vô hiệu hóa tài khoản ${user.name}`
        );
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
          <DialogTitle>
            {newStatus ? "Kích hoạt" : "Vô hiệu hóa"} Tài khoản
          </DialogTitle>
          <DialogDescription>
            Bạn có chắc muốn {newStatus ? "kích hoạt" : "vô hiệu hóa"} tài khoản của{" "}
            <span className="font-medium">{user.name}</span>?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Email:</span> {user.email}
            </div>
            <div>
              <span className="font-medium">Vai trò:</span> {user.role}
            </div>
          </div>

          {!newStatus && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 border border-red-200">
              ⚠️ Người dùng sẽ bị đăng xuất ngay lập tức và không thể đăng nhập lại cho đến khi được kích hoạt.
            </div>
          )}

          {newStatus && (
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-800 border border-green-200">
              ✓ Người dùng sẽ có thể đăng nhập lại vào hệ thống.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            variant={newStatus ? "default" : "destructive"}
          >
            {isPending ? "Đang xử lý..." : newStatus ? "Kích hoạt" : "Vô hiệu hóa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
