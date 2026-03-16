import { NextResponse, NextRequest } from "next/server";
import { buildTMDBParams } from "@/lib/tmdbQueryBuilder";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { excludeIds = [], ...wizardState } = body;
    const excludeSet = new Set<number>(excludeIds);
    const apiKey = process.env.TMDB_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "TMDB API key not configured" }, { status: 500 });
    }

    const fresh: any[] = [];
    const triedPages = new Set<number>();

    // Try up to 6 different pages to collect 5 non-excluded movies
    while (fresh.length < 5 && triedPages.size < 6) {
      const params = buildTMDBParams(wizardState); // picks a new random page each call
      const pageNum = Number((params as Record<string, string>).page ?? 1);

      // Avoid re-fetching the same page
      if (triedPages.has(pageNum)) continue;
      triedPages.add(pageNum);

      const searchParams = new URLSearchParams(params);
      const res = await fetch(
        `https://api.themoviedb.org/3/discover/movie?${searchParams.toString()}`,
        { headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" } }
      );
      if (!res.ok) continue;

      const data = await res.json();
      const results: any[] = data.results || [];

      for (const movie of results) {
        if (!excludeSet.has(movie.id) && fresh.length < 5) {
          fresh.push(movie);
          excludeSet.add(movie.id); // prevent same movie appearing twice within this batch
        }
      }
    }

    return NextResponse.json({ movies: fresh.slice(0, 5) });
  } catch (err) {
    console.error("Find movie error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
