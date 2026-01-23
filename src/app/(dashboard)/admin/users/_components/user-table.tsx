"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditRoleDialog } from "./edit-role-dialog";
import { ToggleActiveDialog } from "./toggle-active-dialog";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@prisma/client";

interface User {
  id: string;
  email: string;
  name: string;
  image: string | null;
  role: UserRole;
  isActive: boolean;
  phone: string | null;
  emailVerified: Date | null;
  createdAt: Date;
  _count: {
    activityLogs: number;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface UserTableProps {
  data: User[];
  pagination: Pagination;
}

const roleLabels: Record<UserRole, string> = {
  ADMIN: "Quản trị viên",
  MANAGER: "Quản lý",
  ACCOUNTANT: "Kế toán",
  STAFF: "Nhân viên",
  VIEWER: "Người xem",
};

const roleColors: Record<UserRole, string> = {
  ADMIN: "bg-purple-100 text-purple-800 border-purple-200",
  MANAGER: "bg-blue-100 text-blue-800 border-blue-200",
  ACCOUNTANT: "bg-green-100 text-green-800 border-green-200",
  STAFF: "bg-yellow-100 text-yellow-800 border-yellow-200",
  VIEWER: "bg-gray-100 text-gray-800 border-gray-200",
};

export function UserTable({ data, pagination }: UserTableProps) {
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editRoleOpen, setEditRoleOpen] = useState(false);
  const [toggleActiveOpen, setToggleActiveOpen] = useState(false);

  const handleEditRole = (user: User) => {
    setSelectedUser(user);
    setEditRoleOpen(true);
  };

  const handleToggleActive = (user: User) => {
    setSelectedUser(user);
    setToggleActiveOpen(true);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set("page", newPage.toString());
    router.push(`/admin/users?${params.toString()}`);
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Người dùng</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Vai trò</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Hoạt động</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground text-center">
                  Không tìm thấy người dùng nào
                </TableCell>
              </TableRow>
            ) : (
              data.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.image ?? undefined} />
                        <AvatarFallback>
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        {user.phone && (
                          <div className="text-muted-foreground text-sm">{user.phone}</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{user.email}</span>
                      {user.emailVerified && (
                        <span className="text-xs text-green-600">✓ Đã xác thực</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={roleColors[user.role]}>
                      {roleLabels[user.role]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.isActive ? (
                      <Badge className="border-green-200 bg-green-100 text-green-800">
                        Hoạt động
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-red-200 bg-red-100 text-red-800">
                        Vô hiệu hóa
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground text-sm">
                      {user._count.activityLogs} hoạt động
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Tùy chọn">
                          <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleEditRole(user)}>
                          Thay đổi vai trò
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleActive(user)}>
                          {user.isActive ? "Vô hiệu hóa" : "Kích hoạt"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground text-sm">
            Trang {pagination.page} / {pagination.totalPages} ({pagination.total} người dùng)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              Sau
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      {selectedUser && (
        <>
          <EditRoleDialog user={selectedUser} open={editRoleOpen} onOpenChange={setEditRoleOpen} />
          <ToggleActiveDialog
            user={selectedUser}
            open={toggleActiveOpen}
            onOpenChange={setToggleActiveOpen}
          />
        </>
      )}
    </>
  );
}
