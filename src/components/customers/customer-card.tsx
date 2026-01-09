/**
 * Customer Card Component
 * Display customer info in a compact card/row format
 */
import Link from "next/link";
import { MapPin, Phone, Mail, Leaf, FileText, StickyNote, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { CustomerStatus } from "@prisma/client";

interface CustomerCardProps {
  customer: {
    id: string;
    code: string;
    companyName: string;
    address: string;
    district: string | null;
    contactName: string | null;
    contactPhone: string | null;
    contactEmail: string | null;
    status: CustomerStatus;
    _count?: {
      customerPlants: number;
      stickyNotes: number;
      contracts: number;
    };
  };
}

const statusConfig: Record<
  CustomerStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  LEAD: { label: "Tiềm năng", variant: "secondary" },
  ACTIVE: { label: "Hoạt động", variant: "default" },
  INACTIVE: { label: "Ngưng", variant: "outline" },
  TERMINATED: { label: "Đã xóa", variant: "destructive" },
};

export function CustomerCard({ customer }: CustomerCardProps) {
  const status = statusConfig[customer.status];

  return (
    <div className="group bg-card hover:bg-accent/50 flex items-center gap-4 rounded-lg border p-4 transition-colors">
      {/* Company icon */}
      <div className="bg-muted text-muted-foreground flex h-10 w-10 items-center justify-center rounded-full">
        <Building2 className="h-5 w-5" />
      </div>

      {/* Main info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link
            href={`/customers/${customer.id}`}
            className="text-foreground truncate font-medium hover:underline"
          >
            {customer.companyName}
          </Link>
          <Badge variant="outline" className="shrink-0">
            {customer.code}
          </Badge>
          <Badge variant={status.variant} className="shrink-0">
            {status.label}
          </Badge>
        </div>

        <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            <span className="max-w-[200px] truncate">{customer.address}</span>
            {customer.district && <span className="text-xs">({customer.district})</span>}
          </span>
          {customer.contactPhone && (
            <span className="flex items-center gap-1">
              <Phone className="h-3.5 w-3.5" />
              {customer.contactPhone}
            </span>
          )}
          {customer.contactEmail && (
            <span className="flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" />
              <span className="max-w-[150px] truncate">{customer.contactEmail}</span>
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      {customer._count && (
        <div className="text-muted-foreground hidden items-center gap-4 text-sm md:flex">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center gap-1">
                  <Leaf className="h-4 w-4" />
                  {customer._count.customerPlants}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{customer._count.customerPlants} cây</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {customer._count.contracts}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{customer._count.contracts} hợp đồng hoạt động</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {customer._count.stickyNotes > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1 text-amber-500">
                    <StickyNote className="h-4 w-4" />
                    {customer._count.stickyNotes}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{customer._count.stickyNotes} ghi chú cần xử lý</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/customers/${customer.id}`}>Xem</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/customers/${customer.id}/edit`}>Sửa</Link>
        </Button>
      </div>
    </div>
  );
}
