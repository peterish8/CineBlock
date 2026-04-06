/**
 * useMovieMetaCache
 *
 * Permanent localStorage cache of movie metadata needed for local filtering:
 * - genre_ids, release_date, vote_average, original_language
 *
 * Stored as a flat Record<movieId, MovieMeta> at key "cb_movie_meta".
 * Written whenever a movie is added to any list (via saveMeta).
 * Read instantly by ListFilterBar for genre/year filtering with zero API calls.
 *
 * Usage:
 *   const { getMeta, saveMeta, getEnrichedList } = useMovieMetaCache();
 *
 *   // When adding a movie: saveMeta(movie)
 *   // To enrich a list:   getEnrichedList(movies) — fills in missing fields from cache
 */

import { TMDBMovie } from "@/lib/types";

const CACHE_KEY = "cb_movie_meta";

interface MovieMeta {
  genre_ids: number[];
  release_date: string;
  vote_average: number;
  original_language: string;
  director?: { id: number; name: string } | null;
}

type MetaStore = Record<number, MovieMeta>;

function readStore(): MetaStore {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStore(store: MetaStore) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(store));
  } catch {
    // Storage full — silently skip
  }
}

/**
 * Saves metadata for a movie into the cache.
 * Only saves fields that are actually present (non-empty).
 * Merges with existing entry so partial data doesn't overwrite full data.
 */
export function saveMovieMeta(movie: TMDBMovie, director?: { id: number; name: string } | null) {
  if (!movie?.id) return;
  
  const store = readStore();
  const existing = store[movie.id];

  const hasData =
    (movie.genre_ids && movie.genre_ids.length > 0) ||
    movie.release_date ||
    movie.vote_average > 0 ||
    director;
    
  if (!hasData && !existing) return;

  store[movie.id] = {
    genre_ids: movie.genre_ids?.length > 0 ? movie.genre_ids : existing?.genre_ids ?? [],
    release_date: movie.release_date || existing?.release_date || "",
    vote_average: movie.vote_average > 0 ? movie.vote_average : existing?.vote_average ?? 0,
    original_language: movie.original_language || existing?.original_language || "",
    director: director !== undefined ? director : existing?.director,
  };
  writeStore(store);
}

/**
 * Returns the cached metadata for a single movie ID, or null if not cached.
 */
export function getMovieMeta(id: number): MovieMeta | null {
  const store = readStore();
  return store[id] ?? null;
}

/**
 * Takes a list of TMDBMovie objects (which may have empty genre_ids / release_date)
 * and fills in any missing fields from the localStorage cache.
 * Returns an enriched copy — original objects are not mutated.
 */
export function enrichMovieList(movies: (TMDBMovie & { director?: { id: number; name: string } | null })[]): (TMDBMovie & { director?: { id: number; name: string } | null })[] {
  const store = readStore();
  return movies.map((m) => {
    const cached = store[m.id];
    if (!cached) return m;
    return {
      ...m,
      genre_ids: m.genre_ids && m.genre_ids.length > 0 ? m.genre_ids : cached.genre_ids,
      release_date: m.release_date || cached.release_date,
      vote_average: m.vote_average > 0 ? m.vote_average : cached.vote_average,
      original_language: m.original_language || cached.original_language,
      director: m.director || cached.director,
    };
  });
}

/**
 * Removes stale cache entries for movie IDs that are no longer in any list.
 * Call this when movies are removed.
 */
export function pruneMovieMeta(activeIds: Set<number>) {
  const store = readStore();
  let changed = false;
  for (const id of Object.keys(store)) {
    const numId = Number(id);
    if (!activeIds.has(numId)) {
      delete store[numId];
      changed = true;
    }
  }
  if (changed) writeStore(store);
}
