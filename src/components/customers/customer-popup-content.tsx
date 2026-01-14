/**
 * Customer Popup Content
 * Displays customer info in map popup with Shadcn styling
 */
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Building2, TreeDeciduous } from "lucide-react";

interface CustomerPopupProps {
  id: string;
  code: string;
  companyName: string;
  address: string;
  district: string;
  contactPhone: string | null;
  plantCount: number;
}

export function CustomerPopupContent({
  id,
  code,
  companyName,
  address,
  district,
  contactPhone,
  plantCount,
}: CustomerPopupProps) {
  return (
    <div className="p-3 space-y-3 min-w-[280px]">
      {/* Header */}
      <div>
        <h3 className="font-semibold text-sm">{companyName}</h3>
        <p className="text-xs text-muted-foreground">{code}</p>
      </div>

      {/* Details */}
      <div className="space-y-1.5 text-xs">
        <div className="flex items-start gap-2">
          <MapPin className="h-3 w-3 mt-0.5 text-muted-foreground shrink-0" />
          <span>
            {address}
            {district && `, ${district}`}
          </span>
        </div>
        {contactPhone && (
          <div className="flex items-center gap-2">
            <Phone className="h-3 w-3 text-muted-foreground" />
            <span>{contactPhone}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <TreeDeciduous className="h-3 w-3 text-muted-foreground" />
          <span>{plantCount} cây</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t">
        <Button size="sm" variant="outline" className="flex-1 text-xs" asChild>
          <Link href={`/customers/${id}`}>
            <Building2 className="h-3 w-3 mr-1" />
            Chi tiết
          </Link>
        </Button>
      </div>
    </div>
  );
}
