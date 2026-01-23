/**
 * API Route: Generate and download Monthly Statement PDF
 * GET /api/statements/[id]/pdf
 *
 * Returns PDF with proper Content-Disposition header for correct filename
 */
import { NextRequest, NextResponse } from "next/server";
import { getMonthlyStatement } from "@/actions/monthly-statements";
import { generateMonthlyStatementPDF } from "@/lib/pdf/monthly-statement-pdf";
import { getStatementFilename } from "@/lib/csv/export-monthly-statement";
import { auth } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Fetch statement data
    const result = await getMonthlyStatement({ id });
    if (!result.success) {
      return NextResponse.json(
        { error: "success" in result && !result.success && "error" in result ? result.error : "Statement not found" },
        { status: 404 }
      );
    }

    if (!result.data) {
      return NextResponse.json(
        { error: "Statement not found" },
        { status: 404 }
      );
    }

    const statement = result.data;

    // Generate PDF
    const doc = generateMonthlyStatementPDF(statement);
    const pdfBuffer = doc.output("arraybuffer");

    // Generate filename
    const filename = getStatementFilename(
      statement.customer?.companyName || "company",
      statement.year,
      statement.month
    ).replace(".csv", ".pdf");

    // Return PDF with proper headers
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${encodeURIComponent(filename)}"`,
        "Content-Length": pdfBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
