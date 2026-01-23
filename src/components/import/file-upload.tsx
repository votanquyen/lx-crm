"use client";

/**
 * File Upload Component for Excel Import
 * Drag-drop zone with file type validation
 */
import { useState, useCallback } from "react";
import { Upload, FileSpreadsheet, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
  error?: string;
}

export function FileUpload({ onFileSelect, isLoading, error }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const files = e.dataTransfer.files;
      if (files?.[0]) {
        setSelectedFile(files[0]);
        onFileSelect(files[0]);
      }
    },
    [onFileSelect]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files?.[0]) {
        setSelectedFile(files[0]);
        onFileSelect(files[0]);
      }
    },
    [onFileSelect]
  );

  const clearFile = () => {
    setSelectedFile(null);
  };

  return (
    <Card
      className={cn(
        "relative border-2 border-dashed p-8 text-center transition-colors",
        dragActive && "border-primary bg-primary/5",
        error && "border-destructive"
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      {selectedFile ? (
        <div className="flex items-center justify-center gap-4">
          <FileSpreadsheet className="h-10 w-10 text-green-600" aria-hidden="true" />
          <div className="text-left">
            <p className="font-medium">{selectedFile.name}</p>
            <p className="text-muted-foreground text-sm">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={clearFile} aria-label="Xóa file">
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      ) : (
        <>
          <Upload className="text-muted-foreground mx-auto h-12 w-12" aria-hidden="true" />
          <p className="mt-4 text-lg font-medium">Kéo thả file Excel vào đây</p>
          <p className="text-muted-foreground text-sm">hoặc click để chọn file</p>
          <p className="text-muted-foreground mt-2 text-xs">Hỗ trợ: .xlsx, .xls (tối đa 10MB)</p>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleChange}
            className="absolute inset-0 cursor-pointer opacity-0"
            disabled={isLoading}
          />
        </>
      )}

      {error && (
        <div className="text-destructive mt-4 flex items-center justify-center gap-2">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <span className="text-sm">{error}</span>
        </div>
      )}
    </Card>
  );
}
