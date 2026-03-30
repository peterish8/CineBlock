import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Read country from CDN headers (Vercel, Cloudflare, CloudFront) set by the
  // edge network based on the caller's IP — more reliable than an outbound fetch.
  const candidates = [
    req.headers.get("x-vercel-ip-country"),
    req.headers.get("cf-ipcountry"),
    req.headers.get("cloudfront-viewer-country"),
  ];

  for (const code of candidates) {
    const normalized = code?.trim().toUpperCase();
    if (normalized && normalized.length === 2) {
      return NextResponse.json({ country: normalized });
    }
  }

  return NextResponse.json({ country: "US" });
}
