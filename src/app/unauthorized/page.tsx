import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";

export default async function UnauthorizedPage() {
  const session = await auth();

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-6">
            <ShieldAlert className="h-16 w-16 text-destructive" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Không có quyền truy cập
          </h1>
          <p className="text-muted-foreground">
            Bạn không có quyền truy cập vào trang này.
          </p>
          {session?.user && (
            <p className="text-sm text-muted-foreground">
              Tài khoản: <span className="font-medium">{session.user.email}</span>
              <br />
              Vai trò: <span className="font-medium capitalize">{session.user.role?.toLowerCase()}</span>
            </p>
          )}
        </div>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Nếu bạn cần quyền truy cập vào trang này, vui lòng liên hệ với quản trị viên hệ thống.
          </p>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button asChild>
              <Link href="/">Về trang chủ</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">Bảng điều khiển</Link>
            </Button>
          </div>
        </div>

        <div className="pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Mã lỗi: 403 - Forbidden
          </p>
        </div>
      </div>
    </div>
  );
}
