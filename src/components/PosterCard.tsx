"use client";

import { memo, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { Star } from "lucide-react";
import { TMDBMovie } from "@/lib/types";
import { posterUrl, logoUrl } from "@/lib/constants";
import MovieActionRail from "@/components/MovieActionRail";
import { useThemeMode } from "@/hooks/useThemeMode";

interface PosterCardProps {
  movie: TMDBMovie;
  onMovieClick: (movie: TMDBMovie) => void;
  index: number;
}

const PosterCard = memo(function PosterCard({ movie, onMovieClick, index }: PosterCardProps) {
  const onClick = useCallback(() => onMovieClick(movie), [onMovieClick, movie]);
  const hasImage = movie.poster_path !== null;
  const year = movie.release_date?.split("-")[0] || movie.first_air_date?.split("-")[0] || "—";
  const rating = movie.vote_average?.toFixed(1) || "N/A";
  const cardRef = useRef<HTMLButtonElement>(null);
  const rafRef = useRef<number | null>(null);
  const theme = useThemeMode();
  const isGlass = theme === "glass";

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const prefetchBackdrop = useCallback(() => {
    if (!movie.backdrop_path) return;
    const img = new window.Image();
    img.src = `https://image.tmdb.org/t/p/w780${movie.backdrop_path}`;
  }, [movie.backdrop_path]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!isGlass || !cardRef.current) return;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const el = cardRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const cx = (e.clientX - rect.left) / rect.width - 0.5;
        const cy = (e.clientY - rect.top) / rect.height - 0.5;
        const rotX = (-cy * 7).toFixed(2);
        const rotY = (cx * 9).toFixed(2);
        const glowX = (50 + cx * 60).toFixed(1);
        const glowY = (50 + cy * 60).toFixed(1);
        el.style.transform = `perspective(700px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.03)`;
        el.style.setProperty("--glow-x", `${glowX}%`);
        el.style.setProperty("--glow-y", `${glowY}%`);
      });
    },
    [isGlass]
  );

  const resetGlassTilt = useCallback(() => {
    if (!isGlass || !cardRef.current) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    cardRef.current.style.transform = "";
  }, [isGlass]);

  const renderPosterMedia = (fillMode: "cover" | "top" = "cover") => {
    if (hasImage) {
      return (
        <Image
          src={posterUrl(movie.poster_path, "medium")}
          alt={movie.title || movie.name || "Movie poster"}
          fill
          className={fillMode === "top" ? "object-cover object-top" : "object-cover"}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          loading="lazy"
        />
      );
    }

    return (
      <div className="flex h-full w-full items-center justify-center bg-surface-2 p-3">
        <span className="text-center font-mono text-xs font-bold uppercase leading-tight text-brutal-muted">
          {movie.title || movie.name}
        </span>
      </div>
    );
  };

  return (
    <div className="relative aspect-[2/3] w-full">
      <button
        ref={cardRef}
        onClick={onClick}
        onMouseEnter={prefetchBackdrop}
        onTouchStart={prefetchBackdrop}
        onMouseMove={handleMouseMove}
        onMouseLeave={resetGlassTilt}
        className="group brutal-poster relative h-full w-full focus:outline-none animate-poster-in"
        style={{
          animationDelay: `${Math.min(index * 18, 140)}ms`,
          transition: "transform 0.35s cubic-bezier(0.22,1,0.36,1), box-shadow 0.35s ease, border-color 0.35s ease",
          willChange: isGlass ? "transform" : undefined,
        }}
        id={`poster-${movie.id}`}
        aria-label={`View ${movie.title || movie.name}`}
      >
        {renderPosterMedia("cover")}

        <div
          className={`glass-poster-overlay pointer-events-none absolute inset-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 ${
            isGlass
              ? "transition-opacity duration-200"
              : "bg-gradient-to-t from-black via-black/50 to-transparent transition-opacity duration-150"
          }`}
        >
          {isGlass && (
            <div
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 sm:group-hover:opacity-100"
              style={{
                background: "radial-gradient(circle at var(--glow-x,50%) var(--glow-y,50%), rgba(255,255,255,0.08) 0%, transparent 60%)",
                borderRadius: "inherit",
              }}
            />
          )}

          <div className={`absolute bottom-0 left-0 right-0 p-2.5 transition-all duration-200 sm:p-3 ${isGlass ? "translate-y-1 opacity-100 sm:group-hover:translate-y-0" : ""}`}>
            {movie.logo_path ? (
              <Image
                src={logoUrl(movie.logo_path, "small")}
                alt={movie.title || movie.name || "Movie logo"}
                width={200}
                height={80}
                className="mb-1 h-auto max-h-8 w-auto max-w-[80%] object-contain object-left drop-shadow-[0_1px_6px_rgba(0,0,0,0.95)] sm:max-h-10"
                loading="lazy"
              />
            ) : (
              <p className={`line-clamp-2 font-display text-[10px] font-bold leading-tight text-white sm:text-xs ${isGlass ? "" : "uppercase"}`}>
                {movie.title || movie.name}
              </p>
            )}
            <div className="mt-1 flex items-center gap-2 sm:gap-3">
              <span className="flex items-center gap-0.5 sm:gap-1" style={{ color: isGlass ? "#FCD34D" : "var(--theme-primary)" }}>
                <Star className="h-3 w-3 fill-current sm:h-3.5 sm:w-3.5" strokeWidth={2.5} />
                <span className="font-mono text-[10px] font-bold sm:text-[11px]">{rating}</span>
              </span>
              <span className="font-mono text-[10px] font-bold sm:text-[11px]" style={{ color: isGlass ? "rgba(148,163,184,0.8)" : "#555" }}>
                {year}
              </span>
            </div>
          </div>
        </div>

        <div
          className={`glass-poster-rating pointer-events-none absolute right-0 top-0 flex items-center gap-0.5 px-1.5 py-0.5 sm:gap-1 sm:px-2 sm:py-1 ${!isGlass ? "border-b-3 border-l-3 border-brutal-border bg-black" : ""}`}
        >
          <Star className="h-2.5 w-2.5 fill-current sm:h-3 sm:w-3" style={{ color: isGlass ? "#FCD34D" : "var(--theme-primary)" }} />
          <span className="font-mono text-[9px] font-bold sm:text-[10px]" style={{ color: isGlass ? "#FCD34D" : "var(--theme-primary)" }}>
            {rating}
          </span>
        </div>

        <div className={isGlass ? "glass-action-rail" : ""}>
          <MovieActionRail movie={movie} actions={["like", "watchlist", "watched", "add"]} />
        </div>
      </button>
    </div>
  );
});

export default PosterCard;
