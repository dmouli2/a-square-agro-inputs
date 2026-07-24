import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Vercel's own serverless request-body ceiling is ~4.5MB; stay under it.
      bodySizeLimit: "4mb",
    },
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" }],
  },
  // Baseline hardening headers. Deliberately not a Content-Security-Policy — this app
  // loads a self-hosted hero video, Supabase-stored images, and Next's own hydration
  // scripts, so a CSP needs to be built and tested against every page before it ships,
  // not bolted on here.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
