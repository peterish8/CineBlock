"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Star, Loader2, Trophy, ChevronDown, Heart, Bookmark, CheckCircle } from "lucide-react";
import { TMDBMovie, TMDBDiscoverResponse } from "@/lib/types";
import { posterUrl } from "@/lib/constants";
import { useMovieLists } from "@/hooks/useMovieLists";
import MovieModal from "@/components/MovieModal";
import { GENRES, LANGUAGES, generateYearRange } from "@/lib/constants";

function BoxOfficeContent() {
  const { liked, isLiked, toggleLiked, isInWatchlist, toggleWatchlist, isWatched, toggleWatched } = useMovieLists();
  const [movies, setMovies] = useState<TMDBMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<TMDBMovie | null>(null);

  // Filters
  const [genre, setGenre] = useState("");
  const [year, setYear] = useState("");
  const [language, setLanguage] = useState("");
  const years = generateYearRange();

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const pageRef = useRef(1);
  const isFetchingRef = useRef(false);
  const maxPagesRef = useRef(100);

  const fetchMovies = useCallback(async (pageNum: number, isInitial = false) => {
    if (pageNum > maxPagesRef.current && !isInitial) return;
    isFetchingRef.current = true;
    if (isInitial) setLoading(true);
    else setLoadingMore(true);

    try {
      const params = new URLSearchParams({
        action: "box-office",
        page: pageNum.toString()
      });
      if (genre) params.append("genre", genre);
      if (year) params.append("year", year);
      if (language) params.append("lang", language);

      const res = await fetch(`/api/movies?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch box office");
      const data: TMDBDiscoverResponse = await res.json();
      
      const filteredResults = data.results.filter(m => m.poster_path);
      
      if (isInitial) {
        setMovies(filteredResults);
        maxPagesRef.current = data.total_pages || 100;
      } else {
        setMovies(prev => [...prev, ...filteredResults]);
      }
      pageRef.current = pageNum;
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [genre, year, language]);

  // Initial fetch and on filter change
  useEffect(() => {
    pageRef.current = 1;
    fetchMovies(1, true);
  }, [fetchMovies]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && !isFetchingRef.current && !loading && !loadingMore && pageRef.current < maxPagesRef.current) {
        fetchMovies(pageRef.current + 1);
      }
    }, { rootMargin: "800px" });

    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [fetchMovies, loading, loadingMore]);

  return (
    <main className="min-h-screen bg-bg flex flex-col pb-16 lg:pb-0">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-bg border-b-3 border-brutal-border shadow-brutal-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="brutal-btn p-2.5">
              <ArrowLeft className="w-4 h-4" strokeWidth={3} />
            </Link>
            <Trophy className="w-6 h-6 text-brutal-yellow" strokeWidth={2.5} />
            <div>
              <h1 className="font-display font-bold text-xl sm:text-2xl text-brutal-white uppercase tracking-tight leading-none">
                BOX OFFICE
              </h1>
              <span className="font-mono text-[10px] text-brutal-yellow font-bold uppercase tracking-widest mt-0.5 block">
                Highest Grossing Ever
              </span>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
            <FilterSelect 
              value={genre} 
              onChange={setGenre} 
              options={GENRES.map(g => ({ value: g.id.toString(), label: g.name }))} 
              placeholder="All Genres" 
            />
            <FilterSelect 
              value={year} 
              onChange={setYear} 
              options={years.map(y => ({ value: y, label: y }))} 
              placeholder="All Years" 
            />
            <FilterSelect 
              value={language} 
              onChange={setLanguage} 
              options={LANGUAGES.map(l => ({ value: l.code, label: l.name }))} 
              placeholder="All Languages" 
            />
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-[1600px] mx-auto w-full px-4 sm:px-6 py-6">
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="brutal-chip flex items-center gap-2 border-[var(--theme-primary)] text-[var(--theme-primary)] text-sm">
              <Loader2 className="w-4 h-4 animate-spin" strokeWidth={3} />
              <span className="font-bold">TABULATING GLOBAL TICKETS...</span>
            </div>
          </div>
        ) : movies.length === 0 ? (
          <div className="text-center py-24 text-brutal-dim font-mono text-sm uppercase">
            No movies found matching these filters. Try removing some.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-10">
            {movies.map((movie, i) => {
              const title = movie.title || movie.name || "";
              const mYear = (movie.release_date || movie.first_air_date || "").split("-")[0] || "—";
              const rating = movie.vote_average?.toFixed(1) || "0";
              const rank = i + 1;
              const liked_ = isLiked(movie.id);
              const inWl = isInWatchlist(movie.id);
              const watched_ = isWatched(movie.id);

              return (
                <div
                  key={`${movie.id}-${i}`}
                  className="group relative w-full flex flex-col justify-end animate-fade-in"
                  style={{ animationDelay: `${(i % 20) * 30}ms` }}
                >
                  {/* Huge Rank Number */}
                  <div 
                    className="absolute -top-6 sm:-top-8 -left-2 sm:-left-4 z-20 text-[60px] sm:text-[80px] font-display font-black leading-none text-transparent tracking-tighter pointer-events-none" 
                    style={{
                      WebkitTextStroke: "2px var(--theme-primary)",
                      filter: "drop-shadow(2px 2px 0px var(--theme-primary))"
                    }}
                  >
                    {rank}
                  </div>
                  
                  <div 
                    className="brutal-poster relative aspect-[2/3] w-full cursor-pointer z-10 block"
                    onClick={() => setSelectedMovie(movie)}
                  >
                    {movie.poster_path ? (
                      <Image src={posterUrl(movie.poster_path, "medium")} alt={title} fill className="object-cover" sizes="17vw" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-surface-2 p-3">
                        <span className="text-brutal-muted text-xs font-mono font-bold text-center uppercase">{title}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-100">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-brutal-white text-xs font-display font-bold uppercase leading-tight line-clamp-2">{title}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="flex items-center gap-1 text-brutal-yellow"><Star className="w-3.5 h-3.5 fill-current" strokeWidth={2.5} /><span className="text-[11px] font-mono font-bold">{rating}</span></span>
                          <span className="text-[11px] font-mono font-bold text-brutal-dim">{mYear}</span>
                        </div>
                      </div>
                    </div>
                    {/* Action buttons */}
                    <div className="absolute top-0 right-0 flex flex-col z-10">
                      <div onClick={(e) => { e.stopPropagation(); toggleLiked(movie); }} className={`border-b-3 border-l-3 border-brutal-border px-2 py-2 min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer transition-colors ${liked_ ? "bg-[var(--theme-primary)] text-black" : "bg-black/80 text-brutal-dim hover:text-[var(--theme-primary)]"}`} title="Like">
                        <Heart className={`w-3.5 h-3.5 ${liked_ ? "fill-current" : ""}`} strokeWidth={2.5} />
                      </div>
                      <div onClick={(e) => { e.stopPropagation(); toggleWatchlist(movie); }} className={`border-b-3 border-l-3 border-brutal-border px-2 py-2 min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer transition-colors ${inWl ? "bg-brutal-lime text-black" : "bg-black/80 text-brutal-dim hover:text-brutal-lime"}`} title="Watchlist">
                        <Bookmark className={`w-3.5 h-3.5 ${inWl ? "fill-current" : ""}`} strokeWidth={2.5} />
                      </div>
                      <div onClick={(e) => { e.stopPropagation(); toggleWatched(movie); }} className={`border-b-3 border-l-3 border-brutal-border px-2 py-2 min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer transition-colors ${watched_ ? "bg-brutal-cyan text-black" : "bg-black/80 text-brutal-dim hover:text-brutal-cyan"}`} title="Mark as Watched">
                        <CheckCircle className={`w-3.5 h-3.5 ${watched_ ? "fill-current" : ""}`} strokeWidth={2.5} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Loading more sentinel */}
        <div ref={sentinelRef} className="h-10 mt-8 mb-4 w-full flex items-center justify-center">
          {loadingMore && <Loader2 className="w-6 h-6 text-brutal-dim animate-spin" />}
        </div>
      </div>

      <MovieModal movie={selectedMovie} onClose={() => setSelectedMovie(null)} />
    </main>
  );
}

function FilterSelect({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; placeholder: string }) {
  return (
    <div className="relative shrink-0">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="brutal-select min-w-[120px] px-3 py-1.5 pr-8 text-[10px] font-mono font-bold uppercase"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-brutal-dim pointer-events-none" strokeWidth={3} />
    </div>
  );
}

export default function BoxOfficePage() {
  return <BoxOfficeContent />;
}
