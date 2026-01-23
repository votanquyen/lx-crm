"use client";

import Link from "next/link";
import { Leaf, Calendar, Clock, ChevronRight, AlertCircle, TreeDeciduous } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface OperationsTabProps {
  customerId: string;
  plantsCount: number;
  careSchedulesCount: number;
  exchangeRequestsCount: number;
}

export function OperationsTab({
  customerId,
  plantsCount,
  careSchedulesCount,
  exchangeRequestsCount,
}: OperationsTabProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Plants Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-bold">
              <Leaf className="h-4 w-4 text-emerald-500" aria-hidden="true" />
              Cây xanh đang thuê
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
              <Link href={`/plants?customerId=${customerId}`}>
                Quản lý cây
                <ChevronRight className="ml-1 h-3 w-3" aria-hidden="true" />
              </Link>
            </Button>
          </div>
          <CardDescription>Tài sản đang thuê tại khách hàng</CardDescription>
        </CardHeader>
        <CardContent>
          {plantsCount === 0 ? (
            <div className="py-8 text-center">
              <TreeDeciduous className="text-muted-foreground/30 mx-auto mb-4 h-12 w-12" aria-hidden="true" />
              <p className="text-muted-foreground mb-4 text-sm">Chưa có cây xanh nào</p>
              <Button asChild variant="outline" size="sm">
                <Link href={`/plants/new?customerId=${customerId}`}>Thêm cây xanh</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                  <p className="text-[10px] font-bold tracking-wider text-emerald-600 uppercase">
                    Tổng cây
                  </p>
                  <p className="text-2xl font-black text-emerald-700">{plantsCount}</p>
                </div>
                {exchangeRequestsCount > 0 && (
                  <div className="rounded-lg border border-amber-100 bg-amber-50 p-3">
                    <p className="text-[10px] font-bold tracking-wider text-amber-600 uppercase">
                      Yêu cầu đổi
                    </p>
                    <p className="text-2xl font-black text-amber-700">{exchangeRequestsCount}</p>
                  </div>
                )}
              </div>

              {/* Placeholder for plant list */}
              <div className="border-t pt-2">
                <p className="text-muted-foreground py-4 text-center text-xs">
                  Danh sách chi tiết cây xanh sẽ hiển thị tại đây
                </p>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href={`/plants?customerId=${customerId}`}>
                    Xem danh sách cây
                    <ChevronRight className="ml-1 h-3 w-3" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Care Schedule Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-bold">
              <Calendar className="h-4 w-4 text-blue-500" aria-hidden="true" />
              Lịch chăm sóc
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
              <Link href={`/care-schedules?customerId=${customerId}`}>
                Xem lịch
                <ChevronRight className="ml-1 h-3 w-3" aria-hidden="true" />
              </Link>
            </Button>
          </div>
          <CardDescription>Lịch sử và kế hoạch chăm sóc</CardDescription>
        </CardHeader>
        <CardContent>
          {careSchedulesCount === 0 ? (
            <div className="py-8 text-center">
              <Clock className="text-muted-foreground/30 mx-auto mb-4 h-12 w-12" aria-hidden="true" />
              <p className="text-muted-foreground mb-4 text-sm">Chưa có lịch chăm sóc</p>
              <Button asChild variant="outline" size="sm">
                <Link href={`/care-schedules/new?customerId=${customerId}`}>Lên lịch chăm sóc</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                  <p className="text-[10px] font-bold tracking-wider text-blue-600 uppercase">
                    Tổng lịch
                  </p>
                  <p className="text-2xl font-black text-blue-700">{careSchedulesCount}</p>
                </div>
              </div>

              {/* Placeholder for schedule list */}
              <div className="border-t pt-2">
                <p className="text-muted-foreground py-4 text-center text-xs">
                  Chi tiết lịch chăm sóc sẽ hiển thị tại đây
                </p>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href={`/care-schedules?customerId=${customerId}`}>
                    Xem lịch chăm sóc
                    <ChevronRight className="ml-1 h-3 w-3" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Exchange Requests Section (if any) */}
      {exchangeRequestsCount > 0 && (
        <Card className="border-l-4 border-l-amber-500 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-bold">
              <AlertCircle className="h-4 w-4 text-amber-500" aria-hidden="true" />
              Yêu cầu đổi cây đang chờ
              <Badge variant="secondary" className="ml-2">
                {exchangeRequestsCount}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <Link href={`/exchange-requests?customerId=${customerId}`}>
                Xem yêu cầu đổi cây
                <ChevronRight className="ml-1 h-3 w-3" aria-hidden="true" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
