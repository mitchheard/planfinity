import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Limit build workers so `next build` fits in Render's build memory.
    cpus: 2,
  },
};

export default nextConfig;
