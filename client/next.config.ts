import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  experimental: {
    proxyTimeout: 120_000,
  },
  async rewrites() {
    const backendUrl = (process.env.BACKEND_URL || "http://localhost:3001").replace(/\/$/, "")
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
