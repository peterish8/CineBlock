import { NextResponse, NextRequest } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { readCliToken } from "@/lib/cliAuth";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const LISTS = ["watchlist", "liked", "watched"] as const;
type ListName = (typeof LISTS)[number];
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

// Best-effort per-instance limit: 60 library reads per minute per token.
const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60_000;
const hits = new Map<string, number[]>();

function isRateLimited(token: string): boolean {
  const now = Date.now();
  const recent = (hits.get(token) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    hits.set(token, recent);
    return true;
  }
  recent.push(now);
  hits.set(token, recent);
  if (hits.size > 5_000) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= RATE_WINDOW_MS)) hits.delete(key);
    }
  }
  return false;
}

function json(body: unknown, status = 200, extra: HeadersInit = {}) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...extra } });
}

// GET /api/cli/library?list=watchlist|liked|watched&limit=1..100
// Reads the token owner's list. Does not use the daily search quota.
export async function GET(req: NextRequest) {
  const auth = readCliToken(req);
  if (!auth.ok) return json({ ok: false, error: auth.error }, 401);

  const params = req.nextUrl.searchParams;
  const list = params.get("list") ?? "";
  if (!LISTS.includes(list as ListName)) {
    return json({ ok: false, error: "list must be watchlist, liked or watched" }, 400);
  }
  const rawLimit = params.get("limit");
  const limit = rawLimit === null ? DEFAULT_LIMIT : Number(rawLimit);
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    return json({ ok: false, error: `limit must be a whole number from 1 to ${MAX_LIMIT}` }, 400);
  }

  if (isRateLimited(auth.token)) {
    return json({ ok: false, error: "Too many requests" }, 429, { "Retry-After": "60" });
  }

  try {
    const result = await convex.query(api.users.getCliLibrary, { token: auth.token, list: list as ListName, limit });
    return json(result, result.ok ? 200 : 401);
  } catch (err) {
    console.error("CLI library error:", err instanceof Error ? err.name : "unknown");
    return json({ ok: false, error: "Server error" }, 500);
  }
}
