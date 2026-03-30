import { NextRequest, NextResponse } from "next/server";

const TMDB_BASE = "https://api.themoviedb.org/3";
const API_KEY = process.env.TMDB_API_KEY || "";

const headers: HeadersInit = {
  Authorization: `Bearer ${API_KEY}`,
  "Content-Type": "application/json;charset=utf-8",
};

// Batch-fetch clearlogos for an array of movies and attach logo_path to each
async function attachLogos<T extends { id: number }>(movies: T[]): Promise<(T & { logo_path: string | null })[]> {
  if (!movies.length) return movies.map((m) => ({ ...m, logo_path: null }));
  const results = await Promise.allSettled(
    movies.map((m) =>
      fetch(`${TMDB_BASE}/movie/${m.id}/images?include_image_language=en,null`, { headers })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null)
    )
  );
  return movies.map((m, i) => {
    const settled = results[i];
    const logos: { file_path: string; iso_639_1: string | null }[] =
      settled.status === "fulfilled" && settled.value?.logos ? settled.value.logos : [];
    const best = logos.find((l) => l.iso_639_1 === "en") ?? logos[0] ?? null;
    return { ...m, logo_path: best?.file_path ?? null };
  });
}

// Actions whose response has a `results` array of movies (not TV)
const MOVIE_LIST_ACTIONS = new Set([
  "recommendations",
  "similar",
  "stream-discover",
  "box-office",
  "discover", // default action
]);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "discover";

  // Basic input validation
  const rawPage = parseInt(searchParams.get("page") || "1", 10);
  const page = String(isNaN(rawPage) || rawPage < 1 || rawPage > 500 ? 1 : rawPage);

  // Validate numeric IDs to prevent URL injection
  const validateId = (raw: string | null): string | null => {
    if (!raw) return null;
    const n = parseInt(raw, 10);
    return isNaN(n) || n <= 0 ? null : String(n);
  };

  try {
    let url: string;

    switch (action) {
      case "search": {
        const query = (searchParams.get("query") || "").slice(0, 150);
        const year = searchParams.get("year");
        const lang = searchParams.get("lang");
        const params = new URLSearchParams({
          query,
          language: "en-US",
          include_adult: "false",
          page,
        });
        if (year) params.set("year", year);
        url = `${TMDB_BASE}/search/movie?${params.toString()}`;
        // lang is not supported by TMDB search endpoint — filter results below
        const searchRes = await fetch(url, { headers });
        if (!searchRes.ok) return NextResponse.json({ error: `TMDB API error: ${searchRes.status}` }, { status: searchRes.status });
        const searchData = await searchRes.json();
        if (lang) {
          const langs = lang.split(',');
          searchData.results = (searchData.results || []).filter(
            (m: { original_language: string }) => langs.includes(m.original_language)
          );
        }
        searchData.results = await attachLogos(searchData.results || []);
        return NextResponse.json(searchData);
      }

      case "search-person": {
        // Search for a person (director/actor) by name, return top matches
        const query = (searchParams.get("query") || "").slice(0, 150);
        if (!query.trim()) return NextResponse.json({ results: [] });
        const params = new URLSearchParams({ query, language: "en-US", include_adult: "false", page });
        const res = await fetch(`${TMDB_BASE}/search/person?${params.toString()}`, { headers });
        if (!res.ok) return NextResponse.json({ error: `TMDB API error: ${res.status}` }, { status: res.status });
        const data = await res.json();
        // Return only relevant fields, top 8
        const results = (data.results || []).slice(0, 8).map((p: any) => ({
          id: p.id,
          name: p.name,
          profile_path: p.profile_path,
          known_for_department: p.known_for_department,
          known_for: (p.known_for || []).slice(0, 2).map((k: any) => k.title || k.name),
        }));
        return NextResponse.json({ results });
      }

      case "discover-by-person": {
        // Discover movies by a specific person ID (director or cast)
        const personId = validateId(searchParams.get("person_id"));
        if (!personId) return NextResponse.json({ error: "person_id required" }, { status: 400 });
        const role = searchParams.get("role") || "cast"; // "cast" | "crew"
        const params = new URLSearchParams({
          language: "en-US",
          include_adult: "false",
          include_video: "false",
          sort_by: "popularity.desc",
          "vote_count.gte": "10",
          page,
        });
        if (role === "crew") {
          params.set("with_crew", personId);
        } else {
          params.set("with_cast", personId);
        }
        const res = await fetch(`${TMDB_BASE}/discover/movie?${params.toString()}`, { headers });
        if (!res.ok) return NextResponse.json({ error: `TMDB API error: ${res.status}` }, { status: res.status });
        const data = await res.json();
        data.results = await attachLogos((data.results || []).slice(0, 20));
        return NextResponse.json(data);
      }

      case "search-tv": {
        const query = (searchParams.get("query") || "").slice(0, 150);
        const params = new URLSearchParams({
          query,
          language: "en-US",
          include_adult: "false",
          page,
        });
        url = `${TMDB_BASE}/search/tv?${params.toString()}`;
        break;
      }

      case "details": {
        const movieId = validateId(searchParams.get("id"));
        if (!movieId) return NextResponse.json({ error: "Invalid movie ID" }, { status: 400 });
        url = `${TMDB_BASE}/movie/${movieId}?append_to_response=credits,videos&language=en-US`;
        break;
      }

      case "tv-details": {
        const tvId = validateId(searchParams.get("id"));
        if (!tvId) return NextResponse.json({ error: "Invalid TV ID" }, { status: 400 });
        url = `${TMDB_BASE}/tv/${tvId}?append_to_response=credits,videos&language=en-US`;
        break;
      }

      case "watch-providers": {
        const movieId = validateId(searchParams.get("id"));
        if (!movieId) return NextResponse.json({ error: "Invalid movie ID" }, { status: 400 });
        url = `${TMDB_BASE}/movie/${movieId}/watch/providers`;
        break;
      }

      case "recommendations": {
        const movieId = validateId(searchParams.get("id"));
        if (!movieId) return NextResponse.json({ error: "Invalid movie ID" }, { status: 400 });
        url = `${TMDB_BASE}/movie/${movieId}/recommendations?language=en-US&page=1`;
        break;
      }

      case "recommendations-tv": {
        const tvId = validateId(searchParams.get("id"));
        if (!tvId) return NextResponse.json({ error: "Invalid TV ID" }, { status: 400 });
        url = `${TMDB_BASE}/tv/${tvId}/recommendations?language=en-US&page=1`;
        break;
      }

      case "similar": {
        const movieId = searchParams.get("id");
        if (!movieId) return NextResponse.json({ error: "Movie ID required" }, { status: 400 });
        url = `${TMDB_BASE}/movie/${movieId}/similar?language=en-US&page=1`;
        break;
      }

      case "similar-tv": {
        const tvId = searchParams.get("id");
        if (!tvId) return NextResponse.json({ error: "TV ID required" }, { status: 400 });
        url = `${TMDB_BASE}/tv/${tvId}/similar?language=en-US&page=1`;
        break;
      }

      case "trending": {
        const window = searchParams.get("window") || "week";
        url = `${TMDB_BASE}/trending/movie/${window}?language=en-US`;
        const trendingRes = await fetch(url, { headers });
        if (!trendingRes.ok) return NextResponse.json({ error: `TMDB API error: ${trendingRes.status}` }, { status: trendingRes.status });
        const trendingData = await trendingRes.json();
        trendingData.results = await attachLogos(trendingData.results?.slice(0, 20) || []);
        return NextResponse.json(trendingData);
      }

      case "trending-tv": {
        const window = searchParams.get("window") || "week";
        url = `${TMDB_BASE}/trending/tv/${window}?language=en-US`;
        break;
      }

      case "person": {
        const personId = searchParams.get("id");
        if (!personId) return NextResponse.json({ error: "Person ID required" }, { status: 400 });
        url = `${TMDB_BASE}/person/${personId}?append_to_response=movie_credits&language=en-US`;
        break;
      }

      case "collection": {
        const collectionId = searchParams.get("id");
        if (!collectionId) return NextResponse.json({ error: "Collection ID required" }, { status: 400 });

        // Custom Override: Marvel Cinematic Universe Chronological Timeline
        if (collectionId === "9999999") {
          const mcuMovieIds = [
            1771,     // Captain America: The First Avenger
            299537,   // Captain Marvel
            1726,     // Iron Man
            10138,    // Iron Man 2
            1724,     // The Incredible Hulk
            10195,    // Thor
            24428,    // The Avengers
            68721,    // Iron Man 3
            76338,    // Thor: The Dark World
            100402,   // Captain America: The Winter Soldier
            118340,   // Guardians of the Galaxy
            283995,   // Guardians of the Galaxy Vol. 2
            99861,    // Avengers: Age of Ultron
            102899,   // Ant-Man
            271110,   // Captain America: Civil War
            497698,   // Black Widow
            284054,   // Black Panther
            315635,   // Spider-Man: Homecoming
            284052,   // Doctor Strange
            284053,   // Thor: Ragnarok
            299536,   // Avengers: Infinity War
            363088,   // Ant-Man and the Wasp
            299534,   // Avengers: Endgame
            429617,   // Spider-Man: Far From Home
            566525,   // Shang-Chi
            524434,   // Eternals
            634649,   // Spider-Man: No Way Home
            453395,   // Doctor Strange in the Multiverse of Madness
            616037,   // Thor: Love and Thunder
            505642,   // Black Panther: Wakanda Forever
            640146,   // Ant-Man and the Wasp: Quantumania
            447365,   // Guardians of the Galaxy Vol. 3
            609681,   // The Marvels
            533535,   // Deadpool & Wolverine
            822119    // Captain America: Brave New World
          ];
          
          const moviePromises = mcuMovieIds.map(id => 
            fetch(`${TMDB_BASE}/movie/${id}?language=en-US`, { headers }).then(r => r.json())
          );
          
          const parts = await Promise.all(moviePromises);
          
          return NextResponse.json({
            id: 9999999,
            name: "Marvel Cinematic Universe (Chronological)",
            overview: "The epic chronological timeline of the Marvel Cinematic Universe, from the origins of Captain America to the latest multiversal threats.",
            poster_path: "/RYMX2wcKCBAr24UyPD7xwmja8y.jpg", // Avengers Poster
            backdrop_path: "/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg", // Endgame Backdrop
            parts: parts.filter(p => !p.status_code) // Filter out any API fetch failures
          });
        }

        // Custom Override: Spider-Man Live Action Eras
        if (collectionId === "9999998") {
          const spideyEras = [
            { id: 557, era: "Tobey Maguire Spider-Man (Standalone)" },
            { id: 558, era: "Tobey Maguire Spider-Man (Standalone)" },
            { id: 559, era: "Tobey Maguire Spider-Man (Standalone)" },
            { id: 1930, era: "Andrew Garfield Spider-Man (Standalone)" },
            { id: 102382, era: "Andrew Garfield Spider-Man (Standalone)" },
            { id: 315635, era: "Tom Holland Spider-Man (Standalone MCU)" },
            { id: 429617, era: "Tom Holland Spider-Man (Standalone MCU)" },
            { id: 634649, era: "Tom Holland Spider-Man (Standalone MCU)" },
            { id: 324857, era: "Miles Morales (Spider-Verse Animated)" },
            { id: 569094, era: "Miles Morales (Spider-Verse Animated)" }
          ];
          
          const moviePromises = spideyEras.map(item => 
            fetch(`${TMDB_BASE}/movie/${item.id}?language=en-US`, { headers })
              .then(r => r.json())
              .then(data => ({ ...data, custom_era: item.era }))
          );
          
          const parts = await Promise.all(moviePromises);
          
          // Use No Way Home for posters/backdrop if available
          const nwh = parts.find(p => p.id === 634649);
          
          return NextResponse.json({
            id: 9999998,
            name: "Spider-Man Collection",
            overview: "The complete live-action standalone universe of Peter Parker across three generation-defining eras: Tobey Maguire, Andrew Garfield, and Tom Holland.",
            poster_path: nwh?.poster_path || "/1g0dhYtq4irTY1R80vFA1REtwhO.jpg",
            backdrop_path: nwh?.backdrop_path || "/1Rr5SrvHxUTgK5j9oVwLOK2HwK5.jpg",
            parts: parts.filter(p => !p.status_code)
          });
        }

        url = `${TMDB_BASE}/collection/${collectionId}?language=en-US`;
        break;
      }

      case "search-collection": {
        const query = searchParams.get("query") || "";
        const params = new URLSearchParams({
          query,
          language: "en-US",
          include_adult: "false", // Strict restriction against adult content
          page,
        });
        url = `${TMDB_BASE}/search/collection?${params.toString()}`;
        break;
      }

      case "discover-tv": {
        const params = new URLSearchParams({
          language: "en-US",
          include_adult: "false",
          sort_by: searchParams.get("sort") || "popularity.desc",
          page,
        });
        let genre = searchParams.get("genre");
        const year = searchParams.get("year");
        let lang = searchParams.get("lang");
        const rating = searchParams.get("rating");
        const runtime = searchParams.get("runtime");

        // Handle virtual genres
        if (genre === "9901") { genre = "18"; lang = "ko"; } // K-Drama (Drama + Korean)
        else if (genre === "9902") { genre = "18"; lang = "zh"; } // C-Drama (Drama + Chinese)
        else if (genre === "9903") { genre = "16"; lang = "ja"; } // Anime (Animation + Japanese)

        if (genre) params.set("with_genres", genre);
        if (year) params.set("first_air_date_year", year);
        if (lang) params.set("with_original_language", lang.replace(/,/g, "|"));
        if (rating) params.set("vote_average.gte", rating);
        if (runtime) params.set("with_runtime.lte", runtime);
        url = `${TMDB_BASE}/discover/tv?${params.toString()}`;
        break;
      }

      case "stream-discover": {
        // Movies available on a specific streaming platform
        const providerId = searchParams.get("provider_id") || "";
        const region = searchParams.get("region") || "US";
        const params = new URLSearchParams({
          language: "en-US",
          include_adult: "false",
          include_video: "false",
          sort_by: searchParams.get("sort") || "popularity.desc",
          "vote_count.gte": "20",
          page,
        });
        if (providerId) {
          params.set("with_watch_providers", providerId);
          params.set("watch_region", region);
        }
        const genre = searchParams.get("genre");
        if (genre) params.set("with_genres", genre);
        url = `${TMDB_BASE}/discover/movie?${params.toString()}`;
        break;
      }

      case "stream-discover-tv": {
        // TV shows available on a specific streaming platform
        const providerId = searchParams.get("provider_id") || "";
        const region = searchParams.get("region") || "US";
        const params = new URLSearchParams({
          language: "en-US",
          include_adult: "false",
          sort_by: searchParams.get("sort") || "popularity.desc",
          "vote_count.gte": "20",
          page,
        });
        if (providerId) {
          params.set("with_watch_providers", providerId);
          params.set("watch_region", region);
        }
        const genre = searchParams.get("genre");
        if (genre) params.set("with_genres", genre);
        url = `${TMDB_BASE}/discover/tv?${params.toString()}`;
        break;
      }

      case "box-office": {
        // Highest grossing movies globally
        const params = new URLSearchParams({
          language: "en-US",
          include_adult: "false",
          include_video: "false",
          sort_by: "revenue.desc", // Force sorting by box office revenue
          "vote_count.gte": "100", // Eliminate bogus/empty entries
          page,
        });
        let genre = searchParams.get("genre");
        const year = searchParams.get("year");
        let lang = searchParams.get("lang");

        if (genre === "9901") { genre = "18"; lang = "ko"; }
        else if (genre === "9902") { genre = "18"; lang = "zh"; }
        else if (genre === "9903") { genre = "16"; lang = "ja"; }

        if (genre) params.set("with_genres", genre);
        if (year) params.set("primary_release_year", year);
        if (lang) params.set("with_original_language", lang.replace(/,/g, "|"));
        
        url = `${TMDB_BASE}/discover/movie?${params.toString()}`;
        break;
      }

      default: {
        // Discover movies
        const params = new URLSearchParams({
          language: "en-US",
          include_adult: "false",
          include_video: "false",
          sort_by: searchParams.get("sort") || "popularity.desc",
          page,
        });
        let genre = searchParams.get("genre");
        const year = searchParams.get("year");
        let lang = searchParams.get("lang");
        const rating = searchParams.get("rating");
        const runtime = searchParams.get("runtime");
        const keyword = validateId(searchParams.get("keyword"));

        // Handle virtual genres
        if (genre === "9901") { genre = "18"; lang = "ko"; } // K-Drama (Drama + Korean)
        else if (genre === "9902") { genre = "18"; lang = "zh"; } // C-Drama (Drama + Chinese)
        else if (genre === "9903") { genre = "16"; lang = "ja"; } // Anime (Animation + Japanese)

        if (genre) params.set("with_genres", genre);
        if (year) params.set("primary_release_year", year);
        if (lang) params.set("with_original_language", lang.replace(/,/g, "|"));
        if (rating) params.set("vote_average.gte", rating);
        if (runtime) params.set("with_runtime.lte", runtime);
        if (keyword) params.set("with_keywords", keyword);
        url = `${TMDB_BASE}/discover/movie?${params.toString()}`;
        break;
      }
    }

    const res = await fetch(url, { headers });
    if (!res.ok) {
      return NextResponse.json({ error: `TMDB API error: ${res.status}` }, { status: res.status });
    }
    const data = await res.json();

    // Attach clearlogos for all movie-list actions
    const resolvedAction = action === "discover" || !action ? "discover" : action;
    if (MOVIE_LIST_ACTIONS.has(resolvedAction) && Array.isArray(data.results)) {
      data.results = await attachLogos(data.results);
    }

    // Cache TMDB responses at CDN for 5 min, serve stale for up to 10 min
    const cacheResponse = NextResponse.json(data);
    cacheResponse.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    return cacheResponse;
  } catch (error) {
    console.error("TMDB API error:", error);
    return NextResponse.json({ error: "Failed to fetch from TMDB" }, { status: 500 });
  }
}
