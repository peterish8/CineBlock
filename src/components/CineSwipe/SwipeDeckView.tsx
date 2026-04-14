"use client"; // force ide re-check

import { useConvexAuth } from "convex/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, Flame, ChevronLeft } from "lucide-react";
import { useCineSwipeEngine } from "@/hooks/useCineSwipeEngine";
import SwipeCard from "./SwipeCard";
import SwipeTutorial from "./SwipeTutorial";
import SwipeLimitScreen from "./SwipeLimitScreen";
import SwipeSummaryScreen from "@/components/CineSwipe/SwipeSummaryScreen";
import { Undo2, Check, Monitor, Smartphone } from "lucide-react";
import { useThemeMode } from "@/hooks/useThemeMode";

import type { TMDBMovie } from "@/lib/types";

function BackButton({ isGlass }: { isGlass: boolean }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      aria-label="Go back"
      className="flex items-center justify-center w-7 h-7 shrink-0 transition-opacity hover:opacity-80"
      style={{
        background: isGlass ? "rgba(2,10,30,0.55)" : "rgba(0,0,0,0.55)",
        border: isGlass ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(255,255,255,0.18)",
        backdropFilter: "blur(16px) saturate(150%)",
        WebkitBackdropFilter: "blur(16px) saturate(150%)",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
        color: isGlass ? "rgba(148,163,184,0.85)" : "rgba(255,255,255,0.75)",
      }}
    >
      <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2.5} />
    </button>
  );
}

