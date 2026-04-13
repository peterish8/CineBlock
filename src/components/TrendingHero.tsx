"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { Star, Bookmark, Play, ChevronLeft, ChevronRight, TrendingUp, Info } from "lucide-react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { TMDBMovie } from "@/lib/types";
import { backdropUrl, logoUrl } from "@/lib/constants";
import { useMovieLists } from "@/hooks/useMovieLists";
import { useThemeMode } from "@/hooks/useThemeMode";

function LogoGlow({ src, alt, imgClassName, wrapClassName }: {
  src: string;
  alt: string;
  imgClassName: string;
  wrapClassName: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);

  const handleMove = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setVisible(true);
  };

  return (
    <div ref={ref} className={`relative overflow-visible ${wrapClassName}`} onMouseMove={handleMove} onMouseLeave={() => setVisible(false)}>
      <Image src={src} alt={alt} width={560} height={200} className={imgClassName} priority />
      <div
        className="pointer-events-none absolute"
        style={{
          width: 240,
          height: 240,
          left: pos.x,
          top: pos.y,
          transform: "translate(-50%, -50%)",
          background: "radial-gradient(circle, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.04) 50%, transparent 70%)",
          mixBlendMode: "screen",
          borderRadius: "50%",
          opacity: visible ? 1 : 0,
          transition: "opacity 0.6s ease",
        }}
      />
    </div>
  );
}

interface TrendingHeroProps {
  onMovieClick: (movie: TMDBMovie) => void;
  preferredLanguage?: string;
}

const contentVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
};

const EASE_OUT = [0.22, 1, 0.36, 1] as [number, number, number, number];

const contentItem = {
  hidden: { opacity: 0, y: 18, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: EASE_OUT },
  },
};

