"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
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
  liked: "moviex_liked",
  watchlist: "moviex_watchlist",
  watched: "moviex_watched",
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
  const [liked, setLiked] = useState<TMDBMovie[]>([]);
  const [watchlist, setWatchlist] = useState<TMDBMovie[]>([]);
  const [watched, setWatched] = useState<TMDBMovie[]>([]);
  const [loaded, setLoaded] = useState(false);

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
    setLiked((prev) => {
      const exists = prev.some((m) => m.id === movie.id);
      return exists ? prev.filter((m) => m.id !== movie.id) : [movie, ...prev];
    });
    // Auto-add to watched when liking (you can only like what you've seen)
    // Unliking does NOT remove from watched — user must undo that manually
    setWatched((prev) => {
      const isAlreadyWatched = prev.some((m) => m.id === movie.id);
      const isCurrentlyLiked = liked.some((m) => m.id === movie.id);
      // Only auto-add when liking (not when un-liking)
      if (!isCurrentlyLiked && !isAlreadyWatched) {
        return [movie, ...prev];
      }
      return prev;
    });
  }, [liked]);

  // --- Watchlist ---
  const isInWatchlist = useCallback((id: number) => watchlist.some((m) => m.id === id), [watchlist]);
  const toggleWatchlist = useCallback((movie: TMDBMovie) => {
    setWatchlist((prev) => {
      const exists = prev.some((m) => m.id === movie.id);
      return exists ? prev.filter((m) => m.id !== movie.id) : [movie, ...prev];
    });
  }, []);

  // --- Watched ---
  const isWatched = useCallback((id: number) => watched.some((m) => m.id === id), [watched]);
  const toggleWatched = useCallback((movie: TMDBMovie) => {
    setWatched((prev) => {
      const exists = prev.some((m) => m.id === movie.id);
      return exists ? prev.filter((m) => m.id !== movie.id) : [movie, ...prev];
    });
  }, []);

  // Move from watchlist → watched (removes from watchlist and adds to watched)
  const moveToWatched = useCallback((movie: TMDBMovie) => {
    setWatchlist((prev) => prev.filter((m) => m.id !== movie.id));
    setWatched((prev) => {
      const exists = prev.some((m) => m.id === movie.id);
      return exists ? prev : [movie, ...prev];
    });
  }, []);

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
  // For pages that only need the old watchlist shape, expose liked as the watchlist
  // (recommendations are now driven by liked)
  return {
    watchlist: liked,    // recommendations engine uses liked now
    isInWatchlist: isLiked,
    toggleWatchlist: toggleLiked,
    clearWatchlist: () => {},
    count: liked.length,
    // Also expose the real watchlist for components that need it
    realWatchlist: watchlist,
    isInRealWatchlist: isInWatchlist,
    toggleRealWatchlist: toggleWatchlist,
  };
}
