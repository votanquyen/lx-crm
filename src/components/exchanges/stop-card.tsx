/**
 * Stop Card Component
 * Display individual stop in daily schedule
 */
"use client";

import { MapPin, Package, Clock, GripVertical } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Stop } from "@/lib/maps/route-optimizer";
import type { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";

interface StopCardProps {
  stop: Stop & { stopOrder?: number; eta?: string };
  isDragging?: boolean;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
}

export function StopCard({ stop, isDragging, dragHandleProps }: StopCardProps) {
  return (
    <Card
      className={`transition-all ${
        isDragging ? "rotate-2 opacity-75 shadow-lg" : "shadow-xs hover:shadow-md"
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Drag Handle */}
          <div
            {...dragHandleProps}
            className="mt-1 cursor-grab text-gray-400 hover:text-gray-600 active:cursor-grabbing"
          >
            <GripVertical className="h-5 w-5" aria-hidden="true" />
          </div>

          {/* Stop Order Badge */}
          {stop.stopOrder && (
            <div className="shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                {stop.stopOrder}
              </div>
            </div>
          )}

          {/* Stop Details */}
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-start justify-between gap-2">
              <h4 className="truncate text-sm font-semibold">{stop.customerName}</h4>
              {stop.eta && (
                <Badge variant="outline" className="shrink-0">
                  <Clock className="mr-1 h-3 w-3" aria-hidden="true" />
                  {stop.eta}
                </Badge>
              )}
            </div>

            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex items-start gap-1">
                <MapPin className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
                <span className="line-clamp-2">{stop.address}</span>
              </div>

              <div className="flex items-center gap-1">
                <Package className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span>
                  {stop.plantCount} cây • ~{stop.estimatedDurationMins || 30} phút
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
