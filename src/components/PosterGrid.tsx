"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { TMDBMovie, TMDBDiscoverResponse } from "@/lib/types";
import PosterCard from "./PosterCard";
import SkeletonCard from "./SkeletonCard";
import { Loader2, Film } from "lucide-react";

interface PosterGridProps {
  filters: {
    query: string;
    genre: string;
    year: string;
    language: string;
    sort: string;
    rating?: string;
    runtime?: string;
    adult?: boolean;
  };
  onMovieClick: (movie: TMDBMovie) => void;
}

export default function PosterGrid({ filters, onMovieClick }: PosterGridProps) {
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
          if (filters.adult) params.set("include_adult", "true");
        }

        const res = await fetch(`/api/movies?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(`API error: ${res.status}`);

        const data: TMDBDiscoverResponse = await res.json();
        setMovies((prev) => (append ? [...prev, ...data.results] : data.results));
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

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 px-4 sm:px-6">
        {movies.map((movie, i) => (
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
          {movies.length} MOVIES · PAGE {page}/{totalPages}
        </span>
      </div>
    </>
  );
}
