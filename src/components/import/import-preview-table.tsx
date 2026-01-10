"use client";

/**
 * Import Preview Table Component
 * Shows AI analysis results with filtering and batch actions
 */
import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, GitMerge, X, Check } from "lucide-react";
import { RowEditDialog } from "./row-edit-dialog";
import { MergeDialog } from "./merge-dialog";
import type { AnalyzedRow, RowStatus } from "@/lib/ai/import-analyzer";

interface ImportPreviewTableProps {
  rows: AnalyzedRow[];
  importType: string;
  onRowUpdate: (rowIndex: number, data: Record<string, unknown>) => void;
  onRowStatusChange: (rowIndex: number, status: RowStatus) => void;
  onImport: (selectedRows: number[]) => void;
  isImporting?: boolean;
}

export function ImportPreviewTable({
  rows,
  onRowUpdate,
  onRowStatusChange,
  onImport,
  isImporting,
}: ImportPreviewTableProps) {
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<RowStatus | "all">("all");
  const [editingRow, setEditingRow] = useState<AnalyzedRow | null>(null);
  const [mergingRow, setMergingRow] = useState<AnalyzedRow | null>(null);

  // Stats
  const stats = useMemo(
    () => ({
      total: rows.length,
      autoApprove: rows.filter((r) => r.status === "auto_approve").length,
      needsReview: rows.filter((r) => r.status === "needs_review").length,
      needsFix: rows.filter((r) => r.status === "needs_fix").length,
      errors: rows.filter((r) => r.status === "error").length,
    }),
    [rows]
  );

  // Filtered rows
  const filteredRows = useMemo(() => {
    if (filter === "all") return rows;
    return rows.filter((r) => r.status === filter);
  }, [rows, filter]);

  // Selection handlers
  const toggleAll = () => {
    if (selectedRows.size === filteredRows.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredRows.map((r) => r.rowIndex)));
    }
  };

  const toggleRow = (rowIndex: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(rowIndex)) {
      newSelected.delete(rowIndex);
    } else {
      newSelected.add(rowIndex);
    }
    setSelectedRows(newSelected);
  };

  // Batch actions
  const approveSelected = () => {
    selectedRows.forEach((idx) => {
      onRowStatusChange(idx, "auto_approve");
    });
  };

  const skipSelected = () => {
    selectedRows.forEach((idx) => {
      onRowStatusChange(idx, "error");
    });
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <StatCard label="Tổng" value={stats.total} color="gray" />
        <StatCard label="Auto" value={stats.autoApprove} color="green" />
        <StatCard label="Cần duyệt" value={stats.needsReview} color="yellow" />
        <StatCard label="Cần sửa" value={stats.needsFix} color="red" />
        <StatCard label="Lỗi" value={stats.errors} color="red" />
      </div>

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as RowStatus | "all")}>
        <TabsList>
          <TabsTrigger value="all">Tất cả ({stats.total})</TabsTrigger>
          <TabsTrigger value="auto_approve">Auto ({stats.autoApprove})</TabsTrigger>
          <TabsTrigger value="needs_review">Duyệt ({stats.needsReview})</TabsTrigger>
          <TabsTrigger value="needs_fix">Sửa ({stats.needsFix})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Xem trước dữ liệu</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={approveSelected}
                disabled={selectedRows.size === 0}
              >
                <Check className="mr-1 h-4 w-4" />
                Duyệt ({selectedRows.size})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={skipSelected}
                disabled={selectedRows.size === 0}
              >
                <X className="mr-1 h-4 w-4" />
                Bỏ qua
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      selectedRows.size === filteredRows.length && filteredRows.length > 0
                    }
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Tên công ty</TableHead>
                <TableHead>Địa chỉ</TableHead>
                <TableHead className="w-32">Trạng thái</TableHead>
                <TableHead className="w-32">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.map((row) => (
                <TableRow
                  key={row.rowIndex}
                  className={row.duplicateInfo?.isDuplicate ? "bg-yellow-50" : ""}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedRows.has(row.rowIndex)}
                      onCheckedChange={() => toggleRow(row.rowIndex)}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{row.rowIndex}</TableCell>
                  <TableCell>
                    <div>
                      <span className="font-medium">
                        {String(row.normalizedData.companyName || "(Thiếu tên)")}
                      </span>
                      {row.duplicateInfo?.isDuplicate && (
                        <div className="text-sm text-yellow-600">
                          Trùng: {row.duplicateInfo.matchName} (
                          {Math.round(row.confidence * 100)}%)
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {String(
                      row.normalizedData.address || row.normalizedData["Địa chỉ"] || "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <ConfidenceBadge confidence={row.confidence} status={row.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingRow(row)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {row.duplicateInfo?.isDuplicate && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setMergingRow(row)}
                        >
                          <GitMerge className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Import Button */}
      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={() => onImport(Array.from(selectedRows))}
          disabled={selectedRows.size === 0 || isImporting}
        >
          {isImporting ? "Đang import..." : `Import ${selectedRows.size} dòng`}
        </Button>
      </div>

      {/* Dialogs */}
      {editingRow && (
        <RowEditDialog
          row={editingRow}
          onSave={(data) => {
            onRowUpdate(editingRow.rowIndex, data);
            setEditingRow(null);
          }}
          onClose={() => setEditingRow(null)}
        />
      )}
      {mergingRow && (
        <MergeDialog
          row={mergingRow}
          onMerge={() => {
            onRowStatusChange(mergingRow.rowIndex, "auto_approve");
            setMergingRow(null);
          }}
          onSkip={() => {
            onRowStatusChange(mergingRow.rowIndex, "error");
            setMergingRow(null);
          }}
          onClose={() => setMergingRow(null)}
        />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    gray: "bg-gray-100 text-gray-800",
    green: "bg-green-100 text-green-800",
    yellow: "bg-yellow-100 text-yellow-800",
    red: "bg-red-100 text-red-800",
  };

  return (
    <Card className={colorClasses[color]}>
      <CardContent className="p-4 text-center">
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-sm">{label}</div>
      </CardContent>
    </Card>
  );
}

function ConfidenceBadge({
  confidence,
  status,
}: {
  confidence: number;
  status: RowStatus;
}) {
  const percent = Math.round(confidence * 100);

  if (status === "auto_approve" || percent >= 90) {
    return <Badge className="bg-green-500">{percent}%</Badge>;
  }
  if (status === "needs_review" || percent >= 70) {
    return <Badge className="bg-yellow-500">{percent}%</Badge>;
  }
  if (status === "needs_fix" || percent >= 30) {
    return <Badge className="bg-red-500">{percent}%</Badge>;
  }
  return <Badge variant="destructive">Lỗi</Badge>;
}
