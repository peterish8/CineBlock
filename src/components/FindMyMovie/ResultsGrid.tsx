"use client";

import { Dices, Film, Loader2, RotateCcw, X } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
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
  onMovieClick: (movie: Movie) => void;
  isGlass?: boolean;
}

export default function ResultsGrid({
  movies,
  onRetry,
  onReroll,
  rerolling,
  onClose,
  onMovieClick,
  isGlass,
}: ResultsGridProps) {
  if (movies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-[20px] border"
          style={isGlass ? {
            background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))",
            borderColor: "rgba(255,255,255,0.1)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
          } : undefined}
        >
          <Film className={`h-6 w-6 ${isGlass ? "text-slate-300" : "text-brutal-white"}`} />
        </div>
        <h3 className={`font-display font-bold text-xl ${isGlass ? "text-white" : "text-brutal-white uppercase"}`}>
          {isGlass ? "Nothing matched" : "NO MOVIES FOUND"}
        </h3>
        <p className={`text-sm ${isGlass ? "text-slate-400" : "font-mono text-xs text-brutal-muted"}`}>
          Your criteria might be too strict.
        </p>
        <button
          onClick={onRetry}
          className={isGlass
            ? "mt-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            : "brutal-btn !bg-brutal-yellow !text-black mx-auto"
          }
          style={isGlass ? {
            background: "rgba(96,165,250,0.18)",
            border: "1px solid rgba(96,165,250,0.35)",
          } : undefined}
        >
          {isGlass ? "Try Again" : "TRY AGAIN"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div
        className="shrink-0 px-4 sm:px-6 pt-4 pb-3"
        style={isGlass ? {
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(8,14,36,0.95)",
        } : {
          borderBottom: "2px solid var(--color-brutal-border)",
          background: "var(--color-bg)",
        }}
      >
        <p className={`text-[10px] font-semibold uppercase tracking-[0.15em] mb-0.5 ${isGlass ? "text-slate-500" : "font-mono text-brutal-dim"}`}>
          Results
        </p>
        <h2 className={`font-display font-bold leading-tight ${isGlass ? "text-[1.15rem] text-white tracking-[-0.02em]" : "text-lg text-brutal-white uppercase tracking-tight"}`}>
          {isGlass ? "We found these for you" : "WE FOUND THESE FOR YOU"}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 space-y-3">
        {movies.map((movie, i) => (
          <motion.div
            key={movie.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className={`flex gap-3 p-3 transition-all duration-200 cursor-pointer group ${isGlass ? "rounded-[22px]" : ""}`}
            style={isGlass ? {
              background: "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.03))",
              border: "1px solid rgba(255,255,255,0.09)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
            } : {
              border: "2px solid var(--color-brutal-border)",
              background: "var(--color-surface)",
            }}
            onClick={() => onMovieClick(movie)}
            whileHover={isGlass ? { y: -2, backgroundColor: "rgba(255,255,255,0.06)" } : undefined}
          >
            <div className={`w-[60px] shrink-0 aspect-[2/3] relative overflow-hidden ${isGlass ? "rounded-lg" : "border-2 border-brutal-border"}`}>
              {movie.poster_path ? (
                <Image
                  src={`${TMDB_IMAGE_BASE}/${POSTER_SIZES.medium}${movie.poster_path}`}
                  alt={movie.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-white/5 text-center p-1">
                  <Film className="h-4 w-4 text-slate-400" />
                </div>
              )}
              {movie.vote_average > 0 && (
                <div
                  className="absolute bottom-0 inset-x-0 text-center text-[10px] font-bold py-0.5"
                  style={isGlass ? {
                    background: "rgba(0,0,0,0.65)",
                    backdropFilter: "blur(4px)",
                    color: "#FCD34D",
                  } : {
                    background: "#FFDE21",
                    color: "#000",
                    borderTop: "1px solid #000",
                  }}
                >
                  {movie.vote_average.toFixed(1)}
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
              <div>
                <h3 className={`font-display leading-tight mb-1 truncate transition-colors ${
                  isGlass
                    ? "text-[1.05rem] font-semibold text-white group-hover:text-blue-100"
                    : "text-brutal-white group-hover:text-brutal-pink"
                }`}>
                  {movie.title}
                </h3>
                <p className={`mb-2 ${isGlass ? "text-[0.82rem] text-slate-400 font-medium" : "text-xs font-mono text-brutal-muted"}`}>
                  {movie.release_date?.substring(0, 4)}
                </p>
                <p className={`leading-relaxed line-clamp-2 ${isGlass ? "text-[0.9rem] text-slate-300" : "text-xs text-brutal-muted"}`}>
                  {movie.overview}
                </p>
              </div>

              <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                <UserListButtons movie={{ id: movie.id, title: movie.title, poster_path: movie.poster_path }} isGlass={isGlass} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div
        className="shrink-0 px-4 sm:px-6 py-3 flex flex-col gap-2"
        style={isGlass ? {
          borderTop: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.02)",
        } : {
          borderTop: "2px solid var(--color-brutal-border)",
          background: "var(--color-surface)",
        }}
      >
        <button
          onClick={onReroll}
          disabled={rerolling}
          className={`w-full flex items-center justify-center gap-2 py-2.5 font-semibold text-sm transition-all disabled:opacity-50 active:scale-[0.98] ${
            isGlass
              ? "rounded-[20px] text-white hover:brightness-110"
              : "brutal-btn !bg-brutal-violet !text-white !border-brutal-violet font-mono font-bold tracking-widest"
          }`}
          style={isGlass ? {
            background: "linear-gradient(135deg, rgba(79,70,229,0.66), rgba(59,130,246,0.58) 55%, rgba(14,165,233,0.46))",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 16px 40px rgba(15,23,42,0.4), inset 0 1px 0 rgba(255,255,255,0.14)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
          } : undefined}
        >
          {rerolling ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Dices className="w-4 h-4" strokeWidth={2.5} />
          )}
          {rerolling ? (isGlass ? "Finding..." : "FINDING...") : (isGlass ? "Reroll with new picks" : "REROLL")}
        </button>

        <div className="flex gap-2">
          <button
            onClick={onRetry}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium transition-all active:scale-[0.98] ${
              isGlass
                ? "rounded-[18px] text-slate-300 hover:text-white hover:bg-white/7"
                : "brutal-btn font-mono font-bold text-xs tracking-widest"
            }`}
            style={isGlass ? {
              background: "rgba(255,255,255,0.055)",
              border: "1px solid rgba(255,255,255,0.08)",
            } : undefined}
          >
            <RotateCcw className="w-3.5 h-3.5" strokeWidth={2.5} />
            {isGlass ? "Start Over" : "START OVER"}
          </button>

          <button
            onClick={onClose}
            className={`flex items-center justify-center gap-1.5 px-4 py-2 text-sm transition-all active:scale-[0.98] ${
              isGlass
                ? "rounded-[18px] text-slate-500 hover:text-slate-300"
                : "brutal-btn font-mono font-bold text-xs tracking-widest"
            }`}
            style={isGlass ? { background: "transparent", border: "1px solid transparent" } : undefined}
          >
            <X className="w-3.5 h-3.5" strokeWidth={2.5} />
            {isGlass ? "Close" : "CLOSE"}
          </button>
        </div>
      </div>
    </div>
  );
}
