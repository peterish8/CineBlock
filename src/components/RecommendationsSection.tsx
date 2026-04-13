"use client";

import { useEffect, useState, useCallback } from "react";
import { TMDBMovie, TMDBDiscoverResponse } from "@/lib/types";
import { useMovieLists } from "@/hooks/useMovieLists";
import PosterCard from "./PosterCard";
import { Sparkles, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

interface RecommendationsSectionProps {
  onMovieClick: (movie: TMDBMovie) => void;
}

export default function RecommendationsSection({ onMovieClick }: RecommendationsSectionProps) {
  const { liked: watchlist } = useMovieLists();
  const [movies, setMovies] = useState<TMDBMovie[]>([]);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchRecommendations = useCallback(async () => {
    if (watchlist.length === 0) {
      setMovies([]);
      return;
    }

    setLoading(true);
    try {
      // Fetch from up to 3 watchlisted movies
      const moviesToFetch = watchlist.slice(0, 3);
      const results = await Promise.allSettled(
        moviesToFetch.map(async (movie) => {
          const isTv = !!movie.name || !!movie.first_air_date;
          const recAction = isTv ? "recommendations-tv" : "recommendations";
          const res = await fetch(`/api/movies?action=${recAction}&id=${movie.id}&include_logos=1`);
          if (!res.ok) throw new Error("Failed");
          const data: TMDBDiscoverResponse = await res.json();
          return data.results;
        })
      );

      // Flatten, deduplicate, exclude already-saved
      const watchlistIds = new Set(watchlist.map((m) => m.id));
      const allMovies = results
        .filter((r): r is PromiseFulfilledResult<TMDBMovie[]> => r.status === "fulfilled")
        .flatMap((r) => r.value)
        .filter((m) => m.poster_path && !watchlistIds.has(m.id));

      // Deduplicate by id
      const seen = new Set<number>();
      const unique = allMovies.filter((m) => {
        if (seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      });

      setMovies(unique.slice(0, 10)); // Show max 10 on homepage
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [watchlist]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  if (watchlist.length === 0 || (movies.length === 0 && !loading)) return null;

  return (
    <section className="py-6 px-4 sm:px-6">
      <div className="max-w-[1600px] mx-auto">
        {/* Header (Clickable to toggle) */}
        <div 
          className="flex items-center justify-between mb-4 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-brutal-yellow" strokeWidth={2.5} />
            <h2 className="font-display font-bold text-lg text-brutal-white uppercase tracking-tight">
              FOR YOU
            </h2>
            <span className="brutal-chip text-brutal-dim text-[10px]">
              BASED ON {watchlist.length} SAVED
            </span>
            {isExpanded ? <ChevronUp className="w-4 h-4 text-brutal-dim" /> : <ChevronDown className="w-4 h-4 text-brutal-dim" />}
          </div>
          <Link
            href="/recommendations"
            className="brutal-btn px-3 py-1.5 flex items-center gap-1.5 text-[10px] font-mono font-bold"
            onClick={(e) => e.stopPropagation()}
          >
            VIEW ALL
            <ArrowRight className="w-3 h-3" strokeWidth={3} />
          </Link>
        </div>

        {/* Flat grid - Only show if expanded */}
        {isExpanded && (
          loading ? (
            <div className="flex justify-center py-8">
              <div className="brutal-chip flex items-center gap-2 text-brutal-yellow border-brutal-yellow">
                <div className="w-4 h-4 border-2 border-brutal-border border-t-brutal-yellow animate-spin" />
                FINDING MOVIES...
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 animate-slide-up">
              {movies.map((movie, i) => (
                <PosterCard
                  key={movie.id}
                  movie={movie}
                  onMovieClick={onMovieClick}
                  index={i}
                />
              ))}
            </div>
          )
        )}
      </div>
    </section>
  );
}
