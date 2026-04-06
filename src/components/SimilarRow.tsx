"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { TMDBMovie } from "@/lib/types";
import { posterUrl } from "@/lib/constants";
import SkeletonCard from "./SkeletonCard";

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

  // Don't render anything if loaded and no results
  if (loaded && movies.length === 0) return null;

  return (
    <div ref={rowRef} className="px-4 sm:px-6 py-5 border-y-2 border-brutal-border bg-surface/40">
      <p className="text-[9px] font-mono font-black text-brutal-dim uppercase tracking-[0.25em] mb-3">
        Because you watched{" "}
        <span className="text-brutal-yellow">{seed.movieTitle}</span>
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
                <div className="aspect-[2/3] relative border-2 border-brutal-border group-hover:border-brutal-yellow transition-colors overflow-hidden">
                  {movie.poster_path ? (
                    <Image
                      src={posterUrl(movie.poster_path, "small")}
                      alt={movie.title}
                      fill
                      sizes="100px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-surface-2 flex items-center justify-center">
                      <span className="text-brutal-dim text-[8px] font-mono text-center px-1">
                        {movie.title}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-[9px] font-mono font-bold text-brutal-muted mt-1 truncate group-hover:text-brutal-white transition-colors">
                  {movie.title}
                </p>
              </button>
            ))}
      </div>
    </div>
  );
}
