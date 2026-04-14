"use client";

import { useEffect, useState, useCallback } from "react";
import { TMDBMovie, TMDBDiscoverResponse } from "@/lib/types";
import { useMovieLists } from "@/hooks/useMovieLists";
import PosterCard from "./PosterCard";
import { Sparkles, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { useThemeMode } from "@/hooks/useThemeMode";

interface RecommendationsSectionProps {
  onMovieClick: (movie: TMDBMovie) => void;
}

export default function RecommendationsSection({ onMovieClick }: RecommendationsSectionProps) {
  const { liked: watchlist } = useMovieLists();
  const isGlass = useThemeMode() === "glass";
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

      const watchlistIds = new Set(watchlist.map((m) => m.id));
      const allMovies = results
        .filter((r): r is PromiseFulfilledResult<TMDBMovie[]> => r.status === "fulfilled")
        .flatMap((r) => r.value)
        .filter((m) => m.poster_path && !watchlistIds.has(m.id));

      const seen = new Set<number>();
      const unique = allMovies.filter((m) => {
        if (seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      });

      setMovies(unique.slice(0, 10));
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
        {/* Header */}
        <div
          className="flex items-center justify-between mb-4 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <Sparkles className={`w-5 h-5 ${isGlass ? "text-amber-400" : "text-brutal-yellow"}`} strokeWidth={2.5} />
            <h2 className={`font-display font-bold text-lg tracking-tight ${isGlass ? "text-white" : "text-brutal-white uppercase"}`}>
              {isGlass ? "For You" : "FOR YOU"}
            </h2>
            <span
              className={`px-2 py-0.5 text-[10px] font-bold ${isGlass ? "rounded-lg" : "brutal-chip text-brutal-dim"}`}
              style={isGlass ? { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(148,163,184,0.6)" } : undefined}
            >
              {isGlass ? `Based on ${watchlist.length} saved` : `BASED ON ${watchlist.length} SAVED`}
            </span>
            {isExpanded
              ? <ChevronUp className={`w-4 h-4 ${isGlass ? "text-slate-500" : "text-brutal-dim"}`} />
              : <ChevronDown className={`w-4 h-4 ${isGlass ? "text-slate-500" : "text-brutal-dim"}`} />
            }
          </div>
          <Link
            href="/recommendations"
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold transition-all active:scale-[0.97] ${
              isGlass ? "rounded-xl" : "brutal-btn font-mono font-black"
            }`}
            style={isGlass ? { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(148,163,184,0.8)" } : undefined}
            onClick={(e) => e.stopPropagation()}
          >
            View all
            <ArrowRight className="w-3 h-3" strokeWidth={3} />
          </Link>
        </div>

        {/* Grid — only when expanded */}
        {isExpanded && (
          loading ? (
            <div className="flex justify-center py-8">
              <div
                className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold ${isGlass ? "rounded-xl" : "brutal-chip text-brutal-yellow border-brutal-yellow"}`}
                style={isGlass ? { background: "rgba(251,191,36,0.10)", border: "1px solid rgba(251,191,36,0.25)", color: "#FCD34D" } : undefined}
              >
                <div className={`w-4 h-4 border-2 border-t-transparent animate-spin ${isGlass ? "rounded-full border-amber-400" : "border-brutal-border border-t-brutal-yellow"}`} />
                {isGlass ? "Finding movies..." : "FINDING MOVIES..."}
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
