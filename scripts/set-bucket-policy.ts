/**
 * Configure S3 Bucket Policy for Public Read Access
 * Run this to make photos publicly accessible
 */
import { S3Client, PutBucketPolicyCommand, GetBucketPolicyCommand } from "@aws-sdk/client-s3";

const endpoint = process.env.MINIO_ENDPOINT || "https://api.node02.s3interdata.com";
const bucket = process.env.MINIO_BUCKET || "s3-10552-36074-storage-default";

const s3Client = new S3Client({
  endpoint,
  region: process.env.MINIO_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY!,
    secretAccessKey: process.env.MINIO_SECRET_KEY!,
  },
  forcePathStyle: true,
  tls: process.env.MINIO_USE_SSL === "true",
});

// Bucket policy for public read access
const publicReadPolicy = {
  Version: "2012-10-17",
  Statement: [
    {
      Sid: "PublicRead",
      Effect: "Allow",
      Principal: "*",
      Action: ["s3:GetObject"],
      Resource: [`arn:aws:s3:::${bucket}/*`],
    },
  ],
};

async function setBucketPolicy() {
  try {
    console.log("\n🔧 Setting bucket policy for public read access...\n");
    console.log(`Bucket: ${bucket}`);
    console.log(`Endpoint: ${endpoint}\n`);

    const command = new PutBucketPolicyCommand({
      Bucket: bucket,
      Policy: JSON.stringify(publicReadPolicy),
    });

    await s3Client.send(command);

    console.log("✅ Bucket policy set successfully!");
    console.log("\nPhotos are now publicly accessible via URLs\n");

    // Verify by getting the policy
    const getCommand = new GetBucketPolicyCommand({ Bucket: bucket });
    const response = await s3Client.send(getCommand);

    console.log("Current policy:");
    console.log(JSON.stringify(JSON.parse(response.Policy!), null, 2));
  } catch (error: any) {
    console.error("❌ Failed to set bucket policy");
    console.error("Error:", error.message);

    if (error.Code === "AccessDenied") {
      console.error("\n⚠️  Access denied. You may need to:");
      console.error("   1. Use your S3 provider's web console to set bucket policy");
      console.error("   2. Contact your S3 provider support");
      console.error("   3. Use a service account with policy management permissions\n");
    }
  }
}

setBucketPolicy();
