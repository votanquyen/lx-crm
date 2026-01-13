"use client";

import { Bell, Search, Menu, Settings, Users, LogOut, User as UserIcon } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
    role?: string | null;
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

  const isAdmin = user.role === "ADMIN";

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-30 flex h-14 items-center border-b bg-white transition-all duration-300",
        sidebarCollapsed ? "left-16" : "left-64"
      )}
    >
      <div className="flex h-full w-full items-center justify-between px-6">
        {/* Left side - Search */}
        <div className="flex items-center gap-4 flex-1">
          <Button variant="ghost" size="icon" className="lg:hidden text-slate-500" onClick={onMenuClick}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="relative hidden md:block max-w-md w-full">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Tìm kiếm nhanh khách hàng, hợp đồng..."
              className="h-8 w-full pl-9 bg-slate-50 border-slate-200 text-xs font-medium focus:bg-white transition-all focus:ring-1 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Right side - Notifications & User */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-8 w-8 text-slate-500 hover:text-primary transition-colors">
                <Bell className="h-4 w-4" />
                <span className="absolute right-1 top-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden border-slate-200 shadow-xl">
              <div className="bg-slate-50 px-4 py-3 border-b">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Thông báo mới nhất</p>
              </div>
              <div className="max-h-96 overflow-y-auto divide-y">
                {[
                  { id: 1, title: "Hóa đơn #INV-001 quá hạn", time: "2 phút trước", type: "error" },
                  { id: 2, title: "Yêu cầu đổi cây từ ABC Corp", time: "1 giờ trước", type: "warning" },
                  { id: 3, title: "Hợp đồng #CT-005 sắp hết hạn", time: "3 giờ trước", type: "info" }
                ].map((notif) => (
                  <DropdownMenuItem key={notif.id} className="flex flex-col items-start gap-0.5 px-4 py-3 cursor-pointer focus:bg-slate-50">
                    <span className="text-[11px] font-bold text-slate-900 leading-tight">{notif.title}</span>
                    <span className="text-[10px] font-bold text-slate-400">{notif.time}</span>
                  </DropdownMenuItem>
                ))}
              </div>
              <div className="p-2 bg-slate-50 border-t">
                <Button variant="ghost" className="w-full h-8 text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary hover:bg-white">
                  Xem tất cả thông báo
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="w-px h-6 bg-slate-200" />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 gap-2.5 pl-1.5 pr-2.5 rounded-full hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200">
                <Avatar className="h-7 w-7 border-2 border-white shadow-sm">
                  <AvatarImage src={user.image ?? undefined} alt={user.name ?? "User"} />
                  <AvatarFallback className="bg-primary text-white text-[10px] font-black">
                    {initials ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start text-left leading-none">
                  <span className="text-[11px] font-black text-slate-900 tracking-tight">{user.name}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">{user.role === "ADMIN" ? "Quản trị viên" : "Nhân viên"}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-1 border-slate-200 shadow-xl">
              <div className="px-3 py-2.5 mb-1 bg-slate-50 rounded-md">
                <p className="text-[11px] font-black text-slate-900 truncate">{user.name}</p>
                <p className="text-[10px] font-bold text-slate-400 truncate mt-0.5">{user.email}</p>
              </div>

              <DropdownMenuItem asChild className="text-[11px] font-bold uppercase tracking-tight py-2.5 cursor-pointer">
                <Link href="/profile" className="flex items-center gap-2">
                  <UserIcon className="h-3.5 w-3.5 text-slate-400" />
                  Hồ sơ cá nhân
                </Link>
              </DropdownMenuItem>

              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <div className="px-3 py-1.5">
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Hệ thống</p>
                  </div>
                  <DropdownMenuItem asChild className="text-[11px] font-bold uppercase tracking-tight py-2.5 cursor-pointer">
                    <Link href="/admin/settings" className="flex items-center gap-2">
                      <Settings className="h-3.5 w-3.5 text-slate-400" />
                      Cài đặt CRM
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="text-[11px] font-bold uppercase tracking-tight py-2.5 cursor-pointer">
                    <Link href="/admin/users" className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      Quản lý nhân sự
                    </Link>
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-[11px] font-bold uppercase tracking-tight py-2.5 text-rose-600 focus:text-rose-600 focus:bg-rose-50 cursor-pointer"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="mr-2 h-3.5 w-3.5" />
                Đăng xuất hệ thống
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
