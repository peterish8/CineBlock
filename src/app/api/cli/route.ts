import { NextResponse, NextRequest } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// cb_ prefix + 48 hex chars = 51 chars total
const TOKEN_REGEX = /^cb_[0-9a-f]{48}$/;

function extractToken(req: NextRequest): string | null {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7).trim();
  return TOKEN_REGEX.test(token) ? token : null;
}

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

// GET — verify token without consuming a daily search count
export async function GET(req: NextRequest) {
  const token = extractToken(req);
  if (!token) {
    return NextResponse.json(
      { ok: false, error: !req.headers.get("Authorization") ? "Missing token" : "Invalid token format" },
      { status: 401 }
    );
  }

  try {
    const result = await convex.query(api.users.pingCliToken, { token });
    return NextResponse.json(result, { status: result.ok ? 200 : 401 });
  } catch (err) {
    console.error("CLI ping error:", err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}

// POST — validate token AND consume one daily search count, then optionally search TMDB
export async function POST(req: NextRequest) {
  const token = extractToken(req);
  if (!token) {
    return NextResponse.json(
      { ok: false, error: !req.headers.get("Authorization") ? "Missing token" : "Invalid token format" },
      { status: 401 }
    );
  }

  // Parse optional search query from body
  let query = "";
  try {
    const body = await req.json();
    if (typeof body?.query === "string") query = body.query.slice(0, 150).trim();
  } catch {
    // No body — count still gets consumed (caller chose to POST)
  }

  try {
    const result = await convex.mutation(api.users.validateCliSearch, { token });
    if (!result.ok) {
      return NextResponse.json(result, { status: result.error === "Invalid token" ? 401 : 429 });
    }

    if (!query) return NextResponse.json(result);

    // Search TMDB
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: "Server misconfiguration" }, { status: 500 });
    }

    const params = new URLSearchParams({
      query,
      language: "en-US",
      include_adult: "false",
      page: "1",
    });

    const tmdbRes = await fetch(`https://api.themoviedb.org/3/search/movie?${params.toString()}`, {
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    });

    if (!tmdbRes.ok) {
      return NextResponse.json({ ok: false, error: "Search failed" }, { status: 500 });
    }

    const tmdbData = await tmdbRes.json();

    const movies = (tmdbData.results ?? []).slice(0, 10).map((m: {
      id: number;
      title: string;
      release_date?: string;
      vote_average?: number;
      overview?: string;
      poster_path?: string;
    }) => ({
      id: m.id,
      title: m.title,
      year: m.release_date?.split("-")[0] ?? "?",
      rating: m.vote_average != null ? m.vote_average.toFixed(1) : "N/A",
      overview: (m.overview ?? "").slice(0, 200),
      poster: m.poster_path ? `https://image.tmdb.org/t/p/w185${m.poster_path}` : null,
    }));

    return NextResponse.json({ ...result, movies });
  } catch (err) {
    console.error("CLI error:", err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
