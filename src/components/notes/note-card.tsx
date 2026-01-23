"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  Check,
  X,
  Pencil,
  Trash2,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { NoteStatus, NoteCategory } from "@prisma/client";

interface NoteCardProps {
  note: {
    id: string;
    content: string;
    status: NoteStatus;
    category: NoteCategory;
    priority: number;
    aiAnalysis: unknown;
    aiSuggestions: unknown;
    createdAt: Date | string;
    createdBy?: { name: string | null } | null;
  };
  onResolve: (id: string) => Promise<void>;
  onReopen: (id: string) => Promise<void>;
  onEdit: (note: NoteCardProps["note"]) => void;
  onDelete: (id: string) => void;
}

const statusConfig: Record<
  NoteStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  OPEN: { label: "Mở", variant: "default" },
  IN_PROGRESS: { label: "Đang xử lý", variant: "secondary" },
  RESOLVED: { label: "Đã xử lý", variant: "outline" },
  CANCELLED: { label: "Đã hủy", variant: "destructive" },
};

const categoryConfig: Record<NoteCategory, { label: string; color: string }> = {
  GENERAL: { label: "Chung", color: "bg-gray-100" },
  URGENT: { label: "Khẩn cấp", color: "bg-red-200" },
  COMPLAINT: { label: "Khiếu nại", color: "bg-red-100" },
  REQUEST: { label: "Yêu cầu", color: "bg-blue-100" },
  FEEDBACK: { label: "Phản hồi", color: "bg-indigo-100" },
  EXCHANGE: { label: "Đổi cây", color: "bg-orange-100" },
  CARE: { label: "Chăm sóc", color: "bg-yellow-100" },
  PAYMENT: { label: "Thanh toán", color: "bg-green-100" },
};

// Safe type guard for AI suggestions
function parseSuggestions(value: unknown): Array<{ action: string }> | null {
  if (!Array.isArray(value)) return null;
  const validSuggestions = value.filter(
    (item): item is { action: string } =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as { action?: unknown }).action === "string"
  );
  return validSuggestions.length > 0 ? validSuggestions : null;
}

export function NoteCard({ note, onResolve, onReopen, onEdit, onDelete }: NoteCardProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const status = statusConfig[note.status];
  const category = categoryConfig[note.category];
  const suggestions = parseSuggestions(note.aiSuggestions);

  return (
    <Card className={note.priority >= 8 ? "border-amber-500" : undefined}>
      <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={status.variant}>{status.label}</Badge>
          <Badge variant="outline" className={category.color}>
            {category.label}
          </Badge>
          {note.priority >= 8 && <Badge variant="destructive">P{note.priority}</Badge>}
          {!!note.aiAnalysis && (
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              AI
            </Badge>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Tùy chọn">
              <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {note.status !== "RESOLVED" && (
              <DropdownMenuItem onClick={() => onResolve(note.id)}>
                <Check className="mr-2 h-4 w-4" aria-hidden="true" />
                Đánh dấu đã xử lý
              </DropdownMenuItem>
            )}
            {note.status === "RESOLVED" && (
              <DropdownMenuItem onClick={() => onReopen(note.id)}>
                <X className="mr-2 h-4 w-4" aria-hidden="true" />
                Mở lại
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onEdit(note)}>
              <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
              Chỉnh sửa
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(note.id)} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
              Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <p className="text-sm whitespace-pre-wrap">{note.content}</p>

        {suggestions && suggestions.length > 0 && (
          <div className="mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="text-muted-foreground gap-1 text-xs"
            >
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              {suggestions.length} đề xuất AI
              {showSuggestions ? (
                <ChevronUp className="h-3 w-3" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-3 w-3" aria-hidden="true" />
              )}
            </Button>
            {showSuggestions && (
              <ul className="text-muted-foreground mt-2 space-y-1 text-sm">
                {suggestions.map((s, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-amber-500">-</span>
                    {s.action}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <p className="text-muted-foreground mt-3 text-xs">
          {note.createdBy?.name ?? "Hệ thống"} -{" "}
          {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true, locale: vi })}
        </p>
      </CardContent>
    </Card>
  );
}
