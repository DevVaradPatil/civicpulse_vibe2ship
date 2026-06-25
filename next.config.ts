import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build a self-contained server for a small Cloud Run container.
  output: "standalone",
  images: {
    // Issue + proof photos are served from a public GCS bucket.
    remotePatterns: [
      { protocol: "https", hostname: "storage.googleapis.com" },
    ],
  },
};

export default nextConfig;
