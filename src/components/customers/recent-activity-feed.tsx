"use client";

import Link from "next/link";
import { Receipt, FileText, MessageSquare, CreditCard, Leaf, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

type ActivityType =
  | "invoice_created"
  | "payment_received"
  | "note_added"
  | "care_completed"
  | "contract_signed";

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

const activityConfig: Record<
  ActivityType,
  { icon: React.ElementType; color: string; bgColor: string }
> = {
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
          <CardTitle className="flex items-center gap-2 text-sm font-bold">
            <Clock className="h-4 w-4 text-slate-400" aria-hidden="true" />
            Hoạt động gần đây
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground py-8 text-center text-sm">
            Chưa có hoạt động nào được ghi nhận
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-bold">
          <Clock className="h-4 w-4 text-slate-400" aria-hidden="true" />
          Hoạt động gần đây
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-border/50 divide-y">
          {sortedActivities.map((activity, idx) => {
            const config = activityConfig[activity.type];
            const Icon = config.icon;
            const Wrapper = activity.linkHref ? Link : "div";
            const wrapperProps = activity.linkHref ? { href: activity.linkHref } : {};

            return (
              <Wrapper
                key={activity.id}
                {...(wrapperProps as any)}
                className={cn(
                  "flex items-start gap-3 px-4 py-3 transition-colors",
                  activity.linkHref && "cursor-pointer hover:bg-slate-50"
                )}
              >
                {/* Timeline dot */}
                <div className="relative flex flex-col items-center">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full",
                      config.bgColor
                    )}
                  >
                    <Icon className={cn("h-4 w-4", config.color)} aria-hidden="true" />
                  </div>
                  {idx < sortedActivities.length - 1 && (
                    <div className="bg-border/50 absolute top-8 left-1/2 h-full w-px -translate-x-1/2" />
                  )}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1 py-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-bold text-slate-800">
                      {activity.title}
                    </span>
                    {activity.amount !== undefined && (
                      <span
                        className={cn(
                          "shrink-0 text-sm font-bold",
                          activity.type === "payment_received"
                            ? "text-emerald-600"
                            : "text-slate-600"
                        )}
                      >
                        {activity.type === "payment_received" ? "+" : ""}
                        {formatCurrency(activity.amount)}
                      </span>
                    )}
                  </div>
                  {activity.description && (
                    <p className="text-muted-foreground truncate text-xs">{activity.description}</p>
                  )}
                  <div className="mt-0.5 text-[10px] text-slate-400">
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
  const amount =
    typeof invoice.totalAmount === "number" ? invoice.totalAmount : invoice.totalAmount.toNumber();

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
