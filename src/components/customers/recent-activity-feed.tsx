"use client";

import Link from "next/link";
import {
    Receipt,
    FileText,
    MessageSquare,
    CreditCard,
    Leaf,
    Calendar,
    Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

type ActivityType = "invoice_created" | "payment_received" | "note_added" | "care_completed" | "contract_signed";

interface ActivityItem {
    id: string;
    type: ActivityType;
    title: string;
    description?: string;
    amount?: number;
    date: Date;
    linkHref?: string;
}

interface RecentActivityFeedProps {
    activities: ActivityItem[];
    maxItems?: number;
}

const activityConfig: Record<ActivityType, { icon: React.ElementType; color: string; bgColor: string }> = {
    invoice_created: { icon: Receipt, color: "text-blue-600", bgColor: "bg-blue-50" },
    payment_received: { icon: CreditCard, color: "text-emerald-600", bgColor: "bg-emerald-50" },
    note_added: { icon: MessageSquare, color: "text-amber-600", bgColor: "bg-amber-50" },
    care_completed: { icon: Leaf, color: "text-green-600", bgColor: "bg-green-50" },
    contract_signed: { icon: FileText, color: "text-purple-600", bgColor: "bg-purple-50" },
};

export function RecentActivityFeed({ activities, maxItems = 5 }: RecentActivityFeedProps) {
    const sortedActivities = [...activities]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, maxItems);

    if (sortedActivities.length === 0) {
        return (
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Clock className="h-4 w-4 text-slate-400" />
                        Hoạt động gần đây
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="py-8 text-center text-sm text-muted-foreground">
                        Chưa có hoạt động nào được ghi nhận
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    Hoạt động gần đây
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                    {sortedActivities.map((activity, idx) => {
                        const config = activityConfig[activity.type];
                        const Icon = config.icon;
                        const Wrapper = activity.linkHref ? Link : "div";
                        const wrapperProps = activity.linkHref
                            ? { href: activity.linkHref }
                            : {};

                        return (
                            <Wrapper
                                key={activity.id}
                                {...(wrapperProps as any)}
                                className={cn(
                                    "flex items-start gap-3 px-4 py-3 transition-colors",
                                    activity.linkHref && "hover:bg-slate-50 cursor-pointer"
                                )}
                            >
                                {/* Timeline dot */}
                                <div className="relative flex flex-col items-center">
                                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", config.bgColor)}>
                                        <Icon className={cn("h-4 w-4", config.color)} />
                                    </div>
                                    {idx < sortedActivities.length - 1 && (
                                        <div className="w-px h-full bg-border/50 absolute top-8 left-1/2 -translate-x-1/2" />
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0 py-0.5">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-sm font-bold text-slate-800 truncate">
                                            {activity.title}
                                        </span>
                                        {activity.amount !== undefined && (
                                            <span className={cn(
                                                "text-sm font-bold shrink-0",
                                                activity.type === "payment_received" ? "text-emerald-600" : "text-slate-600"
                                            )}>
                                                {activity.type === "payment_received" ? "+" : ""}{formatCurrency(activity.amount)}
                                            </span>
                                        )}
                                    </div>
                                    {activity.description && (
                                        <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                                    )}
                                    <div className="text-[10px] text-slate-400 mt-0.5">
                                        {formatDistanceToNow(new Date(activity.date), { addSuffix: true, locale: vi })}
                                    </div>
                                </div>
                            </Wrapper>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}

// Helper to create activity items from different data sources
export function createActivityFromInvoice(invoice: {
    id: string;
    invoiceNumber: string;
    status: string;
    totalAmount: number | { toNumber(): number };
    createdAt: Date;
}): ActivityItem {
    const amount = typeof invoice.totalAmount === "number"
        ? invoice.totalAmount
        : invoice.totalAmount.toNumber();

    return {
        id: `inv-${invoice.id}`,
        type: "invoice_created",
        title: `Hóa đơn ${invoice.invoiceNumber}`,
        description: invoice.status === "PAID" ? "Đã thanh toán" : "Đang chờ thanh toán",
        amount,
        date: new Date(invoice.createdAt),
        linkHref: `/invoices/${invoice.id}`,
    };
}

export function createActivityFromNote(note: {
    id: string;
    title: string;
    category: string;
    createdAt: Date;
}): ActivityItem {
    return {
        id: `note-${note.id}`,
        type: "note_added",
        title: note.title,
        description: note.category,
        date: new Date(note.createdAt),
    };
}