export default function TrendingHero({ onMovieClick, preferredLanguage }: TrendingHeroProps) {
  const [allMovies, setAllMovies] = useState<TMDBMovie[]>([]);
  const [movies, setMovies] = useState<TMDBMovie[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const theme = useThemeMode();
  const heroRef = useRef<HTMLElement>(null);
  const { isInWatchlist, toggleWatchlist } = useMovieLists();

  const isGlass = theme === "glass";
  const isNetflix = theme === "netflix";

  const { scrollY } = useScroll();
  const backdropY = useTransform(scrollY, [0, 500], [0, 80]);
  const contentOpacity = useTransform(scrollY, [0, 220], [1, 0]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/movies?action=trending&window=day&include_logos=1");
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
      const langs = preferredLanguage.split(",").filter(Boolean);
      const filtered = allMovies.filter((m) => langs.includes(m.original_language));
      setMovies((filtered.length > 0 ? filtered : allMovies).slice(0, 8));
    }
    setCurrent(0);
  }, [allMovies, preferredLanguage]);

  useEffect(() => {
    if (movies.length <= 1) return;
    const timer = setInterval(() => setCurrent((p) => (p + 1) % movies.length), 6000);
    return () => clearInterval(timer);
  }, [movies.length]);

  const goNext = useCallback(() => setCurrent((p) => (p + 1) % movies.length), [movies.length]);
  const goPrev = useCallback(() => setCurrent((p) => (p - 1 + movies.length) % movies.length), [movies.length]);

  if (loading) {
    return (
      <div className={`w-full aspect-[4/5] sm:aspect-[21/9] lg:aspect-[3/1] brutal-shimmer ${isGlass ? "" : "border-b-3 border-brutal-border"}`} />
    );
  }

  if (movies.length === 0) return null;

  const movie = movies[current];
  const year = movie.release_date?.split("-")[0] || movie.first_air_date?.split("-")[0] || "—";
  const rating = movie.vote_average?.toFixed(1) || "0";
  const saved = isInWatchlist(movie.id);

  if (isNetflix) {
    return (
      <section ref={heroRef} className="relative w-full overflow-hidden bg-[#141414]">
        <div className="relative aspect-[4/5] w-full sm:aspect-[21/9] lg:aspect-[2.4/1]">
          <AnimatePresence mode="wait">
            <motion.div
              key={movie.id}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
            >
              {movie.backdrop_path ? (
                <Image
                  src={backdropUrl(movie.backdrop_path)}
                  alt={movie.title || movie.name || "Trending movie"}
                  fill
                  className="object-cover object-center"
                  sizes="100vw"
                  priority
                />
              ) : (
                <div className="h-full w-full bg-[#1a1a1a]" />
              )}
              <div className="absolute inset-0 bg-[linear-gradient(77deg,rgba(20,20,20,0.96)_0%,rgba(20,20,20,0.78)_32%,rgba(20,20,20,0.25)_65%,rgba(20,20,20,0.82)_100%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,20,20,0.15)_0%,rgba(20,20,20,0.65)_72%,#141414_100%)]" />
            </motion.div>
          </AnimatePresence>

          <div className="absolute inset-0 flex items-end">
            <div className="w-full px-4 pb-8 sm:px-6 sm:pb-10 lg:px-12 lg:pb-14">
              <div className="max-w-xl lg:max-w-2xl">
                <div className="mb-3 inline-flex items-center gap-2 rounded-sm bg-[#E50914] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white">
                  <TrendingUp className="h-3 w-3" strokeWidth={2.5} />
                  Trending Now
                </div>

                {movie.logo_path ? (
                  <LogoGlow
                    src={logoUrl(movie.logo_path, "large")}
                    alt={movie.title || movie.name || "Movie logo"}
                    wrapClassName="mb-3 max-w-[220px] sm:max-w-sm lg:max-w-md"
                    imgClassName="h-auto max-h-20 w-full object-contain object-left drop-shadow-[0_2px_18px_rgba(0,0,0,0.9)] sm:max-h-28 lg:max-h-36"
                  />
                ) : (
                  <h2 className="mb-3 text-3xl font-black leading-none tracking-tight text-white sm:text-5xl lg:text-6xl">
                    {movie.title || movie.name}
                  </h2>
                )}

                <div className="mb-3 flex flex-wrap items-center gap-3 text-sm font-semibold">
                  <span className="text-[#46D369]">{Math.max(62, Math.min(99, Math.round((movie.vote_average || 7) * 10)))}% Match</span>
                  <span className="text-white/85">{year}</span>
                  <span className="rounded-sm border border-white/35 px-1.5 py-0.5 text-[10px] text-white/70">HD</span>
                  <span className="flex items-center gap-1 text-white/80">
                    <Star className="h-3.5 w-3.5 fill-current text-white/85" strokeWidth={2.2} />
                    {rating}
                  </span>
                </div>

                <p className="max-w-xl text-sm leading-relaxed text-white/78 sm:text-base" style={{ overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                  {movie.overview}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => onMovieClick(movie)}
                    className="flex items-center gap-2 rounded-sm bg-white px-6 py-2.5 text-sm font-bold text-black transition-colors hover:bg-white/85"
                  >
                    <Play className="h-4 w-4 fill-current" strokeWidth={2.5} />
                    Play
                  </button>
                  <button
                    onClick={() => onMovieClick(movie)}
                    className="flex items-center gap-2 rounded-sm bg-[rgba(109,109,110,0.7)] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[rgba(109,109,110,0.55)]"
                  >
                    <Info className="h-4 w-4" strokeWidth={2.5} />
                    More Info
                  </button>
                  <button
                    onClick={() => toggleWatchlist(movie)}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-white/35 bg-black/25 text-white transition-colors hover:border-white"
                    aria-label={saved ? "Remove from watchlist" : "Add to watchlist"}
                  >
                    <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={goPrev}
            className="absolute left-0 top-1/2 z-10 hidden h-28 -translate-y-1/2 items-center justify-center bg-black/25 px-3 text-white/75 transition-colors hover:bg-black/45 hover:text-white md:flex"
          >
            <ChevronLeft className="h-7 w-7" strokeWidth={2.5} />
          </button>
          <button
            onClick={goNext}
            className="absolute right-0 top-1/2 z-10 hidden h-28 -translate-y-1/2 items-center justify-center bg-black/25 px-3 text-white/75 transition-colors hover:bg-black/45 hover:text-white md:flex"
          >
            <ChevronRight className="h-7 w-7" strokeWidth={2.5} />
          </button>

          <div className="absolute bottom-3 right-4 hidden items-center gap-1.5 sm:flex">
            {movies.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-1.5 transition-all duration-300 ${i === current ? "w-7 bg-[#E50914]" : "w-4 bg-white/30 hover:bg-white/50"}`}
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!isGlass) {
    return (
      <section className="relative w-full overflow-hidden border-b-3 border-brutal-border">
        <div className="relative aspect-[4/5] w-full sm:aspect-[21/9] lg:aspect-[3/1]">
          {movie.backdrop_path ? (
            <Image key={movie.id} src={backdropUrl(movie.backdrop_path)} alt={movie.title || movie.name || "Trending movie"} fill className="object-cover hero-img-enter" sizes="100vw" priority />
          ) : (
            <div className="h-full w-full bg-surface" />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg via-bg/70 to-bg/10" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-bg/90 via-bg/20 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-bg/60 to-transparent sm:hidden" />
          <div className="pointer-events-none absolute inset-0 flex items-end">
            <div className="pointer-events-auto mx-auto w-full max-w-6xl px-4 pb-6 sm:px-6 sm:pb-8">
              {movie.logo_path ? (
                <LogoGlow
                  key={`logo-${movie.id}`}
                  src={logoUrl(movie.logo_path, "large")}
                  alt={movie.title || movie.name || "Movie logo"}
                  wrapClassName="mb-1 max-w-xs animate-fade-in-up sm:max-w-sm md:max-w-md"
                  imgClassName="h-auto max-h-24 w-full object-contain object-left drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] sm:max-h-32 md:max-h-40"
                />
              ) : (
                <h2 key={`title-${movie.id}`} className="max-w-xl animate-fade-in-up font-display text-2xl font-bold uppercase leading-none tracking-tight text-brutal-white sm:text-4xl md:text-5xl">
                  {movie.title || movie.name}
                </h2>
              )}
              <div className="mt-3 flex items-center gap-4">
                <span className="flex items-center gap-1 text-brutal-yellow">
                  <Star className="h-4 w-4 fill-current" strokeWidth={2.5} />
                  <span className="font-mono text-sm font-bold">{rating}</span>
                </span>
                <span className="font-mono text-sm font-bold text-brutal-muted">{year}</span>
              </div>
              <p className="mt-2 hidden max-w-lg font-body text-xs leading-relaxed text-brutal-muted sm:block sm:text-sm" style={{ overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{movie.overview}</p>
              <div className="mt-4 flex items-center gap-3">
                <button onClick={() => onMovieClick(movie)} className="brutal-btn flex items-center gap-2 px-4 py-2.5 !border-black !bg-brutal-yellow !text-black !shadow-brutal">
                  <Play className="h-4 w-4 fill-current" strokeWidth={2.5} />
                  <span className="font-mono text-xs font-bold">VIEW DETAILS</span>
                </button>
                <button onClick={() => toggleWatchlist(movie)} className={`brutal-btn flex items-center gap-2 px-4 py-2.5 ${saved ? "!border-brutal-lime !bg-brutal-lime !text-black !shadow-none" : ""}`}>
                  <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} strokeWidth={2.5} />
                </button>
                <div className="brutal-btn pointer-events-none flex items-center gap-2 px-3 py-2.5 !border-brutal-yellow">
                  <TrendingUp className="h-4 w-4 text-brutal-yellow" strokeWidth={3} />
                  <span className="font-mono text-xs font-bold text-brutal-yellow">TRENDING</span>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={goPrev}
            className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center opacity-60 hover:opacity-100 active:opacity-30 transition-opacity duration-100"
            style={{ WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={3} />
          </button>
          <button
            onClick={goNext}
            className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center opacity-60 hover:opacity-100 active:opacity-30 transition-opacity duration-100"
            style={{ WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
          >
            <ChevronRight className="h-5 w-5" strokeWidth={3} />
          </button>
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-brutal-border sm:hidden">
            <div key={current} className="h-full animate-progress bg-brutal-yellow" style={{ animationDuration: "6s" }} />
          </div>
          <div className="absolute bottom-4 right-4 hidden items-center gap-1.5 sm:right-6 sm:flex">
            {movies.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)} className={`tap-target h-1.5 rounded-none transition-all duration-300 ${i === current ? "w-8 bg-brutal-yellow" : "w-1.5 bg-brutal-dim hover:bg-brutal-muted"}`} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={heroRef} className="relative w-full overflow-hidden bg-[#020817]">
      <div className="pointer-events-none absolute left-[-10%] top-[-20%] aspect-square w-[70vw] rounded-full bg-blue-500/20 blur-[100px] mix-blend-screen sm:w-[50vw] sm:blur-[140px]" />
      <div className="pointer-events-none absolute bottom-[-10%] right-[-10%] aspect-square w-[80vw] rounded-full bg-orange-500/15 blur-[120px] mix-blend-screen sm:w-[60vw] sm:blur-[160px]" />
      <div className="relative aspect-[4/5] w-full sm:aspect-[21/9] lg:aspect-[3/1]">
        <AnimatePresence mode="sync">
          <motion.div
            key={movie.id}
            className="pointer-events-none absolute inset-0"
            initial={{ opacity: 0, scale: 1.08, filter: "brightness(0.2) blur(8px)" }}
            animate={{ opacity: 1, scale: 1, filter: "brightness(0.6) blur(0px)" }}
            exit={{ opacity: 0, scale: 1.04, filter: "brightness(0.2) blur(8px)" }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            style={{ y: backdropY }}
          >
            {movie.backdrop_path ? (
              <Image src={backdropUrl(movie.backdrop_path)} alt={movie.title || movie.name || "Trending movie"} fill className="object-cover animate-ken-burns" sizes="100vw" priority />
            ) : (
              <div className="h-full w-full" style={{ background: "linear-gradient(135deg, #0a1628, #050f2e)" }} />
            )}
          </motion.div>
        </AnimatePresence>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#020817] via-[#020817]/60 to-[#020817]/10" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#020817]/90 via-[#020817]/25 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#020817]/50 to-transparent sm:hidden" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#020817] to-transparent" />

        <motion.div className="pointer-events-none absolute inset-0 flex items-end" style={{ opacity: contentOpacity }}>
          <div className="pointer-events-auto mx-auto w-full max-w-6xl px-4 pb-6 sm:px-6 sm:pb-10 lg:px-8 lg:pb-12">
            <AnimatePresence mode="wait">
              <motion.div key={`content-${movie.id}`} variants={contentVariants} initial="hidden" animate="visible" className="max-w-xl lg:max-w-2xl">
                {movie.logo_path ? (
                  <motion.div variants={contentItem}>
                    <LogoGlow
                      src={logoUrl(movie.logo_path, "large")}
                      alt={movie.title || movie.name || "Movie logo"}
                      wrapClassName="mb-2 max-w-[200px] sm:max-w-xs md:max-w-sm lg:max-w-md"
                      imgClassName="h-auto max-h-16 w-full object-contain object-left drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] sm:max-h-24 md:max-h-32 lg:max-h-36"
                    />
                  </motion.div>
                ) : (
                  <motion.h2 variants={contentItem} className="mb-2 font-display text-xl font-bold leading-none tracking-tight text-white drop-shadow-2xl sm:text-3xl md:text-4xl lg:text-5xl">
                    {movie.title || movie.name}
                  </motion.h2>
                )}
                <motion.div variants={contentItem} className="mt-2 flex items-center gap-3 sm:gap-4">
                  <span className="flex items-center gap-1" style={{ color: "#FCD34D" }}>
                    <Star className="h-3.5 w-3.5 fill-current sm:h-4 sm:w-4" strokeWidth={2.5} />
                    <span className="font-mono text-xs font-bold sm:text-sm">{rating}</span>
                  </span>
                  <span className="font-mono text-xs font-bold text-[rgba(148,163,184,0.9)] sm:text-sm">{year}</span>
                </motion.div>
                {movie.overview && (
                  <motion.p
                    variants={contentItem}
                    className="mt-2 hidden text-xs leading-relaxed text-[rgba(148,163,184,0.75)] sm:block sm:text-sm"
                    style={{ overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}
                  >
                    {movie.overview}
                  </motion.p>
                )}
                <motion.div variants={contentItem} className="mt-4 flex items-center gap-2 sm:mt-5 sm:gap-3">
                  <button
                    onClick={() => onMovieClick(movie)}
                    className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white transition-all duration-200 active:scale-95 sm:px-5 sm:py-2.5 sm:text-sm"
                    style={{
                      background: "rgba(96,165,250,0.20)",
                      border: "1px solid rgba(96,165,250,0.45)",
                      backdropFilter: "blur(12px)",
                      boxShadow: "0 0 20px rgba(96,165,250,0.20), inset 0 1px 0 rgba(255,255,255,0.12)",
                    }}
                  >
                    <Play className="h-3.5 w-3.5 fill-current sm:h-4 sm:w-4" strokeWidth={2.5} />
                    <span className="hidden sm:inline">View Details</span>
                    <span className="sm:hidden">Details</span>
                  </button>
                  <button
                    onClick={() => toggleWatchlist(movie)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 active:scale-90 sm:h-10 sm:w-10"
                    style={{
                      background: saved ? "rgba(249,115,22,0.22)" : "rgba(255,255,255,0.08)",
                      border: saved ? "1px solid rgba(249,115,22,0.50)" : "1px solid rgba(255,255,255,0.15)",
                      backdropFilter: "blur(12px)",
                      boxShadow: saved ? "0 0 16px rgba(249,115,22,0.25)" : "none",
                    }}
                  >
                    <Bookmark className="h-4 w-4 transition-all sm:h-[18px] sm:w-[18px]" style={{ color: saved ? "#FB923C" : "rgba(255,255,255,0.7)" }} fill={saved ? "currentColor" : "none"} strokeWidth={2.5} />
                  </button>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-display font-semibold uppercase tracking-[0.15em] sm:text-xs"
                    style={{ background: "rgba(96,165,250,0.12)", border: "1px solid rgba(96,165,250,0.30)", color: "#93C5FD", backdropFilter: "blur(12px)" }}
                  >
                    <TrendingUp className="h-3 w-3" strokeWidth={2.5} />
                    Trending
                  </span>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        <button
          onClick={goPrev}
          className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl opacity-50 transition-opacity duration-100 hover:opacity-100 active:opacity-25 sm:left-4 sm:h-12 sm:w-12"
          style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(8px)", WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
        >
          <ChevronLeft className="h-4 w-4 text-white sm:h-5 sm:w-5" strokeWidth={2.5} />
        </button>
        <button
          onClick={goNext}
          className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl opacity-50 transition-opacity duration-100 hover:opacity-100 active:opacity-25 sm:right-4 sm:h-12 sm:w-12"
          style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(8px)", WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
        >
          <ChevronRight className="h-4 w-4 text-white sm:h-5 sm:w-5" strokeWidth={2.5} />
        </button>

        <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden rounded-full bg-white/5 sm:hidden">
          <div key={current} className="h-full animate-progress rounded-full" style={{ animationDuration: "6s", background: "linear-gradient(90deg, #60A5FA, #F97316)" }} />
        </div>
        <div className="absolute bottom-4 right-4 z-10 hidden items-center gap-1.5 sm:bottom-6 sm:right-6 sm:flex">
          {movies.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => setCurrent(i)}
              className="tap-target relative h-1.5 overflow-hidden rounded-full"
              animate={{
                width: i === current ? 24 : 6,
                backgroundColor: i === current ? "transparent" : "rgba(255,255,255,0.22)",
              }}
              transition={{
                width: { type: "spring", stiffness: 480, damping: 36 },
                backgroundColor: { duration: 0.25, ease: "easeInOut" },
              }}
            >
              {i === current && (
                <motion.span
                  layoutId="hero-dot-active"
                  className="absolute inset-0 rounded-full"
                  style={{ background: "linear-gradient(90deg,#60A5FA,#F97316)" }}
                  transition={{ type: "spring", stiffness: 480, damping: 36 }}
                />
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}
