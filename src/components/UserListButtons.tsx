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
}

export default function UserListButtons({ movie }: UserListButtonsProps) {
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
      inWatchlist
        ? void serverRemoveWatchlist({ movieId: movie.id })
        : void serverAddWatchlist({
            movieId: movie.id,
            movieTitle: movie.title,
            posterPath: movie.poster_path || "",
          });
    } else {
      localLists.toggleWatchlist(movie as any);
    }
  };

  const handleWatched = () => {
    if (isAuthenticated) {
      inWatched
        ? void serverRemoveWatched({ movieId: movie.id })
        : void serverAddWatched({
            movieId: movie.id,
            movieTitle: movie.title,
            posterPath: movie.poster_path || "",
          });
    } else {
      localLists.toggleWatched(movie as any);
    }
  };

  const handleLiked = () => {
    if (isAuthenticated) {
      inLiked
        ? void serverRemoveLiked({ movieId: movie.id })
        : void serverAddLiked({
            movieId: movie.id,
            movieTitle: movie.title,
            posterPath: movie.poster_path || "",
          });
    } else {
      localLists.toggleLiked(movie as any);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleWatchlist}
        title="Watchlist"
        className={`w-8 h-8 flex items-center justify-center rounded-none border-2 border-brutal-border hover:shadow-brutal-hover hover:-translate-y-[2px] hover:-translate-x-[2px] transition-all
          ${inWatchlist ? "bg-brutal-pink text-black" : "bg-bg text-brutal-white"}`}
      >
        <Bookmark className="w-4 h-4" />
      </button>
      <button
        onClick={handleWatched}
        title="Watched"
        className={`w-8 h-8 flex items-center justify-center rounded-none border-2 border-brutal-border hover:shadow-brutal-hover hover:-translate-y-[2px] hover:-translate-x-[2px] transition-all
          ${inWatched ? "bg-brutal-lime text-black" : "bg-bg text-brutal-white"}`}
      >
        <CheckCircle className="w-4 h-4" />
      </button>
      <button
        onClick={handleLiked}
        title="Like"
        className={`w-8 h-8 flex items-center justify-center rounded-none border-2 border-brutal-border hover:shadow-brutal-hover hover:-translate-y-[2px] hover:-translate-x-[2px] transition-all
          ${inLiked ? "bg-brutal-red text-black" : "bg-bg text-brutal-white"}`}
      >
        <Heart className={`w-4 h-4 ${inLiked ? "fill-current" : ""}`} />
      </button>
    </div>
  );
}
