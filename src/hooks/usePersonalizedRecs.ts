"use client";

/**
 * usePersonalizedRecs
 *
 * Permanently stores curated movie cards in localStorage.
 * Never expires — cards are always shown.
 *
 * Smart refresh: compares a fingerprint (sorted movie IDs) of the
 * current watched+liked list vs the one used to build the cache.
 * If new movies have been added since the last build, a silent
 * background re-fetch fires and replaces the cache seamlessly.
 *
 * API cost: 1–2 discover calls per "new movies added" event.
 * Zero calls when the list hasn't changed.
 */

import { useEffect, useRef, useState } from "react";
import { TMDBMovie } from "@/lib/types";

const CACHE_KEY = "cb_personalized_recs";
const FINGERPRINT_KEY = "cb_personalized_fingerprint";

// ── Persistence helpers ───────────────────────────────────────────────────────

function readCache(): TMDBMovie[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as TMDBMovie[]) : [];
  } catch {
    return [];
  }
}

function writeCache(movies: TMDBMovie[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(movies));
  } catch {
    // Storage full — silently skip
  }
}

/** A stable fingerprint of which movies were used to build the profile */
function buildFingerprint(movieIds: number[]): string {
  return [...movieIds].sort((a, b) => a - b).join(",");
}

function readFingerprint(): string {
  try {
    return localStorage.getItem(FINGERPRINT_KEY) ?? "";
  } catch {
    return "";
  }
}

function writeFingerprint(fp: string) {
  try {
    localStorage.setItem(FINGERPRINT_KEY, fp);
  } catch {}
}

// ── Taste profile ─────────────────────────────────────────────────────────────

interface TasteProfile {
  topGenres: number[];
  ratingFloor: number;
  dominantLang: string | null;
}

function buildProfile(movies: TMDBMovie[]): TasteProfile | null {
  const meaningful = movies.filter(
    (m) => m.genre_ids && m.genre_ids.length > 0 && m.vote_average > 0
  );
  if (meaningful.length < 2) return null;

  // Genre frequency
  const genreCount: Record<number, number> = {};
  for (const m of meaningful) {
    for (const g of m.genre_ids) {
      genreCount[g] = (genreCount[g] || 0) + 1;
    }
  }
  const topGenres = Object.entries(genreCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([id]) => Number(id));

  // Rating floor (avg floored to 0.5, capped 5–8)
  const avgRating =
    meaningful.reduce((s, m) => s + m.vote_average, 0) / meaningful.length;
  const ratingFloor = Math.max(5, Math.min(8, Math.floor(avgRating * 2) / 2));

  // Language dominance (>40% share a non-en language)
  const langCount: Record<string, number> = {};
  for (const m of meaningful) {
    if (m.original_language) {
      langCount[m.original_language] = (langCount[m.original_language] || 0) + 1;
    }
  }
  const topLang = Object.entries(langCount).sort((a, b) => b[1] - a[1])[0];
  const dominantLang =
    topLang && topLang[1] / meaningful.length > 0.4 && topLang[0] !== "en"
      ? topLang[0]
      : null;

  return { topGenres, ratingFloor, dominantLang };
}

// ── Build discover URL params from profile ────────────────────────────────────

function buildDiscoverParams(profile: TasteProfile, genreIndex: 0 | 1): URLSearchParams {
  const genre = profile.topGenres[genreIndex];
  const params = new URLSearchParams({
    action: "discover",
    sort: "vote_average.desc",
    page: "1",
  });
  if (genre) params.set("genre", String(genre));
  if (profile.ratingFloor) params.set("rating", String(profile.ratingFloor));
  if (profile.dominantLang) params.set("lang", profile.dominantLang);
  return params;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

interface UsePersonalizedRecsOptions {
  watched: TMDBMovie[];
  liked: TMDBMovie[];
  excludeIds?: Set<number>;
  limit?: number;
  skip?: boolean;
}

interface UsePersonalizedRecsResult {
  cards: TMDBMovie[];
  loading: boolean;
}

export function usePersonalizedRecs({
  watched,
  liked,
  excludeIds,
  limit = 12,
  skip = false,
}: UsePersonalizedRecsOptions): UsePersonalizedRecsResult {
  // Always initialize from localStorage — so recs are visible immediately on load
  const [cards, setCards] = useState<TMDBMovie[]>(() => readCache().slice(0, limit));
  const [loading, setLoading] = useState(false);
  const fetchingRef = useRef(false);

  useEffect(() => {
    if (skip || fetchingRef.current) return;

    // Dedupe watched + liked into one pool
    const seen = new Set<number>();
    const allMovies: TMDBMovie[] = [];
    for (const m of [...watched, ...liked]) {
      if (!seen.has(m.id)) {
        seen.add(m.id);
        allMovies.push(m);
      }
    }

    if (allMovies.length < 2) return;

    // Check if the user's list has changed since last build
    const currentFingerprint = buildFingerprint(allMovies.map((m) => m.id));
    const storedFingerprint = readFingerprint();

    // If nothing changed AND we already have cached cards, skip re-fetch
    if (currentFingerprint === storedFingerprint && cards.length > 0) return;

    // Something changed — run a background refresh
    fetchingRef.current = true;
    const profile = buildProfile(allMovies);
    if (!profile) {
      fetchingRef.current = false;
      return;
    }

    // Only show loading spinner if there are no cached cards yet
    if (cards.length === 0) setLoading(true);

    const numCalls = profile.topGenres.length >= 2 ? 2 : 1;
    const calls = Array.from({ length: numCalls }, (_, i) => {
      const params = buildDiscoverParams(profile, i as 0 | 1);
      return fetch(`/api/movies?${params.toString()}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => (data?.results as TMDBMovie[]) ?? [])
        .catch(() => []);
    });

    Promise.all(calls)
      .then((resultSets) => {
        // Merge, dedupe, and exclude already-watched/liked + grid movies
        const allWatchedIds = new Set(allMovies.map((m) => m.id));
        const merged: TMDBMovie[] = [];
        const addedIds = new Set<number>();

        for (const results of resultSets) {
          for (const m of results) {
            if (
              !addedIds.has(m.id) &&
              !allWatchedIds.has(m.id) &&
              !(excludeIds?.has(m.id))
            ) {
              addedIds.add(m.id);
              merged.push({ ...m, media_type: "movie" });
            }
          }
        }

        const final = merged.slice(0, limit);

        // Persist both the cards and the fingerprint permanently
        writeCache(final);
        writeFingerprint(currentFingerprint);

        // Update UI — seamless if old cards were already showing
        setCards(final);
      })
      .finally(() => {
        setLoading(false);
        fetchingRef.current = false;
      });
  // Re-run when the pool size changes (new like/watch)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watched.length, liked.length, skip]);

  return { cards, loading };
}
