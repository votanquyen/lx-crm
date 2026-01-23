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
import { ClientOnly } from "@/components/ui/client-only";
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
        <div className="flex flex-1 items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-500 lg:hidden"
            onClick={onMenuClick}
            aria-label="Mở menu"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </Button>
          <div className="relative hidden w-full max-w-md md:block">
            <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <Input
              placeholder="Tìm kiếm nhanh khách hàng, hợp đồng..."
              className="focus:ring-primary/20 h-8 w-full border-slate-200 bg-slate-50 pl-9 text-xs font-medium transition-all focus:bg-white focus:ring-1"
            />
          </div>
        </div>

        {/* Right side - Notifications & User */}
        <div className="flex items-center gap-4">
          <ClientOnly
            fallback={
              <div className="flex items-center gap-4">
                <div className="h-8 w-8 animate-pulse rounded-md bg-slate-100" />
                <div className="h-6 w-px bg-slate-200" />
                <div className="h-9 w-32 animate-pulse rounded-full bg-slate-100" />
              </div>
            }
          >
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:text-primary relative h-8 w-8 text-slate-500 transition-colors"
                  aria-label="Thông báo"
                >
                  <Bell className="h-4 w-4" aria-hidden="true" />
                  <span className="absolute top-1 right-1 flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500"></span>
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-80 overflow-hidden border-slate-200 p-0 shadow-xl"
              >
                <div className="border-b bg-slate-50 px-4 py-3">
                  <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    Thông báo mới nhất
                  </p>
                </div>
                <div className="max-h-96 divide-y overflow-y-auto">
                  {[
                    {
                      id: 1,
                      title: "Hóa đơn #INV-001 quá hạn",
                      time: "2 phút trước",
                      type: "error",
                    },
                    {
                      id: 2,
                      title: "Yêu cầu đổi cây từ ABC Corp",
                      time: "1 giờ trước",
                      type: "warning",
                    },
                    {
                      id: 3,
                      title: "Hợp đồng #CT-005 sắp hết hạn",
                      time: "3 giờ trước",
                      type: "info",
                    },
                  ].map((notif) => (
                    <DropdownMenuItem
                      key={notif.id}
                      className="flex cursor-pointer flex-col items-start gap-0.5 px-4 py-3 focus:bg-slate-50"
                    >
                      <span className="text-[11px] leading-tight font-bold text-slate-900">
                        {notif.title}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">{notif.time}</span>
                    </DropdownMenuItem>
                  ))}
                </div>
                <div className="border-t bg-slate-50 p-2">
                  <Button
                    variant="ghost"
                    className="text-primary hover:text-primary h-8 w-full text-[10px] font-bold tracking-widest uppercase hover:bg-white"
                  >
                    Xem tất cả thông báo
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="h-6 w-px bg-slate-200" />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-9 gap-2.5 rounded-full border border-transparent pr-2.5 pl-1.5 transition-all hover:border-slate-200 hover:bg-slate-50"
                >
                  <Avatar className="h-7 w-7 border-2 border-white shadow-sm">
                    <AvatarImage src={user.image ?? undefined} alt={user.name ?? "User"} />
                    <AvatarFallback className="bg-primary text-[10px] font-black text-white">
                      {initials ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden flex-col items-start text-left leading-none md:flex">
                    <span className="text-[11px] font-black tracking-tight text-slate-900">
                      {user.name}
                    </span>
                    <span className="mt-0.5 text-[9px] font-bold tracking-tight text-slate-400 uppercase">
                      {user.role === "ADMIN" ? "Quản trị viên" : "Nhân viên"}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 border-slate-200 p-1 shadow-xl">
                <div className="mb-1 rounded-md bg-slate-50 px-3 py-2.5">
                  <p className="truncate text-[11px] font-black text-slate-900">{user.name}</p>
                  <p className="mt-0.5 truncate text-[10px] font-bold text-slate-400">
                    {user.email}
                  </p>
                </div>

                <DropdownMenuItem
                  asChild
                  className="cursor-pointer py-2.5 text-[11px] font-bold tracking-tight uppercase"
                >
                  <Link href="/profile" className="flex items-center gap-2">
                    <UserIcon className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                    Hồ sơ cá nhân
                  </Link>
                </DropdownMenuItem>

                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <div className="px-3 py-1.5">
                      <p className="text-[9px] font-black tracking-widest text-slate-300 uppercase">
                        Hệ thống
                      </p>
                    </div>
                    <DropdownMenuItem
                      asChild
                      className="cursor-pointer py-2.5 text-[11px] font-bold tracking-tight uppercase"
                    >
                      <Link href="/admin/settings" className="flex items-center gap-2">
                        <Settings className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                        Cài đặt CRM
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      asChild
                      className="cursor-pointer py-2.5 text-[11px] font-bold tracking-tight uppercase"
                    >
                      <Link href="/admin/users" className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                        Quản lý nhân sự
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer py-2.5 text-[11px] font-bold tracking-tight text-rose-600 uppercase focus:bg-rose-50 focus:text-rose-600"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                >
                  <LogOut className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                  Đăng xuất hệ thống
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </ClientOnly>
        </div>
      </div>
    </header>
  );
}
