import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel auto-detects this, but explicit is better
  output: "standalone",

  // Strict mode for better debugging
  reactStrictMode: true,

  // Allow images from your API domain (if you add image uploads later)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.railway.app",
      },
    ],
  },

  // Disable x-powered-by header for security
  poweredByHeader: false,

  // API Proxy - Makes cookies same-origin (fixes Chrome SameSite issues)
  // Frontend localhost:3000/api/* → Backend localhost:8000/api/*
  // In production, Vercel handles this via rewrites
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "http://localhost:8000";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
