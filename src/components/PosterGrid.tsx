"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { TMDBMovie, TMDBDiscoverResponse } from "@/lib/types";
import PosterCard from "./PosterCard";
import SkeletonCard from "./SkeletonCard";
import { Loader2, Film, SearchX, Clapperboard, Ghost, Sparkles } from "lucide-react";
import { useThemeMode } from "@/hooks/useThemeMode";

const EASE_OUT = [0.22, 1, 0.36, 1] as [number, number, number, number];

const FETCH_MESSAGES = [
  "Scanning the archive…",
  "Curating your cinema…",
  "Hold tight, fetching films…",
  "Searching across the reel…",
  "Loading your collection…",
];

const posterVariant = {
  hidden: { opacity: 0, y: 18, scale: 0.95, filter: "blur(5px)" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { delay: Math.min(i * 0.04, 0.48), duration: 0.42, ease: EASE_OUT },
  }),
};

const INJECT_AFTER = 18;

interface PosterGridProps {
  filters: {
    query: string;
    genre: string;
    year: string;
    language: string;
    sort: string;
    rating?: string;
    runtime?: string;
    keyword?: string;
  };
  onMovieClick: (movie: TMDBMovie) => void;
  hiddenIds?: Set<number>;
  personalizedCards?: TMDBMovie[];
}

