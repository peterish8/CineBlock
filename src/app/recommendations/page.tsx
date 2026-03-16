"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, ArrowLeft, Bookmark, Star, Loader2, Info, X, Tv2, ShieldX } from "lucide-react";
import { TMDBMovie, TMDBDiscoverResponse } from "@/lib/types";
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
  const [includeAdult, setIncludeAdult] = useState(false);

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
        include_adult: includeAdult ? "true" : "false",
      });
      if (genreQuery) params.set("genre", genreQuery);
      // If NOT including cartoons, exclude animation genre
      if (!includeCartoons) params.set("without_genres", String(ANIMATION_GENRE_ID));
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
      apiCalls.push(fetch(`/api/movies?action=${recAction}&id=${pick.id}`));
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
  }, [watchlist, watchlistAnalysis, includeCartoons, includeAdult]);

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
  const prevAdultRef = useRef(includeAdult);
  useEffect(() => {
    if (
      prevCartoonsRef.current !== includeCartoons ||
      prevAdultRef.current !== includeAdult
    ) {
      prevCartoonsRef.current = includeCartoons;
      prevAdultRef.current = includeAdult;
      // Reset and re-fetch
      seenIdsRef.current = new Set();
      pageRef.current = 1;
      hasFetchedInitialRef.current = false;
      setMovies([]);
      setLoading(true);
      fetchPage(1).finally(() => setLoading(false));
    }
  }, [includeCartoons, includeAdult, fetchPage]);

  const handleToggleWatchlist = (movie: TMDBMovie, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWatchlist(movie);
  };

  return (
    <main className="min-h-screen bg-bg flex flex-col pb-16 lg:pb-0">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-bg border-b-3 border-brutal-border">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-5 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <Link href="/" className="brutal-btn p-2.5">
              <ArrowLeft className="w-4 h-4" strokeWidth={3} />
            </Link>
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-brutal-yellow" strokeWidth={2.5} />
              <h1 className="font-display font-bold text-xl text-brutal-white uppercase tracking-tight">
                FOR YOU
              </h1>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 flex-wrap overflow-x-auto pb-1 sm:pb-0">
            {/* Cartoons toggle */}
            <button
              onClick={() => setIncludeCartoons((v) => !v)}
              className={`brutal-btn flex items-center gap-2 px-3 py-1.5 text-[10px] font-mono font-bold uppercase transition-all ${
                includeCartoons
                  ? "bg-brutal-cyan !text-black !border-brutal-cyan"
                  : "text-brutal-white border-brutal-border"
              }`}
              title="Toggle Cartoons / Animation"
            >
              <Tv2 className="w-3.5 h-3.5" strokeWidth={2.5} />
              CARTOONS {includeCartoons ? "ON" : "OFF"}
            </button>

            {/* Adult toggle */}
            <button
              onClick={() => setIncludeAdult((v) => !v)}
              className={`brutal-btn flex items-center gap-2 px-3 py-1.5 text-[10px] font-mono font-bold uppercase transition-all ${
                includeAdult
                  ? "bg-brutal-pink !text-black !border-brutal-pink"
                  : "text-brutal-white border-brutal-border"
              }`}
              title="Toggle Adult Content"
            >
              <ShieldX className="w-3.5 h-3.5" strokeWidth={2.5} />
              ADULT {includeAdult ? "ON" : "OFF"}
            </button>

            <span className="brutal-chip text-brutal-lime border-brutal-lime text-[10px]">
              {watchlist.length} SAVED
            </span>
            <span className="brutal-chip text-brutal-dim text-[10px]">
              {movies.length} FOUND
            </span>

            {watchlist.length > 0 && (
              <button
                onClick={() => setShowSources(true)}
                className="brutal-btn flex items-center gap-2 px-3 py-1.5 text-[10px] font-mono font-bold uppercase"
              >
                <Info className="w-3 h-3" />
                SOURCES
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sources Modal */}
      {showSources && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 brutal-modal-overlay animate-fade-in">
          <div className="brutal-card w-full max-w-2xl bg-bg p-6 relative animate-slide-up flex flex-col max-h-[80vh]">
            <button
              onClick={() => setShowSources(false)}
              className="absolute -top-3 -right-3 brutal-btn p-2 bg-brutal-red text-brutal-white border-brutal-red z-10"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" strokeWidth={3} />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <Info className="w-6 h-6 text-brutal-yellow" strokeWidth={2.5} />
              <h2 className="font-display font-bold text-xl text-brutal-white uppercase tracking-tight">
                RECOMMENDATION SOURCES
              </h2>
            </div>
            <p className="text-sm font-body text-brutal-muted mb-4">
              Your feed is curated from <b>{watchlist.length}</b> saved titles:
            </p>
            <div className="flex-1 overflow-y-auto pr-2">
              <div className="flex flex-wrap gap-2">
                {watchlist.map((m) => (
                  <span key={m.id} className="brutal-chip text-brutal-yellow border-brutal-yellow text-xs">
                    {m.title || m.name || "UNKNOWN"}
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
            <div className="brutal-card p-8 max-w-md w-full">
              <Bookmark className="w-12 h-12 text-brutal-dim mx-auto mb-4" strokeWidth={1.5} />
              <p className="font-display font-bold text-lg text-brutal-white uppercase mb-2">
                EMPTY WATCHLIST
              </p>
              <p className="text-brutal-muted text-sm font-mono mb-4">
                Save some movies first to unlock personalized recommendations
              </p>
              <Link href="/" className="brutal-btn inline-flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold">
                <ArrowLeft className="w-3 h-3" strokeWidth={3} />
                GO DISCOVER
              </Link>
            </div>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-8 h-8 text-brutal-yellow animate-spin" />
            <span className="text-brutal-dim text-xs font-mono uppercase tracking-widest">
              ANALYZING YOUR TASTE...
            </span>
          </div>
        ) : (
          <>
            <p className="text-brutal-dim text-[10px] font-mono uppercase tracking-wider mb-4">
              🔥 {movies.length} CURATED PICKS — SCROLL FOR MORE
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
                <div className="flex items-center gap-2 brutal-chip text-brutal-yellow border-brutal-yellow">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  LOADING MORE...
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
