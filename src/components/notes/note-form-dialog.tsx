"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const noteSchema = z.object({
  content: z.string().min(1, "Nội dung không được để trống").max(2000),
  priority: z.number().int().min(1).max(10),
  category: z.enum([
    "GENERAL",
    "URGENT",
    "COMPLAINT",
    "REQUEST",
    "FEEDBACK",
    "EXCHANGE",
    "CARE",
    "PAYMENT",
  ]),
});

type NoteFormData = z.infer<typeof noteSchema>;

interface NoteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  editNote?: {
    id: string;
    content: string;
    priority: number;
    category: string;
  } | null;
  onSubmit: (data: NoteFormData & { id?: string }) => Promise<void>;
}

const CATEGORIES = [
  { value: "GENERAL", label: "Chung" },
  { value: "URGENT", label: "Khẩn cấp" },
  { value: "COMPLAINT", label: "Khiếu nại" },
  { value: "REQUEST", label: "Yêu cầu" },
  { value: "FEEDBACK", label: "Phản hồi" },
  { value: "EXCHANGE", label: "Đổi cây" },
  { value: "CARE", label: "Chăm sóc" },
  { value: "PAYMENT", label: "Thanh toán" },
];

export function NoteFormDialog({ open, onOpenChange, editNote, onSubmit }: NoteFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      content: "",
      priority: 5,
      category: "GENERAL",
    },
  });

  // Reset form when editNote changes or dialog opens/closes
  useEffect(() => {
    if (open) {
      form.reset({
        content: editNote?.content ?? "",
        priority: editNote?.priority ?? 5,
        category: (editNote?.category as NoteFormData["category"]) ?? "GENERAL",
      });
    }
  }, [open, editNote, form]);

  const handleSubmit = async (data: NoteFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit({ ...data, id: editNote?.id });
      form.reset();
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editNote ? "Chỉnh sửa ghi chú" : "Thêm ghi chú mới"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="content">Nội dung</Label>
            <Textarea
              id="content"
              {...form.register("content")}
              placeholder="Nhập nội dung ghi chú..."
              rows={4}
            />
            {form.formState.errors.content && (
              <p className="text-destructive text-sm">{form.formState.errors.content.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Phân loại</Label>
              <Select
                value={form.watch("category")}
                onValueChange={(v) => form.setValue("category", v as NoteFormData["category"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Độ ưu tiên (1-10)</Label>
              <Select
                value={String(form.watch("priority"))}
                onValueChange={(v) => form.setValue("priority", Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((p) => (
                    <SelectItem key={p} value={String(p)}>
                      {p} {p >= 8 ? "(Cao)" : p >= 5 ? "(Trung bình)" : "(Thấp)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
              {editNote ? "Cập nhật" : "Thêm mới"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
