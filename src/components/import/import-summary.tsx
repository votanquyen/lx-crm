"use client";

/**
 * Import Summary Component
 * Shows import results with stats and rollback option
 */
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertTriangle, RotateCcw } from "lucide-react";
import type { ImportResult } from "@/lib/import/customer-importer";

interface ImportSummaryProps {
  result: ImportResult;
  onRollback: () => void;
  onClose: () => void;
  isRollingBack?: boolean;
}

export function ImportSummary({
  result,
  onRollback,
  onClose,
  isRollingBack,
}: ImportSummaryProps) {
  const total = result.imported + result.merged + result.skipped + result.errors.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {result.success ? (
            <>
              <CheckCircle className="h-6 w-6 text-green-500" />
              Import thành công
            </>
          ) : (
            <>
              <XCircle className="h-6 w-6 text-red-500" />
              Import thất bại
            </>
          )}
        </CardTitle>
        <CardDescription>Batch ID: {result.batchId}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4">
          <StatBox
            label="Tạo mới"
            value={result.imported}
            icon={<CheckCircle className="h-5 w-5 text-green-500" />}
            color="green"
          />
          <StatBox
            label="Merge"
            value={result.merged}
            icon={<CheckCircle className="h-5 w-5 text-blue-500" />}
            color="blue"
          />
          <StatBox
            label="Bỏ qua"
            value={result.skipped}
            icon={<AlertTriangle className="h-5 w-5 text-yellow-500" />}
            color="yellow"
          />
          <StatBox
            label="Lỗi"
            value={result.errors.length}
            icon={<XCircle className="h-5 w-5 text-red-500" />}
            color="red"
          />
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Tiến độ</span>
            <span>
              {result.imported + result.merged} / {total}
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-gray-200">
            <div className="flex h-full">
              <div
                className="bg-green-500"
                style={{ width: `${(result.imported / total) * 100}%` }}
              />
              <div
                className="bg-blue-500"
                style={{ width: `${(result.merged / total) * 100}%` }}
              />
              <div
                className="bg-yellow-500"
                style={{ width: `${(result.skipped / total) * 100}%` }}
              />
              <div
                className="bg-red-500"
                style={{ width: `${(result.errors.length / total) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Error List */}
        {result.errors.length > 0 && (
          <div className="rounded border border-red-200 bg-red-50 p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="font-medium text-red-800">
                Có {result.errors.length} lỗi
              </span>
            </div>
            <ul className="mt-2 list-inside list-disc text-sm text-red-700">
              {result.errors.slice(0, 5).map((err, i) => (
                <li key={i}>
                  Dòng #{err.rowIndex}: {err.error}
                </li>
              ))}
              {result.errors.length > 5 && (
                <li>...và {result.errors.length - 5} lỗi khác</li>
              )}
            </ul>
          </div>
        )}

        {/* Created IDs */}
        {result.createdIds.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium">ID khách hàng mới:</p>
            <div className="flex flex-wrap gap-1">
              {result.createdIds.slice(0, 10).map((id) => (
                <Badge key={id} variant="outline">
                  {id.slice(0, 8)}...
                </Badge>
              ))}
              {result.createdIds.length > 10 && (
                <Badge variant="secondary">+{result.createdIds.length - 10}</Badge>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between border-t pt-4">
          <Button variant="outline" onClick={onRollback} disabled={isRollingBack}>
            <RotateCcw className="mr-2 h-4 w-4" />
            {isRollingBack ? "Đang hoàn tác..." : "Hoàn tác (Rollback)"}
          </Button>
          <Button onClick={onClose}>Hoàn tất</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function StatBox({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    green: "bg-green-50 border-green-200",
    blue: "bg-blue-50 border-blue-200",
    yellow: "bg-yellow-50 border-yellow-200",
    red: "bg-red-50 border-red-200",
  };

  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        {icon}
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <p className="text-muted-foreground mt-1 text-sm">{label}</p>
    </div>
  );
}
