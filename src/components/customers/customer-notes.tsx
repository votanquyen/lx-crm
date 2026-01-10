/**
 * Customer Notes Component
 * Display sticky notes for customer
 */
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import type { NoteStatus, NoteCategory } from "@prisma/client";

interface StickyNote {
  id: string;
  title: string;
  content: string;
  category: NoteCategory;
  status: NoteStatus;
  priority: number;
  createdAt: Date;
  createdBy: { id: string; name: string | null } | null;
}

interface CustomerNotesProps {
  notes: StickyNote[];
}

const categoryConfig: Record<NoteCategory, { label: string; color: string }> = {
  GENERAL: { label: "Chung", color: "bg-gray-100 text-gray-800" },
  URGENT: { label: "Khẩn cấp", color: "bg-red-100 text-red-800" },
  COMPLAINT: { label: "Khiếu nại", color: "bg-orange-100 text-orange-800" },
  REQUEST: { label: "Yêu cầu", color: "bg-blue-100 text-blue-800" },
  FEEDBACK: { label: "Phản hồi", color: "bg-amber-100 text-amber-800" },
  EXCHANGE: { label: "Đổi cây", color: "bg-purple-100 text-purple-800" },
  CARE: { label: "Chăm sóc", color: "bg-emerald-100 text-emerald-800" },
  PAYMENT: { label: "Thanh toán", color: "bg-green-100 text-green-800" },
};

const statusConfig: Record<
  NoteStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  OPEN: { label: "Mở", variant: "default" },
  IN_PROGRESS: { label: "Đang xử lý", variant: "secondary" },
  RESOLVED: { label: "Đã xử lý", variant: "default" },
  CANCELLED: { label: "Đã hủy", variant: "outline" },
};

export function CustomerNotes({ notes }: CustomerNotesProps) {
  if (notes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ghi chú</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Chưa có ghi chú nào
          </p>
        </CardContent>
      </Card>
    );
  }

  // Sort by priority then date
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.priority !== b.priority) return b.priority - a.priority;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ghi chú ({notes.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedNotes.map((note) => {
            const category = categoryConfig[note.category];
            const status = statusConfig[note.status];
            return (
              <div
                key={note.id}
                className="rounded-lg border p-3 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-medium">{note.title}</h4>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className={`px-2 py-0.5 text-xs rounded ${category.color}`}>
                      {category.label}
                    </span>
                    <Badge variant={status.variant} className="text-xs">
                      {status.label}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {note.content}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {note.createdBy?.name ?? "Hệ thống"} - {formatDate(note.createdAt)}
                  </span>
                  {note.priority > 5 && (
                    <span className="text-red-500 font-medium">
                      Ưu tiên cao
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
