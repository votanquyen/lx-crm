/**
 * AI Response Panel for Dashboard Sticky Note
 * Displays matched customer, context, and suggestions
 */
"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Calendar, X, ChevronRight } from "lucide-react";
import { formatCurrencyDecimal } from "@/lib/db-utils";
import type { QuickNoteAIResponse } from "./types";

interface AIResponsePanelProps {
  response: QuickNoteAIResponse;
  onDismiss: () => void;
}

export function AIResponsePanel({ response, onDismiss }: AIResponsePanelProps) {
  const { matchedCustomer, customerContext, suggestions, entities, noMatchCompanies } = response;

  return (
    <Card className="relative border-blue-200 bg-blue-50/50 p-4">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6"
        onClick={onDismiss}
        aria-label="Đóng"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </Button>

      <div className="space-y-3">
        {/* Matched Customer */}
        {matchedCustomer && (
          <div className="flex items-start gap-2">
            <Building2 className="mt-0.5 h-4 w-4 text-blue-600" aria-hidden="true" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Link
                  href={`/customers/${matchedCustomer.id}`}
                  className="text-sm font-medium hover:underline"
                >
                  {matchedCustomer.companyName}
                </Link>
                <Badge variant="secondary" className="text-xs">
                  {Math.round(matchedCustomer.score * 100)}% match
                </Badge>
              </div>

              {customerContext && (
                <ul className="text-muted-foreground mt-1 space-y-0.5 text-xs">
                  <li>• Hợp đồng đang hoạt động: {customerContext.activeContracts}</li>
                  {customerContext.overdueInvoices > 0 && (
                    <li className="text-red-600">
                      • Hóa đơn quá hạn: {customerContext.overdueInvoices} (
                      {formatCurrencyDecimal(customerContext.totalDebt)})
                    </li>
                  )}
                  {customerContext.recentNotes > 0 && (
                    <li>• Ghi chú đang mở: {customerContext.recentNotes}</li>
                  )}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* No match warning */}
        {noMatchCompanies.length > 0 && (
          <div className="text-xs text-orange-600">
            Không tìm thấy: {noMatchCompanies.join(", ")}
          </div>
        )}

        {/* Extracted dates */}
        {entities.dates.length > 0 && (
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <Calendar className="h-3 w-3" aria-hidden="true" />
            Thời gian: {entities.dates.join(", ")}
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs font-medium">Đề xuất:</p>
            <ul className="space-y-1">
              {suggestions.map((s, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <span className="text-amber-500">•</span>
                  {s.link ? (
                    <Link href={s.link} className="flex items-center gap-1 hover:underline">
                      {s.action}
                      <ChevronRight className="h-3 w-3" aria-hidden="true" />
                    </Link>
                  ) : (
                    <span>{s.action}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}
