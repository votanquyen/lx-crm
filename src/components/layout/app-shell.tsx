"use client";

import * as React from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface AppShellProps {
  children: React.ReactNode;
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string | null;
  };
}

export function AppShell({ children, user }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <Sidebar collapsed={false} onToggle={() => setMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Header */}
      <Header
        user={user}
        sidebarCollapsed={sidebarCollapsed}
        onMenuClick={() => setMobileMenuOpen(true)}
      />

      {/* Main Content */}
      <main
        className={cn(
          "min-h-screen pt-16 transition-all duration-300",
          "lg:pl-64",
          sidebarCollapsed && "lg:pl-16"
        )}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
