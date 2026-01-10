"use client";

/**
 * Merge Dialog for Import
 * Handle duplicate record merging decisions
 */
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, GitMerge, X } from "lucide-react";
import type { AnalyzedRow } from "@/lib/ai/import-analyzer";

interface MergeDialogProps {
  row: AnalyzedRow;
  onMerge: () => void;
  onSkip: () => void;
  onClose: () => void;
}

export function MergeDialog({ row, onMerge, onSkip, onClose }: MergeDialogProps) {
  const duplicate = row.duplicateInfo;
  if (!duplicate) return null;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Phát hiện trùng lặp</DialogTitle>
          <DialogDescription>
            Dữ liệu từ Excel có thể trùng với record hiện có trong hệ thống
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 py-4">
          {/* New Record */}
          <Card className="flex-1 border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <p className="mb-2 text-xs font-medium text-blue-600">
                RECORD MỚI (Excel)
              </p>
              <p className="font-medium">{String(row.normalizedData.companyName)}</p>
              <p className="text-muted-foreground text-sm">
                {String(row.normalizedData.address || "-")}
              </p>
              <p className="text-muted-foreground text-sm">
                {String(row.normalizedData.contactPhone || "-")}
              </p>
            </CardContent>
          </Card>

          <ArrowRight className="text-muted-foreground h-6 w-6" />

          {/* Existing Record */}
          <Card className="flex-1 border-green-200 bg-green-50">
            <CardContent className="p-4">
              <p className="mb-2 text-xs font-medium text-green-600">
                RECORD CŨ (Database)
              </p>
              <p className="font-medium">{duplicate.matchName}</p>
              <p className="text-muted-foreground text-sm">ID: {duplicate.matchId}</p>
              <p className="text-sm text-green-600">
                Độ trùng khớp: {Math.round(row.confidence * 100)}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* AI Suggestion */}
        <div className="rounded bg-yellow-50 p-3">
          <p className="text-sm font-medium text-yellow-800">AI gợi ý:</p>
          <p className="text-sm text-yellow-700">
            {duplicate.suggestion === "merge"
              ? "Nên merge vào record hiện có vì độ trùng khớp cao"
              : duplicate.suggestion === "new"
                ? "Nên tạo record mới vì có khác biệt đáng kể"
                : "Cần xem xét thêm trước khi quyết định"}
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
          <Button variant="destructive" onClick={onSkip}>
            <X className="mr-1 h-4 w-4" />
            Bỏ qua record mới
          </Button>
          <Button onClick={onMerge}>
            <GitMerge className="mr-1 h-4 w-4" />
            Merge vào record cũ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
