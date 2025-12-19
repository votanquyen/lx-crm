/**
 * File Upload API Route
 * Handles photo uploads to MinIO S3
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadCarePhoto, uploadExchangePhoto } from "@/lib/storage/s3-client";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only images are allowed" }, { status: 400 });
    }

    // Validate file size (max 30MB)
    if (file.size > 30 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 30MB)" }, { status: 400 });
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload based on type
    let url: string;
    if (type === "care") {
      url = await uploadCarePhoto(buffer, file.name);
    } else if (type === "exchange") {
      url = await uploadExchangePhoto(buffer, file.name);
    } else {
      return NextResponse.json({ error: "Invalid upload type" }, { status: 400 });
    }

    return NextResponse.json({ url, success: true });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// Configure max file size (30MB for images)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "30mb",
    },
  },
};
