"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Trash2, GripVertical } from "lucide-react";
import type { PlantItem } from "@/types/monthly-statement";

interface PlantRowEditorProps {
  plant: PlantItem;
  index: number;
  onUpdate: (plant: PlantItem) => void;
  onDelete: (id: string) => void;
  isEditing: boolean;
}

export function PlantRowEditor({
  plant,
  index,
  onUpdate,
  onDelete,
  isEditing,
}: PlantRowEditorProps) {
  const [localPlant, setLocalPlant] = useState(plant);

  const handleChange = (field: keyof PlantItem, value: string | number) => {
    const updated = { ...localPlant, [field]: value };

    // Recalculate total when quantity or unitPrice changes
    if (field === "quantity" || field === "unitPrice") {
      const quantity = field === "quantity" ? Number(value) : localPlant.quantity;
      const unitPrice = field === "unitPrice" ? Number(value) : localPlant.unitPrice;
      updated.total = quantity * unitPrice;
    }

    setLocalPlant(updated);
    onUpdate(updated);
  };

  if (!isEditing) {
    return (
      <TableRow>
        <TableCell className="font-medium">{index + 1}</TableCell>
        <TableCell>{plant.name}</TableCell>
        <TableCell className="text-muted-foreground">{plant.sizeSpec}</TableCell>
        <TableCell className="text-right">{plant.unitPrice.toLocaleString()}</TableCell>
        <TableCell className="text-right">{plant.quantity}</TableCell>
        <TableCell className="text-right font-medium">{plant.total.toLocaleString()}</TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow>
      <TableCell className="w-12">
        <div className="flex items-center gap-1">
          <GripVertical className="text-muted-foreground h-4 w-4 cursor-grab" />
          <span className="font-medium">{index + 1}</span>
        </div>
      </TableCell>
      <TableCell>
        <Input
          value={localPlant.name}
          onChange={(e) => handleChange("name", e.target.value)}
          className="h-8"
          placeholder="Tên cây"
        />
      </TableCell>
      <TableCell>
        <Input
          value={localPlant.sizeSpec}
          onChange={(e) => handleChange("sizeSpec", e.target.value)}
          className="h-8"
          placeholder="Quy cách"
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          value={localPlant.unitPrice}
          onChange={(e) => handleChange("unitPrice", Number(e.target.value))}
          className="h-8 w-24 text-right"
          min={0}
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          value={localPlant.quantity}
          onChange={(e) => handleChange("quantity", Number(e.target.value))}
          className="h-8 w-16 text-right"
          min={1}
        />
      </TableCell>
      <TableCell className="text-right font-medium">
        {localPlant.total.toLocaleString()}
      </TableCell>
      <TableCell className="w-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(plant.id)}
          className="text-destructive hover:text-destructive h-8 w-8"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
