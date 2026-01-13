/**
 * Recent Notes List for Dashboard
 * Shows last 10 notes with links
 */
"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import type { StickyNote } from "@prisma/client";

interface RecentNotesListProps {
  notes: Array<StickyNote & {
    customer: { id: string; code: string; companyName: string } | null;
  }>;
}

const categoryColors: Record<string, string> = {
  GENERAL: "bg-gray-100",
  URGENT: "bg-red-200",
  COMPLAINT: "bg-red-100",
  REQUEST: "bg-blue-100",
  FEEDBACK: "bg-purple-100",
  PAYMENT: "bg-green-100",
  EXCHANGE: "bg-orange-100",
  CARE: "bg-yellow-100",
};

export function RecentNotesList({ notes }: RecentNotesListProps) {
  if (notes.length === 0) {
    return (
      <div className="text-center py-4 text-sm text-muted-foreground">
        Chưa có ghi chú nào
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground border-t pt-3">
        Ghi chú gần đây
      </p>
      <ul className="space-y-2">
        {notes.map((note) => (
          <li key={note.id} className="flex items-start gap-2 text-sm">
            <span className="text-muted-foreground">•</span>
            <div className="flex-1 min-w-0">
              <p className="truncate">{note.content}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <Badge variant="outline" className={`text-xs ${categoryColors[note.category] || ""}`}>
                  {note.category}
                </Badge>
                {note.customer && (
                  <Link
                    href={`/customers/${note.customer.id}`}
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    {note.customer.companyName}
                  </Link>
                )}
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true, locale: vi })}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {notes.length >= 10 && (
        <div className="text-center pt-2">
          <Link href="/notes" className="text-xs text-primary hover:underline">
            Xem tất cả →
          </Link>
        </div>
      )}
    </div>
  );
}
