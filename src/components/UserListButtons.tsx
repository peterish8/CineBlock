"use client";

import { useConvexAuth } from "convex/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useMovieLists } from "@/hooks/useMovieLists";
import { Bookmark, CheckCircle, Heart } from "lucide-react";

interface UserListButtonsProps {
  movie: {
    id: number;
    title: string;
    poster_path: string | null;
  };
  isGlass?: boolean;
}

export default function UserListButtons({ movie, isGlass = false }: UserListButtonsProps) {
  const { isAuthenticated } = useConvexAuth();

  // Local Storage Path
  const localLists = useMovieLists();

  // Convex Path
  const serverIsWatchlist = useQuery(api.lists.isInWatchlist, { movieId: movie.id });
  const serverIsWatched = useQuery(api.lists.isWatched, { movieId: movie.id });
  const serverIsLiked = useQuery(api.lists.isLiked, { movieId: movie.id });

  const serverAddWatchlist = useMutation(api.lists.addToWatchlist);
  const serverRemoveWatchlist = useMutation(api.lists.removeFromWatchlist);
  const serverAddWatched = useMutation(api.lists.addToWatched);
  const serverRemoveWatched = useMutation(api.lists.removeFromWatched);
  const serverAddLiked = useMutation(api.lists.addToLiked);
  const serverRemoveLiked = useMutation(api.lists.removeFromLiked);

  // Derived state
  const inWatchlist = isAuthenticated ? serverIsWatchlist : localLists.isInWatchlist(movie.id);
  const inWatched = isAuthenticated ? serverIsWatched : localLists.isWatched(movie.id);
  const inLiked = isAuthenticated ? serverIsLiked : localLists.isLiked(movie.id);

  const handleWatchlist = () => {
    if (isAuthenticated) {
      if (inWatchlist) {
        void serverRemoveWatchlist({ movieId: movie.id });
      } else {
        void serverAddWatchlist({
          movieId: movie.id,
          movieTitle: movie.title,
          posterPath: movie.poster_path || "",
        });
      }
    } else {
      localLists.toggleWatchlist(movie as any);
    }
  };

  const handleWatched = () => {
    if (isAuthenticated) {
      if (inWatched) {
        void serverRemoveWatched({ movieId: movie.id });
      } else {
        void serverAddWatched({
          movieId: movie.id,
          movieTitle: movie.title,
          posterPath: movie.poster_path || "",
        });
      }
    } else {
      localLists.toggleWatched(movie as any);
    }
  };

  const handleLiked = () => {
    if (isAuthenticated) {
      if (inLiked) {
        void serverRemoveLiked({ movieId: movie.id });
      } else {
        void serverAddLiked({
          movieId: movie.id,
          movieTitle: movie.title,
          posterPath: movie.poster_path || "",
        });
      }
    } else {
      localLists.toggleLiked(movie as any);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleWatchlist}
        title="Watchlist"
        className={isGlass
          ? `w-10 h-10 flex items-center justify-center rounded-[14px] border transition-all ${inWatchlist ? "text-orange-300" : "text-slate-300 hover:text-white"}`
          : `w-8 h-8 flex items-center justify-center rounded-none border-2 border-brutal-border hover:shadow-brutal-hover hover:-translate-y-[2px] hover:-translate-x-[2px] transition-all
          ${inWatchlist ? "bg-brutal-pink text-black" : "bg-bg text-brutal-white"}`}
        style={isGlass ? {
          background: inWatchlist ? "linear-gradient(135deg, rgba(251,146,60,0.22), rgba(249,115,22,0.12))" : "rgba(255,255,255,0.045)",
          borderColor: inWatchlist ? "rgba(251,146,60,0.34)" : "rgba(255,255,255,0.08)",
          boxShadow: inWatchlist ? "0 10px 24px rgba(249,115,22,0.12), inset 0 1px 0 rgba(255,255,255,0.12)" : "inset 0 1px 0 rgba(255,255,255,0.04)",
          backdropFilter: "blur(14px)",
        } : undefined}
      >
        <Bookmark className="w-4 h-4" />
      </button>
      <button
        onClick={handleWatched}
        title="Watched"
        className={isGlass
          ? `w-10 h-10 flex items-center justify-center rounded-[14px] border transition-all ${inWatched ? "text-emerald-300" : "text-slate-300 hover:text-white"}`
          : `w-8 h-8 flex items-center justify-center rounded-none border-2 border-brutal-border hover:shadow-brutal-hover hover:-translate-y-[2px] hover:-translate-x-[2px] transition-all
          ${inWatched ? "bg-brutal-lime text-black" : "bg-bg text-brutal-white"}`}
        style={isGlass ? {
          background: inWatched ? "linear-gradient(135deg, rgba(16,185,129,0.22), rgba(5,150,105,0.12))" : "rgba(255,255,255,0.045)",
          borderColor: inWatched ? "rgba(52,211,153,0.34)" : "rgba(255,255,255,0.08)",
          boxShadow: inWatched ? "0 10px 24px rgba(5,150,105,0.12), inset 0 1px 0 rgba(255,255,255,0.12)" : "inset 0 1px 0 rgba(255,255,255,0.04)",
          backdropFilter: "blur(14px)",
        } : undefined}
      >
        <CheckCircle className={`w-4 h-4 ${inWatched ? "fill-current" : ""}`} />
      </button>
      <button
        onClick={handleLiked}
        title="Like"
        className={isGlass
          ? `w-10 h-10 flex items-center justify-center rounded-[14px] border transition-all ${inLiked ? "text-rose-300" : "text-slate-300 hover:text-white"}`
          : `w-8 h-8 flex items-center justify-center rounded-none border-2 border-brutal-border hover:shadow-brutal-hover hover:-translate-y-[2px] hover:-translate-x-[2px] transition-all
          ${inLiked ? "bg-brutal-red text-black" : "bg-bg text-brutal-white"}`}
        style={isGlass ? {
          background: inLiked ? "linear-gradient(135deg, rgba(244,63,94,0.22), rgba(225,29,72,0.12))" : "rgba(255,255,255,0.045)",
          borderColor: inLiked ? "rgba(251,113,133,0.34)" : "rgba(255,255,255,0.08)",
          boxShadow: inLiked ? "0 10px 24px rgba(225,29,72,0.12), inset 0 1px 0 rgba(255,255,255,0.12)" : "inset 0 1px 0 rgba(255,255,255,0.04)",
          backdropFilter: "blur(14px)",
        } : undefined}
      >
        <Heart className={`w-4 h-4 ${inLiked ? "fill-current" : ""}`} />
      </button>
    </div>
  );
}
