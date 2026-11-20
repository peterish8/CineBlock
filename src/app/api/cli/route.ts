import { NextResponse, NextRequest } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const MAX_BODY_BYTES = 32 * 1024;
const MAX_TMDB_BODY_BYTES = 2 * 1024 * 1024;
const TMDB_TIMEOUT_MS = 10_000;

// cb_ prefix + 48 hex chars = 51 chars total
const TOKEN_REGEX = /^cb_[0-9a-f]{48}$/;

function extractToken(req: NextRequest): string | null {
  const auth = req.headers.get("Authorization");
  if (!auth?.toLowerCase().startsWith("bearer ")) return null;
  const token = auth.slice(7).trim();
  return TOKEN_REGEX.test(token) ? token : null;
}

type CliMovie = {
  id: number;
  title: string;
  release_date?: string;
  vote_average?: number;
  overview?: string;
  poster_path?: string;
};

function isCliMovie(value: unknown): value is CliMovie {
  if (typeof value !== "object" || value === null) return false;
  const movie = value as Record<string, unknown>;
  return typeof movie.id === "number"
    && Number.isSafeInteger(movie.id)
    && typeof movie.title === "string"
    && movie.title.length <= 500
    && (movie.release_date === undefined || typeof movie.release_date === "string")
    && (movie.vote_average === undefined || typeof movie.vote_average === "number")
    && (movie.overview === undefined || typeof movie.overview === "string")
    && (movie.poster_path === undefined || movie.poster_path === null || typeof movie.poster_path === "string");
}

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

// The terminal client is not a browser integration. Do not advertise a
// wildcard origin; keeping this preflight non-readable prevents a future web
// client from accidentally turning the CLI credential into a browser API.
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Cache-Control": "no-store",
    },
  });
}

// GET — verify token without consuming a daily search count
export async function GET(req: NextRequest) {
  const token = extractToken(req);
  if (!token) {
    return json(
      { ok: false, error: !req.headers.get("Authorization") ? "Missing token" : "Invalid token format" },
      401
    );
  }

  try {
    const result = await convex.query(api.users.pingCliToken, { token });
    return json(result, result.ok ? 200 : 401);
  } catch (err) {
    console.error("CLI ping error:", err instanceof Error ? err.name : "unknown");
    return json({ ok: false, error: "Server error" }, 500);
  }
}

// POST — validate token AND consume one daily search count, then optionally search TMDB
export async function POST(req: NextRequest) {
  const token = extractToken(req);
  if (!token) {
    return json(
      { ok: false, error: !req.headers.get("Authorization") ? "Missing token" : "Invalid token format" },
      401
    );
  }

  // Parse optional search query from body
  let query = "";
  try {
    const contentLength = Number(req.headers.get("content-length") ?? 0);
    if (contentLength > MAX_BODY_BYTES) return json({ ok: false, error: "Request body too large" }, 413);
    const rawBody = await req.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) return json({ ok: false, error: "Request body too large" }, 413);
    if (rawBody.trim()) {
      const contentType = req.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
      if (contentType !== "application/json") return json({ ok: false, error: "Content-Type must be application/json" }, 415);
      const body = JSON.parse(rawBody) as { query?: unknown };
      if (typeof body?.query === "string") query = body.query.slice(0, 150).trim();
    }
  } catch {
    return json({ ok: false, error: "Malformed JSON body" }, 400);
  }

  try {
    const result = await convex.mutation(api.users.validateCliSearch, { token });
    if (!result.ok) {
      return json(result, result.error === "Invalid token" ? 401 : 429);
    }

    if (!query) return json(result);

    // Search TMDB
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
      return json({ ok: false, error: "Server misconfiguration" }, 500);
    }

    const params = new URLSearchParams({
      query,
      language: "en-US",
      include_adult: "false",
      page: "1",
    });

    const tmdbRes = await fetch(`https://api.themoviedb.org/3/search/movie?${params.toString()}`, {
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(TMDB_TIMEOUT_MS),
    });

    if (!tmdbRes.ok) {
      return json({ ok: false, error: "Search failed" }, 502);
    }

    const tmdbContentLength = Number(tmdbRes.headers.get("content-length") ?? 0);
    if (tmdbContentLength > MAX_TMDB_BODY_BYTES) return json({ ok: false, error: "Search response too large" }, 502);
    const tmdbBody = await tmdbRes.text();
    if (new TextEncoder().encode(tmdbBody).byteLength > MAX_TMDB_BODY_BYTES) return json({ ok: false, error: "Search response too large" }, 502);
    const tmdbData = JSON.parse(tmdbBody) as { results?: unknown[] };

    const movies = (tmdbData.results ?? []).filter(isCliMovie).slice(0, 10).map((m) => ({
      id: m.id,
      title: m.title,
      year: m.release_date?.split("-")[0] ?? "?",
      rating: m.vote_average != null ? m.vote_average.toFixed(1) : "N/A",
      overview: (m.overview ?? "").slice(0, 200),
      poster: m.poster_path ? `https://image.tmdb.org/t/p/w185${m.poster_path}` : null,
    }));

    return json({ ...result, movies });
  } catch (err) {
    console.error("CLI error:", err instanceof Error ? err.name : "unknown");
    return json({ ok: false, error: "Server error" }, 500);
  }
}
