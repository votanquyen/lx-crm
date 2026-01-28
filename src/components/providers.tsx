/**
 * Client-side providers wrapper
 * Wraps client-only components that need to be rendered in the layout
 */
"use client";

import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster richColors position="top-right" />
    </>
  );
}
