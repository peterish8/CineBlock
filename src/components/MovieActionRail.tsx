"use client";

import { useState } from "react";
import { Heart, Bookmark, CheckCircle, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { TMDBMovie } from "@/lib/types";
import { useMovieLists } from "@/hooks/useMovieLists";
import { useBlockModal } from "@/components/BlockModalProvider";
import { useStampModal } from "@/components/StampProvider";
import { useThemeMode } from "@/hooks/useThemeMode";

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
  const { openStampNudge } = useStampModal();
  const theme = useThemeMode();
  const [likeAnim, setLikeAnim] = useState(false);
  const [watchlistAnim, setWatchlistAnim] = useState(false);
  const [watchedAnim, setWatchedAnim] = useState(false);
  const [addAnim, setAddAnim] = useState(false);

  const liked = isLiked(movie.id);
  const inWatchlist = isInWatchlist(movie.id);
  const watched = isWatched(movie.id);
  const isNetflix = theme === "netflix";
  const isGlass = theme === "glass";
  const railClassName = isNetflix && className === "absolute top-0 left-0 z-10 flex flex-col border-brutal-border"
    ? "absolute bottom-3 left-3 z-10 flex items-center gap-2"
    : className;

  const netflixBase = "flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/30 bg-[rgba(42,42,42,0.92)] text-white/88 transition-colors hover:border-white";

  const glassBase = "min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer transition-colors duration-150 border-b-3 border-r-3 border-brutal-border";
  const glassWatchedStyle = watched
    ? {
        background: "linear-gradient(135deg, rgba(16,185,129,0.28), rgba(5,150,105,0.14))",
        boxShadow: "0 10px 24px rgba(5,150,105,0.18), inset 0 1px 0 rgba(255,255,255,0.12)",
        backdropFilter: "blur(16px)",
      }
    : {
        background: "rgba(10,15,30,0.72)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
        backdropFilter: "blur(12px)",
      };

  const triggerAnim = (setter: (v: boolean) => void) => {
    setter(true);
    setTimeout(() => setter(false), 550);
  };

  if (isGlass) {
    return (
      <div className={railClassName}>
        {actions.includes("like") && (
          <motion.div
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              triggerAnim(setLikeAnim);
              void toggleLiked(movie);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                if (e.key === " ") e.preventDefault();
                e.stopPropagation();
                triggerAnim(setLikeAnim);
                void toggleLiked(movie);
              }
            }}
            className={`${glassBase} px-2 py-2 active:brightness-75 ${liked ? "text-rose-400" : "text-white/50 hover:text-rose-400"}`}
            style={{
              background: "rgba(10,15,30,0.72)",
              backdropFilter: "blur(10px)",
            }}
            aria-label={liked ? "Unlike" : "Like"}
            aria-pressed={liked}
            title="Like"
          >
            <motion.span
              animate={likeAnim
                ? { scale: [1, 1.7, 0.8, 1.2, 1], rotate: [0, -12, 8, -4, 0] }
                : { scale: 1, rotate: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{ display: "flex" }}
            >
              <Heart className={`h-3.5 w-3.5 ${liked ? "fill-current" : ""}`} strokeWidth={2.5} />
            </motion.span>
          </motion.div>
        )}

        {actions.includes("watchlist") && (
          <motion.div
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              triggerAnim(setWatchlistAnim);
              void toggleWatchlist(movie);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                if (e.key === " ") e.preventDefault();
                e.stopPropagation();
                triggerAnim(setWatchlistAnim);
                void toggleWatchlist(movie);
              }
            }}
            className={`${glassBase} px-2 py-2 active:brightness-75 ${inWatchlist ? "text-orange-400" : "text-white/50 hover:text-orange-400"}`}
            style={{
              background: "rgba(10,15,30,0.72)",
              backdropFilter: "blur(10px)",
            }}
            aria-label={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
            aria-pressed={inWatchlist}
            title="Watchlist"
          >
            <motion.span
              animate={watchlistAnim
                ? { y: [0, -5, 3, -2, 0], scale: [1, 0.9, 1.15, 0.95, 1] }
                : { y: 0, scale: 1 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              style={{ display: "flex" }}
            >
              <Bookmark className={`h-3.5 w-3.5 ${inWatchlist ? "fill-current" : ""}`} strokeWidth={2.5} />
            </motion.span>
          </motion.div>
        )}

        {actions.includes("watched") && (
          <motion.div
            role="button"
            tabIndex={0}
            onClick={async (e) => {
              e.stopPropagation();
              triggerAnim(setWatchedAnim);
              const wasWatched = isWatched(movie.id);
              const { added } = await toggleWatched(movie);
              if (added && !wasWatched) {
                openStampNudge({
                  id: movie.id,
                  title: movie.title || movie.name || "Untitled",
                  posterPath: movie.poster_path || "",
                });
              }
            }}
            onKeyDown={async (e) => {
              if (e.key === "Enter" || e.key === " ") {
                if (e.key === " ") e.preventDefault();
                e.stopPropagation();
                triggerAnim(setWatchedAnim);
                const wasWatched = isWatched(movie.id);
                const { added } = await toggleWatched(movie);
                if (added && !wasWatched) {
                  openStampNudge({
                    id: movie.id,
                    title: movie.title || movie.name || "Untitled",
                    posterPath: movie.poster_path || "",
                  });
                }
              }
            }}
            className={`${glassBase} px-2 py-2 active:brightness-75 ${watched ? "text-emerald-300" : "text-white/50 hover:text-emerald-400"}`}
            style={glassWatchedStyle}
            aria-label={watched ? "Mark as unwatched" : "Mark as watched"}
            aria-pressed={watched}
            title="Watched"
          >
            <motion.span
              animate={watchedAnim
                ? { scale: [1, 1.6, 0.85, 1.15, 1], y: [0, -3, 2, -1, 0] }
                : { scale: 1, y: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              style={{ display: "flex" }}
            >
              <CheckCircle className={`h-3.5 w-3.5 ${watched ? "fill-current" : ""}`} strokeWidth={2.5} />
            </motion.span>
          </motion.div>
        )}

        {actions.includes("add") && (
          <motion.div
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              triggerAnim(setAddAnim);
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
                triggerAnim(setAddAnim);
                openBlockModal({
                  id: movie.id,
                  title: movie.title || movie.name || "Untitled",
                  posterPath: movie.poster_path || "",
                });
              }
            }}
            className={`${glassBase} px-2 py-2 active:brightness-75 text-white/50 hover:text-violet-400`}
            style={{
              background: "rgba(10,15,30,0.72)",
              backdropFilter: "blur(10px)",
            }}
            aria-label="Add to CineBlock"
            title="Add to CineBlock"
          >
            <motion.span
              animate={addAnim
                ? { rotate: [0, 90, 180, 135, 90], scale: [1, 1.3, 1, 1.15, 1] }
                : { rotate: 0, scale: 1 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              style={{ display: "flex" }}
            >
              <Plus className="h-4 w-4" strokeWidth={3} />
            </motion.span>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className={railClassName}>
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
          className={isNetflix
            ? `${netflixBase} ${liked ? "border-white bg-white text-black" : ""}`
            : `min-h-[36px] min-w-[36px] border-b-3 border-r-3 border-brutal-border px-2 py-2 flex items-center justify-center cursor-pointer transition-colors duration-100 ${liked ? "bg-[var(--theme-primary)] text-black" : "bg-black/80 text-brutal-dim hover:text-[var(--theme-primary)]"}`}
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
          className={isNetflix
            ? `${netflixBase} ${inWatchlist ? "border-white text-white" : ""}`
            : `min-h-[36px] min-w-[36px] border-b-3 border-r-3 border-brutal-border px-2 py-2 flex items-center justify-center cursor-pointer transition-colors duration-100 ${inWatchlist ? "bg-brutal-lime text-black" : "bg-black/80 text-brutal-dim hover:text-brutal-lime"}`}
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
          onClick={async (e) => {
            e.stopPropagation();
            const wasWatched = isWatched(movie.id);
            const { added } = await toggleWatched(movie);
            if (added && !wasWatched) {
              openStampNudge({
                id: movie.id,
                title: movie.title || movie.name || "Untitled",
                posterPath: movie.poster_path || "",
              });
            }
          }}
          onKeyDown={async (e) => {
            if (e.key === "Enter" || e.key === " ") {
              if (e.key === " ") e.preventDefault();
              e.stopPropagation();
              const wasWatched = isWatched(movie.id);
              const { added } = await toggleWatched(movie);
              if (added && !wasWatched) {
                openStampNudge({
                  id: movie.id,
                  title: movie.title || movie.name || "Untitled",
                  posterPath: movie.poster_path || "",
                });
              }
            }
          }}
          className={isNetflix
            ? `${netflixBase} ${watched ? "border-[#46D369] text-[#46D369]" : ""}`
            : `min-h-[36px] min-w-[36px] border-b-3 border-r-3 border-brutal-border px-2 py-2 flex items-center justify-center cursor-pointer transition-colors duration-100 ${watched ? "bg-brutal-cyan text-black" : "bg-black/80 text-brutal-dim hover:text-brutal-cyan"}`}
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
          className={isNetflix
            ? netflixBase
            : "min-h-[36px] min-w-[36px] border-b-3 border-r-3 border-brutal-border bg-black/80 px-2 py-2 flex items-center justify-center cursor-pointer text-brutal-dim transition-colors duration-100 hover:bg-brutal-violet hover:text-brutal-white"}
          aria-label="Add to CineBlock"
          title="Add to CineBlock"
        >
          <Plus className="h-4 w-4" strokeWidth={3} />
        </div>
      )}
    </div>
  );
}
