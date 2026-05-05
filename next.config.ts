import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack (default in Next.js 16) handles canvas natively in browser bundles.
  // An empty turbopack config silences the webpack-config mismatch warning.
  turbopack: {},
  webpack: (config) => {
    config.resolve.alias.canvas = false
    return config
  },
};

export default nextConfig;
