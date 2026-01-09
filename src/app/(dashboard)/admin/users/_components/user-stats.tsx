"use client";

import { Users, UserCheck, UserX, Shield, UserCog } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { UserRole } from "@prisma/client";

interface UserStatsProps {
  stats: {
    total: number;
    active: number;
    inactive: number;
    byRole: Record<UserRole, number>;
  };
}

export function UserStats({ stats }: UserStatsProps) {
  const statCards = [
    {
      title: "Tổng người dùng",
      value: stats.total,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Đang hoạt động",
      value: stats.active,
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Bị vô hiệu hóa",
      value: stats.inactive,
      icon: UserX,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Quản trị viên",
      value: stats.byRole.ADMIN ?? 0,
      icon: Shield,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Quản lý",
      value: stats.byRole.MANAGER ?? 0,
      icon: UserCog,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`rounded-full p-3 ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
