import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
    domains: ['localhost'],
  },
  // Ensure the _redirects file is copied to the out directory
  async redirects() {
    return [];
  },
};

export default nextConfig;