export default function PosterGrid({
  filters,
  onMovieClick,
  hiddenIds,
  personalizedCards = [],
}: PosterGridProps) {
  const [movies, setMovies] = useState<TMDBMovie[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchMsgIdx, setFetchMsgIdx] = useState(0);
  const [hasLoaded, setHasLoaded] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const theme = useThemeMode();
  const isGlass = theme === "glass";
  const isNetflix = theme === "netflix";

  const fetchMovies = useCallback(
    async (pageNum: number, append = false) => {
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
          if (filters.keyword) params.set("keyword", filters.keyword);
        }
        params.set("include_logos", "1");

        const res = await fetch(`/api/movies?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(`API error: ${res.status}`);

        const data: TMDBDiscoverResponse = await res.json();
        setMovies((prev) => {
          const merged = append ? [...prev, ...data.results] : data.results;
          const seen = new Set<number>();
          return merged.filter((m) => (seen.has(m.id) ? false : (seen.add(m.id), true)));
        });
        setTotalPages(data.total_pages);
        setPage(pageNum);
        setLoading(false);
        setLoadingMore(false);
        setHasLoaded(true);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        setError("Failed to load movies. Check your API key.");
        console.error(err);
        setLoading(false);
        setLoadingMore(false);
        setHasLoaded(true);
      }
    },
    [filters]
  );

  useEffect(() => {
    setMovies([]);
    setPage(1);
    setHasLoaded(false);
    fetchMovies(1, false);
  }, [fetchMovies]);

  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => setFetchMsgIdx((p) => (p + 1) % FETCH_MESSAGES.length), 2200);
    return () => clearInterval(id);
  }, [loading]);

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

  const gridClassName = isNetflix
    ? "grid grid-cols-2 gap-2 px-3 sm:grid-cols-3 sm:px-4 md:grid-cols-4 lg:grid-cols-5 lg:gap-2.5 lg:px-6"
    : "grid grid-cols-2 gap-3 px-3 sm:grid-cols-3 sm:gap-4 sm:px-4 md:grid-cols-4 lg:grid-cols-5 lg:gap-5 lg:px-6";

  const [gridCols, setGridCols] = useState(5);
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 640) setGridCols(2);
      else if (w < 768) setGridCols(3);
      else if (w < 1024) setGridCols(4);
      else setGridCols(5);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  const skeletonCount = gridCols * 4;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-24 text-center">
        <div className={`max-w-md w-full ${isNetflix ? "rounded-md border border-white/10 bg-[#181818] p-8 shadow-[0_18px_50px_rgba(0,0,0,0.45)]" : "brutal-card p-8"}`}>
          <Film className={`mx-auto mb-4 h-12 w-12 ${isNetflix ? "text-[#E50914]" : "text-brutal-yellow"}`} strokeWidth={2} />
          <p className={`${isNetflix ? "text-white" : "text-brutal-white"} mb-2 text-lg font-bold ${isNetflix ? "" : "font-display uppercase"}`}>
            No Connection
          </p>
          <p className={`${isNetflix ? "text-white/65" : "text-brutal-muted"} text-sm ${isNetflix ? "font-medium" : "font-mono"}`}>{error}</p>
          <p className={`${isNetflix ? "border-white/10 text-white/40" : "border-brutal-border text-brutal-dim"} mt-3 border-t pt-3 text-xs ${isNetflix ? "" : "font-mono"}`}>
            Add your TMDB API key to `.env.local`
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    if (isGlass) {
      return (
        <div className="flex w-full flex-col items-center justify-center px-4 py-20 text-center sm:py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center gap-8"
          >
            {/* Cinema reel SVG + orbital rings */}
            <div className="relative flex h-40 w-40 items-center justify-center">
              {/* Outer glow pulse */}
              <div className="absolute inset-0 rounded-full animate-pulse" style={{ background: "radial-gradient(circle, rgba(96,165,250,0.18) 0%, transparent 70%)", filter: "blur(20px)", animationDuration: "2.5s" }} />

              {/* Slow outer ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 18, ease: "linear" }}
                className="absolute inset-0 rounded-full"
                style={{ border: "1.5px dashed rgba(96,165,250,0.25)" }}
              />

              {/* Fast inner ring */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                className="absolute inset-[18px] rounded-full"
                style={{ border: "1.5px dashed rgba(249,115,22,0.30)" }}
              />

              {/* Orbital dot — blue */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 3.5, ease: "linear" }}
                className="absolute inset-0"
              >
                <div className="absolute top-1 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-blue-400" style={{ boxShadow: "0 0 8px rgba(96,165,250,0.8)" }} />
              </motion.div>

              {/* Orbital dot — orange */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 5, ease: "linear" }}
                className="absolute inset-[18px]"
              >
                <div className="absolute bottom-0 right-2 h-1.5 w-1.5 rounded-full bg-orange-400" style={{ boxShadow: "0 0 6px rgba(249,115,22,0.8)" }} />
              </motion.div>

              {/* Center film icon */}
              <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: "rgba(8,15,40,0.80)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 0 30px rgba(96,165,250,0.20), inset 0 1px 0 rgba(255,255,255,0.10)" }}>
                <motion.div
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                >
                  <Film className="h-7 w-7 text-blue-300" strokeWidth={1.5} />
                </motion.div>
              </div>

              {/* Floating clapperboard */}
              <motion.div
                animate={{ y: [-5, 5, -5], rotate: [-10, 10, -10], opacity: [0.6, 1, 0.6] }}
                transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                className="absolute -right-3 -bottom-1 z-20"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "rgba(8,15,40,0.90)", border: "1px solid rgba(249,115,22,0.40)", boxShadow: "0 0 14px rgba(249,115,22,0.30)" }}>
                  <Clapperboard className="h-4.5 w-4.5 text-orange-400" strokeWidth={1.5} />
                </div>
              </motion.div>

              {/* Floating sparkle */}
              <motion.div
                animate={{ y: [4, -4, 4], x: [-3, 3, -3], opacity: [0.4, 0.9, 0.4] }}
                transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut", delay: 0.6 }}
                className="absolute -left-2 top-3 z-20"
              >
                <Sparkles className="h-4 w-4 text-blue-400/70" strokeWidth={1.5} />
              </motion.div>
            </div>

            {/* Cycling text */}
            <div className="space-y-2">
              <motion.p
                key={fetchMsgIdx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="text-base font-display font-medium tracking-tight text-white"
              >
                {FETCH_MESSAGES[fetchMsgIdx]}
              </motion.p>
              <p className="text-xs font-mono text-slate-500">This won&apos;t take long</p>
            </div>

            {/* Animated progress bar */}
            <div className="h-px w-48 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, rgba(96,165,250,0.8), rgba(249,115,22,0.8))" }}
                animate={{ x: ["-100%", "100%"] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
              />
            </div>
          </motion.div>
        </div>
      );
    }

    return (
      <div className={gridClassName}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (movies.length === 0 && hasLoaded) {
    return (
      <div className="flex w-full flex-col items-center justify-center px-4 py-20 text-center sm:py-32">
        {isGlass ? (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="flex max-w-sm flex-col items-center gap-7"
          >
            {/* Icon cluster */}
            <div className="relative flex h-36 w-36 items-center justify-center">
              {/* Red ambient glow */}
              <div className="absolute inset-0 rounded-full animate-pulse" style={{ background: "radial-gradient(circle, rgba(239,68,68,0.15) 0%, transparent 70%)", filter: "blur(24px)", animationDuration: "3s" }} />

              {/* Static broken ring */}
              <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 144 144" fill="none">
                <circle cx="72" cy="72" r="68" stroke="rgba(239,68,68,0.5)" strokeWidth="1.5" strokeDasharray="8 6" />
              </svg>

              {/* Slow wobble outer ring */}
              <motion.div
                animate={{ rotate: [0, 8, -8, 0] }}
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                className="absolute inset-[16px] rounded-full"
                style={{ border: "1.5px dashed rgba(239,68,68,0.25)" }}
              />

              {/* Center card */}
              <div className="relative z-10 flex h-[68px] w-[68px] items-center justify-center rounded-2xl" style={{ background: "rgba(20,6,10,0.85)", border: "1px solid rgba(239,68,68,0.30)", boxShadow: "0 0 30px rgba(239,68,68,0.15), inset 0 1px 0 rgba(255,255,255,0.06)" }}>
                <motion.div
                  animate={{ scale: [1, 0.92, 1], rotate: [0, -6, 6, 0] }}
                  transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", delay: 0.5 }}
                >
                  <SearchX className="h-8 w-8 text-red-400/90" strokeWidth={1.5} />
                </motion.div>
              </div>

              {/* Floating clapperboard */}
              <motion.div
                animate={{ y: [-4, 4, -4], rotate: [-12, 12, -12], opacity: [0.7, 1, 0.7] }}
                transition={{ repeat: Infinity, duration: 3.8, ease: "easeInOut" }}
                className="absolute -right-2 -bottom-1 z-20"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "rgba(8,15,40,0.90)", border: "1px solid rgba(249,115,22,0.35)", boxShadow: "0 0 12px rgba(249,115,22,0.25)" }}>
                  <Clapperboard className="h-4 w-4 text-orange-400" strokeWidth={1.5} />
                </div>
              </motion.div>

              {/* Tiny x-dot */}
              <motion.div
                animate={{ opacity: [0.3, 0.9, 0.3], scale: [0.8, 1.2, 0.8] }}
                transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut", delay: 1 }}
                className="absolute top-3 left-5"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-red-400" style={{ boxShadow: "0 0 6px rgba(239,68,68,0.8)" }} />
              </motion.div>
            </div>

            {/* Text */}
            <div className="space-y-2.5 text-center">
              <h3 className="text-xl font-display font-semibold tracking-tight text-white md:text-2xl">No Movies Found</h3>
              <p className="max-w-[260px] text-xs leading-relaxed text-slate-400 md:text-sm">
                Nothing matched your search. Try tweaking your filters or explore our trending collection.
              </p>
            </div>

            {/* Hint pill */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-mono text-slate-400 uppercase tracking-widest" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}>
              <span style={{ color: "#60A5FA" }}>↑</span> try different filters
            </div>
          </motion.div>
        ) : isNetflix ? (
          <div className="flex max-w-md flex-col items-center rounded-md border border-white/10 bg-[#181818] px-8 py-10 shadow-[0_22px_55px_rgba(0,0,0,0.45)]">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#E50914]/15">
              <SearchX className="h-9 w-9 text-[#E50914]" strokeWidth={1.8} />
            </div>
            <p className="mb-2 text-2xl font-black tracking-tight text-white">No titles found</p>
            <p className="max-w-[290px] text-sm leading-relaxed text-white/60">
              Try a broader search, clear a few filters, or jump back into browsing.
            </p>
          </div>
        ) : (
          <div className="brutal-card relative flex w-full max-w-md flex-col items-center overflow-hidden bg-surface p-10">
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: "repeating-linear-gradient(45deg, #fff 25%, transparent 25%, transparent 75%, #fff 75%, #fff), repeating-linear-gradient(45deg, #fff 25%, transparent 25%, transparent 75%, #fff 75%, #fff)",
                backgroundPosition: "0 0, 10px 10px",
                backgroundSize: "20px 20px",
              }}
            />
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="relative z-10 mb-6 flex h-20 w-20 rotate-3 items-center justify-center border-[3px] border-black bg-brutal-yellow shadow-[4px_4px_0_0_#3A3A3A] transition-transform hover:rotate-6"
            >
              <Ghost className="h-10 w-10 text-black" strokeWidth={2.5} />
            </motion.div>
            <p className="relative z-10 mb-2 font-display text-xl font-black uppercase tracking-wide text-brutal-white">
              Zero Results
            </p>
            <p className="relative z-10 mt-1 border border-brutal-border bg-black/40 px-3 py-1.5 font-mono text-xs uppercase text-brutal-muted">
              Try adjusting your filters
            </p>
          </div>
        )}
      </div>
    );
  }

  const visibleMovies = hiddenIds && hiddenIds.size > 0 ? movies.filter((m) => !hiddenIds.has(m.id)) : movies;
  const mainIds = new Set(visibleMovies.map((m) => m.id));
  const filteredPersonalized = personalizedCards.filter((m) => !mainIds.has(m.id) && !(hiddenIds?.has(m.id)));

  const hasActiveFilters =
    filters.query || filters.genre || filters.year || filters.language ||
    filters.sort !== "popularity.desc" || filters.rating || filters.runtime || filters.keyword;

  let allCards: TMDBMovie[];
  if (!hasActiveFilters && filteredPersonalized.length > 0 && visibleMovies.length >= INJECT_AFTER) {
    allCards = [
      ...visibleMovies.slice(0, INJECT_AFTER),
      ...filteredPersonalized,
      ...visibleMovies.slice(INJECT_AFTER),
    ];
  } else {
    allCards = visibleMovies;
  }

  const seen = new Set<number>();
  const dedupedCards = allCards.filter((m) => (seen.has(m.id) ? false : (seen.add(m.id), true)));

  const completeRows = Math.floor(dedupedCards.length / gridCols);
  const trimmedCards = dedupedCards.slice(0, completeRows * gridCols);

  return (
    <>
      <div className={gridClassName}>
        {trimmedCards.map((movie, i) =>
          isGlass ? (
            <motion.div
              key={movie.id}
              custom={i % 20}
              variants={posterVariant}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
            >
              <PosterCard movie={movie} onMovieClick={onMovieClick} index={i % 20} />
            </motion.div>
          ) : (
            <PosterCard key={movie.id} movie={movie} onMovieClick={onMovieClick} index={i % 20} />
          )
        )}
      </div>

      <div ref={sentinelRef} className="flex justify-center py-6 sm:py-8">
        {loadingMore && (
          isGlass ? (
            <div
              className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-display"
              style={{
                background: "rgba(96,165,250,0.10)",
                border: "1px solid rgba(96,165,250,0.25)",
                color: "#93C5FD",
                backdropFilter: "blur(8px)",
              }}
            >
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading more...
            </div>
          ) : isNetflix ? (
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#181818] px-4 py-2 text-xs font-semibold text-white/72">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#E50914]" />
              Loading more titles...
            </div>
          ) : (
            <div className="brutal-chip flex items-center gap-2 border-brutal-yellow text-brutal-yellow">
              <Loader2 className="h-4 w-4 animate-spin" />
              LOADING MORE...
            </div>
          )
        )}
      </div>

      <div className="pb-4 text-center sm:pb-6">
        {isGlass ? (
          <span
            className="inline-block rounded-full px-3 py-1 text-[11px] font-display"
            style={{ color: "rgba(100,116,139,0.7)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            {trimmedCards.length} films · page {page}/{totalPages}
          </span>
        ) : isNetflix ? (
          <span className="inline-block rounded-full border border-white/10 bg-[#181818] px-3 py-1 text-[11px] font-semibold text-white/58">
            {visibleMovies.length} titles · page {page}/{totalPages}
          </span>
        ) : (
          <span className="brutal-chip inline-block text-brutal-dim">
            {visibleMovies.length} MOVIES · PAGE {page}/{totalPages}
          </span>
        )}
      </div>
    </>
  );
}
