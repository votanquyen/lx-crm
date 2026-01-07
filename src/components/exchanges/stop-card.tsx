/**
 * Stop Card Component
 * Display individual stop in daily schedule
 */
"use client";

import { MapPin, Package, Clock, GripVertical } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Stop } from "@/lib/maps/route-optimizer";
import type { DraggableProvidedDragHandleProps } from "react-beautiful-dnd";

interface StopCardProps {
  stop: Stop & { stopOrder?: number; eta?: string };
  isDragging?: boolean;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
}

export function StopCard({ stop, isDragging, dragHandleProps }: StopCardProps) {
  return (
    <Card
      className={`transition-all ${
        isDragging ? "shadow-lg rotate-2 opacity-75" : "shadow-sm hover:shadow-md"
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Drag Handle */}
          <div
            {...dragHandleProps}
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 mt-1"
          >
            <GripVertical className="h-5 w-5" />
          </div>

          {/* Stop Order Badge */}
          {stop.stopOrder && (
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                {stop.stopOrder}
              </div>
            </div>
          )}

          {/* Stop Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="font-semibold text-sm truncate">{stop.customerName}</h4>
              {stop.eta && (
                <Badge variant="outline" className="flex-shrink-0">
                  <Clock className="h-3 w-3 mr-1" />
                  {stop.eta}
                </Badge>
              )}
            </div>

            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex items-start gap-1">
                <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span className="line-clamp-2">{stop.address}</span>
              </div>

              <div className="flex items-center gap-1">
                <Package className="h-3 w-3 flex-shrink-0" />
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
