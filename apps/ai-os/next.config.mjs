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
  async redirects() {
    return [
      { source: "/dashboard", destination: "/admin", permanent: false },
      { source: "/clients", destination: "/admin/leads", permanent: false },
      { source: "/pipelines", destination: "/admin/pipeline", permanent: false },
      { source: "/tasks", destination: "/admin/automation", permanent: false },
      { source: "/billing", destination: "/admin/billing", permanent: false },
      { source: "/settings", destination: "/admin/settings", permanent: false },
    ];
  },
};

export default nextConfig;
