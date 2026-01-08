/**
 * Sortable Stop Card Component
 * Wraps StopCard with dnd-kit sortable functionality
 */
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { StopCard } from "./stop-card";
import type { Stop } from "@/lib/maps/route-optimizer";

interface SortableStopCardProps {
  stop: Stop & { stopOrder?: number; eta?: string };
}

export function SortableStopCard({ stop }: SortableStopCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stop.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <StopCard
        stop={stop}
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}
