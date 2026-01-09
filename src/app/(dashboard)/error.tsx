"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, RefreshCw } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to monitoring service
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <div className="bg-destructive/10 rounded-full p-6">
            <AlertCircle className="text-destructive h-12 w-12" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Không thể tải dữ liệu</h2>
          <p className="text-muted-foreground">
            Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại sau.
          </p>
          {process.env.NODE_ENV === "development" && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm font-medium">
                Chi tiết lỗi (dev only)
              </summary>
              <pre className="bg-muted mt-2 overflow-auto rounded-md p-4 text-xs">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
                {error.digest && `\n\nDigest: ${error.digest}`}
              </pre>
            </details>
          )}
        </div>
        <div className="flex justify-center gap-2">
          <Button onClick={reset} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Thử lại
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = "/")} className="gap-2">
            <Home className="h-4 w-4" />
            Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
