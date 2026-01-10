"use client";

/**
 * ApiKeyCard - Card component for individual API key management
 * Features: status badge, masked input, test connection, save, help link
 */

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ApiKeyInput } from "./api-key-input";
import { upsertSetting, testApiKey } from "@/actions/settings";
import { Loader2, ExternalLink, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

/** Provider configuration for API key cards */
export interface ApiKeyProvider {
  id: "groq" | "openrouter" | "gemini" | "maps";
  name: string;
  keyName: string;
  helpUrl: string;
  description?: string;
}

interface ApiKeyCardProps {
  provider: ApiKeyProvider;
  currentValue?: string;
  isConfigured: boolean;
}

/**
 * Card for managing a single API key with:
 * - Status badge (connected/not configured)
 * - Masked input with reveal toggle
 * - Test connection button
 * - Save button
 * - Help link to provider dashboard
 */
export function ApiKeyCard({
  provider,
  currentValue,
  isConfigured,
}: ApiKeyCardProps) {
  const [value, setValue] = useState(currentValue ?? "");
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(
    null
  );

  // Handle test connection - calls testApiKey server action
  const handleTest = useCallback(async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await testApiKey(provider.id);
      if (result.success) {
        if (result.data.valid) {
          setTestResult("success");
          toast.success(result.data.message);
        } else {
          setTestResult("error");
          toast.error(result.data.message);
        }
      } else {
        setTestResult("error");
        toast.error(result.error ?? "Lỗi kiểm tra");
      }
    } catch {
      setTestResult("error");
      toast.error("Lỗi kết nối");
    } finally {
      setIsTesting(false);
    }
  }, [provider.id]);

  // Handle save - encrypts and stores key via upsertSetting
  const handleSave = useCallback(async () => {
    // Skip if empty or masked value
    if (!value || value.includes("****")) return;
    setIsSaving(true);
    try {
      const result = await upsertSetting({
        key: provider.keyName,
        value,
        category: "ai",
        isSensitive: true,
      });
      if (result.success) {
        toast.success(`Đã lưu ${provider.name}`);
        setTestResult(null); // Reset test result after save
      } else {
        toast.error(result.error ?? "Lỗi khi lưu");
      }
    } catch {
      toast.error("Lỗi hệ thống");
    } finally {
      setIsSaving(false);
    }
  }, [provider.keyName, provider.name, value]);

  // Parse hostname for help link display
  const getHostname = (url: string): string => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">{provider.name}</CardTitle>
        <Badge variant={isConfigured ? "default" : "secondary"}>
          {isConfigured ? "🟢 Đã kết nối" : "⚪ Chưa cấu hình"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Provider description */}
        {provider.description && (
          <p className="text-sm text-muted-foreground">
            {provider.description}
          </p>
        )}

        {/* API Key input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">API Key</label>
          <ApiKeyInput
            value={value}
            onChange={setValue}
            placeholder="Nhập API key..."
          />
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleTest}
            disabled={isTesting || !isConfigured}
          >
            {isTesting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : testResult === "success" ? (
              <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
            ) : testResult === "error" ? (
              <XCircle className="mr-2 h-4 w-4 text-red-500" />
            ) : null}
            Kiểm tra kết nối
          </Button>

          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Lưu
          </Button>
        </div>

        {/* Help link */}
        <a
          href={provider.helpUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-sm text-blue-600 hover:underline"
        >
          <ExternalLink className="mr-1 h-3 w-3" />
          Lấy API key tại {getHostname(provider.helpUrl)}
        </a>
      </CardContent>
    </Card>
  );
}
