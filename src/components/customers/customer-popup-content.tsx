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
    <div className="min-w-[280px] space-y-3 p-3">
      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold">{companyName}</h3>
        <p className="text-muted-foreground text-xs">{code}</p>
      </div>

      {/* Details */}
      <div className="space-y-1.5 text-xs">
        <div className="flex items-start gap-2">
          <MapPin className="text-muted-foreground mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
          <span>
            {address}
            {district && `, ${district}`}
          </span>
        </div>
        {contactPhone && (
          <div className="flex items-center gap-2">
            <Phone className="text-muted-foreground h-3 w-3" aria-hidden="true" />
            <span>{contactPhone}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <TreeDeciduous className="text-muted-foreground h-3 w-3" aria-hidden="true" />
          <span>{plantCount} cây</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 border-t pt-2">
        <Button size="sm" variant="outline" className="flex-1 text-xs" asChild>
          <Link href={`/customers/${id}`}>
            <Building2 className="mr-1 h-3 w-3" aria-hidden="true" />
            Chi tiết
          </Link>
        </Button>
      </div>
    </div>
  );
}
