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
  // Baseline hardening headers, including a CSP. No nonce (which Next.js's own docs
  // require pairing with fully dynamic rendering on every route — a real regression
  // for this app's static/streaming-optimized storefront) because there's nothing
  // here that needs one: no third-party scripts/analytics, all product photos go
  // through next/image (proxied same-origin via /_next/image, not requested directly
  // from Supabase by the browser), fonts are self-hosted at build time by
  // next/font/google, and the hero video is a same-origin file. 'unsafe-inline' on
  // script-src covers Next's own hydration bootstrap scripts; on style-src it covers
  // this app's few dynamic inline `style={{...}}` usages (chart bar heights etc.) —
  // acceptable here since there's no dangerouslySetInnerHTML or unescaped
  // user-controlled HTML anywhere in the app for either to actually enable.
  async headers() {
    const isDev = process.env.NODE_ENV === "development";
    const cspHeader = `
      default-src 'self';
      script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""};
      style-src 'self' 'unsafe-inline';
      img-src 'self';
      font-src 'self';
      media-src 'self';
      connect-src 'self';
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      upgrade-insecure-requests;
    `
      .replace(/\s{2,}/g, " ")
      .trim();

    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: cspHeader },
        ],
      },
    ];
  },
};

export default nextConfig;
