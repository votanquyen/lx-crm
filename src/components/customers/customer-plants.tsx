/**
 * Customer Plants Component
 * Display list of plants at customer location
 */
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import type { PlantStatus } from "@prisma/client";

type PlantCondition = "EXCELLENT" | "GOOD" | "FAIR" | "POOR" | "DEAD";

interface CustomerPlant {
  id: string;
  quantity: number;
  location: string | null;
  position: string | null;
  condition: PlantCondition;
  status: PlantStatus;
  installedAt: Date;
  lastExchanged: Date | null;
  plantType: {
    name: string;
    scientificName: string | null;
  };
}

interface CustomerPlantsProps {
  plants: CustomerPlant[];
}

const conditionConfig: Record<
  PlantCondition,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  EXCELLENT: { label: "Tốt", variant: "default" },
  GOOD: { label: "Khá", variant: "default" },
  FAIR: { label: "Trung bình", variant: "secondary" },
  POOR: { label: "Yếu", variant: "outline" },
  DEAD: { label: "Chết", variant: "destructive" },
};

const statusConfig: Record<
  PlantStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  ACTIVE: { label: "Đang thuê", variant: "default" },
  REMOVED: { label: "Đã gỡ", variant: "secondary" },
  REPLACED: { label: "Đã thay thế", variant: "outline" },
};

export function CustomerPlants({ plants }: CustomerPlantsProps) {
  if (plants.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cây xanh</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Khách hàng chưa có cây xanh nào
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalPlants = plants.reduce((sum, p) => sum + p.quantity, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cây xanh ({totalPlants} cây)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Loại cây</TableHead>
                <TableHead>SL</TableHead>
                <TableHead>Vị trí</TableHead>
                <TableHead>Tình trạng</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Đổi lần cuối</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plants.map((plant) => {
                const condition = conditionConfig[plant.condition];
                const status = statusConfig[plant.status];
                return (
                  <TableRow key={plant.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{plant.plantType.name}</p>
                        {plant.plantType.scientificName && (
                          <p className="text-muted-foreground text-xs italic">
                            {plant.plantType.scientificName}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{plant.quantity}</TableCell>
                    <TableCell>
                      {plant.location || plant.position || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={condition.variant}>{condition.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {plant.lastExchanged ? formatDate(plant.lastExchanged) : "-"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
