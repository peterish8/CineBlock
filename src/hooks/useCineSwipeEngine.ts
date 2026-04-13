"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { TMDBMovie } from "@/lib/types";
import { useMovieLists } from "@/hooks/useMovieLists";
import { useBlockModal } from "@/components/BlockModalProvider";
import { saveMovieMeta } from "@/lib/movieMetaCache";
import { useToast } from "@/components/ToastProvider";

const BATCH_SIZE = 20;
const PREFETCH_THRESHOLD = 5;
const TUTORIAL_KEY = "cb_swipe_tutorial_dismissed";

type SwipeDirection = "left" | "right" | "up" | "down";

export interface SessionSwipe {
  movie: TMDBMovie;
  action: "liked" | "watchlist" | "watched" | "block" | "skip";
}

export function useCineSwipeEngine() {
  const { pushToast } = useToast();

  // ── Convex ──
  const swipeState = useQuery(api.cineswipe.getSwipeState);

  // ── Existing hooks (reuse!) ──
  const { openBlockModal } = useBlockModal();

  // ── Local state ──
  const [deck, setDeck] = useState<TMDBMovie[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [tutorialDismissed, setTutorialDismissed] = useState(true);
  
  // ── Session state ──
  const [sessionSwipes, setSessionSwipes] = useState<SessionSwipe[]>([]);
  const [isReviewing, setIsReviewing] = useState(false);

  // ── Refs (no re-renders) ──
  const seenIds = useRef(new Set<number>());
  const positiveSwipes = useRef<TMDBMovie[]>([]);
  const isFetching = useRef(false);
  const initialised = useRef(false);
  const batchCounter = useRef(0);

  // ── Tutorial ──
  useEffect(() => {
    try {
      setTutorialDismissed(localStorage.getItem(TUTORIAL_KEY) === "1");
    } catch {
      setTutorialDismissed(true);
    }
  }, []);

  const dismissTutorial = useCallback(() => {
    setTutorialDismissed(true);
    try {
      localStorage.setItem(TUTORIAL_KEY, "1");
    } catch {}
  }, []);

  // ── Fetch a batch of movies from TMDB via the existing /api/movies proxy ──
  const fetchBatch = useCallback(
    async (
      action: "discover" | "recommendations" | "trending" = "discover",
      movieId?: number
    ): Promise<TMDBMovie[]> => {
      try {
        const params = new URLSearchParams();

        if (action === "recommendations" && movieId) {
          params.set("action", "recommendations");
          params.set("id", String(movieId));
        } else if (action === "trending") {
          params.set("action", "trending");
          params.set("window", "week");
        } else {
          params.set("action", "discover");
          params.set("sort", "popularity.desc");
          params.set("page", String(Math.floor(Math.random() * 20) + 1));
        }

        const res = await fetch(`/api/movies?${params.toString()}`);
        if (!res.ok) return [];
        const data = await res.json();
        const results: TMDBMovie[] = data.results ?? [];

        // Filter out already-seen movies
        return results.filter(
          (m) => m.poster_path && !seenIds.current.has(m.id)
        );
      } catch {
        return [];
      }
    },
    []
  );

  // ── Fill deck when it runs low ──
  const fillDeck = useCallback(async () => {
    if (isFetching.current) return;
    isFetching.current = true;

    try {
      // Decide fetch strategy: use recommendations if we have positive swipes
      let movies: TMDBMovie[] = [];
      const positives = positiveSwipes.current;

      if (positives.length > 0) {
        // Priority: liked > watched > watchlist (the user requested this hierarchy)
        const seedMovie = positives.shift()!;
        movies = await fetchBatch("recommendations", seedMovie.id);
      }

      // Fallback / supplement with discover if recs were sparse
      if (movies.length < 8) {
        const discoverMovies = await fetchBatch("discover");
        // Merge without duplicates
        const existingIds = new Set(movies.map((m) => m.id));
        for (const m of discoverMovies) {
          if (!existingIds.has(m.id)) movies.push(m);
        }
      }

      // Still sparse? Try trending
      if (movies.length < 5) {
        const trending = await fetchBatch("trending");
        const existingIds = new Set(movies.map((m) => m.id));
        for (const m of trending) {
          if (!existingIds.has(m.id)) movies.push(m);
        }
      }

      // Cap to batch size and add to deck
      const batch = movies.slice(0, BATCH_SIZE);
      for (const m of batch) {
        seenIds.current.add(m.id);
      }

      setDeck((prev) => [...prev, ...batch]);
    } finally {
      isFetching.current = false;
    }
  }, [fetchBatch]);

  // ── Initialise on first Convex data load ──
  useEffect(() => {
    if (!swipeState || initialised.current) return;
    initialised.current = true;

    // Seed seen IDs from Convex swipe history
    for (const id of swipeState.swipedMovieIds) {
      seenIds.current.add(id);
    }
    setTodayCount(swipeState.todayCount);

    // Fill the initial deck
    fillDeck().then(() => setIsLoading(false));
  }, [swipeState, fillDeck]);

  // ── Prefetch when deck gets low ──
  useEffect(() => {
    if (deck.length > 0 && deck.length <= PREFETCH_THRESHOLD && !isFetching.current) {
      fillDeck();
    }
  }, [deck.length, fillDeck]);

  // ── Swipe handler ──
  const onSwipe = useCallback(
    (direction: SwipeDirection) => {
      const movie = deck[0];
      if (!movie) return;

      // Map direction to action
      let action: "watchlist" | "watched" | "block" | "skip";
      switch (direction) {
        case "right":
          action = "watchlist";
          break;
        case "down":
          action = "watched";
          break;
        case "up":
          action = "block";
          break;
        case "left":
        default:
          action = "skip";
          break;
      }

      // Session batching
      const movieData: TMDBMovie = movie;
      saveMovieMeta(movieData);

      const sessionSwipe: SessionSwipe = { movie: movieData, action };
      setSessionSwipes((prev) => [...prev, sessionSwipe]);

      if (action === "watchlist" || action === "watched" || action === "block") {
        positiveSwipes.current.push(movieData);
      }

      if (action === "block") {
        openBlockModal({
          id: movie.id,
          title: movie.title || "Untitled",
          posterPath: movie.poster_path || "",
        });
      }

      setDeck((prev) => prev.slice(1));
      setTodayCount((prev) => prev + 1);
      batchCounter.current += 1;
      seenIds.current.add(movie.id);
    },
    [deck, openBlockModal]
  );

  // ── Double-tap handler (favourite / liked) ──
  const onDoubleTap = useCallback(() => {
    const movie = deck[0];
    if (!movie) return;

    saveMovieMeta(movie);
    positiveSwipes.current.unshift(movie);

    setSessionSwipes((prev) => [...prev, { movie, action: "liked" }]);
    setDeck((prev) => prev.slice(1));
    setTodayCount((prev) => prev + 1);
    seenIds.current.add(movie.id);
  }, [deck]);

  // ── Undo handler ──
  const undoLastSwipe = useCallback(() => {
    setSessionSwipes((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      
      setDeck((d) => [last.movie, ...d]);
      setTodayCount((c) => Math.max(0, c - 1));
      seenIds.current.delete(last.movie.id);

      return prev.slice(0, -1);
    });
  }, []);

  // Keyboard shortcuts are handled locally within SwipeCard to trigger visual animations.

  return {
    currentMovie: deck[0] ?? null,
    nextMovies: deck.slice(1, 4),
    todayCount,
    todayLimit: swipeState?.limit ?? 250,
    isLimitReached: todayCount >= (swipeState?.limit ?? 250),
    isLoading,
    onSwipe,
    onDoubleTap,
    undoLastSwipe,
    tutorialDismissed,
    dismissTutorial,
    sessionSwipes,
    isReviewing,
    setIsReviewing,
  };
}
