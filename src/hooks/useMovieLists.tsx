"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { useMutation, useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import { TMDBMovie } from "@/lib/types";
import { saveMovieMeta } from "@/lib/movieMetaCache";

interface MovieListsContextType {
  liked: TMDBMovie[];
  isLiked: (id: number) => boolean;
  toggleLiked: (movie: TMDBMovie) => void;

  watchlist: TMDBMovie[];
  isInWatchlist: (id: number) => boolean;
  toggleWatchlist: (movie: TMDBMovie) => void;

  watched: TMDBMovie[];
  isWatched: (id: number) => boolean;
  toggleWatched: (movie: TMDBMovie) => Promise<{ added: boolean }>;
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

function toMovie(item: { movieId: number; movieTitle: string; posterPath: string }): TMDBMovie {
  return {
    id: item.movieId,
    title: item.movieTitle,
    poster_path: item.posterPath || null,
    original_title: item.movieTitle,
    overview: "",
    backdrop_path: null,
    release_date: "",
    vote_average: 0,
    vote_count: 0,
    genre_ids: [],
    original_language: "",
    popularity: 0,
    adult: false,
  };
}

export function MovieListsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useConvexAuth();

  // Local state — used when unauthenticated or before Convex loads
  const [localLiked, setLocalLiked] = useState<TMDBMovie[]>([]);
  const [localWatchlist, setLocalWatchlist] = useState<TMDBMovie[]>([]);
  const [localWatched, setLocalWatched] = useState<TMDBMovie[]>([]);
  const [localLoaded, setLocalLoaded] = useState(false);
  const didSyncUp = useRef(false);

  // Convex queries — reactive; returns [] when unauthenticated
  const convexLiked = useQuery(api.lists.getLiked);
  const convexWatchlist = useQuery(api.lists.getWatchlist);
  const convexWatched = useQuery(api.lists.getWatched);

  // Convex mutations
  const convexAddWatchlist = useMutation(api.lists.addToWatchlist);
  const convexRemoveWatchlist = useMutation(api.lists.removeFromWatchlist);
  const convexAddLiked = useMutation(api.lists.addToLiked);
  const convexRemoveLiked = useMutation(api.lists.removeFromLiked);
  const convexAddWatched = useMutation(api.lists.addToWatched);
  const convexRemoveWatched = useMutation(api.lists.removeFromWatched);

  // Load from localStorage on mount
  useEffect(() => {
    setLocalLiked(loadList(KEYS.liked));
    setLocalWatchlist(loadList(KEYS.watchlist));
    setLocalWatched(loadList(KEYS.watched));
    setLocalLoaded(true);
  }, []);

  // Persist local state to localStorage (for unauthenticated use)
  useEffect(() => {
    if (localLoaded) localStorage.setItem(KEYS.liked, JSON.stringify(localLiked));
  }, [localLiked, localLoaded]);
  useEffect(() => {
    if (localLoaded) localStorage.setItem(KEYS.watchlist, JSON.stringify(localWatchlist));
  }, [localWatchlist, localLoaded]);
  useEffect(() => {
    if (localLoaded) localStorage.setItem(KEYS.watched, JSON.stringify(localWatched));
  }, [localWatched, localLoaded]);

  // On first sign-in: upload any localStorage items not yet in Convex (merge)
  useEffect(() => {
    if (!isAuthenticated || didSyncUp.current) return;
    if (convexLiked === undefined || convexWatchlist === undefined || convexWatched === undefined) return;
    didSyncUp.current = true;

    const convexLikedIds = new Set(convexLiked.map((i) => i.movieId));
    for (const m of localLiked) {
      if (!convexLikedIds.has(m.id)) {
        void convexAddLiked({ movieId: m.id, movieTitle: m.title, posterPath: m.poster_path ?? "" });
      }
    }

    const convexWatchlistIds = new Set(convexWatchlist.map((i) => i.movieId));
    for (const m of localWatchlist) {
      if (!convexWatchlistIds.has(m.id)) {
        void convexAddWatchlist({ movieId: m.id, movieTitle: m.title, posterPath: m.poster_path ?? "" });
      }
    }

    const convexWatchedIds = new Set(convexWatched.map((i) => i.movieId));
    for (const m of localWatched) {
      if (!convexWatchedIds.has(m.id)) {
        void convexAddWatched({ movieId: m.id, movieTitle: m.title, posterPath: m.poster_path ?? "" });
      }
    }
  }, [isAuthenticated, convexLiked, convexWatchlist, convexWatched, localLiked, localWatchlist, localWatched,
      convexAddLiked, convexAddWatchlist, convexAddWatched]);

