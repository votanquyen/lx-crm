/**
 * API Route: Download Quotation PDF
 * GET /api/quotations/[id]/pdf
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateQuotationPDF, type QuotationPDFData } from "@/lib/pdf/quotation-pdf";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Authentication check
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Fetch quotation with all details
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            code: true,
            companyName: true,
            address: true,
            contactPhone: true,
            contactEmail: true,
            taxCode: true,
          },
        },
        createdBy: {
          select: {
            name: true,
          },
        },
        items: {
          include: {
            plantType: {
              select: {
                code: true,
                name: true,
                description: true,
              },
            },
          },
          orderBy: {
            id: "asc",
          },
        },
      },
    });

    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    // Transform to PDF data structure
    const pdfData: QuotationPDFData = {
      quoteNumber: quotation.quoteNumber,
      title: quotation.title,
      validFrom: quotation.validFrom,
      validUntil: quotation.validUntil,
      notes: quotation.notes,
      customer: {
        code: quotation.customer.code,
        companyName: quotation.customer.companyName,
        address: quotation.customer.address,
        contactPhone: quotation.customer.contactPhone,
        contactEmail: quotation.customer.contactEmail,
        taxCode: quotation.customer.taxCode,
      },
      createdBy: quotation.createdBy
        ? {
            name: quotation.createdBy.name,
          }
        : null,
      items: quotation.items.map((item) => ({
        plantType: {
          code: item.plantType.code,
          name: item.plantType.name,
          description: item.plantType.description,
        },
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        discountRate: Number(item.discountRate),
        totalPrice: Number(item.totalPrice),
        notes: item.notes,
      })),
      subtotal: Number(quotation.subtotal),
      discountRate: Number(quotation.discountRate),
      discountAmount: Number(quotation.discountAmount),
      vatRate: Number(quotation.vatRate),
      vatAmount: Number(quotation.vatAmount),
      totalAmount: Number(quotation.totalAmount),
    };

    // Generate PDF
    const doc = generateQuotationPDF(pdfData);

    // Convert to buffer
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    // Return PDF response
    const filename = `${quotation.quoteNumber}.pdf`;
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error generating quotation PDF:", error);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
