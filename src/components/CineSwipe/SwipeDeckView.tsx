"use client"; // force ide re-check

import { useConvexAuth } from "convex/react";
import Link from "next/link";
import { LogIn, Flame } from "lucide-react";
import { useCineSwipeEngine } from "@/hooks/useCineSwipeEngine";
import SwipeCard from "./SwipeCard";
import SwipeTutorial from "./SwipeTutorial";
import SwipeLimitScreen from "./SwipeLimitScreen";
import SwipeSummaryScreen from "@/components/CineSwipe/SwipeSummaryScreen";
import { Undo2, Check } from "lucide-react";

import type { TMDBMovie } from "@/lib/types";

export default function SwipeDeckView() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();

  // Show nothing while auth is resolving
  if (authLoading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="brutal-shimmer h-[520px] w-[340px]" />
      </div>
    );
  }

  // Auth gate — CineSwipe requires sign-in because all swipes hit Convex mutations
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-6 px-4 text-center">
        <Flame className="h-16 w-16 text-brutal-pink" strokeWidth={1.5} />
        <h1 className="font-outfit text-3xl font-black uppercase tracking-wider">
          CineSwipe
        </h1>
        <p className="max-w-sm font-inter text-sm text-text-muted">
          Sign in to start discovering movies with swipe gestures. Your progress
          and lists are synced across devices.
        </p>
        <Link
          href="/sign-in"
          className="brutal-btn flex items-center gap-2 border-2 border-brutal-pink bg-brutal-pink px-6 py-3 font-mono text-sm font-bold uppercase tracking-widest text-black transition-colors hover:bg-white hover:text-brutal-pink"
        >
          <LogIn className="h-4 w-4" strokeWidth={2.5} />
          Sign In to CineSwipe
        </Link>
      </div>
    );
  }

  return <AuthenticatedSwipeDeck />;
}

function AuthenticatedSwipeDeck() {
  const engine = useCineSwipeEngine();

  // Reviewing state
  if (engine.isReviewing) {
    return <SwipeSummaryScreen engine={engine} />;
  }

  // Daily limit reached
  if (engine.isLimitReached) {
    return <SwipeLimitScreen todayCount={engine.todayCount} limit={engine.todayLimit} />;
  }

  // Loading state
  if (engine.isLoading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="brutal-shimmer h-[520px] w-[340px]" />
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-brutal-dim animate-pulse">
            Loading deck...
          </span>
        </div>
      </div>
    );
  }

  // Empty deck (shouldn't normally happen unless TMDB is down)
  if (!engine.currentMovie) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <Flame className="h-12 w-12 text-brutal-dim" strokeWidth={1.5} />
        <p className="font-mono text-sm uppercase tracking-widest text-brutal-dim">
          No more movies to discover right now.
          <br />
          Check back later!
        </p>
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex min-h-[100dvh] max-w-[460px] md:max-w-[600px] flex-col items-center px-4 pb-24 pt-4 md:pt-10">
      {/* ── Progress bar ── */}
      <div className="mb-4 flex w-full max-w-[340px] md:max-w-[420px] items-center gap-3">
        <Flame className="h-4 w-4 shrink-0 text-brutal-pink" strokeWidth={2.5} />
        <div className="relative h-2 flex-1 overflow-hidden border-2 border-brutal-border bg-surface">
          <div
            className="absolute inset-y-0 left-0 bg-brutal-pink transition-all duration-300 ease-out"
            style={{ width: `${(engine.todayCount / engine.todayLimit) * 100}%` }}
          />
        </div>
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-brutal-dim">
          {engine.todayCount}/{engine.todayLimit}
        </span>
      </div>

      {/* ── Card stack ── */}
      <div className="relative h-[520px] w-full max-w-[340px] md:h-[650px] md:max-w-[420px]">
        {/* Render bottom cards first (behind), top card last (in front) */}
        {engine.nextMovies
          .slice(0, 2)
          .reverse()
          .map((movie: TMDBMovie, reverseIdx: number) => {
            const stackIndex = 2 - reverseIdx; // 2 = deepest, 1 = middle
            return (
              <div
                key={movie.id}
                className="absolute inset-0 pointer-events-none"
                style={{
                  zIndex: reverseIdx,
                  transform: `scale(${1 - stackIndex * 0.04}) translateY(${stackIndex * 16}px)`,
                  filter: `brightness(${1 - stackIndex * 0.3})`,
                }}
              >
                <SwipeCard movie={movie} isActive={false} onSwipe={() => {}} onDoubleTap={() => {}} />
              </div>
            );
          })}

        {/* Active top card */}
        <div key={engine.currentMovie.id} className="absolute inset-0" style={{ zIndex: 10 }}>
          <SwipeCard
            movie={engine.currentMovie}
            isActive={true}
            onSwipe={engine.onSwipe}
            onDoubleTap={engine.onDoubleTap}
          />
        </div>
      </div>

      {/* ── Direction hints ── */}
      <div className="mt-4 grid w-full max-w-[340px] md:max-w-[420px] grid-cols-4 gap-2">
        {[
          { label: "SKIP", color: "text-brutal-dim", key: "←" },
          { label: "WATCHED", color: "text-brutal-cyan", key: "↓" },
          { label: "WATCHLIST", color: "text-brutal-lime", key: "→" },
          { label: "BLOCK", color: "text-brutal-violet", key: "↑" },
        ].map((hint) => (
          <div
            key={hint.label}
            className="flex flex-col items-center gap-0.5 py-2"
          >
            <span className={`font-mono text-xs font-black ${hint.color}`}>
              {hint.key}
            </span>
            <span className="font-mono text-[8px] font-bold uppercase tracking-widest text-brutal-dim">
              {hint.label}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-1 text-center font-mono text-[9px] uppercase tracking-widest text-brutal-dim/50">
        Double-tap or press Space to ♥ Favourite
      </p>

      {/* ── Action Bar ── */}
      <div className="mt-6 flex w-full max-w-[340px] md:max-w-[420px] items-center justify-between gap-4">
        <button
          onClick={engine.undoLastSwipe}
          disabled={engine.sessionSwipes.length === 0}
          className="brutal-btn flex h-12 w-12 items-center justify-center border-2 border-brutal-border disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-2 transition-colors"
          title="Undo Last Swipe"
        >
          <Undo2 className="h-5 w-5" strokeWidth={2.5} />
        </button>
        <button
          onClick={() => engine.setIsReviewing(true)}
          disabled={engine.sessionSwipes.length === 0}
          className="brutal-btn flex h-12 flex-1 items-center justify-center gap-2 border-2 border-brutal-pink bg-brutal-pink px-4 font-mono text-sm font-bold uppercase tracking-widest text-black disabled:border-brutal-border disabled:bg-surface disabled:text-text-muted disabled:cursor-not-allowed transition-colors hover:bg-white hover:text-brutal-pink"
        >
          <Check className="h-5 w-5" strokeWidth={2.5} />
          {engine.sessionSwipes.length > 0 ? `Done (${engine.sessionSwipes.length})` : "Done"}
        </button>
      </div>

      {/* ── Tutorial overlay (first visit only) ── */}
      {!engine.tutorialDismissed && (
        <SwipeTutorial onDismiss={engine.dismissTutorial} />
      )}
    </div>
  );
}
