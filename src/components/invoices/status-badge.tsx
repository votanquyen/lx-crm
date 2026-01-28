import { CheckCircle, Clock, AlertCircle, Send, FileText, XCircle, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InvoiceStatus } from "@prisma/client";

interface StatusBadgeProps {
    status: InvoiceStatus;
    className?: string;
    showIcon?: boolean;
    size?: "sm" | "md" | "lg";
}

const statusConfig = {
    PAID: {
        label: "Đã TT",
        icon: CheckCircle,
        color: "text-emerald-700",
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        dotColor: "bg-emerald-500",
    },
    SENT: {
        label: "Đã gửi",
        icon: Send,
        color: "text-blue-700",
        bg: "bg-blue-50",
        border: "border-blue-200",
        dotColor: "bg-blue-500",
    },
    PARTIAL: {
        label: "TT một phần",
        icon: DollarSign,
        color: "text-amber-700",
        bg: "bg-amber-50",
        border: "border-amber-200",
        dotColor: "bg-amber-500",
    },
    OVERDUE: {
        label: "Quá hạn",
        icon: AlertCircle,
        color: "text-rose-700",
        bg: "bg-rose-50",
        border: "border-rose-200",
        dotColor: "bg-rose-500",
    },
    DRAFT: {
        label: "Nháp",
        icon: FileText,
        color: "text-slate-600",
        bg: "bg-slate-50",
        border: "border-slate-200",
        dotColor: "bg-slate-400",
    },
    CANCELLED: {
        label: "Đã hủy",
        icon: XCircle,
        color: "text-slate-500",
        bg: "bg-slate-50",
        border: "border-slate-200",
        dotColor: "bg-slate-400",
    },
    REFUNDED: {
        label: "Hoàn tiền",
        icon: DollarSign,
        color: "text-purple-700",
        bg: "bg-purple-50",
        border: "border-purple-200",
        dotColor: "bg-purple-500",
    },
} as const;

const sizeConfig = {
    sm: {
        text: "text-[10px]",
        icon: "h-3 w-3",
        dot: "h-1.5 w-1.5",
        padding: "px-2 py-0.5",
        gap: "gap-1",
    },
    md: {
        text: "text-xs",
        icon: "h-3.5 w-3.5",
        dot: "h-2 w-2",
        padding: "px-2.5 py-1",
        gap: "gap-1.5",
    },
    lg: {
        text: "text-sm",
        icon: "h-4 w-4",
        dot: "h-2.5 w-2.5",
        padding: "px-3 py-1.5",
        gap: "gap-2",
    },
};

export function StatusBadge({
    status,
    className,
    showIcon = true,
    size = "sm"
}: StatusBadgeProps) {
    const config = statusConfig[status];
    const sizeStyles = sizeConfig[size];
    const Icon = config.icon;

    return (
        <div
            className={cn(
                "inline-flex items-center rounded-full border font-bold uppercase tracking-wider tabular-nums",
                config.bg,
                config.border,
                config.color,
                sizeStyles.text,
                sizeStyles.padding,
                sizeStyles.gap,
                className
            )}
        >
            {showIcon && <Icon className={sizeStyles.icon} />}
            <span>{config.label}</span>
        </div>
    );
}

export function StatusDot({ status, className }: { status: InvoiceStatus; className?: string }) {
    const config = statusConfig[status];

    return (
        <span
            className={cn(
                "inline-block h-2 w-2 rounded-full",
                config.dotColor,
                className
            )}
            aria-label={config.label}
        />
    );
}

export { statusConfig };
