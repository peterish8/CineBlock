import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { buildFranchise, FranchiseNotFoundError, type FranchiseDefinition } from "@/lib/franchiseBuilder";
import { FRANCHISE_SEED } from "@/lib/franchiseSeed";

const TMDB_BASE = "https://api.themoviedb.org/3";
const API_KEY = process.env.TMDB_API_KEY || "";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexHttpClient(convexUrl) : null;

/** Franchise Vault snapshot from Convex; null when missing or Convex is unreachable. */
async function readFranchiseSnapshot(collectionId: number) {
  if (!convex) {
    return null;
  }
  try {
    const snap = await convex.query(api.franchises.getSnapshot, { collectionId });
    return snap && snap.parts.length > 0 ? snap : null;
  } catch (err) {
    console.error("Franchise snapshot read failed, falling back to TMDB:", err);
    return null;
  }
}

/**
 * How to build a franchise live: its definition from the Convex catalog. Only if the
 * catalog can't answer (fresh deployment before the first sync, or Convex down) does
 * it fall back to the bootstrap seed, and finally to treating the key as a plain
 * TMDB collection id.
 */
async function readFranchiseDefinition(key: number): Promise<FranchiseDefinition> {
  if (convex) {
    try {
      const def = await convex.query(api.franchises.getDefinition, { key });
      if (def) {
        return def;
      }
    } catch (err) {
      console.error("Franchise definition read failed, using seed:", err);
    }
  }
  const seed = FRANCHISE_SEED.find((s) => s.key === key);
  if (seed) {
    return seed;
  }
  return { key, name: "", source: { type: "collection", tmdbCollectionId: key } };
}

const headers: HeadersInit = {
  Authorization: `Bearer ${API_KEY}`,
  "Content-Type": "application/json;charset=utf-8",
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// How many requests we're willing to have in flight against TMDB at once
const TMDB_CONCURRENCY = 6;

/**
 * TMDB drops connections (ECONNRESET) fairly often, especially when we fan out,
 * which used to surface as a 500 on an otherwise healthy request. Retry those and
 * rate limits; hand 4xx straight back since retrying won't change the answer.
 * Returns null when every attempt failed at the network level.
 */
async function tmdbFetch(url: string, attempts = 3): Promise<Response | null> {
  let lastResponse: Response | null = null;
  let lastError: unknown = null;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { headers });
      if (res.ok || (res.status !== 429 && res.status < 500)) return res;
      lastResponse = res;
    } catch (err) {
      lastResponse = null; // network drop — retry below
      lastError = err;
    }
    if (i < attempts - 1) await sleep(200 * (i + 1));
  }
  if (!lastResponse) {
    console.error(`TMDB unreachable after ${attempts} attempts: ${url.split("?")[0]}`, lastError);
  }
  return lastResponse;
}

async function tmdbJson<T = Record<string, unknown>>(url: string): Promise<T | null> {
  const res = await tmdbFetch(url);
  if (!res?.ok) return null;
  return res.json().catch(() => null);
}

// Firing 20 requests at TMDB at once drops a few connections, so keep the fan-out bounded
async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (cursor < items.length) {
        const i = cursor++;
        out[i] = await fn(items[i]);
      }
    })
  );
  return out;
}

// Batch-fetch clearlogos for an array of movies and attach logo_path to each
async function attachLogos<T extends { id: number }>(movies: T[]): Promise<(T & { logo_path: string | null })[]> {
  if (!movies.length) return movies.map((m) => ({ ...m, logo_path: null }));
  const images = await mapWithConcurrency(movies, TMDB_CONCURRENCY, (m) =>
    tmdbJson(`${TMDB_BASE}/movie/${m.id}/images?include_image_language=en,null`)
  );
  return movies.map((m, i) => {
    const logos = (images[i]?.logos ?? []) as { file_path: string; iso_639_1: string | null }[];
    const best = logos.find((l) => l.iso_639_1 === "en") ?? logos[0] ?? null;
    return { ...m, logo_path: best?.file_path ?? null };
  });
}

// Batch-fetch worldwide gross for an array of movies. /discover results omit `revenue`,
// so it has to come from the details endpoint one movie at a time.
async function attachRevenue<T extends { id: number }>(movies: T[]): Promise<(T & { revenue: number })[]> {
  if (!movies.length) return [];
  const details = await mapWithConcurrency(movies, TMDB_CONCURRENCY, (m) => tmdbJson(`${TMDB_BASE}/movie/${m.id}`));
  return movies.map((m, i) => {
    const revenue = typeof details[i]?.revenue === "number" ? (details[i]!.revenue as number) : 0;
    return { ...m, revenue };
  });
}

const TMDB_UNREACHABLE = () =>
  NextResponse.json({ error: "TMDB is unreachable, please retry" }, { status: 502 });

// --- Rate limiting: 60 requests per minute per IP ---
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT = 120;
const RATE_WINDOW_MS = 60_000;

