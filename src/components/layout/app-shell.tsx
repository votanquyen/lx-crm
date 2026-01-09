"use client";

import * as React from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { Breadcrumbs } from "./breadcrumbs";
import { QuickActionsFab } from "./quick-actions-fab";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";

const SIDEBAR_COLLAPSED_KEY = "locxanh-sidebar-collapsed";

interface AppShellProps {
  children: React.ReactNode;
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function AppShell({ children, user }: AppShellProps) {
  // Start with default value on server, then hydrate from localStorage
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Load and persist sidebar collapse state from/to localStorage (client-side only)
  React.useEffect(() => {
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (saved === "true") {
      setSidebarCollapsed(true);
    }
  }, []);

  React.useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  return (
    <div className="bg-background min-h-screen">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
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
        <div className="p-6">
          <Breadcrumbs />
          {children}
        </div>
      </main>

      {/* Mobile Quick Actions FAB */}
      <QuickActionsFab />
    </div>
  );
}
