import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/kozmocart',
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/static_uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'api',
        port: '8000',
        pathname: '/static_uploads/**',
      },
    ],
  },
};

export default nextConfig;
