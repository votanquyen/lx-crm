"use client";

/**
 * Data Import Page
 * Import data from Excel with AI-powered analysis
 */
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/import/file-upload";
import { ImportPreviewTable } from "@/components/import/import-preview-table";
import { ImportSummary } from "@/components/import/import-summary";
import {
  parseExcelFile,
  analyzeImportData,
  executeImport,
  rollbackImportBatch,
  type ImportType,
  type ParseResult,
  type AnalysisResult,
  type ImportResult,
} from "@/actions/data-import";
import type { RowStatus } from "@/lib/ai/import-analyzer";
import { Loader2, ArrowRight } from "lucide-react";

const IMPORT_TYPES: Array<{ value: ImportType; label: string; description: string }> = [
  { value: "customers", label: "Khách hàng", description: "Import danh sách khách hàng" },
  { value: "plants", label: "Cây thuê", description: "Import danh sách cây đang thuê" },
  { value: "bangke", label: "Bảng kê", description: "Import bảng kê hàng tháng" },
  { value: "invoices", label: "Hóa đơn", description: "Import lịch sử hóa đơn" },
  { value: "payments", label: "Thanh toán", description: "Import lịch sử thanh toán" },
];

export default function DataImportPage() {
  const [importType, setImportType] = useState<ImportType>("customers");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string>();

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setParseResult(null);
    setAnalysisResult(null);
    setError(undefined);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError(undefined);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("type", importType);

      const result = await parseExcelFile(formData);
      setParseResult(result);

      if (!result.success || !result.data) {
        setError(result.error || "Parse error");
        return;
      }

      // Run AI analysis
      const analysis = await analyzeImportData(result.data, importType);
      setAnalysisResult(analysis);
    } catch {
      setError("Lỗi khi phân tích file");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRowUpdate = (rowIndex: number, data: Record<string, unknown>) => {
    if (!analysisResult) return;
    setAnalysisResult({
      ...analysisResult,
      rows: analysisResult.rows.map((r) =>
        r.rowIndex === rowIndex ? { ...r, normalizedData: data } : r
      ),
    });
  };

  const handleRowStatusChange = (rowIndex: number, status: RowStatus) => {
    if (!analysisResult) return;
    setAnalysisResult({
      ...analysisResult,
      rows: analysisResult.rows.map((r) =>
        r.rowIndex === rowIndex ? { ...r, status } : r
      ),
    });
  };

  const handleImport = async (selectedRows: number[]) => {
    if (!analysisResult) return;

    setIsImporting(true);
    setError(undefined);

    try {
      // Filter to selected rows only
      const rowsToImport = analysisResult.rows.filter((r) =>
        selectedRows.includes(r.rowIndex)
      );

      const result = await executeImport(rowsToImport, importType);
      setImportResult(result);

      if (!result.success && result.errors.length > 0) {
        setError(result.errors[0]?.error ?? "Unknown error");
      }
    } catch {
      setError("Lỗi khi import dữ liệu");
    } finally {
      setIsImporting(false);
    }
  };

  const handleRollback = async () => {
    if (!importResult) return;

    setIsRollingBack(true);

    try {
      await rollbackImportBatch(importResult.batchId);
      // Reset to analysis state
      setImportResult(null);
    } catch {
      setError("Lỗi khi hoàn tác");
    } finally {
      setIsRollingBack(false);
    }
  };

  const handleClose = () => {
    // Reset all state
    setSelectedFile(null);
    setParseResult(null);
    setAnalysisResult(null);
    setImportResult(null);
    setError(undefined);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Import Dữ liệu từ Excel</h1>
        <p className="text-muted-foreground">
          Upload file Excel để import dữ liệu vào hệ thống với AI hỗ trợ
        </p>
      </div>

      {/* Step 1: Select File */}
      <Card>
        <CardHeader>
          <CardTitle>Bước 1: Chọn File</CardTitle>
          <CardDescription>Upload file Excel chứa dữ liệu cần import</CardDescription>
        </CardHeader>
        <CardContent>
          <FileUpload
            onFileSelect={handleFileSelect}
            isLoading={isLoading}
            error={error}
          />
        </CardContent>
      </Card>

      {/* Step 2: Select Import Type */}
      <Card>
        <CardHeader>
          <CardTitle>Bước 2: Loại Dữ liệu</CardTitle>
          <CardDescription>Chọn loại dữ liệu muốn import</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {IMPORT_TYPES.map((type) => (
              <Label
                key={type.value}
                className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-4 transition-colors hover:bg-accent ${
                  importType === type.value
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }`}
              >
                <input
                  type="radio"
                  name="importType"
                  value={type.value}
                  checked={importType === type.value}
                  onChange={(e) => setImportType(e.target.value as ImportType)}
                  className="sr-only"
                />
                <span className="font-medium">{type.label}</span>
                <span className="text-muted-foreground text-center text-xs">
                  {type.description}
                </span>
              </Label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Button */}
      {!analysisResult && (
        <div className="flex justify-end">
          <Button size="lg" onClick={handleAnalyze} disabled={!selectedFile || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang phân tích...
              </>
            ) : (
              <>
                Phân tích với AI
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}

      {/* Analysis Preview Table */}
      {analysisResult && !importResult && (
        <ImportPreviewTable
          rows={analysisResult.rows}
          importType={importType}
          onRowUpdate={handleRowUpdate}
          onRowStatusChange={handleRowStatusChange}
          onImport={handleImport}
          isImporting={isImporting}
        />
      )}

      {/* Import Summary */}
      {importResult && (
        <ImportSummary
          result={importResult}
          onRollback={handleRollback}
          onClose={handleClose}
          isRollingBack={isRollingBack}
        />
      )}

      {/* Raw Preview (before AI analysis) */}
      {parseResult?.success && parseResult.data && !analysisResult && (
        <Card>
          <CardHeader>
            <CardTitle>Xem trước dữ liệu thô</CardTitle>
            <CardDescription>
              File: {parseResult.data.filename} | Tổng: {parseResult.data.totalRows} dòng
              | Sheets: {parseResult.data.sheets.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted max-h-96 overflow-auto rounded p-4 text-sm">
              {JSON.stringify(parseResult.data.sheets[0]?.rows.slice(0, 5), null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
