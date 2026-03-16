import { NextResponse, NextRequest } from "next/server";
import { buildTMDBParams } from "@/lib/tmdbQueryBuilder";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const params = buildTMDBParams(body);
    const apiKey = process.env.TMDB_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "TMDB API key not configured" }, { status: 500 });
    }

    const searchParams = new URLSearchParams(params);
    const res = await fetch(
      `https://api.themoviedb.org/3/discover/movie?${searchParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "TMDB request failed" },
        { status: res.status }
      );
    }

    const data = await res.json();
    const movies = (data.results || []).slice(0, 5);

    return NextResponse.json({ movies });
  } catch (err) {
    console.error("Find movie error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