  // Source of truth: Convex when authenticated, localStorage when not
  const liked = isAuthenticated && convexLiked !== undefined ? convexLiked.map(toMovie) : localLiked;
  const watchlist = isAuthenticated && convexWatchlist !== undefined ? convexWatchlist.map(toMovie) : localWatchlist;
  const watched = isAuthenticated && convexWatched !== undefined ? convexWatched.map(toMovie) : localWatched;

  const isLiked = useCallback((id: number) => liked.some((m) => m.id === id), [liked]);
  const isInWatchlist = useCallback((id: number) => watchlist.some((m) => m.id === id), [watchlist]);
  const isWatched = useCallback((id: number) => watched.some((m) => m.id === id), [watched]);

  const toggleLiked = useCallback((movie: TMDBMovie) => {
    const currentlyLiked = liked.some((m) => m.id === movie.id);
    if (!currentlyLiked) saveMovieMeta(movie); // cache metadata on add
    if (isAuthenticated) {
      // Server handles auto-add to watched when liking (see lists.ts addToLiked)
      if (currentlyLiked) {
        void convexRemoveLiked({ movieId: movie.id });
      } else {
        void convexAddLiked({ movieId: movie.id, movieTitle: movie.title, posterPath: movie.poster_path ?? "" });
      }
    } else {
      setLocalLiked((prev) =>
        currentlyLiked ? prev.filter((m) => m.id !== movie.id) : [movie, ...prev]
      );
      if (!currentlyLiked && !localWatched.some((m) => m.id === movie.id)) {
        setLocalWatched((prev) => [movie, ...prev]);
      }
    }
  }, [liked, localWatched, isAuthenticated, convexAddLiked, convexRemoveLiked]);

  const toggleWatchlist = useCallback((movie: TMDBMovie) => {
    const currentlyIn = watchlist.some((m) => m.id === movie.id);
    if (!currentlyIn) saveMovieMeta(movie); // cache metadata on add
    if (isAuthenticated) {
      if (currentlyIn) {
        void convexRemoveWatchlist({ movieId: movie.id });
      } else {
        void convexAddWatchlist({ movieId: movie.id, movieTitle: movie.title, posterPath: movie.poster_path ?? "" });
      }
    } else {
      setLocalWatchlist((prev) =>
        currentlyIn ? prev.filter((m) => m.id !== movie.id) : [movie, ...prev]
      );
    }
  }, [watchlist, isAuthenticated, convexAddWatchlist, convexRemoveWatchlist]);

  const toggleWatched = useCallback(async (movie: TMDBMovie): Promise<{ added: boolean }> => {
    const currentlyWatched = watched.some((m) => m.id === movie.id);
    if (!currentlyWatched) saveMovieMeta(movie); // cache metadata on add
    if (isAuthenticated) {
      if (currentlyWatched) {
        void convexRemoveWatched({ movieId: movie.id });
        return { added: false };
      } else {
        await convexAddWatched({ movieId: movie.id, movieTitle: movie.title, posterPath: movie.poster_path ?? "" });
        return { added: true };
      }
    } else {
      setLocalWatched((prev) =>
        currentlyWatched ? prev.filter((m) => m.id !== movie.id) : [movie, ...prev]
      );
      return { added: !currentlyWatched };
    }
  }, [watched, isAuthenticated, convexAddWatched, convexRemoveWatched]);

  const moveToWatched = useCallback((movie: TMDBMovie) => {
    if (isAuthenticated) {
      void convexRemoveWatchlist({ movieId: movie.id });
      void convexAddWatched({ movieId: movie.id, movieTitle: movie.title, posterPath: movie.poster_path ?? "" });
    } else {
      setLocalWatchlist((prev) => prev.filter((m) => m.id !== movie.id));
      setLocalWatched((prev) => prev.some((m) => m.id === movie.id) ? prev : [movie, ...prev]);
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

export { MovieListsProvider as WatchlistProvider };
export function useWatchlist() {
  const { liked, isLiked, toggleLiked, watchlist, isInWatchlist, toggleWatchlist } = useMovieLists();
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
