/**
 * Test MinIO S3 Photo Upload
 * Verifies S3 connection, upload, and public URL access
 */
import { S3Client, ListBucketsCommand, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { uploadToS3, uploadCarePhoto, generateFileKey } from "../src/lib/storage/s3-client";
import * as fs from "fs";
import * as path from "path";

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

const log = {
  success: (msg: string) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg: string) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg: string) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  section: (msg: string) => console.log(`\n${colors.blue}=== ${msg} ===${colors.reset}\n`),
};

// Configuration
const endpoint = process.env.MINIO_ENDPOINT || "http://localhost:9000";
const useSSL = process.env.MINIO_USE_SSL === "true";
const accessKey = process.env.MINIO_ACCESS_KEY || "minioadmin";
const secretKey = process.env.MINIO_SECRET_KEY || "minioadmin";
const bucket = process.env.MINIO_BUCKET || "locxanh-photos";
const publicUrl = process.env.MINIO_PUBLIC_URL;

// Create S3 client
const s3Client = new S3Client({
  endpoint,
  region: process.env.MINIO_REGION || "us-east-1",
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretKey,
  },
  forcePathStyle: true,
  tls: useSSL,
});

/**
 * Test 1: Connection
 */
async function testConnection() {
  log.section("Test 1: Connection");
  try {
    const command = new ListBucketsCommand({});
    const response = await s3Client.send(command);

    log.success("MinIO connection successful");
    log.info(`Endpoint: ${endpoint}`);
    log.info(`SSL: ${useSSL ? "Enabled" : "Disabled"}`);
    log.info(`Buckets found: ${response.Buckets?.length || 0}`);

    if (response.Buckets && response.Buckets.length > 0) {
      response.Buckets.forEach((bucket) => {
        console.log(`  - ${bucket.Name}`);
      });
    }

    // Check if our bucket exists
    const hasBucket = response.Buckets?.some((b) => b.Name === bucket);
    if (hasBucket) {
      log.success(`Bucket "${bucket}" exists`);
    } else {
      log.error(`Bucket "${bucket}" not found`);
      log.warning("Please create the bucket in MinIO console");
    }

    return true;
  } catch (error) {
    log.error("Connection failed");
    console.error(error);
    return false;
  }
}

/**
 * Test 2: Upload Test Image
 */
async function testUpload() {
  log.section("Test 2: Upload Test Image");
  try {
    // Create a test image (1x1 pixel red PNG)
    const testImageBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==",
      "base64"
    );

    const filename = "test-upload.png";
    const key = generateFileKey(filename, "test");

    log.info(`Uploading test image: ${key}`);

    const url = await uploadToS3(testImageBuffer, key, "image/png");

    log.success("Upload successful");
    log.info(`URL: ${url}`);

    return { key, url };
  } catch (error) {
    log.error("Upload failed");
    console.error(error);
    return null;
  }
}

/**
 * Test 3: Public URL Access
 */
async function testPublicAccess(url: string) {
  log.section("Test 3: Public URL Access");
  try {
    log.info(`Testing URL: ${url}`);

    const response = await fetch(url);

    if (response.ok) {
      log.success("Public URL accessible");
      log.info(`Status: ${response.status} ${response.statusText}`);
      log.info(`Content-Type: ${response.headers.get("content-type")}`);
      log.info(`Content-Length: ${response.headers.get("content-length")} bytes`);
      return true;
    } else {
      log.error(`Public URL returned: ${response.status} ${response.statusText}`);
      log.warning("Check bucket policy - photos should be publicly readable");
      return false;
    }
  } catch (error) {
    log.error("Public URL access failed");
    console.error(error);
    return false;
  }
}

/**
 * Test 4: Care Photo Upload (Real Workflow)
 */
async function testCarePhotoUpload() {
  log.section("Test 4: Care Photo Upload Workflow");
  try {
    // Create a test image
    const testImageBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==",
      "base64"
    );

    const filename = "care-test.jpg";

    log.info("Using uploadCarePhoto() function...");

    const url = await uploadCarePhoto(testImageBuffer, filename);

    log.success("Care photo upload successful");
    log.info(`URL: ${url}`);

    // Test access
    const response = await fetch(url);
    if (response.ok) {
      log.success("Photo accessible via public URL");
    } else {
      log.warning(`Photo URL returned: ${response.status}`);
    }

    return url;
  } catch (error) {
    log.error("Care photo upload failed");
    console.error(error);
    return null;
  }
}

