"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ApiKeyInput } from "./api-key-input";
import { upsertSetting, deleteSetting, testApiKey } from "@/actions/settings";
import { Loader2, Plus, Trash2, Save, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface Setting {
  key: string;
  value: unknown;
  description: string | null;
  isSensitive?: boolean;
}

interface SettingsFormProps {
  settings: Setting[];
  category: string;
}

export function SettingsForm({ settings, category }: SettingsFormProps) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(settings.map((s) => [s.key, String(s.value ?? "")]))
  );
  const [saving, setSaving] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  const handleSave = async (key: string, isSensitive: boolean) => {
    setSaving(key);
    try {
      const result = await upsertSetting({
        key,
        value: values[key],
        category,
        isSensitive,
      });
      if (result.success) {
        toast.success(`Đã lưu ${key}`);
      } else {
        toast.error(result.error ?? "Lỗi khi lưu");
      }
    } catch {
      toast.error("Có lỗi xảy ra");
    } finally {
      setSaving(null);
    }
  };

  const handleTest = async (key: string) => {
    setTesting(key);
    try {
      // Map key to provider
      const providerMap: Record<string, "groq" | "openrouter" | "gemini"> = {
        GROQ_API_KEY: "groq",
        OPENROUTER_API_KEY: "openrouter",
        GOOGLE_AI_API_KEY: "gemini",
      };
      const provider = providerMap[key];
      if (!provider) {
        toast.error("Không hỗ trợ kiểm tra key này");
        return;
      }

      const result = await testApiKey(provider);
      if (result.success && result.data) {
        if (result.data.valid) {
          toast.success(result.data.message);
        } else {
          toast.error(result.data.message);
        }
      } else if (!result.success) {
        toast.error(result.error ?? "Lỗi kiểm tra");
      }
    } finally {
      setTesting(null);
    }
  };

  const handleAdd = async () => {
    if (!newKey.trim()) return;
    setSaving("new");
    try {
      const result = await upsertSetting({
        key: newKey.toUpperCase().replace(/\s+/g, "_"),
        value: newValue,
        category,
      });
      if (result.success) {
        toast.success("Đã thêm cài đặt mới");
        setNewKey("");
        setNewValue("");
      } else {
        toast.error(result.error ?? "Lỗi khi thêm");
      }
    } catch {
      toast.error("Có lỗi xảy ra");
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = async (key: string) => {
    if (!confirm(`Xóa cài đặt ${key}?`)) return;
    setSaving(key);
    try {
      const result = await deleteSetting(key);
      if (result.success) {
        toast.success("Đã xóa");
      } else {
        toast.error(result.error ?? "Lỗi khi xóa");
      }
    } catch {
      toast.error("Có lỗi xảy ra");
    } finally {
      setSaving(null);
    }
  };

  // Check if this is a testable API key
  const isTestableKey = (key: string) =>
    ["GROQ_API_KEY", "OPENROUTER_API_KEY", "GOOGLE_AI_API_KEY"].includes(key);

  if (settings.length === 0) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground text-sm">Chưa có cài đặt nào trong danh mục này.</p>
        <AddSettingForm
          newKey={newKey}
          newValue={newValue}
          saving={saving}
          onKeyChange={setNewKey}
          onValueChange={setNewValue}
          onAdd={handleAdd}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Existing settings */}
      {settings.map((setting) => (
        <div key={setting.key} className="flex items-end gap-4">
          <div className="flex-1 space-y-2">
            <Label htmlFor={setting.key}>
              {setting.key}
              {setting.description && (
                <span className="text-muted-foreground ml-2 text-xs">({setting.description})</span>
              )}
            </Label>
            {setting.isSensitive ? (
              <ApiKeyInput
                value={values[setting.key] ?? ""}
                onChange={(v) => setValues({ ...values, [setting.key]: v })}
                placeholder="Nhập API key mới..."
              />
            ) : typeof setting.value === "boolean" ||
              values[setting.key] === "true" ||
              values[setting.key] === "false" ? (
              <Switch
                checked={values[setting.key] === "true"}
                onCheckedChange={(c) => setValues({ ...values, [setting.key]: String(c) })}
              />
            ) : (
              <Input
                id={setting.key}
                value={values[setting.key] ?? ""}
                onChange={(e) => setValues({ ...values, [setting.key]: e.target.value })}
              />
            )}
          </div>

          {/* Test button for API keys */}
          {isTestableKey(setting.key) && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleTest(setting.key)}
              disabled={testing === setting.key}
              title="Kiểm tra kết nối"
            >
              {testing === setting.key ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <CheckCircle className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
          )}

          <Button
            variant="outline"
            size="icon"
            onClick={() => handleSave(setting.key, setting.isSensitive ?? false)}
            disabled={saving === setting.key}
            title="Lưu"
            aria-label="Lưu"
          >
            {saving === setting.key ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(setting.key)}
            disabled={saving === setting.key}
            title="Xóa"
            aria-label="Xóa"
          >
            <Trash2 className="text-destructive h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      ))}

      {/* Add new setting */}
      <AddSettingForm
        newKey={newKey}
        newValue={newValue}
        saving={saving}
        onKeyChange={setNewKey}
        onValueChange={setNewValue}
        onAdd={handleAdd}
      />
    </div>
  );
}

interface AddSettingFormProps {
  newKey: string;
  newValue: string;
  saving: string | null;
  onKeyChange: (value: string) => void;
  onValueChange: (value: string) => void;
  onAdd: () => void;
}

function AddSettingForm({
  newKey,
  newValue,
  saving,
  onKeyChange,
  onValueChange,
  onAdd,
}: AddSettingFormProps) {
  return (
    <div className="border-t pt-4">
      <Label className="text-sm font-medium">Thêm cài đặt mới</Label>
      <div className="mt-2 flex items-end gap-4">
        <div className="flex-1 space-y-2">
          <Input
            placeholder="KEY_NAME"
            value={newKey}
            onChange={(e) => onKeyChange(e.target.value)}
          />
        </div>
        <div className="flex-1 space-y-2">
          <Input
            placeholder="Giá trị"
            value={newValue}
            onChange={(e) => onValueChange(e.target.value)}
          />
        </div>
        <Button onClick={onAdd} disabled={saving === "new"}>
          {saving === "new" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          )}
          Thêm
        </Button>
      </div>
    </div>
  );
}
