/**
 * Priority Badge Component
 * Visual indicator for exchange request priority
 */
import { ExchangePriority } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

interface PriorityBadgeProps {
  priority: ExchangePriority;
  score?: number;
}

const priorityConfig = {
  URGENT: {
    label: "Khẩn cấp",
    variant: "destructive" as const,
    className: "bg-red-600 hover:bg-red-700",
  },
  HIGH: {
    label: "Cao",
    variant: "default" as const,
    className: "bg-orange-500 hover:bg-orange-600",
  },
  MEDIUM: {
    label: "Trung bình",
    variant: "secondary" as const,
    className: "bg-blue-500 hover:bg-blue-600 text-white",
  },
  LOW: {
    label: "Thấp",
    variant: "outline" as const,
    className: "border-gray-300 text-gray-600",
  },
};

export function PriorityBadge({ priority, score }: PriorityBadgeProps) {
  const config = priorityConfig[priority];

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
      {score !== undefined && ` (${score})`}
    </Badge>
  );
}
