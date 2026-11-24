"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Dices, Film, RotateCcw, Star } from "lucide-react";
import { posterUrl } from "@/lib/constants";
import type { TMDBMovie } from "@/lib/types";
import ErrorState from "../ErrorState";

interface ResultsGridProps {
  movies: TMDBMovie[];
  onStartOver: () => void;
  onReroll: () => void;
  rerolling: boolean;
  onMovieClick: (movie: TMDBMovie) => void;
}

export default function ResultsGrid({ movies, onStartOver, onReroll, rerolling, onMovieClick }: ResultsGridProps) {
  const reduceMotion = useReducedMotion();

  if (movies.length === 0) {
    return (
      <ErrorState
        icon={Film}
        title="Nothing fit all of that"
        message="Try a wider year range or another language."
        onRetry={onStartOver}
        retryLabel="Change my picks"
        className="px-6"
      />
    );
  }

  return (
    <>
      <div className="flex flex-1 flex-col justify-center overflow-y-auto px-5 pb-6 sm:px-8">
        <ol className={`grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-5 transition-opacity duration-200 ${rerolling ? "opacity-40" : ""}`}>
          {movies.map((movie, i) => (
            <motion.li
              key={movie.id}
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            >
              <button type="button" onClick={() => onMovieClick(movie)} className="group block w-full text-left">
                <span className="relative block aspect-[2/3] overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] transition-colors duration-150 group-hover:border-white/30 group-focus-visible:border-blue-400/60">
                  {movie.poster_path ? (
                    <Image src={posterUrl(movie.poster_path, "medium")} alt="" fill className="object-cover" sizes="(min-width: 768px) 140px, 45vw" />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center"><Film className="h-8 w-8 text-slate-600" strokeWidth={1.5} /></span>
                  )}
                  {movie.vote_average > 0 && (
                    <span className="absolute right-1.5 top-1.5 flex items-center gap-1 rounded-md bg-[#020817]/80 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-amber-300">
                      <Star className="h-3 w-3 fill-current" />
                      {movie.vote_average.toFixed(1)}
                    </span>
                  )}
                </span>
                <span className="mt-2 line-clamp-2 block text-sm font-medium leading-snug text-white transition-colors duration-150 group-hover:text-blue-300">{movie.title}</span>
                {movie.release_date && <span className="mt-0.5 block text-xs tabular-nums text-slate-500">{movie.release_date.slice(0, 4)}</span>}
              </button>
            </motion.li>
          ))}
        </ol>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-white/[0.08] px-5 py-4 sm:px-8">
        <button
          type="button"
          onClick={onStartOver}
          className="flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-slate-400 transition-colors duration-150 hover:bg-white/[0.06] hover:text-white"
        >
          <RotateCcw className="h-4 w-4" /> Start over
        </button>
        <button
          type="button"
          onClick={onReroll}
          disabled={rerolling}
          className="flex min-h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold text-white transition-[transform,background-color] duration-150 hover:bg-blue-400/30 active:scale-[0.97] disabled:opacity-60 disabled:active:scale-100"
          style={{ background: "rgba(96,165,250,0.22)", border: "1px solid rgba(96,165,250,0.5)" }}
        >
          <Dices className={`h-4 w-4 ${rerolling ? "animate-spin" : ""}`} />
          {rerolling ? "Finding new picks…" : "Show 5 different films"}
        </button>
      </div>
    </>
  );
}
