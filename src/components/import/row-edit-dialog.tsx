"use client";

/**
 * Row Edit Dialog for Import
 * Edit individual row data before import
 */
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AnalyzedRow } from "@/lib/ai/import-analyzer";

interface RowEditDialogProps {
  row: AnalyzedRow;
  onSave: (data: Record<string, unknown>) => void;
  onClose: () => void;
}

export function RowEditDialog({ row, onSave, onClose }: RowEditDialogProps) {
  const [formData, setFormData] = useState(row.normalizedData);

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const fields = [
    { key: "companyName", label: "Tên công ty" },
    { key: "shortName", label: "Tên viết tắt" },
    { key: "address", label: "Địa chỉ" },
    { key: "district", label: "Quận/Huyện" },
    { key: "contactName", label: "Người liên hệ" },
    { key: "contactPhone", label: "Số điện thoại" },
    { key: "contactEmail", label: "Email" },
    { key: "taxCode", label: "Mã số thuế" },
  ];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Sửa dòng #{row.rowIndex}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          {fields.map(({ key, label }) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key}>{label}</Label>
              <Input
                id={key}
                value={String(formData[key] || "")}
                onChange={(e) => handleChange(key, e.target.value)}
                placeholder={label}
              />
            </div>
          ))}
        </div>

        {/* AI Suggestions */}
        {row.aiSuggestions.length > 0 && (
          <div className="rounded bg-blue-50 p-3">
            <p className="text-sm font-medium text-blue-800">Gợi ý từ AI:</p>
            <ul className="mt-1 list-inside list-disc text-sm text-blue-600">
              {row.aiSuggestions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={() => onSave(formData)}>Lưu</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
