"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { TMDBMovie, TMDBDiscoverResponse } from "@/lib/types";
import PosterCard from "./PosterCard";
import SkeletonCard from "./SkeletonCard";
import { Loader2, Film } from "lucide-react";

// After this many main-grid cards, inject personalized rec cards inline
const INJECT_AFTER = 18;

interface PosterGridProps {
  filters: {
    query: string;
    genre: string;
    year: string;
    language: string;
    sort: string;
    rating?: string;
    runtime?: string;
    keyword?: string;
  };
  onMovieClick: (movie: TMDBMovie) => void;
  /** IDs to hide immediately (watched + liked + watchlist) */
  hiddenIds?: Set<number>;
  /** Pre-computed personalized cards from usePersonalizedRecs — injected inline */
  personalizedCards?: TMDBMovie[];
}

export default function PosterGrid({
  filters,
  onMovieClick,
  hiddenIds,
  personalizedCards = [],
}: PosterGridProps) {
  const [movies, setMovies] = useState<TMDBMovie[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchMovies = useCallback(
    async (pageNum: number, append: boolean = false) => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      if (!append) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      try {
        const params = new URLSearchParams({ page: pageNum.toString() });

        if (filters.query) {
          params.set("action", "search");
          params.set("query", filters.query);
          if (filters.year) params.set("year", filters.year);
          if (filters.language) params.set("lang", filters.language);
        } else {
          params.set("action", "discover");
          if (filters.genre) params.set("genre", filters.genre);
          if (filters.year) params.set("year", filters.year);
          if (filters.language) params.set("lang", filters.language);
          if (filters.sort) params.set("sort", filters.sort);
          if (filters.rating) params.set("rating", filters.rating);
          if (filters.runtime) params.set("runtime", filters.runtime);
          if (filters.keyword) params.set("keyword", filters.keyword);
        }

        const res = await fetch(`/api/movies?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(`API error: ${res.status}`);

        const data: TMDBDiscoverResponse = await res.json();
        setMovies((prev) => {
          const merged = append ? [...prev, ...data.results] : data.results;
          const seen = new Set<number>();
          return merged.filter((m) => seen.has(m.id) ? false : (seen.add(m.id), true));
        });
        setTotalPages(data.total_pages);
        setPage(pageNum);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        setError("Failed to load movies. Check your API key.");
        console.error(err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    setMovies([]);
    setPage(1);
    fetchMovies(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.query, filters.genre, filters.year, filters.language, filters.sort]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && !loadingMore && page < totalPages) {
          fetchMovies(page + 1, true);
        }
      },
      { rootMargin: "400px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [page, totalPages, loading, loadingMore, fetchMovies]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-4">
        <div className="brutal-card p-8 max-w-md w-full">
          <Film className="w-12 h-12 text-brutal-yellow mx-auto mb-4" strokeWidth={2} />
          <p className="text-brutal-white font-display font-bold text-lg uppercase mb-2">
            No Connection
          </p>
          <p className="text-brutal-muted text-sm font-mono">{error}</p>
          <p className="text-brutal-dim text-xs font-mono mt-3 border-t-2 border-brutal-border pt-3">
            Add your TMDB API key to .env.local
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 px-4 sm:px-6">
        {Array.from({ length: 15 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (movies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-4">
        <div className="brutal-card p-8 max-w-md w-full">
          <p className="text-brutal-white font-display font-bold text-lg uppercase mb-2">
            No Results
          </p>
          <p className="text-brutal-muted text-sm font-mono">
            Try adjusting your filters
          </p>
        </div>
      </div>
    );
  }

  // Hide any movies the user has already interacted with (watched, liked, watchlisted)
  const visibleMovies = hiddenIds && hiddenIds.size > 0
    ? movies.filter((m) => !hiddenIds.has(m.id))
    : movies;

  // Filter personalized cards: remove anything already in the main grid
  const mainIds = new Set(visibleMovies.map((m) => m.id));
  const filteredPersonalized = personalizedCards.filter(
    (m) => !mainIds.has(m.id) && !(hiddenIds?.has(m.id))
  );

  // Inject personalized cards after INJECT_AFTER main cards (only if no filters active)
  const hasActiveFilters =
    filters.query || filters.genre || filters.year || filters.language ||
    filters.sort !== "popularity.desc" || filters.rating || filters.runtime || filters.keyword;

  let allCards: TMDBMovie[];
  if (!hasActiveFilters && filteredPersonalized.length > 0 && visibleMovies.length >= INJECT_AFTER) {
    allCards = [
      ...visibleMovies.slice(0, INJECT_AFTER),
      ...filteredPersonalized,
      ...visibleMovies.slice(INJECT_AFTER),
    ];
  } else {
    allCards = visibleMovies;
  }

  // Final dedup
  const seen = new Set<number>();
  const dedupedCards = allCards.filter((m) => seen.has(m.id) ? false : (seen.add(m.id), true));

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 px-4 sm:px-6">
        {dedupedCards.map((movie, i) => (
          <PosterCard
            key={movie.id}
            movie={movie}
            onClick={() => onMovieClick(movie)}
            index={i % 20}
          />
        ))}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="flex justify-center py-8">
        {loadingMore && (
          <div className="brutal-chip flex items-center gap-2 text-brutal-yellow border-brutal-yellow">
            <Loader2 className="w-4 h-4 animate-spin" />
            LOADING MORE...
          </div>
        )}
      </div>

      {/* Counter */}
      <div className="text-center pb-6">
        <span className="brutal-chip text-brutal-dim inline-block">
          {visibleMovies.length} MOVIES · PAGE {page}/{totalPages}
        </span>
      </div>
    </>
  );
}
