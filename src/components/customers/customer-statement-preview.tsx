/**
 * Customer Statement Preview Component
 * Shows latest monthly statement preview
 */
import Link from "next/link";
import { FileText, ArrowRight, Check, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

type NumericValue = number | string | { toString(): string };

interface MonthlyStatement {
  id: string;
  month: number;
  year: number;
  needsConfirmation: boolean;
  confirmedAt: Date | null;
  total: NumericValue;
}

interface CustomerStatementPreviewProps {
  statements: MonthlyStatement[];
  customerId: string;
}

const monthNames = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];

export function CustomerStatementPreview({
  statements,
  customerId,
}: CustomerStatementPreviewProps) {
  if (statements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-5 w-5" />
            Bảng kê gần nhất
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            Chưa có bảng kê nào
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link href={`/bang-ke?customerId=${customerId}`}>
              Tạo bảng kê mới
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const statement = statements[0]!;
  const isConfirmed = !statement.needsConfirmation || statement.confirmedAt !== null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-5 w-5" />
          Bảng kê gần nhất
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-medium">
            {monthNames[statement.month - 1]} {statement.year}
          </span>
          {isConfirmed ? (
            <Badge variant="default" className="flex items-center gap-1">
              <Check className="h-3 w-3" />
              Đã xác nhận
            </Badge>
          ) : (
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Chờ xác nhận
            </Badge>
          )}
        </div>

        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tổng tiền:</span>
            <span className="font-medium">
              {formatCurrency(Number(statement.total))}
            </span>
          </div>
        </div>

        <Button asChild variant="outline" className="w-full" size="sm">
          <Link href={`/bang-ke/${statement.id}`}>
            Xem chi tiết
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
