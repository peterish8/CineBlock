"use client";

import { Heart, Bookmark, CheckCircle, Plus } from "lucide-react";
import { TMDBMovie } from "@/lib/types";
import { useMovieLists } from "@/hooks/useMovieLists";
import { useBlockModal } from "@/components/BlockModalProvider";

export type MovieAction = "like" | "watchlist" | "watched" | "add";

type MovieActionRailProps = {
  movie: TMDBMovie;
  actions: MovieAction[];
  className?: string;
};

export default function MovieActionRail({
  movie,
  actions,
  className = "absolute top-0 left-0 z-10 flex flex-col border-brutal-border",
}: MovieActionRailProps) {
  const { isLiked, toggleLiked, isInWatchlist, toggleWatchlist, isWatched, toggleWatched } = useMovieLists();
  const { openBlockModal } = useBlockModal();

  const liked = isLiked(movie.id);
  const inWatchlist = isInWatchlist(movie.id);
  const watched = isWatched(movie.id);

  // Use div+role="button" instead of <button> because this component is rendered
  // inside a <button> (PosterCard). Nesting <button> inside <button> is invalid HTML.
  return (
    <div className={className}>
      {actions.includes("like") && (
        <div
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            void toggleLiked(movie);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              if (e.key === " ") e.preventDefault();
              e.stopPropagation();
              void toggleLiked(movie);
            }
          }}
          className={`min-h-[36px] min-w-[36px] border-b-3 border-r-3 border-brutal-border px-2 py-2 flex items-center justify-center cursor-pointer transition-colors duration-100 ${
            liked ? "bg-[var(--theme-primary)] text-black" : "bg-black/80 text-brutal-dim hover:text-[var(--theme-primary)]"
          }`}
          aria-label={liked ? "Unlike" : "Like"}
          aria-pressed={liked}
          title="Like"
        >
          <Heart className={`h-3.5 w-3.5 ${liked ? "fill-current" : ""}`} strokeWidth={2.5} />
        </div>
      )}

      {actions.includes("watchlist") && (
        <div
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            void toggleWatchlist(movie);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              if (e.key === " ") e.preventDefault();
              e.stopPropagation();
              void toggleWatchlist(movie);
            }
          }}
          className={`min-h-[36px] min-w-[36px] border-b-3 border-r-3 border-brutal-border px-2 py-2 flex items-center justify-center cursor-pointer transition-colors duration-100 ${
            inWatchlist ? "bg-brutal-lime text-black" : "bg-black/80 text-brutal-dim hover:text-brutal-lime"
          }`}
          aria-label={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
          aria-pressed={inWatchlist}
          title="Watchlist"
        >
          <Bookmark className={`h-3.5 w-3.5 ${inWatchlist ? "fill-current" : ""}`} strokeWidth={2.5} />
        </div>
      )}

      {actions.includes("watched") && (
        <div
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            void toggleWatched(movie);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              if (e.key === " ") e.preventDefault();
              e.stopPropagation();
              void toggleWatched(movie);
            }
          }}
          className={`min-h-[36px] min-w-[36px] border-b-3 border-r-3 border-brutal-border px-2 py-2 flex items-center justify-center cursor-pointer transition-colors duration-100 ${
            watched ? "bg-brutal-cyan text-black" : "bg-black/80 text-brutal-dim hover:text-brutal-cyan"
          }`}
          aria-label={watched ? "Mark as unwatched" : "Mark as watched"}
          aria-pressed={watched}
          title="Watched"
        >
          <CheckCircle className={`h-3.5 w-3.5 ${watched ? "fill-current" : ""}`} strokeWidth={2.5} />
        </div>
      )}

      {actions.includes("add") && (
        <div
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            openBlockModal({
              id: movie.id,
              title: movie.title || movie.name || "Untitled",
              posterPath: movie.poster_path || "",
            });
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              if (e.key === " ") e.preventDefault();
              e.stopPropagation();
              openBlockModal({
                id: movie.id,
                title: movie.title || movie.name || "Untitled",
                posterPath: movie.poster_path || "",
              });
            }
          }}
          className="min-h-[36px] min-w-[36px] border-b-3 border-r-3 border-brutal-border bg-black/80 px-2 py-2 flex items-center justify-center cursor-pointer text-brutal-dim transition-colors duration-100 hover:bg-brutal-violet hover:text-brutal-white"
          aria-label="Add to CineBlock"
          title="Add to CineBlock"
        >
          <Plus className="h-4 w-4" strokeWidth={3} />
        </div>
      )}
    </div>
  );
}
