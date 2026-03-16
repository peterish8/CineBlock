"use client";

import { useMovieLists } from "@/hooks/useMovieLists";
import { TMDBMovie } from "@/lib/types";
import { posterUrl } from "@/lib/constants";
import Image from "next/image";
import Link from "next/link";
import { Bookmark, ArrowLeft, Star, CheckCircle, Trash2 } from "lucide-react";
import { useState } from "react";
import MovieModal from "@/components/MovieModal";
import Attribution from "@/components/Attribution";

function WatchlistContent() {
  const { watchlist, toggleWatchlist, moveToWatched, isWatched } = useMovieLists();
  const [selectedMovie, setSelectedMovie] = useState<TMDBMovie | null>(null);

  return (
    <main className="min-h-screen bg-bg flex flex-col">
      <div className="sticky top-0 z-50 bg-bg border-b-3 border-brutal-border">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="brutal-btn p-2"><ArrowLeft className="w-4 h-4" strokeWidth={3} /></Link>
            <Bookmark className="w-5 h-5 text-brutal-lime" fill="currentColor" strokeWidth={2.5} />
            <h1 className="font-display font-bold text-xl text-brutal-white uppercase tracking-tight">WATCHLIST</h1>
          </div>
          <span className="brutal-chip text-brutal-lime border-brutal-lime text-[10px]">{watchlist.length} TO WATCH</span>
        </div>
      </div>

      <div className="flex-1 max-w-[1600px] mx-auto w-full px-4 sm:px-6 py-6">
        {watchlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
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
            <p className="text-brutal-dim text-[10px] font-mono uppercase tracking-wider mb-4">
              {watchlist.length} IN QUEUE — HIT ✓ WHEN DONE WATCHING
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {watchlist.map((movie, i) => {
                const title = movie.title || movie.name || "";
                const year = (movie.release_date || movie.first_air_date || "").split("-")[0] || "—";
                const rating = movie.vote_average?.toFixed(1) || "0";
                const alreadyWatched = isWatched(movie.id);
                return (
                  <div key={movie.id} className="group brutal-poster relative aspect-[2/3] w-full animate-fade-in cursor-pointer" style={{ animationDelay: `${(i % 30) * 30}ms` }} onClick={() => setSelectedMovie(movie)}>
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
                    {/* Action buttons */}
                    <div className="absolute top-0 left-0 flex flex-col z-10">
                      {/* Move to watched */}
                      <div onClick={(e) => { e.stopPropagation(); moveToWatched(movie); }} className={`border-b-3 border-r-3 border-brutal-border px-2 py-2 min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer transition-colors ${alreadyWatched ? "bg-brutal-cyan text-black" : "bg-black/80 text-brutal-dim hover:text-brutal-cyan"}`} role="button" title="Mark as Watched" aria-label="Mark as watched">
                        <CheckCircle className={`w-3.5 h-3.5 ${alreadyWatched ? "fill-current" : ""}`} strokeWidth={2.5} />
                      </div>
                      {/* Remove */}
                      <div onClick={(e) => { e.stopPropagation(); toggleWatchlist(movie); }} className="border-b-3 border-r-3 border-brutal-border px-2 py-2 min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer bg-black/80 text-brutal-dim hover:text-brutal-red transition-colors" role="button" title="Remove from Watchlist">
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                      </div>
                    </div>
                    {alreadyWatched && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                        <CheckCircle className="w-10 h-10 text-brutal-cyan" strokeWidth={2} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      <Attribution />
      <MovieModal movie={selectedMovie} onClose={() => setSelectedMovie(null)} />
    </main>
  );
}

export default function WatchlistPage() {
  return <WatchlistContent />;
}
