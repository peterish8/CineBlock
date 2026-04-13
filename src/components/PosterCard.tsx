"use client";

import { memo, useRef, useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Play, Star, ChevronDown } from "lucide-react";
import { TMDBMovie } from "@/lib/types";
import { posterUrl, logoUrl, backdropUrl } from "@/lib/constants";
import MovieActionRail from "@/components/MovieActionRail";
import { useThemeMode } from "@/hooks/useThemeMode";

interface PosterCardProps {
  movie: TMDBMovie;
  onMovieClick: (movie: TMDBMovie) => void;
  index: number;
}

const isTouchDevice = () =>
  typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);

const PosterCard = memo(function PosterCard({ movie, onMovieClick, index }: PosterCardProps) {
  const onClick = useCallback(() => onMovieClick(movie), [onMovieClick, movie]);
  const hasImage = movie.poster_path !== null;
  const year = movie.release_date?.split("-")[0] || movie.first_air_date?.split("-")[0] || "—";
  const rating = movie.vote_average?.toFixed(1) || "N/A";
  const matchScore = Math.max(62, Math.min(99, Math.round((movie.vote_average || 7) * 10)));
  const cardRef = useRef<HTMLButtonElement>(null);
  const hoverRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const expandTimer = useRef<NodeJS.Timeout | null>(null);
  const collapseTimer = useRef<NodeJS.Timeout | null>(null);
  const theme = useThemeMode();
  const isGlass = theme === "glass";
  const isNetflix = theme === "netflix";
  const [hovered, setHovered] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [clicking, setClicking] = useState(false);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (expandTimer.current) clearTimeout(expandTimer.current);
      if (collapseTimer.current) clearTimeout(collapseTimer.current);
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

  const startNetflixHover = useCallback(() => {
    if (!isNetflix || isTouchDevice()) return;
    prefetchBackdrop();
    if (collapseTimer.current) clearTimeout(collapseTimer.current);
    expandTimer.current = setTimeout(() => {
      setHovered(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setExpanded(true)));
    }, 420);
  }, [isNetflix, prefetchBackdrop]);

  const endNetflixHover = useCallback(() => {
    if (!isNetflix || isTouchDevice()) return;
    if (expandTimer.current) clearTimeout(expandTimer.current);
    setExpanded(false);
    collapseTimer.current = setTimeout(() => setHovered(false), 180);
  }, [isNetflix]);

  const handleOpen = useCallback(() => {
    if (!isNetflix || isTouchDevice()) {
      onClick();
      return;
    }
    setClicking(true);
    setTimeout(() => {
      setClicking(false);
      onClick();
    }, 180);
  }, [isNetflix, onClick]);

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

  if (isNetflix) {
    return (
      <div
        className="relative aspect-[2/3] w-full"
        style={{ zIndex: hovered ? 60 : 1 }}
        onMouseEnter={startNetflixHover}
        onMouseLeave={endNetflixHover}
      >
        <button
          ref={cardRef}
          onClick={handleOpen}
          onFocus={startNetflixHover}
          onBlur={endNetflixHover}
          onMouseEnter={prefetchBackdrop}
          onTouchStart={prefetchBackdrop}
          className="relative h-full w-full overflow-hidden rounded-[4px] border border-white/[0.06] bg-[#141414] text-left focus:outline-none focus:ring-2 focus:ring-white/70"
          style={{
            transform: clicking ? "scale(1.03)" : "scale(1)",
            transition: "transform 180ms cubic-bezier(0.23,1,0.32,1), opacity 150ms ease",
            opacity: expanded ? 0.12 : 1,
          }}
          id={`poster-${movie.id}`}
          aria-label={`View ${movie.title || movie.name}`}
        >
          {renderPosterMedia("top")}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/18 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-2.5">
            {movie.logo_path ? (
              <Image
                src={logoUrl(movie.logo_path, "small")}
                alt={movie.title || movie.name || "Movie logo"}
                width={160}
                height={70}
                className="mb-1 h-auto max-h-8 w-auto max-w-[80%] object-contain object-left drop-shadow-[0_1px_6px_rgba(0,0,0,0.95)]"
                loading="lazy"
              />
            ) : (
              <p className="line-clamp-2 font-display text-[11px] font-bold leading-tight text-white">
                {movie.title || movie.name}
              </p>
            )}
          </div>
        </button>

        {hovered && (
          <div
            ref={hoverRef}
            className="absolute left-[-8%] top-[-84px] overflow-hidden rounded-md border border-white/[0.08] bg-[#181818]"
            style={{
              width: "116%",
              boxShadow: expanded ? "0 22px 55px rgba(0,0,0,0.72)" : "0 0 0 rgba(0,0,0,0)",
              opacity: expanded ? 1 : 0,
              transform: expanded ? "translateY(0) scale(1)" : "translateY(8px) scale(0.985)",
              transformOrigin: "center bottom",
              transition: "transform 260ms cubic-bezier(0.25,0.46,0.45,0.94), opacity 220ms ease, box-shadow 260ms ease",
            }}
            onMouseEnter={() => {
              if (collapseTimer.current) clearTimeout(collapseTimer.current);
            }}
            onMouseLeave={endNetflixHover}
          >
            <button
              onClick={handleOpen}
              className="relative block h-[172px] w-full overflow-hidden text-left focus:outline-none"
            >
              {movie.backdrop_path ? (
                <Image
                  src={backdropUrl(movie.backdrop_path)}
                  alt={movie.title || movie.name || "Backdrop"}
                  fill
                  className="object-cover"
                  sizes="320px"
                />
              ) : (
                renderPosterMedia("cover")
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-black/15 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 px-4 pb-4">
                {movie.logo_path ? (
                  <Image
                    src={logoUrl(movie.logo_path, "small")}
                    alt={movie.title || movie.name || "Movie logo"}
                    width={220}
                    height={80}
                    className="mb-2 h-auto max-h-10 w-auto max-w-[75%] object-contain object-left drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]"
                    loading="lazy"
                  />
                ) : (
                  <h3 className="mb-2 font-display line-clamp-2 text-lg font-black leading-none text-white">
                    {movie.title || movie.name}
                  </h3>
                )}
              </div>
            </button>

            <div className="relative px-4 pb-4 pt-3">
              <div className="mb-3 flex items-center gap-3">
                <button
                  onClick={handleOpen}
                  className="flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-bold text-black transition-colors hover:bg-white/85"
                >
                  <Play className="h-3.5 w-3.5 fill-current" strokeWidth={2.5} />
                  Play
                </button>
                <MovieActionRail
                  movie={movie}
                  actions={["watchlist", "like", "watched", "add"]}
                  className="flex items-center gap-2"
                />
                <button
                  onClick={handleOpen}
                  className="ml-auto flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-[rgba(42,42,42,0.92)] text-white transition-colors hover:border-white"
                  aria-label="More info"
                >
                  <ChevronDown className="h-4 w-4" strokeWidth={2.5} />
                </button>
              </div>

              <div className="mb-2 flex flex-wrap items-center gap-2.5 text-[11px] font-semibold">
                <span className="text-[#46D369]">{matchScore}% Match</span>
                <span className="text-white/80">{year}</span>
                <span className="rounded-sm border border-white/30 px-1 text-[10px] text-white/65">HD</span>
                <span className="flex items-center gap-1 text-white/78">
                  <Star className="h-3 w-3 fill-current text-white/85" strokeWidth={2.2} />
                  {rating}
                </span>
              </div>

              <p className="line-clamp-2 text-[12px] leading-relaxed text-white/72">
                {movie.overview || "Open to view more details, cast, and streaming information."}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

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
