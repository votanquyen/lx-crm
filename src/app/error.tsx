"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to monitoring service
    console.error("Global error boundary:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <AlertCircle className="text-destructive h-16 w-16" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Đã xảy ra lỗi</h1>
          <p className="text-muted-foreground">Xin lỗi, có lỗi xảy ra khi tải trang này.</p>
          {process.env.NODE_ENV === "development" && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm font-medium">
                Chi tiết lỗi (chỉ hiển thị ở môi trường dev)
              </summary>
              <pre className="bg-muted mt-2 overflow-auto rounded-md p-4 text-xs">
                {error.message}
                {error.digest && `\nDigest: ${error.digest}`}
              </pre>
            </details>
          )}
        </div>
        <div className="flex justify-center gap-2">
          <Button onClick={reset}>Thử lại</Button>
          <Button variant="outline" onClick={() => (window.location.href = "/")}>
            Về trang chủ
          </Button>
        </div>
      </div>
    </div>
  );
}
