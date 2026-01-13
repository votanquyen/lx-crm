"use client";

import { useState, useTransition, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { NoteCard } from "./note-card";
import { NoteFormDialog } from "./note-form-dialog";
import {
  getCustomerNotes,
  createStickyNote,
  updateStickyNote,
  deleteStickyNote,
} from "@/actions/sticky-notes";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import type { NoteStatus, NoteCategory } from "@prisma/client";

interface NoteListProps {
  customerId: string;
  initialNotes: Awaited<ReturnType<typeof getCustomerNotes>>;
}

const STATUS_OPTIONS = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "OPEN", label: "Mở" },
  { value: "IN_PROGRESS", label: "Đang xử lý" },
  { value: "RESOLVED", label: "Đã xử lý" },
];

const CATEGORY_OPTIONS = [
  { value: "all", label: "Tất cả loại" },
  { value: "GENERAL", label: "Chung" },
  { value: "URGENT", label: "Khẩn cấp" },
  { value: "COMPLAINT", label: "Khiếu nại" },
  { value: "REQUEST", label: "Yêu cầu" },
  { value: "FEEDBACK", label: "Phản hồi" },
  { value: "EXCHANGE", label: "Đổi cây" },
  { value: "CARE", label: "Chăm sóc" },
  { value: "PAYMENT", label: "Thanh toán" },
];

// Auto-poll interval for AI analysis (4 seconds)
const AI_POLL_INTERVAL = 4000;

export function NoteList({ customerId, initialNotes }: NoteListProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editNote, setEditNote] = useState<typeof notes[0] | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check if any notes are pending AI analysis
  const hasPendingAI = notes.some(n => !n.aiAnalysis && n.status === "OPEN");

  const refreshNotes = useCallback(() => {
    startTransition(async () => {
      const options: { status?: NoteStatus; category?: NoteCategory } = {};
      if (statusFilter !== "all") options.status = statusFilter as NoteStatus;
      if (categoryFilter !== "all") options.category = categoryFilter as NoteCategory;
      const newNotes = await getCustomerNotes(customerId, options);
      setNotes(newNotes);
    });
  }, [customerId, statusFilter, categoryFilter]);

  // Auto-poll for AI analysis when notes are pending
  useEffect(() => {
    // Clear any existing interval first to prevent stacking
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    if (hasPendingAI) {
      pollIntervalRef.current = setInterval(() => {
        refreshNotes();
      }, AI_POLL_INTERVAL);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [hasPendingAI, refreshNotes]);

  const handleSubmit = async (data: { id?: string; content: string; priority: number; category: string }) => {
    try {
      if (data.id) {
        await updateStickyNote({
          id: data.id,
          content: data.content,
          priority: data.priority,
          category: data.category as NoteCategory,
        });
        toast.success("Cập nhật ghi chú thành công");
      } else {
        await createStickyNote({
          customerId,
          content: data.content,
          priority: data.priority,
          category: data.category as NoteCategory,
        });
        toast.success("Thêm ghi chú thành công");
      }
      refreshNotes();
    } catch {
      toast.error("Có lỗi xảy ra, vui lòng thử lại");
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await updateStickyNote({ id, status: "RESOLVED" });
      toast.success("Đã đánh dấu hoàn thành");
      refreshNotes();
    } catch {
      toast.error("Có lỗi xảy ra");
    }
  };

  const handleReopen = async (id: string) => {
    try {
      await updateStickyNote({ id, status: "OPEN" });
      toast.success("Đã mở lại ghi chú");
      refreshNotes();
    } catch {
      toast.error("Có lỗi xảy ra");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteStickyNote(deleteId);
      toast.success("Đã xóa ghi chú");
      setDeleteId(null);
      refreshNotes();
    } catch {
      toast.error("Có lỗi xảy ra khi xóa");
      setDeleteId(null);
    }
  };

  // Filter change handlers
  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    startTransition(async () => {
      const options: { status?: NoteStatus; category?: NoteCategory } = {};
      if (value !== "all") options.status = value as NoteStatus;
      if (categoryFilter !== "all") options.category = categoryFilter as NoteCategory;
      const newNotes = await getCustomerNotes(customerId, options);
      setNotes(newNotes);
    });
  };

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
    startTransition(async () => {
      const options: { status?: NoteStatus; category?: NoteCategory } = {};
      if (statusFilter !== "all") options.status = statusFilter as NoteStatus;
      if (value !== "all") options.category = value as NoteCategory;
      const newNotes = await getCustomerNotes(customerId, options);
      setNotes(newNotes);
    });
  };

  return (
    <div className="space-y-4">
      {/* Filters + Add Button */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex-1" />

        <Button onClick={() => { setEditNote(null); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm ghi chú
        </Button>
      </div>

      {/* Loading indicator */}
      {isPending && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Notes list */}
      {!isPending && notes.length === 0 && (
        <div className="py-8 text-center text-muted-foreground">
          Chưa có ghi chú nào
        </div>
      )}

      {!isPending && notes.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onResolve={handleResolve}
              onReopen={handleReopen}
              onEdit={(n) => { setEditNote(n as typeof notes[0]); setDialogOpen(true); }}
              onDelete={(id) => setDeleteId(id)}
            />
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <NoteFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        customerId={customerId}
        editNote={editNote}
        onSubmit={handleSubmit}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa ghi chú này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
