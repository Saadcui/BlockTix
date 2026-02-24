import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Allow user-provided event image URLs. If you want to lock this down,
      // replace this wildcard with an explicit allowlist of domains.
      {
        protocol: 'https',
        hostname: '**',
      },
      // Useful for local development/test images.
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
};

export default nextConfig;