function isRateLimited(request: NextRequest): boolean {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const now = Date.now();
  const timestamps = (rateLimitMap.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (timestamps.length >= RATE_LIMIT) return true;
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  return false;
}

// Actions whose response has a `results` array of movies (not TV)
const MOVIE_LIST_ACTIONS = new Set([
  "recommendations",
  "similar",
  "box-office",
  "discover", // default action
]);

export async function GET(request: NextRequest) {
  if (isRateLimited(request)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60" } });
  }
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "discover";
  const includeLogos = searchParams.get("include_logos") === "1";

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
        const searchRes = await tmdbFetch(url);
        if (!searchRes) return TMDB_UNREACHABLE();
        if (!searchRes.ok) return NextResponse.json({ error: `TMDB API error: ${searchRes.status}` }, { status: searchRes.status });
        const searchData = await searchRes.json();
        if (lang) {
          const langs = lang.split(',');
          searchData.results = (searchData.results || []).filter(
            (m: { original_language: string }) => langs.includes(m.original_language)
          );
        }
        if (includeLogos) searchData.results = await attachLogos(searchData.results || []);
        return NextResponse.json(searchData);
      }

      case "search-person": {
        // Search for a person (director/actor) by name, return top matches
        const query = (searchParams.get("query") || "").slice(0, 150);
        if (!query.trim()) return NextResponse.json({ results: [] });
        const params = new URLSearchParams({ query, language: "en-US", include_adult: "false", page });
        const res = await tmdbFetch(`${TMDB_BASE}/search/person?${params.toString()}`);
        if (!res) return TMDB_UNREACHABLE();
        if (!res.ok) return NextResponse.json({ error: `TMDB API error: ${res.status}` }, { status: res.status });
        const data = await res.json();
        // Return only relevant fields, top 8
        const results = (data.results || []).slice(0, 8).map((p: { id: number; name: string; profile_path: string | null; known_for_department: string; known_for?: { title?: string; name?: string }[] }) => ({
          id: p.id,
          name: p.name,
          profile_path: p.profile_path,
          known_for_department: p.known_for_department,
          known_for: (p.known_for || []).slice(0, 2).map((k) => k.title || k.name),
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
        const res = await tmdbFetch(`${TMDB_BASE}/discover/movie?${params.toString()}`);
        if (!res) return TMDB_UNREACHABLE();
        if (!res.ok) return NextResponse.json({ error: `TMDB API error: ${res.status}` }, { status: res.status });
        const data = await res.json();
        if (includeLogos) data.results = await attachLogos((data.results || []).slice(0, 20));
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
        const trendingRes = await tmdbFetch(url);
        if (!trendingRes) return TMDB_UNREACHABLE();
        if (!trendingRes.ok) return NextResponse.json({ error: `TMDB API error: ${trendingRes.status}` }, { status: trendingRes.status });
        const trendingData = await trendingRes.json();
        if (includeLogos) trendingData.results = await attachLogos(trendingData.results?.slice(0, 20) || []);
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
        const collectionId = validateId(searchParams.get("id"));
        if (!collectionId) return NextResponse.json({ error: "Collection ID required" }, { status: 400 });
        const numericId = Number(collectionId);

        // 1) Serve the snapshot the "franchise vault sync" cron keeps fresh in Convex
        const snapshot = await readFranchiseSnapshot(numericId);
        if (snapshot) {
          const res = NextResponse.json(snapshot);
          res.headers.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
          return res;
        }

        // 2) Not synced yet (new catalog entry / Convex unreachable): build it live from TMDB.
        //    Same builder the cron uses, so MCU / Spider-Man follow the same auto rules.
        try {
          const def = await readFranchiseDefinition(numericId);
          const { snapshot: live } = await buildFranchise(def, API_KEY);
          const res = NextResponse.json({ id: live.collectionId, ...live });
          res.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
          return res;
        } catch (err) {
          if (err instanceof FranchiseNotFoundError) {
            return NextResponse.json({ error: "Franchise not found" }, { status: 404 });
          }
          console.error(`Franchise ${collectionId} live build failed:`, err);
          return TMDB_UNREACHABLE();
        }
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
        else if (genre === "9902") { genre = "18"; lang = "zh,cn"; } // C-Drama (Drama + Chinese Mandarin/Cantonese)
        else if (genre === "9903") { genre = "16"; lang = "ja"; } // Anime (Animation + Japanese)

        if (genre) params.set("with_genres", genre);
        if (year) params.set("first_air_date_year", year);
        if (lang) params.set("with_original_language", lang.replace(/,/g, "|"));
        if (rating) params.set("vote_average.gte", rating);
        if (runtime) params.set("with_runtime.lte", runtime);
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
        else if (genre === "9902") { genre = "18"; lang = "zh,cn"; }
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
        else if (genre === "9902") { genre = "18"; lang = "zh,cn"; } // C-Drama (Drama + Chinese Mandarin/Cantonese)
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

    const res = await tmdbFetch(url);
    if (!res) return TMDB_UNREACHABLE();
    if (!res.ok) {
      return NextResponse.json({ error: `TMDB API error: ${res.status}` }, { status: res.status });
    }
    const data = await res.json();

    // Attach clearlogos only when the caller opts in via include_logos=1
    const resolvedAction = action === "discover" || !action ? "discover" : action;
    if (includeLogos && MOVIE_LIST_ACTIONS.has(resolvedAction) && Array.isArray(data.results)) {
      data.results = await attachLogos(data.results);
    }

    // The box-office grid renders gross per card, which /discover doesn't return
    if (resolvedAction === "box-office" && Array.isArray(data.results)) {
      data.results = await attachRevenue(data.results);
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
