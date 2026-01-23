"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Users, Receipt, FileSpreadsheet, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuickAction {
  label: string;
  href: string;
  icon: React.ElementType;
  color: string;
}

const quickActions: QuickAction[] = [
  {
    label: "Khách hàng mới",
    href: "/customers/new",
    icon: Users,
    color: "bg-blue-500 hover:bg-blue-600",
  },
  {
    label: "Hóa đơn mới",
    href: "/invoices/new",
    icon: Receipt,
    color: "bg-green-500 hover:bg-green-600",
  },
  {
    label: "Báo giá mới",
    href: "/quotations/new",
    icon: FileSpreadsheet,
    color: "bg-orange-500 hover:bg-orange-600",
  },
];

/**
 * Floating Action Button (FAB) for quick actions on mobile
 * Shows on mobile/tablet viewports only
 */
export function QuickActionsFab() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="fixed right-4 bottom-4 z-50 lg:hidden">
      {/* Action buttons - shown when FAB is open */}
      <div
        className={cn(
          "absolute right-0 bottom-14 flex flex-col-reverse gap-2 transition-all duration-200",
          isOpen
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0"
        )}
      >
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2 text-white shadow-lg transition-all",
                action.color,
                "animate-in fade-in slide-in-from-bottom-2",
              )}
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => setIsOpen(false)}
            >
              <Icon className="h-5 w-5" />
              <span className="text-sm font-medium whitespace-nowrap">
                {action.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Main FAB button */}
      <Button
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-14 w-14 rounded-full shadow-lg transition-transform",
          isOpen ? "rotate-45 bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"
        )}
        aria-label={isOpen ? "Đóng menu" : "Mở menu nhanh"}
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </Button>

      {/* Backdrop for closing */}
      {isOpen && (
        <div
          className="fixed inset-0 -z-10"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
