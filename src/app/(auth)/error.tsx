"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AuthError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to monitoring service
    console.error("Auth error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-6">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Lỗi đăng nhập</h2>
          <p className="text-muted-foreground">
            Không thể đăng nhập. Vui lòng thử lại hoặc liên hệ quản trị viên.
          </p>
          {process.env.NODE_ENV === "development" && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm font-medium">
                Chi tiết lỗi (dev only)
              </summary>
              <pre className="mt-2 overflow-auto rounded-md bg-muted p-4 text-xs">
                {error.message}
                {error.digest && `\nDigest: ${error.digest}`}
              </pre>
            </details>
          )}
        </div>
        <div className="flex gap-2 justify-center">
          <Button onClick={reset}>Thử lại</Button>
          <Button variant="outline" onClick={() => window.location.href = "/login"} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Quay lại đăng nhập
          </Button>
        </div>
      </div>
    </div>
  );
}
