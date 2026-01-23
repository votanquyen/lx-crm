"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, User, Clock, AlertCircle, RefreshCw, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface DeletedStatement {
  id: string;
  customerId: string;
  year: number;
  month: number;
  deletedAt: Date;
  deletedBy: { name: string; email: string } | null;
  daysSinceDeleted: number;
  canRestore: boolean;
  customer: {
    code: string;
    companyName: string;
    shortName: string | null;
  };
}

interface DeletedStatementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestore: (id: string) => void;
  deletedStatements: DeletedStatement[];
  isLoading: boolean;
  isRestoring: boolean;
}

export function DeletedStatementsModal({
  isOpen,
  onClose,
  onRestore,
  deletedStatements,
  isLoading,
  isRestoring,
}: DeletedStatementsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-slate-900">
            Bảng kê đã xóa
          </DialogTitle>
          <p className="text-sm text-slate-600">
            Khôi phục bảng kê trong vòng 30 ngày kể từ khi xóa
          </p>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" aria-hidden="true" />
            <span className="sr-only">Đang tải...</span>
          </div>
        ) : deletedStatements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="mb-4 h-12 w-12 text-slate-300" aria-hidden="true" />
            <p className="text-sm font-medium text-slate-600">
              Không có bảng kê nào đã xóa
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Các bảng kê đã xóa quá 30 ngày sẽ tự động bị xóa vĩnh viễn
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {deletedStatements.map((stmt) => {
                const daysRemaining = 30 - stmt.daysSinceDeleted;
                const isUrgent = daysRemaining <= 7;
                const isWarning = daysRemaining > 7 && daysRemaining <= 14;

                return (
                  <div
                    key={stmt.id}
                    className="rounded-lg border bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Customer Info */}
                        <div className="mb-3">
                          <h3 className="text-base font-bold text-slate-900">
                            {stmt.customer.shortName || stmt.customer.companyName}
                          </h3>
                          <p className="text-xs text-slate-500">
                            Mã KH: {stmt.customer.code}
                          </p>
                        </div>

                        {/* Metadata Grid */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {/* Period */}
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-slate-400" aria-hidden="true" />
                            <span className="text-slate-700">
                              Tháng {stmt.month}/{stmt.year}
                            </span>
                          </div>

                          {/* Deleted By */}
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-slate-400" aria-hidden="true" />
                            <span className="text-slate-700">
                              {stmt.deletedBy?.name || "Không rõ"}
                            </span>
                          </div>

                          {/* Deleted Date */}
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-slate-400" aria-hidden="true" />
                            <span className="text-slate-700">
                              {formatDistanceToNow(new Date(stmt.deletedAt), {
                                addSuffix: true,
                                locale: vi,
                              })}
                            </span>
                          </div>

                          {/* Days Remaining */}
                          <div className="flex items-center gap-2">
                            <AlertCircle
                              className={`h-4 w-4 ${
                                !stmt.canRestore
                                  ? "text-red-500"
                                  : isUrgent
                                  ? "text-orange-500"
                                  : isWarning
                                  ? "text-yellow-500"
                                  : "text-slate-400"
                              }`}
                              aria-hidden="true"
                            />
                            <span
                              className={`font-medium ${
                                !stmt.canRestore
                                  ? "text-red-600"
                                  : isUrgent
                                  ? "text-orange-600"
                                  : isWarning
                                  ? "text-yellow-600"
                                  : "text-slate-700"
                              }`}
                            >
                              {stmt.canRestore
                                ? `Còn ${daysRemaining} ngày`
                                : `Quá hạn ${Math.abs(daysRemaining)} ngày`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Restore Button */}
                      <div className="ml-4">
                        <Button
                          onClick={() => onRestore(stmt.id)}
                          disabled={!stmt.canRestore || isRestoring}
                          size="sm"
                          className={
                            stmt.canRestore
                              ? "bg-emerald-600 font-bold text-white hover:bg-emerald-700"
                              : ""
                          }
                          variant={stmt.canRestore ? "default" : "secondary"}
                        >
                          {isRestoring ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                              Đang khôi phục...
                            </>
                          ) : stmt.canRestore ? (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
                              Khôi phục
                            </>
                          ) : (
                            <>
                              <AlertCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                              Không thể khôi phục
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Warning Message for Expiring Soon */}
                    {stmt.canRestore && isUrgent && (
                      <div className="mt-3 rounded-md border border-orange-200 bg-orange-50 p-2">
                        <p className="text-xs font-medium text-orange-800">
                          ⚠️ Sắp hết hạn! Khôi phục ngay nếu cần thiết.
                        </p>
                      </div>
                    )}

                    {/* Cannot Restore Message */}
                    {!stmt.canRestore && (
                      <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-2">
                        <p className="text-xs font-medium text-red-800">
                          🚫 Đã quá 30 ngày - không thể khôi phục
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {/* Info Footer */}
        {!isLoading && deletedStatements.length > 0 && (
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="text-xs font-medium text-blue-900">
              💡 <strong>Lưu ý:</strong> Bảng kê chỉ có thể khôi phục trong vòng 30 ngày kể từ khi
              xóa. Sau 30 ngày, dữ liệu sẽ bị xóa vĩnh viễn.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