export default function SwipeDeckView() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const isGlass = useThemeMode() === "glass";

  // Show nothing while auth is resolving
  if (authLoading) {
    return (
      <div
        className={`flex min-h-[80vh] items-center justify-center ${isGlass ? "" : ""}`}
        style={isGlass ? { background: "#020817" } : undefined}
      >
        <BackButton isGlass={isGlass} />
        <div
          className={`h-[520px] w-[340px] ${isGlass ? "rounded-3xl animate-pulse" : "brutal-shimmer"}`}
          style={isGlass ? { background: "rgba(8,15,40,0.60)", border: "1px solid rgba(255,255,255,0.08)" } : undefined}
        />
      </div>
    );
  }

  // Auth gate
  if (!isAuthenticated) {
    return (
      <div
        className={`flex min-h-[80vh] flex-col items-center justify-center gap-6 px-4 text-center ${isGlass ? "" : ""}`}
        style={isGlass ? { background: "#020817" } : undefined}
      >
        <BackButton isGlass={isGlass} />
        {isGlass && (
          <div className="pointer-events-none fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 aspect-square w-[60vw] rounded-full opacity-15" style={{ background: "radial-gradient(circle, rgba(236,72,153,0.30) 0%, transparent 70%)", filter: "blur(100px)", zIndex: 0 }} />
        )}
        <Flame className={`h-16 w-16 relative z-10 ${isGlass ? "text-pink-400" : "text-brutal-pink"}`} strokeWidth={1.5} />
        <h1 className={`text-3xl font-black uppercase tracking-wider relative z-10 ${isGlass ? "text-white" : "font-outfit"}`}>
          CineSwipe
        </h1>
        <p className={`max-w-sm text-sm relative z-10 ${isGlass ? "text-slate-400" : "font-inter text-text-muted"}`}>
          Sign in to start discovering movies with swipe gestures. Your progress and lists are synced across devices.
        </p>
        <Link
          href="/sign-in"
          className={`flex items-center gap-2 px-6 py-3 text-sm font-bold uppercase tracking-widest transition-colors relative z-10 ${
            isGlass
              ? "rounded-xl"
              : "brutal-btn border-2 border-brutal-pink bg-brutal-pink text-black hover:bg-white hover:text-brutal-pink font-mono"
          }`}
          style={isGlass ? { background: "rgba(236,72,153,0.18)", border: "1px solid rgba(236,72,153,0.45)", color: "#F472B6" } : undefined}
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
  const isGlass = useThemeMode() === "glass";
  const [isLandscape, setIsLandscape] = useState(true);

  // ── Global keyboard shortcuts ──
  // Arrow keys + Space (like) are handled inside SwipeCard.
  // Z / Backspace → undo last swipe
  // Enter → like (alias for Space, convenient on laptop)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.key === "z" || e.key === "Z" || e.key === "Backspace") && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        engine.undoLastSwipe();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [engine]);


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
      <div
        className="flex min-h-[80vh] items-center justify-center"
        style={isGlass ? { background: "#020817" } : undefined}
      >
        <BackButton isGlass={isGlass} />
        <div className="flex flex-col items-center gap-4">
          <div
            className={`h-[520px] w-[340px] ${isGlass ? "rounded-3xl animate-pulse" : "brutal-shimmer"}`}
            style={isGlass ? { background: "rgba(8,15,40,0.60)", border: "1px solid rgba(255,255,255,0.08)" } : undefined}
          />
          <span className={`text-xs font-bold uppercase tracking-widest animate-pulse ${isGlass ? "text-slate-600" : "font-mono text-brutal-dim"}`}>
            Loading deck...
          </span>
        </div>
      </div>
    );
  }

  // Empty deck
  if (!engine.currentMovie) {
    return (
      <div
        className="flex min-h-[80vh] flex-col items-center justify-center gap-4 px-4 text-center"
        style={isGlass ? { background: "#020817" } : undefined}
      >
        <BackButton isGlass={isGlass} />
        <Flame className={`h-12 w-12 ${isGlass ? "text-slate-600" : "text-brutal-dim"}`} strokeWidth={1.5} />
        <p className={`text-sm uppercase tracking-widest ${isGlass ? "text-slate-500" : "font-mono text-brutal-dim"}`}>
          No more movies to discover right now.
          <br />
          Check back later!
        </p>
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-[100dvh] flex flex-col items-center justify-center px-4 pt-safe pb-4 gap-3 lg:gap-6 transition-all"
      style={isGlass ? { background: "#020817" } : undefined}
    >
      {/* ── Top Strip ── */}
      <div className="flex w-full max-w-[340px] md:max-w-[600px] lg:max-w-[1000px] items-center gap-2 shrink-0 pt-4 lg:pt-0">
        <BackButton isGlass={isGlass} />
        <Flame
          className={`h-5 w-5 shrink-0 ${isGlass ? "text-pink-400" : "text-brutal-pink"}`}
          strokeWidth={2.5}
        />
        <div
          className={`relative h-1.5 flex-1 overflow-hidden ${isGlass ? "rounded-full" : "border border-brutal-border bg-surface"}`}
          style={isGlass ? { background: "rgba(255,255,255,0.08)" } : undefined}
        >
          <div
            className={`absolute inset-y-0 left-0 transition-all duration-300 ease-out ${isGlass ? "rounded-full" : "bg-brutal-pink"}`}
            style={{
              width: `${(engine.todayCount / engine.todayLimit) * 100}%`,
              ...(isGlass ? { background: "linear-gradient(90deg, #EC4899, #F472B6)" } : {}),
            }}
          />
        </div>
        <span className={`text-[9px] font-bold tabular-nums shrink-0 ${isGlass ? "text-slate-500" : "font-mono text-brutal-dim"}`}>
          {engine.todayCount}/{engine.todayLimit}
        </span>
        
        {/* Aspect Toggle (Desktop Only) */}
        <button
          onClick={() => setIsLandscape(!isLandscape)}
          className={`hidden lg:flex items-center justify-center w-7 h-7 shrink-0 transition-all ml-2 ${isGlass ? "hover:bg-white/10" : "hover:bg-surface-2"}`}
          style={{
            background: isGlass ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.55)",
            border: isGlass ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(255,255,255,0.18)",
            borderRadius: "8px",
            color: isGlass ? "rgba(148,163,184,0.85)" : "rgba(255,255,255,0.75)",
          }}
          title={`Switch to ${isLandscape ? "portrait" : "landscape"} view`}
        >
          {isLandscape ? <Smartphone className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* ── Card stack ── */}
      <div className={`relative flex-1 lg:flex-none w-full max-w-[340px] md:max-w-[600px] min-h-[400px] shrink-0 transition-all duration-300 ${isLandscape ? "lg:max-w-[1000px] lg:h-[65vh] lg:aspect-video" : "lg:max-w-[460px] lg:h-[70vh] lg:aspect-[2/3]"}`}>
        {engine.nextMovies
          .slice(0, 2)
          .reverse()
          .map((movie: TMDBMovie, reverseIdx: number) => {
            const stackIndex = 2 - reverseIdx;
            return (
              <div
                key={`bg-${movie.id}-${reverseIdx}`}
                className="absolute inset-0 pointer-events-none"
                style={{
                  zIndex: reverseIdx,
                  transform: `scale(${1 - stackIndex * 0.04}) translateY(${stackIndex * 16}px)`,
                  filter: `brightness(${1 - stackIndex * 0.3})`,
                }}
              >
                <SwipeCard movie={movie} isActive={false} isGlass={isGlass} onSwipe={() => {}} onDoubleTap={() => {}} orientation={isLandscape ? "landscape" : "portrait"} />
              </div>
            );
          })}

        {/* Active top card */}
        <div key={`active-${engine.currentMovie.id}`} className="absolute inset-0" style={{ zIndex: 10 }}>
          <SwipeCard
            movie={engine.currentMovie}
            isActive={true}
            isGlass={isGlass}
            onSwipe={engine.onSwipe}
            onDoubleTap={engine.onDoubleTap}
            orientation={isLandscape ? "landscape" : "portrait"}
          />
        </div>
      </div>

      {/* ── Hints ── */}
      <div className="grid w-full max-w-[340px] md:max-w-[600px] lg:max-w-[1000px] grid-cols-4 lg:grid-cols-5 gap-1 lg:gap-4 shrink-0 transition-all">
        {[
          { label: "SKIP",      brutalColor: "text-brutal-dim",    glassColor: "text-slate-500",   key: "←" },
          { label: "WATCHED",   brutalColor: "text-brutal-cyan",   glassColor: "text-cyan-400",    key: "↓" },
          { label: "WATCHLIST", brutalColor: "text-brutal-lime",   glassColor: "text-emerald-400", key: "→" },
          { label: "BLOCK",     brutalColor: "text-brutal-violet", glassColor: "text-violet-400",  key: "↑" },
          { label: "FAVOURITE", brutalColor: "text-brutal-red",    glassColor: "text-pink-400",    key: "Space", deskOnly: true },
        ].map((hint, idx) => (
          <div key={hint.label} className={`flex flex-col items-center gap-0.5 lg:gap-2 py-1 ${hint.deskOnly ? "hidden lg:flex" : "flex"}`}>
            <span className={`text-[10px] lg:text-sm font-black lg:px-4 lg:py-1 lg:rounded-md lg:bg-white/5 ${isGlass ? hint.glassColor : `font-mono ${hint.brutalColor}`}`}>
              {hint.key}
            </span>
            <span className={`text-[7px] lg:text-[10px] font-bold uppercase tracking-widest ${isGlass ? "text-slate-500 lg:text-slate-400" : "font-mono text-brutal-dim"}`}>
              {hint.label}
            </span>
          </div>
        ))}
      </div>

      <p className={`text-center text-[8px] uppercase tracking-widest shrink-0 ${isGlass ? "text-slate-700 lg:hidden" : "font-mono text-brutal-dim/50 lg:hidden"}`}>
        Double-tap or Space to ♥
      </p>

      {/* ── Action Bar ── */}
      <div className="flex w-full max-w-[340px] md:max-w-[600px] lg:max-w-[1000px] items-center justify-between gap-3 shrink-0 lg:pb-4">
        <button
          onClick={engine.undoLastSwipe}
          disabled={engine.sessionSwipes.length === 0}
          className={`flex h-11 lg:h-14 lg:px-8 w-11 lg:w-auto items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
            isGlass
              ? "rounded-xl hover:bg-white/10"
              : "brutal-btn border-2 border-brutal-border hover:bg-surface-2"
          }`}
          style={isGlass ? { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(148,163,184,0.8)" } : undefined}
          title="Undo Last Swipe"
        >
          <Undo2 className="h-4 w-4 lg:h-5 lg:w-5" strokeWidth={2.5} />
          <span className="hidden lg:block ml-2 text-xs font-bold tracking-widest uppercase">Undo</span>
        </button>
        <button
          onClick={() => engine.setIsReviewing(true)}
          disabled={engine.sessionSwipes.length === 0}
          className={`flex h-11 lg:h-14 flex-1 items-center justify-center gap-2 px-4 text-sm font-bold uppercase tracking-widest transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
            isGlass
              ? "rounded-xl lg:text-base"
              : "brutal-btn border-2 border-brutal-pink bg-brutal-pink text-black font-mono hover:bg-white hover:text-brutal-pink disabled:border-brutal-border disabled:bg-surface disabled:text-text-muted text-base"
          }`}
          style={isGlass && engine.sessionSwipes.length > 0
            ? { background: "rgba(236,72,153,0.18)", border: "1px solid rgba(236,72,153,0.45)", color: "#F472B6", boxShadow: "0 0 20px rgba(236,72,153,0.2)" }
            : isGlass
            ? { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(148,163,184,0.4)" }
            : undefined
          }
        >
          <Check className="h-4 w-4 lg:h-5 lg:w-5" strokeWidth={2.5} />
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
