"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Leaf,
  FileText,
  Receipt,
  Calendar,
  RefreshCcw,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  CreditCard,
  ClipboardList,
  CalendarCheck,
  CalendarClock,
  Upload,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const navItems: NavItem[] = [
  // 1. Core Business (Daily Workflow)
  { title: "Tổng quan", href: "/", icon: LayoutDashboard },
  { title: "Khách hàng", href: "/customers", icon: Users },
  { title: "Bảng Kê", href: "/bang-ke", icon: ClipboardList },
  { title: "Hóa đơn", href: "/invoices", icon: Receipt },

  // 2. Operations (Field)
  { title: "Cây xanh", href: "/plant-types", icon: Leaf },
  { title: "Lịch chăm sóc", href: "/care", icon: Calendar }, // Includes "Today" view
  { title: "Đổi cây", href: "/exchanges", icon: RefreshCcw }, // Includes "Exchange Schedule"

  // 3. Occasional / Monitoring
  { title: "Hợp đồng", href: "/contracts", icon: FileText },
  { title: "Báo giá", href: "/quotations", icon: FileSpreadsheet },
  { title: "Thanh toán", href: "/payments", icon: CreditCard },

  // 4. Admin / System
  { title: "Báo cáo", href: "/analytics", icon: BarChart3 },
  { title: "Nhập dữ liệu", href: "/admin/data-import", icon: Upload },
  { title: "Quản lý user", href: "/admin/users", icon: UserCog },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen border-r bg-card transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-center border-b px-4">
          {!collapsed && (
            <Link href="/" className="flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="Lộc Xanh"
                width={140}
                height={40}
                className="h-10 w-auto"
                priority
              />
            </Link>
          )}
          {collapsed && (
            <Link href="/" className="mx-auto">
              <Image
                src="/logo.png"
                alt="Lộc Xanh"
                width={32}
                height={32}
                className="h-8 w-auto object-contain"
                priority
              />
            </Link>
          )}
        </div>

        {/* Navigation */}
        <ScrollArea className="h-[calc(100vh-8rem)]">
          <nav className="flex flex-col gap-1 p-2">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              const Icon = item.icon;

              if (collapsed) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-md transition-all mx-auto mb-1",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-slate-100 hover:text-foreground"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="font-medium">{item.title}</TooltipContent>
                  </Tooltip>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all mb-0.5",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-slate-100 hover:text-foreground"
                  )}
                >
                  <Icon className="h-4.5 w-4.5" />
                  <span>{item.title}</span>
                  {item.badge && (
                    <span className="ml-auto rounded-full bg-primary-foreground/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Toggle Button */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-8 w-8 rounded-full border"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
