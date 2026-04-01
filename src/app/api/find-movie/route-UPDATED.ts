/**
 * UPDATED find-movie endpoint with persistent rate limiting
 *
 * This is a reference implementation showing how to integrate the Redis-based rate limiter
 * into your existing find-movie route.
 *
 * To implement:
 * 1. Setup Upstash Redis account and get credentials
 * 2. Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to .env.local
 * 3. Install: npm install @upstash/ratelimit @upstash/redis
 * 4. Replace the old rate limiting code in your find-movie/route.ts with this
 */

import { NextResponse, NextRequest } from "next/server";
import { buildTMDBParams, WizardState } from "@/lib/tmdbQueryBuilder";
import { checkRateLimitManual, getClientIP } from "@/lib/rateLimiter";

// --- REMOVED: Old in-memory rate limiter ---
// const rateLimitMap = new Map<string, number[]>();
// const RATE_LIMIT = 10;
// const RATE_WINDOW_MS = 60_000;

// --- NEW: Persistent rate limiting with Redis ---
const RATE_LIMIT = 10; // requests
const RATE_WINDOW = 60; // seconds

async function isRateLimited(request: NextRequest): Promise<{ limited: boolean; resetAfter?: number }> {
  const ip = getClientIP(request);
  const result = await checkRateLimitManual(ip, RATE_LIMIT, RATE_WINDOW);

  return {
    limited: !result.success,
    resetAfter: result.resetAfter,
  };
}

// ... rest of your existing code remains the same ...

export async function POST(req: NextRequest) {
  // Check rate limit
  const rateLimitCheck = await isRateLimited(req);

  if (rateLimitCheck.limited) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rateLimitCheck.resetAfter || 60) / 1000)),
        },
      }
    );
  }

  // ... rest of your POST handler remains the same ...
  try {
    const body = (await req.json()) as any;
    const apiKey = process.env.TMDB_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "TMDB API key not configured" },
        { status: 500 }
      );
    }

    // Your existing find-movie logic continues here...
    return NextResponse.json({ error: "Not implemented - use reference" }, { status: 501 });
  } catch (err) {
    console.error("Find movie error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
