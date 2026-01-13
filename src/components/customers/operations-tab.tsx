"use client";

import Link from "next/link";
import {
    Leaf,
    Calendar,
    Clock,
    ChevronRight,
    AlertCircle,
    TreeDeciduous,
} from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
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
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Leaf className="h-4 w-4 text-emerald-500" />
                            Cây xanh đang thuê
                        </CardTitle>
                        <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                            <Link href={`/plants?customerId=${customerId}`}>
                                Quản lý cây
                                <ChevronRight className="ml-1 h-3 w-3" />
                            </Link>
                        </Button>
                    </div>
                    <CardDescription>Tài sản đang thuê tại khách hàng</CardDescription>
                </CardHeader>
                <CardContent>
                    {plantsCount === 0 ? (
                        <div className="py-8 text-center">
                            <TreeDeciduous className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                            <p className="text-sm text-muted-foreground mb-4">Chưa có cây xanh nào</p>
                            <Button asChild variant="outline" size="sm">
                                <Link href={`/plants/new?customerId=${customerId}`}>
                                    Thêm cây xanh
                                </Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Summary Stats */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Tổng cây</p>
                                    <p className="text-2xl font-black text-emerald-700">{plantsCount}</p>
                                </div>
                                {exchangeRequestsCount > 0 && (
                                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Yêu cầu đổi</p>
                                        <p className="text-2xl font-black text-amber-700">{exchangeRequestsCount}</p>
                                    </div>
                                )}
                            </div>

                            {/* Placeholder for plant list */}
                            <div className="pt-2 border-t">
                                <p className="text-xs text-muted-foreground text-center py-4">
                                    Danh sách chi tiết cây xanh sẽ hiển thị tại đây
                                </p>
                                <Button asChild variant="outline" size="sm" className="w-full">
                                    <Link href={`/plants?customerId=${customerId}`}>
                                        Xem danh sách cây
                                        <ChevronRight className="ml-1 h-3 w-3" />
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
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-blue-500" />
                            Lịch chăm sóc
                        </CardTitle>
                        <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                            <Link href={`/care-schedules?customerId=${customerId}`}>
                                Xem lịch
                                <ChevronRight className="ml-1 h-3 w-3" />
                            </Link>
                        </Button>
                    </div>
                    <CardDescription>Lịch sử và kế hoạch chăm sóc</CardDescription>
                </CardHeader>
                <CardContent>
                    {careSchedulesCount === 0 ? (
                        <div className="py-8 text-center">
                            <Clock className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                            <p className="text-sm text-muted-foreground mb-4">Chưa có lịch chăm sóc</p>
                            <Button asChild variant="outline" size="sm">
                                <Link href={`/care-schedules/new?customerId=${customerId}`}>
                                    Lên lịch chăm sóc
                                </Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Summary Stats */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Tổng lịch</p>
                                    <p className="text-2xl font-black text-blue-700">{careSchedulesCount}</p>
                                </div>
                            </div>

                            {/* Placeholder for schedule list */}
                            <div className="pt-2 border-t">
                                <p className="text-xs text-muted-foreground text-center py-4">
                                    Chi tiết lịch chăm sóc sẽ hiển thị tại đây
                                </p>
                                <Button asChild variant="outline" size="sm" className="w-full">
                                    <Link href={`/care-schedules?customerId=${customerId}`}>
                                        Xem lịch chăm sóc
                                        <ChevronRight className="ml-1 h-3 w-3" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Exchange Requests Section (if any) */}
            {exchangeRequestsCount > 0 && (
                <Card className="lg:col-span-2 border-l-4 border-l-amber-500">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                            Yêu cầu đổi cây đang chờ
                            <Badge variant="secondary" className="ml-2">{exchangeRequestsCount}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button asChild variant="outline" size="sm">
                            <Link href={`/exchange-requests?customerId=${customerId}`}>
                                Xem yêu cầu đổi cây
                                <ChevronRight className="ml-1 h-3 w-3" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
