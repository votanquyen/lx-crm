/**
 * New Plant Type Page
 * Form for creating a new plant type
 */
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlantTypeForm } from "@/components/plant-types/plant-type-form";

export default async function NewPlantTypePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/plant-types">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Thêm loại cây mới</h1>
          <p className="text-muted-foreground">Tạo loại cây mới trong danh mục</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin loại cây</CardTitle>
          <CardDescription>Điền thông tin chi tiết về loại cây</CardDescription>
        </CardHeader>
        <CardContent>
          <PlantTypeForm />
        </CardContent>
      </Card>
    </div>
  );
}
