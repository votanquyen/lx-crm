/**
 * Schedule Builder Component
 * Drag-and-drop interface for building daily routes
 * Using dnd-kit for React 19 compatibility
 */
"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { SortableStopCard } from "./sortable-stop-card";
import { Shuffle, Save } from "lucide-react";
import { toast } from "sonner";
import type { Stop } from "@/lib/maps/route-optimizer";

interface ScheduleBuilderProps {
  initialStops: Stop[];
  scheduleId: string;
  onOptimize: () => Promise<void>;
  onSave: (stops: Stop[]) => Promise<void>;
  isOptimizing?: boolean;
  isSaving?: boolean;
}

export function ScheduleBuilder({
  initialStops,
  scheduleId: _scheduleId,
  onOptimize,
  onSave,
  isOptimizing,
  isSaving,
}: ScheduleBuilderProps) {
  const [stops, setStops] = useState<Stop[]>(initialStops);
  const [hasChanges, setHasChanges] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setStops((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
      setHasChanges(true);
    }
  };

  const handleSave = async () => {
    try {
      await onSave(stops);
      setHasChanges(false);
      toast.success("Đã lưu thứ tự điểm dừng");
    } catch {
      toast.error("Không thể lưu thứ tự");
    }
  };

  const handleOptimize = async () => {
    try {
      await onOptimize();
      toast.success("Đã tối ưu lộ trình");
    } catch {
      toast.error("Không thể tối ưu lộ trình");
    }
  };

  const totalPlants = stops.reduce((sum, stop) => sum + stop.plantCount, 0);
  const totalDuration = stops.reduce((sum, stop) => sum + (stop.estimatedDurationMins || 30), 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-gray-600">Tổng điểm dừng:</span>{" "}
            <span className="font-semibold">{stops.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Tổng cây:</span>{" "}
            <span className="font-semibold">{totalPlants}</span>
          </div>
          <div>
            <span className="text-gray-600">Thời gian dự kiến:</span>{" "}
            <span className="font-semibold">~{Math.round(totalDuration / 60)}h {totalDuration % 60}m</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOptimize}
            disabled={isOptimizing || stops.length < 2}
          >
            <Shuffle className="h-4 w-4 mr-2" />
            {isOptimizing ? "Đang tối ưu..." : "Tối ưu lộ trình"}
          </Button>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Đang lưu..." : "Lưu thứ tự"}
          </Button>
        </div>
      </div>

      {/* Drag and Drop List */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={stops.map(s => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 min-h-[200px] p-4 rounded-lg border-2 border-dashed border-gray-200 bg-white">
            {stops.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                Chưa có điểm dừng nào. Thêm yêu cầu đổi cây vào lịch trình.
              </div>
            ) : (
              stops.map((stop, index) => (
                <SortableStopCard
                  key={stop.id}
                  stop={{ ...stop, stopOrder: index + 1 }}
                />
              ))
            )}
          </div>
        </SortableContext>
      </DndContext>

      {/* Help Text */}
      <p className="text-sm text-gray-500 text-center">
        Kéo thả để sắp xếp lại thứ tự các điểm dừng, hoặc nhấn &quot;Tối ưu lộ trình&quot; để tự động sắp xếp
      </p>
    </div>
  );
}
