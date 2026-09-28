import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // A service worker in `next dev` can keep a bundle from another worktree or
  // branch alive after route files are moved. PWA behaviour remains enabled
  // for preview/production builds, where the cache is useful to customers.
  disable: process.env.NODE_ENV !== "production",
  additionalPrecacheEntries: [{ url: "/offline", revision: "offline-v1" }],
});

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
    viewTransition: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
    minimumCacheTTL: 31536000,
    formats: ["image/avif", "image/webp"],
    deviceSizes: [390, 768, 1024, 1280, 1920],
    imageSizes: [64, 128, 256, 384],
  },
};

export default withSerwist(nextConfig);
