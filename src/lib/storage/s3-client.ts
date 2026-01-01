/**
 * MinIO S3 Storage Client
 * S3-compatible storage for photos and files
 * Supports external MinIO hosting (different server than VPS)
 */
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// MinIO configuration from environment
// Supports external hosting with full URL
const endpoint = process.env.MINIO_ENDPOINT || "http://localhost:9000";
const useSSL = process.env.MINIO_USE_SSL === "true";

const s3Client = new S3Client({
  endpoint,
  region: process.env.MINIO_REGION || "us-east-1", // MinIO doesn't use regions but SDK requires it
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || "minioadmin",
    secretAccessKey: process.env.MINIO_SECRET_KEY || "minioadmin",
  },
  forcePathStyle: true, // Required for MinIO
  tls: useSSL,
});

const BUCKET = process.env.MINIO_BUCKET || "locxanh-photos";
const PUBLIC_URL = process.env.MINIO_PUBLIC_URL; // External URL for public access

/**
 * Upload a file to MinIO
 * @param file - File buffer or stream
 * @param key - S3 object key (path/filename)
 * @param contentType - MIME type
 * @returns Public URL (external MinIO host) or presigned URL
 */
export async function uploadToS3(
  file: Buffer | Uint8Array,
  key: string,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: file,
    ContentType: contentType,
    // ACL: "public-read", // Optional: make objects publicly readable
  });

  await s3Client.send(command);

  // Return public URL if configured (for external MinIO)
  if (PUBLIC_URL) {
    return `${PUBLIC_URL}/${key}`;
  }

  // Generate presigned URL (expires in 7 days) for private access
  const getCommand = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  return await getSignedUrl(s3Client, getCommand, { expiresIn: 604800 });
}

/**
 * Generate a unique file key with timestamp
 * @param filename - Original filename
 * @param prefix - Optional prefix (e.g., "care", "exchange")
 * @returns Unique S3 key
 */
export function generateFileKey(filename: string, prefix?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = filename.split(".").pop() ?? "bin";
  const sanitizedName = (filename.split(".")[0] ?? "file").replace(/[^a-zA-Z0-9-_]/g, "_");
  const baseName = prefix
    ? `${prefix}/${timestamp}-${random}-${sanitizedName}`
    : `${timestamp}-${random}-${sanitizedName}`;
  return `${baseName}.${ext}`;
}

/**
 * Upload care schedule photo
 */
export async function uploadCarePhoto(file: Buffer, filename: string): Promise<string> {
  const key = generateFileKey(filename, "care");
  return await uploadToS3(file, key, "image/jpeg");
}

/**
 * Upload exchange photo
 */
export async function uploadExchangePhoto(file: Buffer, filename: string): Promise<string> {
  const key = generateFileKey(filename, "exchange");
  return await uploadToS3(file, key, "image/jpeg");
}
