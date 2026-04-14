import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "crypto";

/** @type {import('next').NextConfig} */

// Generate a random nonce for inline scripts
const generateNonce = () => crypto.randomBytes(16).toString('hex');

// Store nonce in memory for this session
let cachedNonce = generateNonce();

const contentSecurityPolicy = (nonce) => [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  // Use nonce instead of 'unsafe-inline'
  `script-src 'self' 'nonce-${nonce}' https://va.vercel-scripts.com`,
  // Use nonce for styles instead of 'unsafe-inline'
  `style-src 'self' 'nonce-${nonce}'`,
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://api.themoviedb.org https://vitals.vercel-insights.com https://va.vercel-scripts.com https://*.convex.cloud wss://*.convex.cloud https://*.convex.site https://1.1.1.1 https://ipwho.is https://ipapi.co",
  "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
  "media-src 'self' https:",
].join("; ");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    loader: "custom",
    loaderFile: "./src/lib/imageLoader.ts",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  async headers() {
    // Refresh nonce for each request in production
    const nonce = process.env.NODE_ENV === "production" ? generateNonce() : cachedNonce;

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy(nonce) },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // Add CORS headers
          { key: "Access-Control-Allow-Origin", value: "https://cineblock.in" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type,Authorization" },
          // preload requires submission to https://hstspreload.org — cineblock.in has been submitted
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
        ],
      },
    ];
  },
};

export default nextConfig;
