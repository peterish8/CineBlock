"use client";

import { useMovieLists } from "@/hooks/useMovieLists";
import { TMDBMovie } from "@/lib/types";
import { posterUrl } from "@/lib/constants";
import Image from "next/image";
import { Heart, Bookmark, CheckCircle, Trash2, Star, X, CheckCheck } from "lucide-react";
import Link from "next/link";

interface WatchlistPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onMovieClick: (movie: TMDBMovie) => void;
}

export default function WatchlistPanel({ isOpen, onClose, onMovieClick }: WatchlistPanelProps) {
  const { liked, isLiked, toggleLiked, watchlist, toggleWatchlist, moveToWatched, watched, count: _c } = useMovieLists() as any;

  if (!isOpen) return null;

  const likedCount = liked.length;
  const wlCount = watchlist.length;
  const watchedCount = watched.length;

  function MovieRow({ movie, actions }: { movie: TMDBMovie; actions: React.ReactNode }) {
    const year = (movie.release_date || movie.first_air_date || "").split("-")[0] || "—";
    const rating = movie.vote_average?.toFixed(1) || "0";
    const title = movie.title || movie.name || "";
    return (
      <div
        className="flex gap-3 p-4 hover:bg-surface transition-colors cursor-pointer group"
        onClick={() => onMovieClick(movie)}
      >
        <div className="w-14 h-20 flex-shrink-0 border-2 border-brutal-border overflow-hidden bg-surface-2">
          {movie.poster_path ? (
            <Image src={posterUrl(movie.poster_path, "small")} alt={title} width={56} height={80} className="object-cover w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-brutal-dim text-[8px] font-mono">N/A</div>
          )}
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <p className="text-brutal-white text-sm font-display font-bold uppercase truncate leading-tight">{title}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="flex items-center gap-1 text-brutal-yellow">
              <Star className="w-3 h-3 fill-current" />
              <span className="text-[10px] font-mono font-bold">{rating}</span>
            </span>
            <span className="text-[10px] font-mono font-bold text-brutal-dim">{year}</span>
          </div>
        </div>
        {actions}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[90] flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 brutal-modal-overlay animate-fade-in" />
      <div
        className="relative w-full sm:max-w-md h-full bg-bg sm:border-l-3 border-brutal-border overflow-y-auto animate-slide-up sm:animate-none flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-bg border-b-3 border-brutal-border px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bookmark className="w-5 h-5 text-brutal-lime" fill="currentColor" strokeWidth={2.5} />
            <h2 className="font-display font-bold text-lg text-brutal-white uppercase tracking-tight">LISTS</h2>
          </div>
          <button onClick={onClose} className="brutal-btn p-2">
            <X className="w-4 h-4" strokeWidth={3} />
          </button>
        </div>

        {/* NAV links to full pages */}
        <div className="flex border-b-3 border-brutal-border">
          <Link href="/liked" onClick={onClose} className="flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-mono font-bold text-brutal-dim hover:text-[var(--theme-primary)] transition-colors border-r-3 border-brutal-border">
            <Heart className="w-3.5 h-3.5" strokeWidth={2.5} />
            LIKED <span className="brutal-chip text-[var(--theme-primary)] border-[var(--theme-primary)] text-[8px] px-1">{likedCount}</span>
          </Link>
          <Link href="/watchlist" onClick={onClose} className="flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-mono font-bold text-brutal-dim hover:text-brutal-lime transition-colors border-r-3 border-brutal-border">
            <Bookmark className="w-3.5 h-3.5" strokeWidth={2.5} />
            QUEUE <span className="brutal-chip text-brutal-lime border-brutal-lime text-[8px] px-1">{wlCount}</span>
          </Link>
          <Link href="/watched" onClick={onClose} className="flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-mono font-bold text-brutal-dim hover:text-brutal-cyan transition-colors">
            <CheckCheck className="w-3.5 h-3.5" strokeWidth={2.5} />
            WATCHED <span className="brutal-chip text-brutal-cyan border-brutal-cyan text-[8px] px-1">{watchedCount}</span>
          </Link>
        </div>

        {/* Liked section */}
        {liked.length > 0 && (
          <>
            <div className="px-5 py-2 bg-surface border-b border-brutal-border">
              <p className="text-[10px] font-mono font-bold text-[var(--theme-primary)] uppercase tracking-widest flex items-center gap-2">
                <Heart className="w-3 h-3" strokeWidth={2.5} /> LIKED — POWERS RECOMMENDATIONS
              </p>
            </div>
            <div className="divide-y-2 divide-brutal-border">
              {liked.map((movie: TMDBMovie) => (
                <MovieRow key={movie.id} movie={movie} actions={
                  <button onClick={(e) => { e.stopPropagation(); toggleLiked(movie); }} className="self-center p-1.5 text-brutal-dim hover:text-brutal-red transition-colors opacity-0 group-hover:opacity-100" aria-label="Unlike">
                    <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                  </button>
                } />
              ))}
            </div>
          </>
        )}

        {/* Watchlist section */}
        {watchlist.length > 0 && (
          <>
            <div className="px-5 py-2 bg-surface border-b border-brutal-border border-t-3 border-t-brutal-border">
              <p className="text-[10px] font-mono font-bold text-brutal-lime uppercase tracking-widest flex items-center gap-2">
                <Bookmark className="w-3 h-3" strokeWidth={2.5} /> TO WATCH
              </p>
            </div>
            <div className="divide-y-2 divide-brutal-border">
              {watchlist.map((movie: TMDBMovie) => (
                <MovieRow key={movie.id} movie={movie} actions={
                  <div className="flex flex-col gap-1 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); moveToWatched(movie); }}
                      className="p-1.5 text-brutal-dim hover:text-brutal-cyan transition-colors"
                      aria-label="Mark as watched"
                      title="Move to Watched"
                    >
                      <CheckCircle className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleWatchlist(movie); }}
                      className="p-1.5 text-brutal-dim hover:text-brutal-red transition-colors"
                      aria-label="Remove from watchlist"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                  </div>
                } />
              ))}
            </div>
          </>
        )}

        {/* Watched section */}
        {watched.length > 0 && (
          <>
            <div className="px-5 py-2 bg-surface border-b border-brutal-border border-t-3 border-t-brutal-border">
              <p className="text-[10px] font-mono font-bold text-brutal-cyan uppercase tracking-widest flex items-center gap-2">
                <CheckCheck className="w-3 h-3" strokeWidth={2.5} /> WATCHED
              </p>
            </div>
            <div className="divide-y-2 divide-brutal-border">
              {watched.map((movie: TMDBMovie) => (
                <MovieRow key={movie.id} movie={movie} actions={
                  <span className="self-center ml-2">
                    <CheckCircle className="w-4 h-4 text-brutal-cyan fill-brutal-cyan" strokeWidth={2} />
                  </span>
                } />
              ))}
            </div>
          </>
        )}

        {/* Empty */}
        {liked.length === 0 && watchlist.length === 0 && watched.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1 py-24 px-6 text-center">
            <Bookmark className="w-12 h-12 text-brutal-dim mb-4" strokeWidth={1.5} />
            <p className="font-display font-bold text-brutal-muted uppercase">Nothing here yet</p>
            <p className="text-brutal-dim text-xs font-mono mt-2">Use the ♥ Bookmark ✓ icons on any poster</p>
          </div>
        )}
      </div>
    </div>
  );
}
