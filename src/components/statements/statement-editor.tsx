"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Save, X, Pencil } from "lucide-react";
import { PlantRowEditor } from "./plant-row-editor";
import { updateMonthlyStatement } from "@/actions/monthly-statements";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format";
import type { PlantItem, StatementDTO } from "@/types/monthly-statement";

interface StatementEditorProps {
  statement: StatementDTO;
  onSave: () => void;
  onCancel: () => void;
}

function generateId() {
  return `plant_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function StatementEditor({ statement, onSave, onCancel }: StatementEditorProps) {
  const [plants, setPlants] = useState<PlantItem[]>(statement.plants);
  const [contactName, setContactName] = useState(statement.contactName ?? "");
  const [vatRate, setVatRate] = useState(statement.vatRate);
  const [notes, setNotes] = useState(statement.notes ?? "");
  const [internalNotes, setInternalNotes] = useState(statement.internalNotes ?? "");
  const [isSaving, setIsSaving] = useState(false);

  // Calculate totals
  const subtotal = plants.reduce((sum, p) => sum + p.total, 0);
  const vatAmount = Math.round(subtotal * (vatRate / 100));
  const total = subtotal + vatAmount;

  const handleUpdatePlant = useCallback((updated: PlantItem) => {
    setPlants((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }, []);

  const handleDeletePlant = useCallback((id: string) => {
    setPlants((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleAddPlant = () => {
    const newPlant: PlantItem = {
      id: generateId(),
      name: "",
      sizeSpec: "",
      quantity: 1,
      unitPrice: 0,
      total: 0,
    };
    setPlants((prev) => [...prev, newPlant]);
  };

  const handleSave = async () => {
    // Validate plants
    const invalidPlants = plants.filter((p) => !p.name || !p.sizeSpec);
    if (invalidPlants.length > 0) {
      toast.error("Vui lòng nhập đầy đủ tên cây và quy cách");
      return;
    }

    try {
      setIsSaving(true);
      const result = await updateMonthlyStatement({
        id: statement.id,
        contactName: contactName || undefined,
        plants,
        vatRate,
        notes: notes || undefined,
        internalNotes: internalNotes || undefined,
      });

      if (result.success) {
        toast.success("Đã lưu bảng kê");
        onSave();
      } else {
        throw new Error(result.error || "Không thể lưu");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể lưu bảng kê";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border-primary/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Chỉnh sửa bảng kê - Tháng {statement.month}/{statement.year}
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel} disabled={isSaving}>
              <X className="mr-2 h-4 w-4" />
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Đang lưu..." : "Lưu"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Header Fields */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="contactName">Người liên hệ</Label>
            <Input
              id="contactName"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Tên người liên hệ"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vatRate">Thuế VAT (%)</Label>
            <Input
              id="vatRate"
              type="number"
              value={vatRate}
              onChange={(e) => setVatRate(Number(e.target.value))}
              min={0}
              max={20}
              className="w-24"
            />
          </div>
        </div>

        {/* Plant Table */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label>Danh sách cây</Label>
            <Button variant="outline" size="sm" onClick={handleAddPlant}>
              <Plus className="mr-2 h-4 w-4" />
              Thêm cây
            </Button>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">STT</TableHead>
                  <TableHead>Tên cây</TableHead>
                  <TableHead>Quy cách</TableHead>
                  <TableHead className="text-right">Đơn giá</TableHead>
                  <TableHead className="text-right">SL</TableHead>
                  <TableHead className="text-right">Thành tiền</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {plants.map((plant, idx) => (
                  <PlantRowEditor
                    key={plant.id}
                    plant={plant}
                    index={idx}
                    onUpdate={handleUpdatePlant}
                    onDelete={handleDeletePlant}
                    isEditing={true}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-muted/50 space-y-2 rounded-lg border p-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tổng cộng:</span>
            <span className="font-medium">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">VAT ({vatRate}%):</span>
            <span className="font-medium">{formatCurrency(vatAmount)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 text-lg font-bold">
            <span>Thành tiền:</span>
            <span className="text-primary">{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Notes */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="notes">Ghi chú (hiển thị trên bảng kê)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú cho khách hàng..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="internalNotes">Ghi chú nội bộ</Label>
            <Textarea
              id="internalNotes"
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Ghi chú nội bộ (không hiển thị)..."
              rows={3}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
