import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // Injected by Vercel at build time — surfaced in the UI to verify which commit was deployed
    NEXT_PUBLIC_DEPLOY_SHA: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
  },
};

export default nextConfig;
