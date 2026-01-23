/**
 * Exchange Request Card Component
 * Display individual exchange request with actions
 */
"use client";

import { memo } from "react";

import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { MapPin, Calendar, Package, User } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PriorityBadge } from "./priority-badge";
import { StatusBadge } from "./status-badge";
import type { ExchangeRequest, Customer } from "@prisma/client";

interface ExchangeRequestCardProps {
  request: ExchangeRequest & {
    customer: Pick<Customer, "id" | "code" | "companyName" | "address" | "district">;
  };
  onApprove?: (id: string) => void;
  onCancel?: (id: string) => void;
  onView?: (id: string) => void;
}

export function ExchangeRequestCardComponent({
  request,
  onApprove,
  onCancel,
  onView,
}: ExchangeRequestCardProps) {
  const canApprove = request.status === "PENDING";
  const canCancel = !["COMPLETED", "CANCELLED"].includes(request.status);

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <h3 className="truncate text-lg font-semibold">{request.customer.companyName}</h3>
              <span className="shrink-0 text-sm text-gray-500">#{request.customer.code}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={request.status} />
              <PriorityBadge priority={request.priority} score={request.priorityScore} />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Customer Info */}
        <div className="flex items-start gap-2 text-sm text-gray-600">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="line-clamp-2">
            {request.customer.address}, {request.customer.district}
          </span>
        </div>

        {/* Plant Details */}
        {request.currentPlant && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Package className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              Cây hiện tại: <span className="font-medium">{request.currentPlant}</span>
              {request.quantity > 1 && ` (${request.quantity} cây)`}
            </span>
          </div>
        )}

        {/* Preferred Date */}
        {request.preferredDate && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              Ngày mong muốn: {format(request.preferredDate, "dd/MM/yyyy", { locale: vi })}
            </span>
          </div>
        )}

        {/* Reason */}
        {request.reason && (
          <p className="line-clamp-2 rounded bg-gray-50 p-2 text-sm text-gray-700 italic">
            &quot;{request.reason}&quot;
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 border-t pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onView?.(request.id)}
            className="min-w-[100px] flex-1"
          >
            <User className="mr-1 h-4 w-4" aria-hidden="true" />
            Chi tiết
          </Button>

          {canApprove && onApprove && (
            <Button
              size="sm"
              onClick={() => onApprove(request.id)}
              className="min-w-[100px] flex-1"
            >
              Duyệt
            </Button>
          )}

          {canCancel && onCancel && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onCancel(request.id)}
              className="min-w-[100px] flex-1"
            >
              Hủy
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Memoize to prevent re-renders when parent list changes but this card's props don't
export const ExchangeRequestCard = memo(ExchangeRequestCardComponent);
