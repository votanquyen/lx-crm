/**
 * SmartVAS Webhook API Endpoint
 * Receives invoice data from n8n workflow parsing SmartVAS emails
 */
import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { normalizeVietnamese } from "@/lib/utils";
import { smartvasWebhookSchema } from "@/lib/validations/smartvas-webhook";

const SMARTVAS_API_KEY = process.env.SMARTVAS_API_KEY;

/**
 * Constant-time string comparison to prevent timing attacks
 */
function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate with timing-safe comparison
    const apiKey = req.headers.get("X-API-Key");
    if (!SMARTVAS_API_KEY || !apiKey || !secureCompare(apiKey, SMARTVAS_API_KEY)) {
      console.warn("[SmartVAS Webhook] Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse & validate
    const body = await req.json();
    const data = smartvasWebhookSchema.parse(body);

    console.log("[SmartVAS Webhook] Received:", {
      invoiceNumber: data.invoiceNumber,
      serialNumber: data.serialNumber,
      customerTaxCode: data.customerTaxCode ? `***${data.customerTaxCode.slice(-4)}` : null,
      companyName: data.companyName,
    });

    // 3. Find customer
    let customer = null;

    // Priority 1: Tax code match
    if (data.customerTaxCode) {
      customer = await prisma.customer.findFirst({
        where: {
          taxCode: data.customerTaxCode,
          status: { not: "TERMINATED" },
        },
      });
    }

    // Priority 2: Company name fuzzy match using pg_trgm
    if (!customer && data.companyName) {
      const normalized = normalizeVietnamese(data.companyName);
      // SAFE: Prisma's $queryRaw template literal auto-parameterizes inputs
      const results = await prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM customers
        WHERE status != 'TERMINATED'
          AND "companyNameNorm" % ${normalized}
        ORDER BY similarity("companyNameNorm", ${normalized}) DESC
        LIMIT 1
      `;
      if (results.length > 0 && results[0]) {
        customer = await prisma.customer.findUnique({
          where: { id: results[0].id },
        });
      }
    }

    if (!customer) {
      console.warn("[SmartVAS Webhook] Customer not found:", {
        taxCode: data.customerTaxCode,
        companyName: data.companyName,
      });
      // Limited information in response to prevent data leakage
      return NextResponse.json(
        {
          success: false,
          error: "Customer not matched",
        },
        { status: 404 }
      );
    }

    // 4. Check for existing invoice by SmartVAS number (idempotent)
    let invoice = await prisma.invoice.findFirst({
      where: {
        smartvasInvoiceNumber: data.invoiceNumber,
        smartvasSerialNumber: data.serialNumber,
      },
    });

    if (invoice) {
      // Update existing invoice
      invoice = await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          smartvasIssueDate: data.issueDate,
          smartvasPdfUrl: data.pdfUrl,
          smartvasXmlUrl: data.xmlUrl,
          customerTaxCode: data.customerTaxCode,
        },
      });

      console.log("[SmartVAS Webhook] Updated existing invoice:", invoice.id);
      return NextResponse.json({
        success: true,
        action: "updated",
        invoiceId: invoice.id,
        customerId: customer.id,
      });
    }

    // 5. Find pending invoice for this customer (from bảng kê)
    // Match by customer + approximate amount + recent date
    const pendingInvoice = await prisma.invoice.findFirst({
      where: {
        customerId: customer.id,
        status: { in: ["DRAFT", "SENT"] },
        smartvasInvoiceNumber: null, // Not yet linked
        totalAmount: {
          gte: data.totalAmount - 1000, // Allow small variance
          lte: data.totalAmount + 1000,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (pendingInvoice) {
      // Link SmartVAS data to existing invoice
      invoice = await prisma.invoice.update({
        where: { id: pendingInvoice.id },
        data: {
          smartvasInvoiceNumber: data.invoiceNumber,
          smartvasSerialNumber: data.serialNumber,
          smartvasIssueDate: data.issueDate,
          smartvasPdfUrl: data.pdfUrl,
          smartvasXmlUrl: data.xmlUrl,
          customerTaxCode: data.customerTaxCode,
          status: "SENT", // Mark as officially issued
        },
      });

      console.log("[SmartVAS Webhook] Linked to invoice:", invoice.id);
      return NextResponse.json({
        success: true,
        action: "linked",
        invoiceId: invoice.id,
        customerId: customer.id,
      });
    }

    // 6. No matching invoice - return for manual linking
    // Only return minimal info needed for n8n to log the issue
    console.warn("[SmartVAS Webhook] No matching invoice found for customer:", customer.id);
    return NextResponse.json(
      {
        success: false,
        error: "No matching pending invoice found",
        customerId: customer.id,
      },
      { status: 404 }
    );
  } catch (error) {
    console.error("[SmartVAS Webhook Error]", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
