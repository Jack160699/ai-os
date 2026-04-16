import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = dirname(fileURLToPath(import.meta.url));
const monorepoRoot = join(appDir, "../..");

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: { root: monorepoRoot },
};

export default nextConfig;
