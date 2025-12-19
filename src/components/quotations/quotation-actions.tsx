/**
 * Quotation Actions Component
 * Action buttons for quotation (send, accept, reject, convert, delete)
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  CheckCircle,
  XCircle,
  Download,
  Trash2,
  FileCheck,
  Edit,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  sendQuotation,
  acceptQuotation,
  rejectQuotation,
  deleteQuotation,
  convertQuotationToContract,
} from "@/actions/quotations";
import type { Quotation, Customer, QuotationItem, PlantType, User } from "@prisma/client";

interface QuotationActionsProps {
  quotation: Quotation & {
    customer: Customer;
    items: (QuotationItem & { plantType: PlantType })[];
    createdBy: Pick<User, "id" | "name" | "email"> | null;
  };
}

export function QuotationActions({ quotation }: QuotationActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  async function handleSend() {
    setIsLoading(true);
    try {
      await sendQuotation({
        quotationId: quotation.id,
      });
      toast.success("Gửi báo giá thành công!");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAccept() {
    setIsLoading(true);
    try {
      await acceptQuotation(quotation.id);
      toast.success("Chấp nhận báo giá thành công!");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleReject() {
    setIsLoading(true);
    try {
      await rejectQuotation(quotation.id);
      toast.success("Từ chối báo giá");
      router.refresh();
      setShowRejectDialog(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    setIsLoading(true);
    try {
      await deleteQuotation(quotation.id);
      toast.success("Xóa báo giá thành công!");
      router.push("/quotations");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra");
      setShowDeleteDialog(false);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleConvert() {
    setIsLoading(true);
    try {
      const result = await convertQuotationToContract({
        quotationId: quotation.id,
        startDate: new Date(),
        duration: quotation.proposedDuration || 12,
        monthlyFee: quotation.proposedMonthlyFee
          ? Number(quotation.proposedMonthlyFee)
          : Number(quotation.totalAmount),
        deposit: quotation.proposedDeposit
          ? Number(quotation.proposedDeposit)
          : Number(quotation.totalAmount),
      });
      toast.success(result.message);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra");
    } finally {
      setIsLoading(false);
    }
  }

  function handleDownloadPDF() {
    toast.info("Tính năng xuất PDF sẽ được triển khai sau");
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {/* Edit - Only for DRAFT */}
        {quotation.status === "DRAFT" && (
          <Button variant="outline" size="sm" asChild>
            <a href={`/quotations/${quotation.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Chỉnh sửa
            </a>
          </Button>
        )}

        {/* Send - Only for DRAFT */}
        {quotation.status === "DRAFT" && (
          <Button
            size="sm"
            onClick={handleSend}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Gửi báo giá
          </Button>
        )}

        {/* Accept/Reject - Only for SENT/VIEWED */}
        {["SENT", "VIEWED"].includes(quotation.status) && (
          <>
            <Button
              size="sm"
              variant="default"
              onClick={handleAccept}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              Chấp nhận
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowRejectDialog(true)}
              disabled={isLoading}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Từ chối
            </Button>
          </>
        )}

        {/* Convert - Only for ACCEPTED */}
        {quotation.status === "ACCEPTED" && !quotation.convertedToContractId && (
          <Button
            size="sm"
            onClick={handleConvert}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileCheck className="mr-2 h-4 w-4" />
            )}
            Chuyển thành hợp đồng
          </Button>
        )}

        {/* More Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Thêm
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleDownloadPDF}>
              <Download className="mr-2 h-4 w-4" />
              Tải PDF
            </DropdownMenuItem>
            {quotation.status === "DRAFT" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Xóa báo giá
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa báo giá</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa báo giá {quotation.quoteNumber}? Hành
              động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Từ chối báo giá</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn từ chối báo giá {quotation.quoteNumber}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Từ chối
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
