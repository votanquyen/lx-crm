/**
 * Dashboard Sticky Note Card
 * Windows 11-style sticky note with AI analysis
 */
"use client";

import { useState, useTransition, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { StickyNote, Send, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { createQuickNoteWithAI } from "@/actions/sticky-notes";
import { AIResponsePanel } from "./ai-response-panel";
import { RecentNotesList } from "./recent-notes-list";
import type { QuickNoteAIResponse } from "./types";
import type { StickyNote as StickyNoteType } from "@prisma/client";

type NoteWithCustomer = StickyNoteType & {
  customer: { id: string; code: string; companyName: string } | null;
  createdBy: { id: string; name: string | null } | null;
};

interface DashboardStickyNoteProps {
  initialNotes: NoteWithCustomer[];
}

export function DashboardStickyNote({ initialNotes }: DashboardStickyNoteProps) {
  const [content, setContent] = useState("");
  const [notes, setNotes] = useState<NoteWithCustomer[]>(initialNotes);
  const [aiResponse, setAiResponse] = useState<QuickNoteAIResponse | null>(null);
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(async () => {
    if (!content.trim()) return;

    startTransition(async () => {
      try {
        const result = await createQuickNoteWithAI({ content: content.trim() });

        if (result.success) {
          setAiResponse(result.data.aiResponse);
          setNotes(prev => [result.data.note as NoteWithCustomer, ...prev.slice(0, 9)]);
          setContent("");
          toast.success("Đã lưu ghi chú");
        } else {
          toast.error(result.error || "Có lỗi xảy ra");
        }
      } catch (error) {
        toast.error("Có lỗi xảy ra, vui lòng thử lại");
        console.error(error);
      }
    });
  }, [content]);

  // Ctrl+Enter to submit
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Card className="border-amber-200 bg-amber-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-amber-700">
          <StickyNote className="h-5 w-5" />
          Ghi chú nhanh
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input Area */}
        <div className="space-y-2">
          <Textarea
            ref={textareaRef}
            placeholder="Nhập ghi chú... (Ctrl+Enter để gửi)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isPending}
            className="min-h-[80px] resize-none bg-white"
          />
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={isPending || !content.trim()}
              size="sm"
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Gửi
            </Button>
          </div>
        </div>

        {/* AI Response (loading) */}
        {isPending && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 animate-pulse" />
              Đang phân tích...
            </div>
            <Skeleton className="h-20 w-full" />
          </div>
        )}

        {/* AI Response (result) */}
        {aiResponse && !isPending && (
          <AIResponsePanel
            response={aiResponse}
            onDismiss={() => setAiResponse(null)}
          />
        )}

        {/* Recent Notes */}
        <RecentNotesList notes={notes} />
      </CardContent>
    </Card>
  );
}
