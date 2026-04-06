"use client";

import { useMovieLists } from "@/hooks/useMovieLists";
import { TMDBMovie } from "@/lib/types";
import { posterUrl } from "@/lib/constants";
import Image from "next/image";
import Link from "next/link";
import { Bookmark, ArrowLeft, Star, CheckCircle, CheckSquare2 } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import MovieModal from "@/components/MovieModal";
import MovieActionRail from "@/components/MovieActionRail";
import ListFilterBar from "@/components/ListFilterBar";
import SelectionBar from "@/components/SelectionBar";

function WatchlistContent() {
  const { watchlist, isWatched } = useMovieLists();
  const [selectedMovie, setSelectedMovie] = useState<TMDBMovie | null>(null);
  const [filteredMovies, setFilteredMovies] = useState<TMDBMovie[]>(watchlist);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // Sync filtered list when the source list loads from Convex
  useEffect(() => { setFilteredMovies(watchlist); }, [watchlist]);
  const handleFiltered = useCallback((f: TMDBMovie[]) => setFilteredMovies(f), []);

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filteredMovies.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredMovies.map((m) => m.id)));
    }
  };

  const clearSelection = () => {
    setSelected(new Set());
    setSelectMode(false);
  };

  return (
    <main className="min-h-screen bg-bg flex flex-col pb-16 lg:pb-0">
      <div className="sticky top-0 z-50 bg-bg border-b-3 border-brutal-border">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="brutal-btn p-2.5"><ArrowLeft className="w-4 h-4" strokeWidth={3} /></Link>
            <Bookmark className="w-5 h-5 text-brutal-lime" fill="currentColor" strokeWidth={2.5} />
            <h1 className="font-display font-bold text-xl sm:text-2xl text-brutal-white uppercase tracking-tight">WATCHLIST</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="brutal-chip text-brutal-lime border-brutal-lime text-[10px]">{watchlist.length} TO WATCH</span>
            {watchlist.length > 0 && (
              <button
                onClick={() => { setSelectMode((v) => !v); if (selectMode) setSelected(new Set()); }}
                className={`brutal-btn px-3 py-1.5 text-[9px] font-mono font-black flex items-center gap-1.5 ${selectMode ? "!bg-brutal-yellow !text-black !border-brutal-yellow" : ""}`}
              >
                <CheckSquare2 className="w-3.5 h-3.5" />
                {selectMode ? "DONE" : "SELECT"}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-[1600px] mx-auto w-full pt-2 pb-8">
        {watchlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-4">
            <div className="brutal-card p-8 max-w-md w-full">
              <Bookmark className="w-12 h-12 text-brutal-dim mx-auto mb-4" strokeWidth={1.5} />
              <p className="font-display font-bold text-lg text-brutal-white uppercase mb-2">WATCHLIST EMPTY</p>
              <p className="text-brutal-muted text-sm font-mono mb-4">Tap the <Bookmark className="w-3 h-3 inline" /> icon on any poster to queue it.</p>
              <Link href="/" className="brutal-btn inline-flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold">
                <ArrowLeft className="w-3 h-3" strokeWidth={3} />BROWSE
              </Link>
            </div>
          </div>
        ) : (
          <>
            <ListFilterBar movies={watchlist} onFiltered={handleFiltered} />
            <div className="px-4 sm:px-6">
              <p className="text-brutal-dim text-[10px] font-mono uppercase tracking-wider mb-4">
                {watchlist.length} IN QUEUE — HIT ✓ WHEN DONE WATCHING
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filteredMovies.map((movie, i) => {
                  const title = movie.title || movie.name || "";
                  const year = (movie.release_date || movie.first_air_date || "").split("-")[0] || "—";
                  const rating = movie.vote_average?.toFixed(1) || "0";
                  const alreadyWatched = isWatched(movie.id);
                  const isSelected = selected.has(movie.id);
                  return (
                    <div
                      key={movie.id}
                      className={`group brutal-poster relative aspect-[2/3] w-full animate-fade-in cursor-pointer ${isSelected ? "ring-2 ring-brutal-yellow ring-offset-2 ring-offset-bg" : ""}`}
                      style={{ animationDelay: `${(i % 30) * 30}ms` }}
                      onClick={() => selectMode ? toggleSelect(movie.id) : setSelectedMovie(movie)}
                    >
                      {movie.poster_path ? (
                        <Image src={posterUrl(movie.poster_path, "medium")} alt={title} fill className="object-cover" sizes="17vw" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-surface-2 p-3"><span className="text-brutal-muted text-xs font-mono font-bold text-center uppercase">{title}</span></div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-100 opacity-100">
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <p className="text-brutal-white text-xs font-display font-bold uppercase leading-tight line-clamp-2">{title}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="flex items-center gap-1 text-brutal-yellow"><Star className="w-3.5 h-3.5 fill-current" strokeWidth={2.5} /><span className="text-[11px] font-mono font-bold">{rating}</span></span>
                            <span className="text-[11px] font-mono font-bold text-brutal-dim">{year}</span>
                          </div>
                        </div>
                      </div>
                      <div className="absolute top-0 right-0 bg-black border-b-3 border-l-3 border-brutal-border px-2 py-1 flex items-center gap-1">
                        <Star className="w-3 h-3 text-brutal-yellow fill-current" /><span className="text-[10px] font-mono font-bold text-brutal-yellow">{rating}</span>
                      </div>
                      {!selectMode && <MovieActionRail movie={movie} actions={["like", "watchlist", "watched", "add"]} />}
                      {alreadyWatched && !selectMode && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                          <CheckCircle className="w-10 h-10 text-brutal-cyan" strokeWidth={2} />
                        </div>
                      )}
                      {/* Select mode checkbox */}
                      {selectMode && (
                        <div className={`absolute top-2 left-2 w-5 h-5 border-2 flex items-center justify-center transition-colors ${isSelected ? "bg-brutal-yellow border-brutal-yellow" : "bg-black/60 border-brutal-border"}`}>
                          {isSelected && <span className="text-black text-[10px] font-black">✓</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {selectMode && selected.size > 0 && (
        <SelectionBar
          selected={selected}
          allMovies={filteredMovies}
          onToggleAll={toggleAll}
          onClear={clearSelection}
        />
      )}

      <MovieModal movie={selectedMovie} onClose={() => setSelectedMovie(null)} />
    </main>
  );
}

export default function WatchlistPage() {
  return <WatchlistContent />;
}
