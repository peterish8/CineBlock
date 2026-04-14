"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { TMDBMovie } from "@/lib/types";
import { posterUrl } from "@/lib/constants";
import SkeletonCard from "./SkeletonCard";
import { useThemeMode } from "@/hooks/useThemeMode";

interface SimilarRowProps {
  seed: { movieId: number; movieTitle: string };
  mediaType: "movie" | "tv";
  onMovieClick: (movie: TMDBMovie) => void;
}

export default function SimilarRow({ seed, mediaType, onMovieClick }: SimilarRowProps) {
  const [movies, setMovies] = useState<TMDBMovie[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [visible, setVisible] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const isGlass = useThemeMode() === "glass";

  // Lazy-load: only fetch when row scrolls into view
  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;

    const action = mediaType === "tv" ? "recommendations-tv" : "recommendations";

    fetch(`/api/movies?action=${action}&id=${seed.movieId}`)
      .then((r) => r.json())
      .then((data) => {
        const results: TMDBMovie[] = (data.results ?? []).slice(0, 12).map((m: TMDBMovie) => ({
          ...m,
          media_type: mediaType,
        }));
        setMovies(results);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [visible, seed.movieId, mediaType]);

  if (loaded && movies.length === 0) return null;

  return (
    <div
      ref={rowRef}
      className={`px-4 sm:px-6 py-5 ${isGlass ? "" : "border-y-2 border-brutal-border bg-surface/40"}`}
      style={isGlass ? {
        borderTop: "1px solid rgba(255,255,255,0.07)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      } : undefined}
    >
      <p className={`text-[9px] font-bold uppercase tracking-[0.25em] mb-3 ${isGlass ? "text-slate-500" : "font-mono font-black text-brutal-dim"}`}>
        Because you watched{" "}
        <span className={isGlass ? "text-amber-400" : "text-brutal-yellow"}>{seed.movieTitle}</span>
      </p>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
        {!loaded
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-[100px] shrink-0">
                <SkeletonCard />
              </div>
            ))
          : movies.map((movie) => (
              <button
                key={movie.id}
                onClick={() => onMovieClick(movie)}
                className="w-[100px] shrink-0 group text-left focus:outline-none"
              >
                <div
                  className={`aspect-[2/3] relative overflow-hidden transition-all ${
                    isGlass
                      ? "rounded-xl group-hover:ring-1 group-hover:ring-white/25 group-hover:-translate-y-0.5"
                      : "border-2 border-brutal-border group-hover:border-brutal-yellow transition-colors"
                  }`}
                  style={isGlass ? { border: "1px solid rgba(255,255,255,0.10)" } : undefined}
                >
                  {movie.poster_path ? (
                    <Image
                      src={posterUrl(movie.poster_path, "small")}
                      alt={movie.title}
                      fill
                      sizes="100px"
                      className="object-cover"
                    />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center ${isGlass ? "bg-white/5" : "bg-surface-2"}`}>
                      <span className={`text-[8px] font-bold text-center px-1 ${isGlass ? "text-slate-500" : "font-mono text-brutal-dim"}`}>
                        {movie.title}
                      </span>
                    </div>
                  )}
                </div>
                <p className={`text-[9px] font-bold mt-1 truncate transition-colors ${
                  isGlass
                    ? "text-slate-400 group-hover:text-white"
                    : "font-mono text-brutal-muted group-hover:text-brutal-white"
                }`}>
                  {movie.title}
                </p>
              </button>
            ))}
      </div>
    </div>
  );
}
