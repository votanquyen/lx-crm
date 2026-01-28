"use client";

import Link from "next/link";
import { Receipt, AlertTriangle, DollarSign, Clock, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Icon mapping for Server→Client serialization
const ICON_MAP: Record<string, LucideIcon> = {
  receipt: Receipt,
  "alert-triangle": AlertTriangle,
  "dollar-sign": DollarSign,
  clock: Clock,
};

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: keyof typeof ICON_MAP;
  iconColor: string;
  iconBgColor: string;
  textColor?: string;
  bgColor?: string;
  borderColor?: string;
  href?: string;
  badge?: number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  iconColor,
  iconBgColor,
  textColor = "text-slate-900",
  bgColor = "bg-white",
  borderColor = "border-slate-200",
  href,
  badge,
  trend,
}: SummaryCardProps) {
  const Icon = ICON_MAP[icon] || Receipt;
  const CardWrapper = href ? Link : "div";
  const wrapperProps = href ? { href } : {};

  return (
    <CardWrapper
      {...wrapperProps}
      className={cn(
        "group relative rounded-xl border p-5 shadow-sm transition-all duration-200",
        bgColor,
        borderColor,
        href && "cursor-pointer hover:shadow-md hover:scale-[1.02] hover:border-slate-300"
      )}
    >
      {/* Badge */}
      {badge !== undefined && badge > 0 && (
        <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-md">
          {badge > 99 ? "99+" : badge}
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Title */}
          <div className="mb-3 flex items-center gap-2">
            <div className={cn("rounded-lg p-2", iconBgColor)}>
              <Icon className={cn("h-5 w-5", iconColor)} />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {title}
            </span>
          </div>

          {/* Value */}
          <div className="flex items-baseline gap-2">
            <span className={cn("text-3xl font-black tabular-nums", textColor)}>
              {value}
            </span>
            {trend && (
              <span
                className={cn(
                  "text-xs font-bold",
                  trend.isPositive ? "text-emerald-600" : "text-rose-600"
                )}
              >
                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
              </span>
            )}
          </div>

          {/* Subtitle */}
          {subtitle && (
            <p className="mt-1 text-xs font-medium text-slate-500">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Hover indicator */}
      {href && (
        <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-xl bg-gradient-to-r from-blue-500 to-blue-600 opacity-0 transition-opacity group-hover:opacity-100" />
      )}
    </CardWrapper>
  );
}
