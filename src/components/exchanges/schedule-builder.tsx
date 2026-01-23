/**
 * Schedule Builder Component
 * Drag-and-drop interface for building daily routes
 * Using @hello-pangea/dnd (react-beautiful-dnd fork with React 19 support)
 */
"use client";

import { useState } from "react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { StopCard } from "./stop-card";
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
  // scheduleId reserved for future use (e.g., optimistic updates)
  scheduleId: _,
  onOptimize,
  onSave,
  isOptimizing,
  isSaving,
}: ScheduleBuilderProps) {
  const [stops, setStops] = useState<Stop[]>(initialStops);
  const [hasChanges, setHasChanges] = useState(false);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;

    if (sourceIndex === destIndex) return;

    const reordered = Array.from(stops);
    const [removed] = reordered.splice(sourceIndex, 1);
    if (removed) {
      reordered.splice(destIndex, 0, removed);
    }

    setStops(reordered);
    setHasChanges(true);
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
      <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
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
            <span className="font-semibold">
              ~{Math.round(totalDuration / 60)}h {totalDuration % 60}m
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOptimize}
            disabled={isOptimizing || stops.length < 2}
          >
            <Shuffle className="mr-2 h-4 w-4" aria-hidden="true" />
            {isOptimizing ? "Đang tối ưu..." : "Tối ưu lộ trình"}
          </Button>

          <Button size="sm" onClick={handleSave} disabled={!hasChanges || isSaving}>
            <Save className="mr-2 h-4 w-4" aria-hidden="true" />
            {isSaving ? "Đang lưu..." : "Lưu thứ tự"}
          </Button>
        </div>
      </div>

      {/* Drag and Drop List */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="stops">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`min-h-[200px] space-y-2 rounded-lg border-2 border-dashed bg-white p-4 ${
                snapshot.isDraggingOver ? "border-blue-400 bg-blue-50" : "border-gray-200"
              }`}
            >
              {stops.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  Chưa có điểm dừng nào. Thêm yêu cầu đổi cây vào lịch trình.
                </div>
              ) : (
                stops.map((stop, index) => (
                  <Draggable key={stop.id} draggableId={stop.id} index={index}>
                    {(provided, snapshot) => (
                      <div ref={provided.innerRef} {...provided.draggableProps}>
                        <StopCard
                          stop={{ ...stop, stopOrder: index + 1 }}
                          isDragging={snapshot.isDragging}
                          dragHandleProps={provided.dragHandleProps}
                        />
                      </div>
                    )}
                  </Draggable>
                ))
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Help Text */}
      <p className="text-center text-sm text-gray-500">
        Kéo thả để sắp xếp lại thứ tự các điểm dừng, hoặc nhấn &quot;Tối ưu lộ trình&quot; để tự
        động sắp xếp
      </p>
    </div>
  );
}
