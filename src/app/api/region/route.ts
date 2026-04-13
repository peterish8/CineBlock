import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // 1. Try CDN headers first (Vercel, Cloudflare, CloudFront) — zero latency on deployment.
  const candidates = [
    req.headers.get("x-vercel-ip-country"),
    req.headers.get("cf-ipcountry"),
    req.headers.get("cloudfront-viewer-country"),
  ];

  for (const code of candidates) {
    const normalized = code?.trim().toUpperCase();
    if (normalized && normalized.length === 2 && normalized !== "XX") {
      return NextResponse.json({ country: normalized });
    }
  }

  // 2. Fallback: call ip-api.com using the real client IP.
  //    This fires when CDN headers aren't present (local dev, bare Node, etc.)
  const rawIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "";

  // Loopback / private IPs can't be geolocated — omit them so ip-api.com
  // auto-detects from the server's own outgoing IP (same machine in local dev).
  const isPrivate = !rawIp || rawIp === "::1" || rawIp.startsWith("127.") || rawIp.startsWith("192.168.") || rawIp.startsWith("10.") || rawIp.startsWith("::ffff:127.");
  const ipSegment = isPrivate ? "" : rawIp;

  try {
    // ip-api.com free tier is HTTP-only; server-side fetch so no CORS issue.
    const ipRes = await fetch(
      `http://ip-api.com/json/${ipSegment}?fields=countryCode`,
      { cache: "no-store" }
    );
    if (ipRes.ok) {
      const ipData = await ipRes.json();
      const code = ipData?.countryCode?.trim().toUpperCase();
      if (code && code.length === 2) {
        return NextResponse.json({ country: code });
      }
    }
  } catch {
    // ip-api.com unreachable — fall through to default
  }

  return NextResponse.json({ country: "US" });
}
