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
};

export default nextConfig;
