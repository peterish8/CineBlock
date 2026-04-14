"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, ArrowLeft, Bookmark, Star, Loader2, Info, X, Tv2 } from "lucide-react";
import { motion } from "framer-motion";
import { TMDBMovie, TMDBDiscoverResponse } from "@/lib/types";
import { useThemeMode } from "@/hooks/useThemeMode";
import { posterUrl } from "@/lib/constants";
import { useMovieLists } from "@/hooks/useMovieLists";
import MovieModal from "@/components/MovieModal";

const ANIMATION_GENRE_ID = 16; // TMDB Animation

function RecommendationsContent() {
  const { watchlist, isInWatchlist, toggleWatchlist } = useMovieLists();
  const [movies, setMovies] = useState<TMDBMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<TMDBMovie | null>(null);
  const [showSources, setShowSources] = useState(false);
  const [includeCartoons, setIncludeCartoons] = useState(false);
  const isGlass = useThemeMode() === "glass";

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const hasFetchedInitialRef = useRef(false);
  const seenIdsRef = useRef<Set<number>>(new Set());
  const pageRef = useRef(1);
  const isFetchingRef = useRef(false);

  // Derived: analyse watchlist for top genres and majority format
  const watchlistAnalysis = useCallback(() => {
    const genreCounts: Record<number, number> = {};
    let totalTv = 0, totalMovies = 0;
    watchlist.forEach((m) => {
      if (m.name || m.first_air_date) totalTv++; else totalMovies++;
      m.genre_ids?.forEach((id) => {
        // Skip animation from genre weights unless cartoons enabled
        if (id === ANIMATION_GENRE_ID) return;
        genreCounts[id] = (genreCounts[id] || 0) + 1;
      });
    });
    const topGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => id);
    return { topGenres, preferTv: totalTv > totalMovies };
  }, [watchlist]);

  const fetchPage = useCallback(async (page: number) => {
    if (isFetchingRef.current || watchlist.length === 0) return;
    isFetchingRef.current = true;

    const { topGenres, preferTv } = watchlistAnalysis();
    const genreQuery = topGenres.length > 0 ? topGenres.join("|") : "";

    const apiCalls: Promise<Response>[] = [];

    // Build discover URLs for movies AND TV (whichever is preferred gets priority)
    const buildUrl = (isTvAction: boolean, p: number) => {
      const action = isTvAction ? "discover-tv" : "discover";
      const params = new URLSearchParams({
        sort: "popularity.desc",
        rating: "6.5",
        page: String(p),
      });
      if (genreQuery) params.set("genre", genreQuery);
      // If NOT including cartoons, exclude animation genre
      if (!includeCartoons) params.set("without_genres", String(ANIMATION_GENRE_ID));
      params.set("include_logos", "1");
      return `/api/movies?action=${action}&${params.toString()}`;
    };

    // Fetch two pages of the preferred format then one of the other
    if (preferTv) {
      apiCalls.push(fetch(buildUrl(true, page)));
      apiCalls.push(fetch(buildUrl(true, page + 1)));
      apiCalls.push(fetch(buildUrl(false, page)));
    } else {
      apiCalls.push(fetch(buildUrl(false, page)));
      apiCalls.push(fetch(buildUrl(false, page + 1)));
      apiCalls.push(fetch(buildUrl(true, page)));
    }

    // Also pull direct recommendations from a random watchlist item for spice
    if (watchlist.length > 0) {
      const pick = watchlist[Math.floor(Math.random() * watchlist.length)];
      const isTv = !!pick.name || !!pick.first_air_date;
      const recAction = isTv ? "recommendations-tv" : "recommendations";
      apiCalls.push(fetch(`/api/movies?action=${recAction}&id=${pick.id}&include_logos=1`));
    }

    try {
      const responses = await Promise.allSettled(apiCalls);
      const allNew: TMDBMovie[] = [];
      const watchlistIds = new Set(watchlist.map((m) => m.id));

      for (const res of responses) {
        if (res.status === "fulfilled" && res.value.ok) {
          const data: TMDBDiscoverResponse = await res.value.json();
          if (data?.results) allNew.push(...data.results);
        }
      }

      const filtered = allNew.filter((m) => {
        if (!m.poster_path) return false;
        if (watchlistIds.has(m.id)) return false;
        if (seenIdsRef.current.has(m.id)) return false;
        if (m.vote_average < 6.5) return false;
        // Exclude animation unless cartoons enabled
        if (!includeCartoons && m.genre_ids?.includes(ANIMATION_GENRE_ID)) return false;
        return true;
      });

      const unique: TMDBMovie[] = [];
      filtered.forEach((m) => {
        if (!seenIdsRef.current.has(m.id)) {
          seenIdsRef.current.add(m.id);
          unique.push(m);
        }
      });

      // Shuffle for variety
      unique.sort(() => 0.5 - Math.random());

      setMovies((prev) => [...prev, ...unique]);
      pageRef.current = page + 2;
    } catch (err) {
      console.error("Recommendation fetch error:", err);
    } finally {
      isFetchingRef.current = false;
    }
  }, [watchlist, watchlistAnalysis, includeCartoons]);

  // Initial load
  useEffect(() => {
    if (watchlist.length === 0 || hasFetchedInitialRef.current) {
      if (watchlist.length === 0) setLoading(false);
      return;
    }
    hasFetchedInitialRef.current = true;
    setLoading(true);
    fetchPage(1).finally(() => setLoading(false));
  }, [watchlist, fetchPage]);

  // Infinite scroll sentinel
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingRef.current && !loading) {
          setLoadingMore(true);
          fetchPage(pageRef.current).finally(() => setLoadingMore(false));
        }
      },
      { rootMargin: "400px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchPage, loading]);

  // Re-fetch when filters change
  const prevCartoonsRef = useRef(includeCartoons);
  useEffect(() => {
    if (prevCartoonsRef.current !== includeCartoons) {
      prevCartoonsRef.current = includeCartoons;
      // Reset and re-fetch
      seenIdsRef.current = new Set();
      pageRef.current = 1;
      hasFetchedInitialRef.current = false;
      setMovies([]);
      setLoading(true);
      fetchPage(1).finally(() => setLoading(false));
    }
  }, [includeCartoons, fetchPage]);

  const handleToggleWatchlist = (movie: TMDBMovie, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWatchlist(movie);
  };

  return (
    <main className={`min-h-screen flex flex-col pb-16 lg:pb-0 ${isGlass ? "bg-transparent" : "bg-bg"}`}>
      {/* Header */}
      <div className={isGlass
        ? "sticky top-0 z-50 backdrop-blur-2xl border-b border-white/10"
        : "sticky top-0 z-50 bg-bg border-b-3 border-brutal-border"
      } style={isGlass ? { background: "rgba(2,8,23,0.75)" } : undefined}>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-5 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <Link href="/" className={isGlass ? "p-2.5 rounded-xl bg-white/8 border border-white/10 text-white hover:bg-white/15 transition-all" : "brutal-btn p-2.5"}>
              <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
            </Link>
            <div className="flex items-center gap-3">
              <Sparkles className={`w-5 h-5 ${isGlass ? "text-blue-400" : "text-brutal-yellow"}`} strokeWidth={2.5} />
              <h1 className={isGlass ? "font-display font-semibold text-xl text-white tracking-tight" : "font-display font-bold text-xl text-brutal-white uppercase tracking-tight"}>
                {isGlass ? "For You" : "FOR YOU"}
              </h1>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 flex-wrap overflow-x-auto pb-1 sm:pb-0">
            {/* Cartoons toggle */}
            <button
              onClick={() => setIncludeCartoons((v) => !v)}
              className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase transition-all active:scale-[0.97] ${
                isGlass
                  ? "rounded-xl"
                  : `brutal-btn font-mono ${includeCartoons ? "bg-brutal-cyan !text-black !border-brutal-cyan" : "text-brutal-white border-brutal-border"}`
              }`}
              style={isGlass ? (includeCartoons
                ? { background: "rgba(34,211,238,0.18)", border: "1px solid rgba(34,211,238,0.45)", color: "#67E8F9" }
                : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(148,163,184,0.8)" }
              ) : undefined}
              title="Toggle Cartoons / Animation"
            >
              <Tv2 className="w-3.5 h-3.5" strokeWidth={2.5} />
              Cartoons {includeCartoons ? "On" : "Off"}
            </button>

            <span
              className={`px-2 py-0.5 text-[10px] font-bold ${isGlass ? "rounded-lg" : "brutal-chip text-brutal-lime border-brutal-lime"}`}
              style={isGlass ? { background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.30)", color: "#6EE7B7" } : undefined}
            >
              {watchlist.length} saved
            </span>
            <span
              className={`px-2 py-0.5 text-[10px] font-bold ${isGlass ? "rounded-lg" : "brutal-chip text-brutal-dim"}`}
              style={isGlass ? { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(148,163,184,0.6)" } : undefined}
            >
              {movies.length} found
            </span>

            {watchlist.length > 0 && (
              <button
                onClick={() => setShowSources(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase transition-all active:scale-[0.97] ${
                  isGlass ? "rounded-xl" : "brutal-btn font-mono"
                }`}
                style={isGlass ? { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(148,163,184,0.8)" } : undefined}
              >
                <Info className="w-3 h-3" />
                Sources
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sources Modal */}
      {showSources && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in"
          style={isGlass
            ? { background: "rgba(2,8,23,0.80)", backdropFilter: "blur(8px)" }
            : undefined}
        >
          {!isGlass && <div className="absolute inset-0 brutal-modal-overlay" onClick={() => setShowSources(false)} />}
          <div
            className={`w-full max-w-2xl p-6 relative animate-slide-up flex flex-col max-h-[80vh] ${
              isGlass ? "" : "brutal-card bg-bg"
            }`}
            style={isGlass ? {
              background: "rgba(8,15,40,0.96)",
              backdropFilter: "blur(28px) saturate(160%)",
              WebkitBackdropFilter: "blur(28px) saturate(160%)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "20px",
              boxShadow: "0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)",
            } : undefined}
          >
            {isGlass && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #60A5FA, #818CF8)", borderRadius: "20px 20px 0 0" }} />}
            <button
              onClick={() => setShowSources(false)}
              className={`absolute top-4 right-4 flex items-center justify-center transition-colors ${
                isGlass ? "w-8 h-8 rounded-xl hover:bg-white/10" : "-top-3 -right-3 brutal-btn p-2 bg-brutal-red text-brutal-white border-brutal-red z-10"
              }`}
              style={isGlass ? { border: "1px solid rgba(255,255,255,0.12)", color: "rgba(148,163,184,0.8)" } : undefined}
              aria-label="Close modal"
            >
              <X className={isGlass ? "w-4 h-4" : "w-5 h-5"} strokeWidth={isGlass ? 2 : 3} />
            </button>
            <div className="flex items-center gap-3 mb-4 mt-2">
              <Info className={`w-5 h-5 ${isGlass ? "text-blue-400" : "text-brutal-yellow"}`} strokeWidth={2.5} />
              <h2 className={`font-display font-bold text-lg tracking-tight ${isGlass ? "text-white" : "text-brutal-white uppercase"}`}>
                {isGlass ? "Recommendation Sources" : "RECOMMENDATION SOURCES"}
              </h2>
            </div>
            <p className={`text-sm mb-4 ${isGlass ? "text-slate-400" : "font-body text-brutal-muted"}`}>
              Your feed is curated from <b className={isGlass ? "text-white" : ""}>{watchlist.length}</b> saved titles:
            </p>
            <div className="flex-1 overflow-y-auto pr-2">
              <div className="flex flex-wrap gap-2">
                {watchlist.map((m) => (
                  <span
                    key={m.id}
                    className={`px-2 py-0.5 text-xs font-bold ${isGlass ? "rounded-lg" : "brutal-chip text-brutal-yellow border-brutal-yellow"}`}
                    style={isGlass ? { background: "rgba(251,191,36,0.10)", border: "1px solid rgba(251,191,36,0.25)", color: "#FCD34D" } : undefined}
                  >
                    {m.title || m.name || "Unknown"}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 max-w-[1600px] mx-auto w-full px-4 sm:px-6 py-6">
        {watchlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div
              className={isGlass ? "p-8 max-w-md w-full rounded-2xl" : "brutal-card p-8 max-w-md w-full"}
              style={isGlass ? {
                background: "rgba(8,15,40,0.72)",
                backdropFilter: "blur(28px) saturate(200%)",
                WebkitBackdropFilter: "blur(28px) saturate(200%)",
                border: "1px solid rgba(255,255,255,0.12)",
                boxShadow: "0 8px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.10)",
              } : undefined}
            >
              <Bookmark className={`w-12 h-12 mx-auto mb-4 ${isGlass ? "text-slate-600" : "text-brutal-dim"}`} strokeWidth={1.5} />
              <p className={`font-bold text-lg mb-2 ${isGlass ? "text-white" : "font-display text-brutal-white uppercase"}`}>
                {isGlass ? "Empty watchlist" : "EMPTY WATCHLIST"}
              </p>
              <p className={`text-sm mb-4 ${isGlass ? "text-slate-400" : "text-brutal-muted font-mono"}`}>
                Save some movies first to unlock personalized recommendations
              </p>
              <Link
                href="/"
                className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold transition-all active:scale-[0.97] ${
                  isGlass ? "rounded-xl" : "brutal-btn font-mono font-black"
                }`}
                style={isGlass ? { background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)", color: "rgba(148,163,184,0.9)" } : undefined}
              >
                <ArrowLeft className="w-3 h-3" strokeWidth={3} />
                Go Discover
              </Link>
            </div>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-6">
            {isGlass ? (
              <>
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-[30px] animate-pulse" />
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-2 border-dashed border-blue-400/25"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-blue-400 animate-pulse" strokeWidth={1.5} />
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <p className="text-white font-display font-medium text-lg tracking-tight">Curating your feed…</p>
                  <div className="h-0.5 w-36 rounded-full overflow-hidden bg-white/10">
                    <motion.div
                      animate={{ x: ["-100%", "200%"] }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                      className="h-full w-1/2 bg-gradient-to-r from-blue-400 to-orange-400 rounded-full"
                    />
                  </div>
                  <p className="text-slate-500 text-xs font-sans">Analyzing your taste…</p>
                </div>
              </>
            ) : (
              <>
                <Loader2 className="w-8 h-8 text-brutal-yellow animate-spin" />
                <span className="text-brutal-dim text-xs font-mono uppercase tracking-widest">ANALYZING YOUR TASTE...</span>
              </>
            )}
          </div>
        ) : (
          <>
            <p className={`text-[10px] uppercase tracking-wider mb-4 ${isGlass ? "text-slate-500" : "text-brutal-dim font-mono"}`}>
              🔥 {movies.length} curated picks — scroll for more
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {movies.map((movie, i) => {
                const saved = isInWatchlist(movie.id);
                const title = movie.title || movie.name || "";
                const year = (movie.release_date || movie.first_air_date || "").split("-")[0] || "—";
                const rating = movie.vote_average?.toFixed(1) || "0";

                return (
                  <div
                    key={movie.id}
                    className="group brutal-poster relative aspect-[2/3] w-full animate-fade-in cursor-pointer"
                    style={{ animationDelay: `${(i % 30) * 30}ms` }}
                    onClick={() => setSelectedMovie(movie)}
                  >
                    {movie.poster_path ? (
                      <Image
                        src={posterUrl(movie.poster_path, "medium")}
                        alt={title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 17vw"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-surface-2 p-3">
                        <span className="text-brutal-muted text-xs font-mono font-bold text-center uppercase">
                          {title}
                        </span>
                      </div>
                    )}

                    {/* Hover overlay - always on mobile */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-100 opacity-100">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-brutal-white text-xs font-display font-bold uppercase leading-tight line-clamp-2">
                          {title}
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

                    {/* Watchlist bookmark */}
                    <div
                      onClick={(e) => handleToggleWatchlist(movie, e)}
                      className={`absolute top-0 left-0 border-b-3 border-r-3 border-brutal-border px-2 py-2 min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer transition-colors duration-100 z-10 ${
                        saved
                          ? "bg-brutal-lime text-black"
                          : "bg-black/80 text-brutal-dim hover:text-brutal-lime"
                      }`}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${saved ? "fill-current" : ""}`} strokeWidth={2.5} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sentinel for infinite scroll */}
            <div ref={sentinelRef} className="py-8 flex justify-center">
              {loadingMore && (
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold ${isGlass ? "rounded-xl" : "brutal-chip text-brutal-yellow border-brutal-yellow"}`}
                  style={isGlass ? { background: "rgba(251,191,36,0.10)", border: "1px solid rgba(251,191,36,0.25)", color: "#FCD34D" } : undefined}
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading more...
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <MovieModal movie={selectedMovie} onClose={() => setSelectedMovie(null)} />
    </main>
  );
}

export default function RecommendationsPage() {
  return <RecommendationsContent />;
}
