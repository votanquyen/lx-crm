"use client";

import { Bell, Search, Menu } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface HeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  sidebarCollapsed: boolean;
  onMenuClick?: () => void;
}

export function Header({ user, sidebarCollapsed, onMenuClick }: HeaderProps) {
  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header
      className={cn(
        "bg-background fixed top-0 right-0 z-30 flex h-16 items-center border-b transition-all duration-300",
        "left-0 lg:left-64",
        sidebarCollapsed && "lg:left-16"
      )}
    >
      <div className="flex h-full w-full items-center justify-between px-6">
        {/* Left side - Search */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
            aria-label="Mở menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="relative hidden md:block">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input placeholder="Tìm kiếm khách hàng, hợp đồng..." className="w-80 pl-9" />
          </div>
        </div>

        {/* Right side - Notifications & User */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative" aria-label="Thông báo">
                <Bell className="h-5 w-5" />
                <span className="bg-destructive absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] text-white">
                  3
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Thông báo</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
                <span className="font-medium">Hóa đơn #INV-001 quá hạn</span>
                <span className="text-muted-foreground text-xs">2 phút trước</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
                <span className="font-medium">Yêu cầu đổi cây từ ABC Corp</span>
                <span className="text-muted-foreground text-xs">1 giờ trước</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
                <span className="font-medium">Hợp đồng #CT-005 sắp hết hạn</span>
                <span className="text-muted-foreground text-xs">3 giờ trước</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 pr-3 pl-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.image ?? undefined} alt={user.name ?? "User"} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {initials ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium md:inline-block">{user.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-muted-foreground text-xs">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Hồ sơ cá nhân</DropdownMenuItem>
              <DropdownMenuItem>Cài đặt</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
