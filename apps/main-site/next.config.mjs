import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = dirname(fileURLToPath(import.meta.url));
const monorepoRoot = join(appDir, "../..");

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@stratxcel/payments", "@stratxcel/ui"],
  turbopack: {
    root: monorepoRoot,
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    optimizePackageImports: ["@stratxcel/ui"],
  },
};

export default nextConfig;
