import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const TMDB_BASE = "https://api.themoviedb.org/3";

// Map common IP-country headers (Vercel/Cloudflare) to ISO region codes
function getRegionFromRequest(req: NextRequest, fallback: string): string {
  // Vercel sets x-vercel-ip-country, Cloudflare sets cf-ipcountry
  const country =
    req.headers.get("x-vercel-ip-country") ||
    req.headers.get("cf-ipcountry") ||
    fallback;
  return country.toUpperCase();
}

export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "misconfigured" }, { status: 500 });

    const { searchParams } = new URL(req.url);
    // Client sends its timezone-derived region as a hint; IP header takes priority
    const clientRegion = searchParams.get("region") || "US";
    const region = getRegionFromRequest(req, clientRegion);

    const headers = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };

    const today = new Date().toISOString().split("T")[0];
    const sixMonths = new Date();
    sixMonths.setMonth(sixMonths.getMonth() + 6);
    const sixMonthsStr = sixMonths.toISOString().split("T")[0];

    const fetchPage = async (page: number) => {
      const url = new URL(`${TMDB_BASE}/discover/movie`);
      url.searchParams.set("region", region);
      url.searchParams.set("release_date.gte", today);
      url.searchParams.set("release_date.lte", sixMonthsStr);
      url.searchParams.set("with_release_type", "2|3");
      url.searchParams.set("sort_by", "popularity.desc");
      url.searchParams.set("include_adult", "false");
      url.searchParams.set("page", page.toString());
      const res = await fetch(url.toString(), { headers });
      const data = await res.json();
      return (data.results || []) as any[];
    };

    const [page1, page2] = await Promise.all([fetchPage(1), fetchPage(2)]);

    const movieMap = new Map<number, any>();
    for (const m of [...page1, ...page2]) {
      if (!m.release_date || m.release_date < today) continue;
      if (movieMap.has(m.id)) continue;
      movieMap.set(m.id, {
        id: m.id,
        title: m.title || "Untitled",
        release_date: m.release_date,
        poster_path: m.poster_path,
        backdrop_path: m.backdrop_path,
        genre_ids: m.genre_ids,
        overview: m.overview || "",
        vote_average: m.vote_average,
        popularity: m.popularity,
        media_type: "movie",
      });
    }

    const movies = Array.from(movieMap.values())
      .sort((a, b) => a.release_date.localeCompare(b.release_date))
      .slice(0, 60);

    return NextResponse.json(
      { movies, region },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
    );
  } catch (error) {
    console.error("Radar API Error:", error);
    return NextResponse.json({ error: "upstream_failed" }, { status: 503 });
  }
}
