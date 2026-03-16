"use client";

import { Dices, Loader2 } from "lucide-react";
import Image from "next/image";
import UserListButtons from "../UserListButtons";
import { TMDB_IMAGE_BASE, POSTER_SIZES } from "@/lib/constants";

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  overview: string;
  vote_average: number;
}

interface ResultsGridProps {
  movies: Movie[];
  onRetry: () => void;
  onReroll: () => void;
  rerolling: boolean;
  onClose: () => void;
}

export default function ResultsGrid({ movies, onRetry, onReroll, rerolling, onClose }: ResultsGridProps) {
  if (movies.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🏜️</div>
        <h3 className="font-display font-bold text-xl text-brutal-white mb-2 uppercase">NO MOVIES FOUND</h3>
        <p className="font-mono text-xs text-brutal-muted mb-6">Your criteria might be too strict.</p>
        <button onClick={onRetry} className="brutal-btn !bg-brutal-yellow !text-black mx-auto">
          TRY AGAIN
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <h2 className="font-display font-bold text-xl text-brutal-white uppercase tracking-tight mb-4 sticky top-0 bg-bg z-10 py-2 border-b-2 border-brutal-border">
        WE FOUND THESE FOR YOU
      </h2>

      <div className="flex-1 overflow-y-auto space-y-4 pb-4 pr-2">
        {movies.map((movie, i) => (
          <div key={movie.id} className="brutal-card p-3 flex gap-4 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="w-24 shrink-0 bg-surface border-2 border-brutal-border aspect-[2/3] relative">
              {movie.poster_path ? (
                <Image
                  src={`${TMDB_IMAGE_BASE}/${POSTER_SIZES.medium}${movie.poster_path}`}
                  alt={movie.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-brutal-dim opacity-30">
                  <span className="text-2xl mb-1">🎬</span>
                  <span className="text-[8px] font-mono leading-tight">{movie.title.toUpperCase()}</span>
                </div>
              )}
              {movie.vote_average > 0 && (
                <div className="absolute top-1 right-1 bg-brutal-yellow text-black text-[9px] font-bold px-1 py-0.5 border border-black shadow-[1px_1px_0px_#000]">
                  {movie.vote_average.toFixed(1)}
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col justify-between py-1">
              <div>
                <h3 className="font-display font-bold text-sm text-brutal-white leading-tight mb-1">
                  {movie.title}
                </h3>
                <div className="text-brutal-muted text-xs font-mono mb-2">
                  <span>{movie.release_date?.substring(0, 4)}</span>
                </div>
                <p className="text-brutal-dim text-[11px] leading-snug line-clamp-3">
                  {movie.overview}
                </p>
              </div>

              <div className="mt-3">
                <UserListButtons movie={{ id: movie.id, title: movie.title, poster_path: movie.poster_path }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t-2 border-brutal-border flex items-center gap-2">
        <button
          onClick={onReroll}
          disabled={rerolling}
          className="flex-1 brutal-btn !bg-brutal-violet !text-black !border-brutal-violet flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {rerolling ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Dices className="w-4 h-4" strokeWidth={2.5} />
          )}
          {rerolling ? "FINDING..." : "REROLL"}
        </button>
        <button onClick={onRetry} className="flex-1 brutal-btn !bg-brutal-yellow !text-black">
          START OVER
        </button>
        <button onClick={onClose} className="flex-1 brutal-btn">
          CLOSE
        </button>
      </div>
    </div>
  );
}
