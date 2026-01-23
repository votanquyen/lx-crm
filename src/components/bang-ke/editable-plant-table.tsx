"use client";

import { useState, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save, X, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import type { PlantItem } from "@/types/monthly-statement";
import { createId } from "@paralleldrive/cuid2";
import { PlantAutocompleteInput } from "./plant-autocomplete-input";

interface EditablePlantTableProps {
  plants: PlantItem[];
  isEditable: boolean; // Can edit (not confirmed)
  onSave: (plants: PlantItem[]) => Promise<void>;
  isSaving?: boolean;
}

/**
 * Inline editable table for plant items in monthly statements.
 * Click any cell to edit. Escape to cancel, Tab/Enter to confirm cell.
 * Save button commits all changes to server.
 */
export function EditablePlantTable({
  plants: initialPlants,
  isEditable,
  onSave,
  isSaving = false,
}: EditablePlantTableProps) {
  // Local state for editing
  const [plants, setPlants] = useState<PlantItem[]>(initialPlants);
  const [editingCell, setEditingCell] = useState<{
    rowId: string;
    field: keyof PlantItem;
  } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync plants when initialPlants changes (e.g., switching customers)
  useEffect(() => {
    setPlants(initialPlants);
    setHasChanges(false);
    setEditingCell(null);
  }, [initialPlants]);

  // Reset when initial plants change (e.g., after save or reload)
  const resetToInitial = useCallback(() => {
    setPlants(initialPlants);
    setHasChanges(false);
    setEditingCell(null);
  }, [initialPlants]);

  // Handle cell click to start editing
  const handleCellClick = (rowId: string, field: keyof PlantItem) => {
    if (!isEditable || field === "id" || field === "total") return;
    setEditingCell({ rowId, field });
  };

  // Handle cell value change
  const handleCellChange = (rowId: string, field: keyof PlantItem, value: string) => {
    setPlants((prev) =>
      prev.map((plant) => {
        if (plant.id !== rowId) return plant;

        let newValue: string | number = value;
        if (field === "quantity" || field === "unitPrice") {
          newValue = parseInt(value, 10) || 0;
        }

        const updated = { ...plant, [field]: newValue };

        // Auto-calculate total when quantity or unitPrice changes
        if (field === "quantity" || field === "unitPrice") {
          updated.total = updated.quantity * updated.unitPrice;
        }

        return updated;
      })
    );
    setHasChanges(true);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, _rowId: string, _field: keyof PlantItem) => {
    if (e.key === "Escape") {
      setEditingCell(null);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      setEditingCell(null);
    }
  };

  // Add new plant row
  const handleAddPlant = () => {
    const newPlant: PlantItem = {
      id: createId(),
      name: "",
      sizeSpec: "",
      quantity: 1,
      unitPrice: 0,
      total: 0,
    };
    setPlants((prev) => [...prev, newPlant]);
    setHasChanges(true);
    // Auto-focus the new row's name field
    setTimeout(() => {
      setEditingCell({ rowId: newPlant.id, field: "name" });
    }, 50);
  };

  // Remove plant row
  const handleRemovePlant = (rowId: string) => {
    setPlants((prev) => prev.filter((p) => p.id !== rowId));
    setHasChanges(true);
  };

  // Save all changes
  const handleSave = async () => {
    // Filter out empty rows
    const validPlants = plants.filter((p) => p.name.trim() !== "" && p.quantity > 0);
    await onSave(validPlants);
    setHasChanges(false);
    setEditingCell(null);
  };

  // Handle plant selection from autocomplete
  const handlePlantSelect = (
    rowId: string,
    plant: { name: string; sizeSpec: string | null; unitPrice: number }
  ) => {
    setPlants((prev) =>
      prev.map((p) => {
        if (p.id !== rowId) return p;
        const updated = {
          ...p,
          name: plant.name,
          sizeSpec: plant.sizeSpec || p.sizeSpec,
          unitPrice: plant.unitPrice,
          total: p.quantity * plant.unitPrice,
        };
        return updated;
      })
    );
    setHasChanges(true);
    setEditingCell(null);
  };

  // Render editable cell
  const renderCell = (
    plant: PlantItem,
    field: keyof PlantItem,
    displayValue: React.ReactNode,
    inputType: "text" | "number" = "text",
    className?: string
  ) => {
    const isEditing = editingCell?.rowId === plant.id && editingCell?.field === field;

    if (!isEditable) {
      return <span className={className}>{displayValue}</span>;
    }

    if (isEditing) {
      // Use autocomplete for name field
      if (field === "name") {
        return (
          <PlantAutocompleteInput
            value={plant.name}
            onChange={(value) => handleCellChange(plant.id, "name", value)}
            onSelectPlant={(selected) => handlePlantSelect(plant.id, selected)}
            onBlur={() => setTimeout(() => setEditingCell(null), 150)}
            onKeyDown={(e) => handleKeyDown(e, plant.id, field)}
            autoFocus
          />
        );
      }

      return (
        <Input
          type={inputType}
          value={plant[field] as string | number}
          onChange={(e) => handleCellChange(plant.id, field, e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, plant.id, field)}
          onBlur={() => setTimeout(() => setEditingCell(null), 100)}
          autoFocus
          className="h-7 min-w-[60px] px-1 text-sm"
        />
      );
    }

    return (
      <span
        onClick={() => handleCellClick(plant.id, field)}
        className={cn(
          className,
          "hover:bg-primary/5 cursor-pointer rounded px-1 py-0.5 transition-colors",
          "hover:border-primary/20 border border-transparent"
        )}
        title="Nhấp để chỉnh sửa"
      >
        {displayValue}
      </span>
    );
  };

  // Calculate totals
  const subtotal = plants.reduce((sum, p) => sum + p.total, 0);
  const totalQuantity = plants.reduce((sum, p) => sum + p.quantity, 0);

  return (
    <div>
      {/* Action bar */}
      {isEditable && (
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddPlant}
              className="h-8 gap-1.5 text-xs"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Thêm dòng
            </Button>
            <span className="text-xs text-slate-500">
              {plants.length} dòng • <span className="font-semibold">{totalQuantity} cây</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {hasChanges && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetToInitial}
                  disabled={isSaving}
                  className="text-muted-foreground h-8 gap-1.5 text-xs"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                  Hủy
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-primary h-8 gap-1.5 text-xs"
                >
                  <Save className="h-3.5 w-3.5" aria-hidden="true" />
                  {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border whitespace-nowrap">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="w-12 px-4 py-3 text-center text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                #
              </th>
              <th className="px-4 py-3 text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                Tên danh mục cây
              </th>
              <th className="px-4 py-3 text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                Quy cách/Size
              </th>
              <th className="px-4 py-3 text-right text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                Đơn giá
              </th>
              <th className="w-24 px-4 py-3 text-center text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                SL
              </th>
              <th className="px-4 py-3 text-right text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                Thành tiền
              </th>
              {isEditable && <th className="w-10 px-2 py-3"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {plants.map((plant, idx) => (
              <tr
                key={plant.id}
                className={cn(
                  "transition-colors hover:bg-slate-50",
                  editingCell?.rowId === plant.id && "bg-primary/5"
                )}
              >
                <td className="px-4 py-3 text-center text-xs font-bold text-slate-400">
                  {idx + 1}
                </td>
                <td className="px-4 py-3">
                  {renderCell(
                    plant,
                    "name",
                    plant.name,
                    "text",
                    "text-sm font-bold text-slate-800"
                  )}
                </td>
                <td className="px-4 py-3">
                  {renderCell(
                    plant,
                    "sizeSpec",
                    plant.sizeSpec,
                    "text",
                    "text-xs font-medium text-slate-500 tracking-tight"
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {renderCell(
                    plant,
                    "unitPrice",
                    formatCurrency(plant.unitPrice),
                    "number",
                    "text-xs font-bold text-slate-700"
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {renderCell(
                    plant,
                    "quantity",
                    plant.quantity,
                    "number",
                    "text-sm font-black text-slate-900"
                  )}
                </td>
                <td className="text-primary px-4 py-3 text-right text-sm font-bold">
                  {formatCurrency(plant.total)}
                </td>
                {isEditable && (
                  <td className="px-2 py-3">
                    <button
                      type="button"
                      onClick={() => handleRemovePlant(plant.id)}
                      className="p-1 text-slate-400 transition-colors hover:text-red-500"
                      aria-label="Xóa dòng"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {plants.length === 0 && (
              <tr key="empty-row">
                <td
                  colSpan={isEditable ? 7 : 6}
                  className="px-4 py-8 text-center text-sm text-slate-400"
                >
                  Chưa có dữ liệu. Nhấn "Thêm dòng" để bắt đầu.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Inline subtotal preview (updates live) */}
      {hasChanges && (
        <div className="text-muted-foreground mt-2 text-right text-xs">
          Tạm tính: <span className="font-bold text-slate-700">{formatCurrency(subtotal)}</span>
          <span className="ml-2 text-amber-600">(chưa lưu)</span>
        </div>
      )}

      {/* Summary for non-editable view */}
      {!isEditable && plants.length > 0 && (
        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
          <span>
            {plants.length} dòng • <span className="font-semibold">{totalQuantity} cây</span>
          </span>
          <span>
            Tổng: <span className="font-bold text-slate-700">{formatCurrency(subtotal)}</span>
          </span>
        </div>
      )}
    </div>
  );
}
