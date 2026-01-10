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
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <h2 className="text-xl font-semibold">Co loi xay ra</h2>
      <p className="text-muted-foreground text-center max-w-md">
        {error.message || "Da xay ra loi khong mong muon. Vui long thu lai."}
      </p>
      <Button onClick={reset}>Thu lai</Button>
    </div>
  );
}
