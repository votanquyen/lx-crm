"use client";

import { StickyNote, AlertCircle, Info, MessageSquare, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import type { NoteCategory, NoteStatus } from "@prisma/client";

interface Note {
  id: string;
  title: string | null;
  content: string | null;
  category: NoteCategory;
  status: NoteStatus;
  priority: number;
  createdAt: Date;
  createdBy: { id: string; name: string | null } | null;
}

interface CustomerNoteBannerProps {
  notes: Note[];
  maxDisplay?: number;
}

const categoryConfig: Record<
  NoteCategory,
  { label: string; icon: typeof StickyNote; bgColor: string; borderColor: string; textColor: string }
> = {
  URGENT: {
    label: "Khẩn cấp",
    icon: AlertCircle,
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
    textColor: "text-rose-700",
  },
  COMPLAINT: {
    label: "Khiếu nại",
    icon: AlertCircle,
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    textColor: "text-orange-700",
  },
  PAYMENT: {
    label: "Thanh toán",
    icon: StickyNote,
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    textColor: "text-amber-700",
  },
  REQUEST: {
    label: "Yêu cầu",
    icon: MessageSquare,
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-700",
  },
  FEEDBACK: {
    label: "Phản hồi",
    icon: MessageSquare,
    bgColor: "bg-cyan-50",
    borderColor: "border-cyan-200",
    textColor: "text-cyan-700",
  },
  EXCHANGE: {
    label: "Đổi cây",
    icon: StickyNote,
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    textColor: "text-purple-700",
  },
  CARE: {
    label: "Chăm sóc",
    icon: StickyNote,
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    textColor: "text-emerald-700",
  },
  GENERAL: {
    label: "Chung",
    icon: Info,
    bgColor: "bg-slate-50",
    borderColor: "border-slate-200",
    textColor: "text-slate-700",
  },
};

export function CustomerNoteBanner({ notes, maxDisplay = 3 }: CustomerNoteBannerProps) {
  // Filter to show only OPEN or IN_PROGRESS notes, sorted by priority
  const activeNotes = notes
    .filter((n) => n.status === "OPEN" || n.status === "IN_PROGRESS")
    .sort((a, b) => b.priority - a.priority)
    .slice(0, maxDisplay);

  if (activeNotes.length === 0) return null;

  return (
    <div className="space-y-2">
      {activeNotes.map((note) => {
        const config = categoryConfig[note.category];
        const Icon = config.icon;

        return (
          <div
            key={note.id}
            className={cn(
              "flex items-start gap-3 rounded-lg border-l-4 p-4 shadow-sm",
              config.bgColor,
              config.borderColor
            )}
          >
            <div className={cn("mt-0.5 rounded-full p-1.5", config.bgColor)}>
              <Icon className={cn("h-4 w-4", config.textColor)} aria-hidden="true" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                    config.bgColor,
                    config.textColor,
                    "border",
                    config.borderColor
                  )}
                >
                  {config.label}
                </span>
                {note.priority >= 8 && (
                  <span className="inline-flex items-center rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-700 border border-rose-200">
                    Ưu tiên cao
                  </span>
                )}
                <span className="flex items-center gap-1 text-[10px] text-slate-500">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true, locale: vi })}
                </span>
              </div>

              {note.title && (
                <p className={cn("mt-1 text-sm font-bold", config.textColor)}>{note.title}</p>
              )}

              {note.content && (
                <p className="mt-1 text-sm leading-relaxed text-slate-700 line-clamp-2">
                  {note.content}
                </p>
              )}

              {note.createdBy?.name && (
                <p className="mt-2 text-[10px] text-slate-500">
                  Tạo bởi: <span className="font-medium">{note.createdBy.name}</span>
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
