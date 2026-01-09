/**
 * Status Badge Configuration
 * Centralized badge styling for all status enums
 */

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

interface StatusConfig {
  label: string;
  variant: BadgeVariant;
}

/**
 * Invoice status badge configuration
 */
export const invoiceStatusConfig: Record<string, StatusConfig> = {
  DRAFT: { label: "Nháp", variant: "secondary" },
  SENT: { label: "Đã gửi", variant: "outline" },
  PARTIAL: { label: "Thanh toán một phần", variant: "outline" },
  PAID: { label: "Đã thanh toán", variant: "default" },
  OVERDUE: { label: "Quá hạn", variant: "destructive" },
  CANCELLED: { label: "Đã hủy", variant: "destructive" },
};

/**
 * Contract status badge configuration
 */
export const contractStatusConfig: Record<string, StatusConfig> = {
  DRAFT: { label: "Nháp", variant: "secondary" },
  SENT: { label: "Đã gửi", variant: "outline" },
  NEGOTIATING: { label: "Đang đàm phán", variant: "outline" },
  SIGNED: { label: "Đã ký", variant: "secondary" },
  ACTIVE: { label: "Đang hoạt động", variant: "default" },
  EXPIRED: { label: "Hết hạn", variant: "destructive" },
  TERMINATED: { label: "Đã chấm dứt", variant: "destructive" },
  CANCELLED: { label: "Đã hủy", variant: "destructive" },
};

/**
 * Customer status badge configuration
 */
export const customerStatusConfig: Record<string, StatusConfig> = {
  LEAD: { label: "Tiềm năng", variant: "outline" },
  ACTIVE: { label: "Đang hoạt động", variant: "default" },
  INACTIVE: { label: "Tạm ngưng", variant: "secondary" },
  TERMINATED: { label: "Đã kết thúc", variant: "destructive" },
};

/**
 * Payment method badge configuration
 */
export const paymentMethodConfig: Record<string, StatusConfig> = {
  CASH: { label: "Tiền mặt", variant: "secondary" },
  BANK_TRANSFER: { label: "Chuyển khoản", variant: "default" },
  CHECK: { label: "Séc", variant: "outline" },
  OTHER: { label: "Khác", variant: "outline" },
};

/**
 * Schedule status badge configuration
 */
export const scheduleStatusConfig: Record<string, StatusConfig> = {
  DRAFT: { label: "Nháp", variant: "secondary" },
  PENDING: { label: "Chờ duyệt", variant: "outline" },
  APPROVED: { label: "Đã duyệt", variant: "default" },
  IN_PROGRESS: { label: "Đang thực hiện", variant: "default" },
  COMPLETED: { label: "Hoàn thành", variant: "default" },
  CANCELLED: { label: "Đã hủy", variant: "destructive" },
};

/**
 * Exchange request status badge configuration
 */
export const exchangeStatusConfig: Record<string, StatusConfig> = {
  PENDING: { label: "Chờ xử lý", variant: "outline" },
  SCHEDULED: { label: "Đã lên lịch", variant: "secondary" },
  IN_PROGRESS: { label: "Đang thực hiện", variant: "default" },
  COMPLETED: { label: "Hoàn thành", variant: "default" },
  CANCELLED: { label: "Đã hủy", variant: "destructive" },
};

/**
 * Get status config with fallback for unknown statuses
 */
export function getStatusConfig(
  config: Record<string, StatusConfig>,
  status: string
): StatusConfig {
  return config[status] ?? { label: status, variant: "secondary" };
}
