"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useMutation } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import { TMDBMovie } from "@/lib/types";

interface MovieListsContextType {
  // Liked — powers recommendations
  liked: TMDBMovie[];
  isLiked: (id: number) => boolean;
  toggleLiked: (movie: TMDBMovie) => void;

  // Watchlist — to-watch queue
  watchlist: TMDBMovie[];
  isInWatchlist: (id: number) => boolean;
  toggleWatchlist: (movie: TMDBMovie) => void;

  // Watched — completed history
  watched: TMDBMovie[];
  isWatched: (id: number) => boolean;
  toggleWatched: (movie: TMDBMovie) => void;
  // Move from watchlist to watched in one action
  moveToWatched: (movie: TMDBMovie) => void;
}

const MovieListsContext = createContext<MovieListsContextType | null>(null);

const KEYS = {
  liked: "cineblock_liked",
  watchlist: "cineblock_watchlist",
  watched: "cineblock_watched",
};

function loadList(key: string): TMDBMovie[] {
  try {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as TMDBMovie[]) : [];
  } catch {
    return [];
  }
}

export function MovieListsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useConvexAuth();
  const [liked, setLiked] = useState<TMDBMovie[]>([]);
  const [watchlist, setWatchlist] = useState<TMDBMovie[]>([]);
  const [watched, setWatched] = useState<TMDBMovie[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Convex mutations — only fire when authenticated
  const convexAddWatchlist = useMutation(api.lists.addToWatchlist);
  const convexRemoveWatchlist = useMutation(api.lists.removeFromWatchlist);
  const convexAddLiked = useMutation(api.lists.addToLiked);
  const convexRemoveLiked = useMutation(api.lists.removeFromLiked);
  const convexAddWatched = useMutation(api.lists.addToWatched);
  const convexRemoveWatched = useMutation(api.lists.removeFromWatched);

  // Load all three from localStorage on mount
  useEffect(() => {
    setLiked(loadList(KEYS.liked));
    setWatchlist(loadList(KEYS.watchlist));
    setWatched(loadList(KEYS.watched));
    setLoaded(true);
  }, []);

  // Persist each list whenever it changes
  useEffect(() => {
    if (loaded) localStorage.setItem(KEYS.liked, JSON.stringify(liked));
  }, [liked, loaded]);
  useEffect(() => {
    if (loaded) localStorage.setItem(KEYS.watchlist, JSON.stringify(watchlist));
  }, [watchlist, loaded]);
  useEffect(() => {
    if (loaded) localStorage.setItem(KEYS.watched, JSON.stringify(watched));
  }, [watched, loaded]);

  // --- Liked ---
  const isLiked = useCallback((id: number) => liked.some((m) => m.id === id), [liked]);
  const toggleLiked = useCallback((movie: TMDBMovie) => {
    const currentlyLiked = liked.some((m) => m.id === movie.id);
    setLiked((prev) =>
      currentlyLiked ? prev.filter((m) => m.id !== movie.id) : [movie, ...prev]
    );
    // Auto-add to watched when liking
    if (!currentlyLiked) {
      setWatched((prev) => {
        const isAlreadyWatched = prev.some((m) => m.id === movie.id);
        return isAlreadyWatched ? prev : [movie, ...prev];
      });
    }
    // Sync to Convex
    if (isAuthenticated) {
      if (currentlyLiked) {
        void convexRemoveLiked({ movieId: movie.id });
      } else {
        void convexAddLiked({
          movieId: movie.id,
          movieTitle: movie.title,
          posterPath: movie.poster_path ?? "",
        });
      }
    }
  }, [liked, isAuthenticated, convexAddLiked, convexRemoveLiked]);

  // --- Watchlist ---
  const isInWatchlist = useCallback((id: number) => watchlist.some((m) => m.id === id), [watchlist]);
  const toggleWatchlist = useCallback((movie: TMDBMovie) => {
    const currentlyIn = watchlist.some((m) => m.id === movie.id);
    setWatchlist((prev) =>
      currentlyIn ? prev.filter((m) => m.id !== movie.id) : [movie, ...prev]
    );
    // Sync to Convex
    if (isAuthenticated) {
      if (currentlyIn) {
        void convexRemoveWatchlist({ movieId: movie.id });
      } else {
        void convexAddWatchlist({
          movieId: movie.id,
          movieTitle: movie.title,
          posterPath: movie.poster_path ?? "",
        });
      }
    }
  }, [watchlist, isAuthenticated, convexAddWatchlist, convexRemoveWatchlist]);

  // --- Watched ---
  const isWatched = useCallback((id: number) => watched.some((m) => m.id === id), [watched]);
  const toggleWatched = useCallback((movie: TMDBMovie) => {
    const currentlyWatched = watched.some((m) => m.id === movie.id);
    setWatched((prev) =>
      currentlyWatched ? prev.filter((m) => m.id !== movie.id) : [movie, ...prev]
    );
    // Sync to Convex
    if (isAuthenticated) {
      if (currentlyWatched) {
        void convexRemoveWatched({ movieId: movie.id });
      } else {
        void convexAddWatched({
          movieId: movie.id,
          movieTitle: movie.title,
          posterPath: movie.poster_path ?? "",
        });
      }
    }
  }, [watched, isAuthenticated, convexAddWatched, convexRemoveWatched]);

  // Move from watchlist → watched
  const moveToWatched = useCallback((movie: TMDBMovie) => {
    setWatchlist((prev) => prev.filter((m) => m.id !== movie.id));
    setWatched((prev) => {
      const exists = prev.some((m) => m.id === movie.id);
      return exists ? prev : [movie, ...prev];
    });
    if (isAuthenticated) {
      void convexRemoveWatchlist({ movieId: movie.id });
      void convexAddWatched({
        movieId: movie.id,
        movieTitle: movie.title,
        posterPath: movie.poster_path ?? "",
      });
    }
  }, [isAuthenticated, convexRemoveWatchlist, convexAddWatched]);

  return (
    <MovieListsContext.Provider
      value={{
        liked, isLiked, toggleLiked,
        watchlist, isInWatchlist, toggleWatchlist,
        watched, isWatched, toggleWatched, moveToWatched,
      }}
    >
      {children}
    </MovieListsContext.Provider>
  );
}

export function useMovieLists() {
  const ctx = useContext(MovieListsContext);
  if (!ctx) throw new Error("useMovieLists must be used within MovieListsProvider");
  return ctx;
}

// Backwards-compatible alias so existing pages that use WatchlistProvider/useWatchlist still compile
export { MovieListsProvider as WatchlistProvider };
export function useWatchlist() {
  const {
    liked, isLiked, toggleLiked,
    watchlist, isInWatchlist, toggleWatchlist,
  } = useMovieLists();
  return {
    watchlist: liked,
    isInWatchlist: isLiked,
    toggleWatchlist: toggleLiked,
    clearWatchlist: () => {},
    count: liked.length,
    realWatchlist: watchlist,
    isInRealWatchlist: isInWatchlist,
    toggleRealWatchlist: toggleWatchlist,
  };
}
