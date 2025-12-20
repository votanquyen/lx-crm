/**
 * API Route: Download Morning Briefing PDF
 * GET /api/schedules/[id]/briefing
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateMorningBriefingPDF } from "@/lib/pdf/morning-briefing";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Fetch schedule with all details
    const schedule = await prisma.dailySchedule.findUnique({
      where: { id },
      include: {
        exchanges: {
          include: {
            customer: {
              select: {
                code: true,
                companyName: true,
                address: true,
                district: true,
                contactPhone: true,
              },
            },
          },
          orderBy: {
            stopOrder: "asc",
          },
        },
      },
    });

    if (!schedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }

    // Generate PDF
    const doc = generateMorningBriefingPDF(schedule);

    // Convert to buffer
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    // Return PDF with proper headers
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="lich-trinh-${schedule.scheduleDate.toISOString().split("T")[0]}.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
