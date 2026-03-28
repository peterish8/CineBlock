"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { Star, Bookmark, Play, ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import { TMDBMovie } from "@/lib/types";
import { backdropUrl } from "@/lib/constants";
import { useWatchlist } from "@/hooks/useWatchlist";

interface TrendingHeroProps {
  onMovieClick: (movie: TMDBMovie) => void;
  preferredLanguage?: string;
}

export default function TrendingHero({ onMovieClick, preferredLanguage }: TrendingHeroProps) {
  const [allMovies, setAllMovies] = useState<TMDBMovie[]>([]);
  const [movies, setMovies] = useState<TMDBMovie[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const { isInWatchlist, toggleWatchlist } = useWatchlist();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/movies?action=trending&window=day");
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        setAllMovies(data.results?.slice(0, 20) || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!preferredLanguage) {
      setMovies(allMovies.slice(0, 8));
    } else {
      const filtered = allMovies.filter((m) => m.original_language === preferredLanguage);
      setMovies((filtered.length > 0 ? filtered : allMovies).slice(0, 8));
    }
    setCurrent(0);
  }, [allMovies, preferredLanguage]);

  // Auto-rotate every 6 seconds
  useEffect(() => {
    if (movies.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % movies.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [movies.length]);

  const goNext = useCallback(() => {
    setCurrent((prev) => (prev + 1) % movies.length);
  }, [movies.length]);

  const goPrev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + movies.length) % movies.length);
  }, [movies.length]);

  if (loading) {
    return (
      <div className="w-full aspect-[4/5] sm:aspect-[21/9] lg:aspect-[3/1] brutal-shimmer border-b-3 border-brutal-border" />
    );
  }

  if (movies.length === 0) return null;

  const movie = movies[current];
  const year = movie.release_date?.split("-")[0] || "—";
  const rating = movie.vote_average?.toFixed(1) || "0";
  const saved = isInWatchlist(movie.id);

  return (
    <section className="relative w-full border-b-3 border-brutal-border overflow-hidden">
      {/* Background image */}
      <div className="relative aspect-[4/5] sm:aspect-[21/9] lg:aspect-[3/1] w-full">
        {movie.backdrop_path ? (
          <Image
            key={movie.id}
            src={backdropUrl(movie.backdrop_path)}
            alt={movie.title}
            fill
            className="object-cover hero-img-enter"
            sizes="100vw"
            priority
          />
        ) : (
          <div className="w-full h-full bg-surface" />
        )}

        {/* Stronger cinematic gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/70 to-bg/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-bg/90 via-bg/20 to-transparent" />
        {/* Extra top fade for mobile readability */}
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-bg/60 to-transparent sm:hidden" />

        {/* Content */}
        <div className="absolute inset-0 flex items-end">
          <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pb-6 sm:pb-8">
            {/* Badge */}
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-brutal-yellow" strokeWidth={3} />
              <span className="brutal-chip text-brutal-yellow border-brutal-yellow text-[10px]">
                TRENDING TODAY
              </span>
            </div>

            {/* Title — animate on each slide change */}
            <h2 key={`title-${movie.id}`} className="font-display font-bold text-2xl sm:text-4xl md:text-5xl text-brutal-white uppercase leading-none tracking-tight max-w-xl animate-fade-in-up">
              {movie.title}
            </h2>

            {/* Meta */}
            <div className="flex items-center gap-4 mt-3">
              <span className="flex items-center gap-1 text-brutal-yellow">
                <Star className="w-4 h-4 fill-current" strokeWidth={2.5} />
                <span className="text-sm font-mono font-bold">{rating}</span>
              </span>
              <span className="text-sm font-mono font-bold text-brutal-muted">{year}</span>
            </div>

            {/* Overview */}
            <p className="text-brutal-muted text-xs sm:text-sm font-body leading-relaxed mt-2 max-w-lg line-clamp-2 hidden sm:block">
              {movie.overview}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => onMovieClick(movie)}
                className="brutal-btn px-4 py-2.5 flex items-center gap-2 !bg-brutal-yellow !text-black !border-black !shadow-brutal"
              >
                <Play className="w-4 h-4 fill-current" strokeWidth={2.5} />
                <span className="font-mono font-bold text-xs">VIEW DETAILS</span>
              </button>
              <button
                onClick={() => toggleWatchlist(movie)}
                className={`brutal-btn px-4 py-2.5 flex items-center gap-2 ${saved ? "!bg-brutal-lime !border-brutal-lime !text-black !shadow-none" : ""}`}
              >
                <Bookmark className={`w-4 h-4 ${saved ? "fill-current" : ""}`} strokeWidth={2.5} />
                <span className="hidden sm:inline font-mono font-bold text-xs">{saved ? "SAVED" : "WATCHLIST"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation arrows */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
          <button
            onClick={goPrev}
            className="brutal-btn p-2 opacity-60 hover:opacity-100 !hover:transform-none active:!transform-none"
          >
            <ChevronLeft className="w-5 h-5" strokeWidth={3} />
          </button>
        </div>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
          <button
            onClick={goNext}
            className="brutal-btn p-2 opacity-60 hover:opacity-100 !hover:transform-none active:!transform-none"
          >
            <ChevronRight className="w-5 h-5" strokeWidth={3} />
          </button>
        </div>

        {/* Progress bar (mobile) */}
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-brutal-border sm:hidden">
          <div
            key={current}
            className="h-full bg-brutal-yellow animate-progress"
            style={{ animationDuration: "6s" }}
          />
        </div>

        {/* Dots (desktop) */}
        <div className="absolute bottom-4 right-4 sm:right-6 hidden sm:flex items-center gap-1.5">
          {movies.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-none transition-all duration-300 tap-target ${
                i === current
                  ? "w-8 bg-brutal-yellow"
                  : "w-1.5 bg-brutal-dim hover:bg-brutal-muted"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
