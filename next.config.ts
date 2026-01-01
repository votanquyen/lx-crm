import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https: blob: https://api.node02.s3interdata.com; " +
      "font-src 'self' data:; " +
      "connect-src 'self' https://accounts.google.com https://api.node02.s3interdata.com; " +
      "frame-src 'self' https://accounts.google.com;",
  },
];

const nextConfig: NextConfig = {
  // Disable standalone for local dev/build testing on Windows (symlink issues)
  // Enable for Docker deployment: output: "standalone",

  // Fix workspace root warning - specify project root explicitly
  outputFileTracingRoot: __dirname,

  serverExternalPackages: ["@prisma/client", "prisma"],

  // Webpack configuration for custom file loaders
  webpack: (config) => {
    config.module.rules.push({
      test: /\.txt$/,
      type: 'asset/source',
    });
    return config;
  },

  experimental: {
    serverActions: {
      bodySizeLimit: "30mb", // Support large image uploads
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
