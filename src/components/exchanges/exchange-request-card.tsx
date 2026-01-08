/**
 * Exchange Request Card Component
 * Display individual exchange request with actions
 */
"use client";

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
    customer: Pick<Customer, "id" | "code" | "companyName" | "address" | "district" | "tier">;
  };
  onApprove?: (id: string) => void;
  onCancel?: (id: string) => void;
  onView?: (id: string) => void;
}

export function ExchangeRequestCard({
  request,
  onApprove,
  onCancel,
  onView,
}: ExchangeRequestCardProps) {
  const canApprove = request.status === "PENDING";
  const canCancel = !["COMPLETED", "CANCELLED"].includes(request.status);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg truncate">
                {request.customer.companyName}
              </h3>
              <span className="text-sm text-gray-500 shrink-0">
                #{request.customer.code}
              </span>
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
          <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
          <span className="line-clamp-2">
            {request.customer.address}, {request.customer.district}
          </span>
        </div>

        {/* Plant Details */}
        {request.currentPlant && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Package className="h-4 w-4 shrink-0" />
            <span>
              Cây hiện tại: <span className="font-medium">{request.currentPlant}</span>
              {request.quantity > 1 && ` (${request.quantity} cây)`}
            </span>
          </div>
        )}

        {/* Preferred Date */}
        {request.preferredDate && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4 shrink-0" />
            <span>
              Ngày mong muốn:{" "}
              {format(request.preferredDate, "dd/MM/yyyy", { locale: vi })}
            </span>
          </div>
        )}

        {/* Reason */}
        {request.reason && (
          <p className="text-sm text-gray-700 line-clamp-2 italic bg-gray-50 p-2 rounded">
            &quot;{request.reason}&quot;
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onView?.(request.id)}
            className="flex-1 min-w-[100px]"
          >
            <User className="h-4 w-4 mr-1" />
            Chi tiết
          </Button>

          {canApprove && onApprove && (
            <Button
              size="sm"
              onClick={() => onApprove(request.id)}
              className="flex-1 min-w-[100px]"
            >
              Duyệt
            </Button>
          )}

          {canCancel && onCancel && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onCancel(request.id)}
              className="flex-1 min-w-[100px]"
            >
              Hủy
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
