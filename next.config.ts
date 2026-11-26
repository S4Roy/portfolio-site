import type { NextConfig } from "next";
import { execSync } from "node:child_process";

// Unique per deploy (git commit). Next.js stamps assets and navigation requests with it;
// when a tab opened on an older deploy navigates after a new deploy, the IDs differ and
// Next performs a full page load instead of reusing incompatible client code (version skew).
function deploymentId(): string | undefined {
  if (process.env.DEPLOYMENT_ID) return process.env.DEPLOYMENT_ID;
  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return undefined;
  }
}

const nextConfig: NextConfig = {
  deploymentId: deploymentId(),
  poweredByHeader: false,
};

export default nextConfig;
