import { NextRequest, NextResponse } from "next/server";
import { getUpcomingMovies, getMoviesByGenreUpcoming, getUpcomingTV, getTVByGenreUpcoming } from "@/lib/tmdb";
import { TMDBMovie } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // 1 hour

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const genresStr = searchParams.get("genres");
    const lang = searchParams.get("lang") || undefined;
    const genreIds = genresStr ? genresStr.split(",").map(Number).filter(id => !isNaN(id)) : [];

    let personalized = false;

    // 1. Fetch data in parallel (Movies Only)
    const promises: Promise<any>[] = [
      getUpcomingMovies(1, lang)
    ];
    
    if (genreIds.length > 0) {
      promises.push(getMoviesByGenreUpcoming(genreIds, lang));
    }

    const results = await Promise.all(promises);
    const globalMovies = (results[0].results || []).map((m: any) => ({ ...m, media_type: "movie" }));
    const genreMatchedMovies = (results[1]?.results || []).map((m: any) => ({ ...m, media_type: "movie" }));

    // 2. Merge and Deduplicate
    const movieMap = new Map<number, any>();
    
    // Prioritize genre matches
    genreMatchedMovies.forEach((m: any) => {
      movieMap.set(m.id, m);
      personalized = true;
    });

    // Fill with global upcoming
    globalMovies.forEach((m: any) => {
      if (!movieMap.has(m.id)) {
        movieMap.set(m.id, m);
      }
    });

    const combined = Array.from(movieMap.values());

    // 3. Sort by release date ASC (nearest first)
    combined.sort((a, b) => {
      const dateA = a.release_date || "9999-12-31";
      const dateB = b.release_date || "9999-12-31";
      return dateA.localeCompare(dateB);
    });

    // 4. Transform and Limit to 60
    const finalItems = combined.slice(0, 60).map(m => ({
      id: m.id,
      title: m.title || "Untitled",
      release_date: m.release_date || "",
      poster_path: m.poster_path,
      backdrop_path: m.backdrop_path,
      genre_ids: m.genre_ids,
      overview: m.overview || "",
      vote_average: m.vote_average,
      popularity: m.popularity,
      media_type: "movie",
    }));

    return NextResponse.json(
      {
        personalized,
        movies: finalItems,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error) {
    console.error("Radar API Error:", error);
    return NextResponse.json({ error: "upstream_failed" }, { status: 503 });
  }
}
