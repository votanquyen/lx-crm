"use client";

import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { MessageSquare, FileText, Receipt, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface TimelineEvent {
  id: string;
  type: "NOTE" | "INVOICE" | "CONTRACT" | "ACTIVITY";
  date: Date;
  title: string;
  description?: string;
  user?: { name: string | null; image?: string | null };
  amount?: number;
  status?: string;
}

interface CustomerTimelineProps {
  events: TimelineEvent[];
}

export function CustomerTimeline({ events }: CustomerTimelineProps) {
  // Sort events by date desc
  const sortedEvents = [...events].sort((a, b) => b.date.getTime() - a.date.getTime());

  if (sortedEvents.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-center justify-center py-12">
        <Clock className="mb-2 h-8 w-8 opacity-50" aria-hidden="true" />
        <p className="text-sm">Chưa có hoạt động nào</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-8 pl-6 before:absolute before:inset-0 before:top-2 before:left-[11px] before:w-[2px] before:bg-slate-100">
      {sortedEvents.map((event) => {
        const isNote = event.type === "NOTE";
        const isInvoice = event.type === "INVOICE";

        return (
          <div key={event.id} className="group relative">
            {/* Dot */}
            <div
              className={cn(
                "absolute top-1 -left-[31px] flex h-6 w-6 items-center justify-center rounded-full border-4 border-white shadow-sm",
                isNote
                  ? "bg-amber-100 text-amber-600"
                  : isInvoice
                    ? "bg-blue-100 text-blue-600"
                    : "bg-slate-100 text-slate-600"
              )}
            >
              {isNote ? (
                <MessageSquare className="h-3 w-3" aria-hidden="true" />
              ) : isInvoice ? (
                <Receipt className="h-3 w-3" aria-hidden="true" />
              ) : (
                <FileText className="h-3 w-3" aria-hidden="true" />
              )}
            </div>

            {/* Content */}
            <div className="rounded-lg border bg-white p-4 shadow-sm transition-shadow group-hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{event.title}</span>
                    <span className="text-muted-foreground text-xs">
                      {formatDistanceToNow(event.date, { addSuffix: true, locale: vi })}
                    </span>
                  </div>
                  {event.description && (
                    <p className="text-sm leading-relaxed text-slate-600">{event.description}</p>
                  )}
                  {event.amount !== undefined && (
                    <p className="text-sm font-bold text-slate-900">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(event.amount)}
                      {event.status && (
                        <span
                          className={cn(
                            "ml-2 rounded px-1.5 py-0.5 text-xs font-normal",
                            event.status === "PAID"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          )}
                        >
                          {event.status === "PAID" ? "Đã thanh toán" : event.status}
                        </span>
                      )}
                    </p>
                  )}
                  {event.user && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-[9px]">
                          {event.user.name?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-muted-foreground text-xs">{event.user.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
