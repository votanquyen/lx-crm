/**
 * Exchange Status Badge Component
 */
import { ExchangeStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: ExchangeStatus;
}

const statusConfig = {
  PENDING: {
    label: "Chờ duyệt",
    variant: "outline" as const,
    className: "border-yellow-400 text-yellow-700 bg-yellow-50",
  },
  SCHEDULED: {
    label: "Đã lên lịch",
    variant: "default" as const,
    className: "bg-blue-600 hover:bg-blue-700",
  },
  IN_PROGRESS: {
    label: "Đang thực hiện",
    variant: "default" as const,
    className: "bg-purple-600 hover:bg-purple-700",
  },
  COMPLETED: {
    label: "Hoàn thành",
    variant: "default" as const,
    className: "bg-green-600 hover:bg-green-700",
  },
  CANCELLED: {
    label: "Đã hủy",
    variant: "secondary" as const,
    className: "bg-gray-400 hover:bg-gray-500",
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
}
