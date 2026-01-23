/**
 * Admin Settings Page
 * System configuration management (ADMIN only)
 */
import { Suspense } from "react";
import { getAllSettings } from "@/actions/settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { SettingsForm } from "./_components/settings-form";
import { ApiKeysSection } from "./_components/api-keys-section";

const CATEGORIES = [
  { key: "general", label: "Chung", description: "Thông tin cơ bản của hệ thống" },
  { key: "ai", label: "AI / API", description: "Cấu hình AI và API keys" },
  { key: "notification", label: "Thông báo", description: "Cài đặt email và thông báo" },
  { key: "integration", label: "Tích hợp", description: "Kết nối với dịch vụ bên ngoài" },
];

export default async function SettingsPage() {
  const settings = await getAllSettings();

  // Group settings by category
  const grouped = settings.reduce(
    (acc, s) => {
      const cat = s.category ?? "general";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(s);
      return acc;
    },
    {} as Record<string, typeof settings>
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cài đặt Hệ thống</h1>
        <p className="text-muted-foreground">Quản lý cấu hình và API keys (Chỉ dành cho Admin)</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          {CATEGORIES.map((c) => (
            <TabsTrigger key={c.key} value={c.key}>
              {c.label} ({grouped[c.key]?.length ?? 0})
            </TabsTrigger>
          ))}
        </TabsList>

        {CATEGORIES.map((c) => (
          <TabsContent key={c.key} value={c.key}>
            <Card>
              <CardHeader>
                <CardTitle>{c.label}</CardTitle>
                <CardDescription>{c.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<Skeleton className="h-48" />}>
                  {c.key === "ai" ? (
                    <ApiKeysSection settings={grouped[c.key] ?? []} />
                  ) : (
                    <SettingsForm settings={grouped[c.key] ?? []} category={c.key} />
                  )}
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
