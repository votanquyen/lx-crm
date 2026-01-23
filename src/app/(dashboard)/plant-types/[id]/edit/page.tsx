/**
 * Edit Plant Type Page
 * Form for editing existing plant type
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPlantTypeById } from "@/actions/plant-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlantTypeForm } from "@/components/plant-types/plant-type-form";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditPlantTypePage({ params }: PageProps) {
  const { id } = await params;

  const plantType = await getPlantTypeById(id).catch(() => notFound());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/plant-types/${id}`}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Chỉnh sửa loại cây</h1>
          <p className="text-muted-foreground">
            {plantType.name} ({plantType.code})
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin loại cây</CardTitle>
          <CardDescription>Cập nhật thông tin chi tiết về loại cây</CardDescription>
        </CardHeader>
        <CardContent>
          <PlantTypeForm plantType={plantType} />
        </CardContent>
      </Card>
    </div>
  );
}