/**
 * Test 5: Multiple File Upload
 */
async function testMultipleUploads() {
  log.section("Test 5: Multiple File Upload");
  try {
    const testImage = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==",
      "base64"
    );

    const uploads = [
      { name: "photo-1.jpg", prefix: "care" },
      { name: "photo-2.jpg", prefix: "care" },
      { name: "photo-3.jpg", prefix: "exchange" },
    ];

    log.info(`Uploading ${uploads.length} files...`);

    const results = await Promise.all(
      uploads.map(async ({ name, prefix }) => {
        const key = generateFileKey(name, prefix);
        const url = await uploadToS3(testImage, key, "image/jpeg");
        return { name, url };
      })
    );

    log.success(`${results.length} files uploaded`);
    results.forEach(({ name, url }) => {
      console.log(`  ${name}: ${url}`);
    });

    return results;
  } catch (error) {
    log.error("Multiple upload failed");
    console.error(error);
    return null;
  }
}

/**
 * Test 6: Large File Upload
 */
async function testLargeFileUpload() {
  log.section("Test 6: Large File Upload (30MB)");
  try {
    // Create a 30MB test file
    const size = 30 * 1024 * 1024; // 30MB
    const largeBuffer = Buffer.alloc(size);

    log.info(`Creating ${(size / 1024 / 1024).toFixed(1)}MB test file...`);

    const key = generateFileKey("large-test.jpg", "test");

    const startTime = Date.now();
    const url = await uploadToS3(largeBuffer, key, "image/jpeg");
    const duration = Date.now() - startTime;

    log.success("Large file upload successful");
    log.info(`Time taken: ${(duration / 1000).toFixed(2)}s`);
    log.info(`Speed: ${((size / 1024 / 1024) / (duration / 1000)).toFixed(2)} MB/s`);
    log.info(`URL: ${url}`);

    return true;
  } catch (error) {
    log.error("Large file upload failed");
    console.error(error);
    return false;
  }
}

/**
 * Print Configuration Summary
 */
function printConfig() {
  log.section("Configuration");
  console.log("MinIO Settings:");
  console.log(`  Endpoint: ${endpoint}`);
  console.log(`  SSL: ${useSSL ? "Enabled" : "Disabled"}`);
  console.log(`  Access Key: ${accessKey.substring(0, 4)}...`);
  console.log(`  Bucket: ${bucket}`);
  console.log(`  Public URL: ${publicUrl || "Not configured (will use presigned URLs)"}`);
  console.log();
}

/**
 * Main Test Runner
 */
async function runTests() {
  console.log("\n🧪 MinIO S3 Photo Upload Test Suite\n");

  printConfig();

  let allPassed = true;

  // Test 1: Connection
  const connected = await testConnection();
  if (!connected) {
    log.error("Cannot proceed without connection");
    process.exit(1);
  }

  // Test 2: Upload
  const uploadResult = await testUpload();
  if (!uploadResult) {
    allPassed = false;
  }

  // Test 3: Public Access
  if (uploadResult) {
    const publicAccessible = await testPublicAccess(uploadResult.url);
    if (!publicAccessible) {
      allPassed = false;
    }
  }

  // Test 4: Care Photo Upload
  const careUrl = await testCarePhotoUpload();
  if (!careUrl) {
    allPassed = false;
  }

  // Test 5: Multiple Uploads
  const multipleResults = await testMultipleUploads();
  if (!multipleResults) {
    allPassed = false;
  }

  // Test 6: Large File
  const largeFileSuccess = await testLargeFileUpload();
  if (!largeFileSuccess) {
    allPassed = false;
  }

  // Summary
  log.section("Test Summary");
  if (allPassed) {
    log.success("All tests passed! ✨");
    log.info("MinIO S3 is ready for production use");
  } else {
    log.warning("Some tests failed");
    log.info("Please review the errors above and fix configuration");
  }

  console.log();
}

// Run tests
runTests().catch((error) => {
  console.error("Test suite failed:", error);
  process.exit(1);
});
