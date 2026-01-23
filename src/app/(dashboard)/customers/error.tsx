"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
      <AlertTriangle className="text-destructive h-12 w-12" aria-hidden="true" />
      <h2 className="text-xl font-semibold">Co loi xay ra</h2>
      <p className="text-muted-foreground max-w-md text-center">
        {error.message || "Da xay ra loi khong mong muon. Vui long thu lai."}
      </p>
      <Button onClick={reset}>Thu lai</Button>
    </div>
  );
}
