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
import { useThemeMode } from "@/hooks/useThemeMode";

function WatchlistContent() {
  const { watchlist, isWatched } = useMovieLists();
  const isGlass = useThemeMode() === "glass";
  const [selectedMovie, setSelectedMovie] = useState<TMDBMovie | null>(null);
  const [filteredMovies, setFilteredMovies] = useState<TMDBMovie[]>(watchlist);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());

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
    <main
      className={`min-h-screen flex flex-col pb-16 lg:pb-0 ${isGlass ? "relative overflow-x-hidden" : "bg-bg"}`}
      style={isGlass ? { background: "#020817" } : undefined}
    >
      {/* Glass depth orbs */}
      {isGlass && (
        <>
          <div className="pointer-events-none fixed left-[-20%] top-[-15%] aspect-square w-[70vw] rounded-full opacity-30" style={{ background: "radial-gradient(circle, rgba(52,211,153,0.22) 0%, transparent 70%)", filter: "blur(90px)", zIndex: 0 }} />
          <div className="pointer-events-none fixed bottom-[-20%] right-[-15%] aspect-square w-[60vw] rounded-full opacity-25" style={{ background: "radial-gradient(circle, rgba(96,165,250,0.18) 0%, transparent 70%)", filter: "blur(110px)", zIndex: 0 }} />
        </>
      )}

      {/* Sticky header */}
      <div
        className={`sticky top-0 z-50 ${isGlass ? "" : "bg-bg border-b-3 border-brutal-border"}`}
        style={isGlass ? {
          background: "rgba(2,8,23,0.80)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        } : undefined}
      >
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-5 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className={isGlass ? "flex items-center justify-center w-9 h-9 rounded-xl transition-colors hover:bg-white/10" : "brutal-btn p-2.5"}
              style={isGlass ? { border: "1px solid rgba(255,255,255,0.12)", color: "rgba(148,163,184,0.8)" } : undefined}
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={3} />
            </Link>
            <Bookmark className={`w-5 h-5 ${isGlass ? "text-emerald-400" : "text-brutal-lime"}`} fill="currentColor" strokeWidth={2.5} />
            <h1 className={`font-display font-bold text-xl sm:text-2xl tracking-tight ${isGlass ? "text-white" : "text-brutal-white uppercase"}`}>
              {isGlass ? "Watchlist" : "WATCHLIST"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 text-[10px] font-bold ${isGlass ? "rounded-lg" : "brutal-chip text-brutal-lime border-brutal-lime"}`}
              style={isGlass ? { background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.30)", color: "#6EE7B7" } : undefined}
            >
              {watchlist.length} to watch
            </span>
            {watchlist.length > 0 && (
              <button
                onClick={() => { setSelectMode((v) => !v); if (selectMode) setSelected(new Set()); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-bold transition-all active:scale-[0.97] ${
                  isGlass
                    ? "rounded-xl"
                    : `brutal-btn font-mono font-black ${selectMode ? "!bg-brutal-yellow !text-black !border-brutal-yellow" : ""}`
                }`}
                style={isGlass ? (selectMode
                  ? { background: "rgba(251,191,36,0.18)", border: "1px solid rgba(251,191,36,0.45)", color: "#FCD34D" }
                  : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(148,163,184,0.8)" }
                ) : undefined}
              >
                <CheckSquare2 className="w-3.5 h-3.5" />
                {selectMode ? "Done" : "Select"}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-[1600px] mx-auto w-full pt-2 pb-8 relative z-10">
        {watchlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-4">
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
                {isGlass ? "Watchlist empty" : "WATCHLIST EMPTY"}
              </p>
              <p className={`text-sm mb-4 ${isGlass ? "text-slate-400" : "text-brutal-muted font-mono"}`}>
                Tap the <Bookmark className="w-3 h-3 inline" /> icon on any poster to queue it.
              </p>
              <Link
                href="/"
                className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold transition-all active:scale-[0.97] ${
                  isGlass ? "rounded-xl" : "brutal-btn font-mono font-black"
                }`}
                style={isGlass ? { background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)", color: "rgba(148,163,184,0.9)" } : undefined}
              >
                <ArrowLeft className="w-3 h-3" strokeWidth={3} />Browse
              </Link>
            </div>
          </div>
        ) : (
          <>
            <ListFilterBar movies={watchlist} onFiltered={handleFiltered} />
            <div className="px-4 sm:px-6">
              <p className={`text-[10px] uppercase tracking-wider mb-4 ${isGlass ? "text-slate-500" : "text-brutal-dim font-mono"}`}>
                {watchlist.length} in queue — hit ✓ when done watching
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
                      className={`group brutal-poster relative aspect-[2/3] w-full animate-fade-in cursor-pointer ${
                        isSelected
                          ? isGlass ? "ring-2 ring-cyan-400 ring-offset-1 ring-offset-transparent" : "ring-2 ring-brutal-yellow ring-offset-2 ring-offset-bg"
                          : ""
                      }`}
                      style={{ animationDelay: `${(i % 30) * 30}ms` }}
                      onClick={() => selectMode ? toggleSelect(movie.id) : setSelectedMovie(movie)}
                    >
                      {movie.poster_path ? (
                        <Image src={posterUrl(movie.poster_path, "medium")} alt={title} fill className="object-cover" sizes="17vw" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-surface-2 p-3">
                          <span className="text-brutal-muted text-xs font-mono font-bold text-center uppercase">{title}</span>
                        </div>
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
                          <CheckCircle className={`w-10 h-10 ${isGlass ? "text-cyan-300" : "text-brutal-cyan"}`} strokeWidth={2} />
                        </div>
                      )}
                      {selectMode && (
                        <div
                          className={`absolute top-2 left-2 w-5 h-5 flex items-center justify-center transition-colors ${
                            isSelected
                              ? isGlass ? "rounded-md bg-cyan-400 border-cyan-400" : "bg-brutal-yellow border-brutal-yellow"
                              : isGlass ? "rounded-md bg-black/60" : "bg-black/60 border-brutal-border"
                          } ${isGlass ? "" : "border-2"}`}
                          style={isGlass && !isSelected ? { border: "1px solid rgba(255,255,255,0.30)" } : undefined}
                        >
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
