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
      "default-src 'self' blob:; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https: blob: https://api.node02.s3interdata.com; " +
      "font-src 'self' data:; " +
      "connect-src 'self' https://accounts.google.com https://api.node02.s3interdata.com https://*.carto.com https://*.cartocdn.com; " +
      "worker-src 'self' blob:; " +
      "frame-src 'self' https://accounts.google.com;",
  },
];

const nextConfig: NextConfig = {
  // Disable standalone for local dev/build testing on Windows (symlink issues)
  // Enable for Docker deployment: output: "standalone",

  // Fix workspace root warning - specify project root explicitly
  outputFileTracingRoot: __dirname,

  serverExternalPackages: ["@prisma/client", "prisma", "xlsx", "pg"],

  // Turbopack configuration (resolved file extensions)
  turbopack: {
    resolveExtensions: [".tsx", ".ts", ".jsx", ".js", ".mjs", ".json"],
  },

  experimental: {
    serverActions: {
      bodySizeLimit: "30mb", // Support large image uploads
    },
    // Optimize barrel file imports for better tree-shaking (Vercel React Best Practices)
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-alert-dialog",
      "@radix-ui/react-avatar",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-label",
      "@radix-ui/react-radio-group",
      "@radix-ui/react-scroll-area",
      "@radix-ui/react-select",
      "@radix-ui/react-separator",
      "@radix-ui/react-slot",
      "@radix-ui/react-switch",
      "@radix-ui/react-tabs",
      "@radix-ui/react-tooltip",
      "date-fns",
      "recharts",
    ],
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
