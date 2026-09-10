import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://proyojon-plus.onrender.com/api/:path*',
      },
      {
        source: '/uploads/:path*',
        destination: 'https://proyojon-plus.onrender.com/uploads/:path*',
      },
    ];
  },
};

export default nextConfig;
