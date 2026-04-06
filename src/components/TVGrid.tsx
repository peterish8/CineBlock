"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { Loader2, Tv, Star } from "lucide-react";
import { TMDBTVShow, TMDBTVDiscoverResponse, TMDBMovie } from "@/lib/types";
import { posterUrl } from "@/lib/constants";
import MovieActionRail from "./MovieActionRail";
import SkeletonCard from "./SkeletonCard";
import SimilarRow from "./SimilarRow";

const CHUNK_SIZE = 18;

interface TVGridProps {
  filters: {
    query: string;
    genre: string;
    year: string;
    language: string;
    sort: string;
    rating?: string;
    runtime?: string;
  };
  onShowClick: (show: TMDBTVShow) => void;
  watchedIds?: Set<number>;
  watched?: { movieId: number; movieTitle: string }[];
  onMovieClick?: (movie: TMDBMovie) => void;
}

export default function TVGrid({ filters, onShowClick, watchedIds, watched, onMovieClick }: TVGridProps) {
  const [shows, setShows] = useState<TMDBTVShow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchShows = useCallback(
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
          params.set("action", "search-tv");
          params.set("query", filters.query);
        } else {
          params.set("action", "discover-tv");
          if (filters.genre) params.set("genre", filters.genre);
          if (filters.year) params.set("year", filters.year);
          if (filters.language) params.set("lang", filters.language);
          if (filters.sort) params.set("sort", filters.sort);
          if (filters.rating) params.set("rating", filters.rating);
          if (filters.runtime) params.set("runtime", filters.runtime);
        }

        const res = await fetch(`/api/movies?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(`API error: ${res.status}`);

        const data: TMDBTVDiscoverResponse = await res.json();
        setShows((prev) => (append ? [...prev, ...data.results] : data.results));
        setTotalPages(data.total_pages);
        setPage(pageNum);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        setError("Failed to load TV shows.");
        console.error(err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    setShows([]);
    setPage(1);
    fetchShows(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.query, filters.genre, filters.year, filters.language, filters.sort]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && !loadingMore && page < totalPages) {
          fetchShows(page + 1, true);
        }
      },
      { rootMargin: "400px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [page, totalPages, loading, loadingMore, fetchShows]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-4">
        <div className="brutal-card p-8 max-w-md w-full">
          <Tv className="w-12 h-12 text-brutal-cyan mx-auto mb-4" strokeWidth={2} />
          <p className="text-brutal-white font-display font-bold text-lg uppercase mb-2">ERROR</p>
          <p className="text-brutal-muted text-sm font-mono">{error}</p>
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

  if (shows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-4">
        <div className="brutal-card p-8 max-w-md w-full">
          <p className="text-brutal-white font-display font-bold text-lg uppercase mb-2">NO SHOWS</p>
          <p className="text-brutal-muted text-sm font-mono">Try adjusting your filters</p>
        </div>
      </div>
    );
  }

  // Filter out watched shows
  const visibleShows = watchedIds && watchedIds.size > 0
    ? shows.filter((s) => !watchedIds.has(s.id))
    : shows;

  // Chunk into groups of CHUNK_SIZE for SimilarRow injection
  const chunks: TMDBTVShow[][] = [];
  for (let i = 0; i < visibleShows.length; i += CHUNK_SIZE) {
    chunks.push(visibleShows.slice(i, i + CHUNK_SIZE));
  }
  const hasSimilar = watched && watched.length > 0 && onMovieClick;

  return (
    <>
      {chunks.map((chunk, chunkIndex) => (
        <div key={chunkIndex}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 px-4 sm:px-6">
            {chunk.map((show, i) => {
              const year = show.first_air_date?.split("-")[0] || "—";
              const rating = show.vote_average?.toFixed(1) || "0";
              const hasImage = show.poster_path !== null;
              const asMovie = {
                id: show.id,
                title: show.name,
                original_title: show.original_name,
                overview: show.overview,
                poster_path: show.poster_path,
                backdrop_path: show.backdrop_path,
                release_date: show.first_air_date,
                vote_average: show.vote_average,
                vote_count: show.vote_count,
                genre_ids: show.genre_ids,
                original_language: show.original_language,
                popularity: show.popularity,
                adult: false,
                media_type: "tv" as const,
              };

              return (
                <button
                  key={`${show.id}-${i}`}
                  onClick={() => onShowClick(show)}
                  className="group brutal-poster relative aspect-[2/3] w-full focus:outline-none animate-fade-in"
                  style={{ animationDelay: `${(i % 20) * 40}ms` }}
                >
                  {hasImage ? (
                    <Image
                      src={posterUrl(show.poster_path, "medium")}
                      alt={show.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-surface-2 p-3">
                      <span className="text-brutal-muted text-xs font-mono font-bold text-center uppercase">
                        {show.name}
                      </span>
                    </div>
                  )}

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-100">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-brutal-white text-xs font-display font-bold uppercase leading-tight line-clamp-2">
                        {show.name}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1 text-brutal-yellow">
                          <Star className="w-3.5 h-3.5 fill-current" strokeWidth={2.5} />
                          <span className="text-[11px] font-mono font-bold">{rating}</span>
                        </span>
                        <span className="text-[11px] font-mono font-bold text-brutal-dim">{year}</span>
                      </div>
                    </div>
                  </div>

                  {/* Rating badge */}
                  <div className="absolute top-0 right-0 bg-black border-b-3 border-l-3 border-brutal-border px-2 py-1 flex items-center gap-1">
                    <Star className="w-3 h-3 text-brutal-yellow fill-current" />
                    <span className="text-[10px] font-mono font-bold text-brutal-yellow">{rating}</span>
                  </div>

                  <MovieActionRail movie={asMovie} actions={["watchlist", "add"]} />

                  {/* TV badge — bottom left */}
                  <div className="absolute bottom-0 left-0 bg-brutal-cyan text-black border-t-3 border-r-3 border-brutal-border px-1.5 py-1">
                    <Tv className="w-3 h-3" strokeWidth={3} />
                  </div>
                </button>
              );
            })}
          </div>

          {hasSimilar && (
            <SimilarRow
              seed={watched![chunkIndex % watched!.length]}
              mediaType="tv"
              onMovieClick={onMovieClick!}
            />
          )}
        </div>
      ))}

      <div ref={sentinelRef} className="flex justify-center py-8">
        {loadingMore && (
          <div className="brutal-chip flex items-center gap-2 text-brutal-cyan border-brutal-cyan">
            <Loader2 className="w-4 h-4 animate-spin" />
            LOADING MORE...
          </div>
        )}
      </div>

      <div className="text-center pb-6">
        <span className="brutal-chip text-brutal-dim inline-block">
          {visibleShows.length} TV SHOWS · PAGE {page}/{totalPages}
        </span>
      </div>
    </>
  );
}
