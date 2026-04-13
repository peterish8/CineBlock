"use client";

import { useRef, useState, useEffect } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  PanInfo,
} from "framer-motion";
import Image from "next/image";
import { Star, Bookmark, Eye, ArrowUpFromLine, X, Heart } from "lucide-react";
import { TMDBMovie } from "@/lib/types";
import { posterUrl } from "@/lib/constants";
import { GENRES } from "@/lib/constants";

// ── Thresholds ──
const SWIPE_COMMIT_OFFSET = 120;
const SWIPE_COMMIT_VELOCITY = 500;
const DOUBLE_TAP_DELAY = 300;

interface SwipeCardProps {
  movie: TMDBMovie;
  isActive: boolean;
  onSwipe: (direction: "left" | "right" | "up" | "down") => void;
  onDoubleTap: () => void;
}

export default function SwipeCard({
  movie,
  isActive,
  onSwipe,
  onDoubleTap,
}: SwipeCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotate = useTransform(x, [-300, 0, 300], [-18, 0, 18]);

  // Direction stamp opacities
  const rightOpacity = useTransform(x, [0, 60, 140], [0, 0.4, 1]);
  const leftOpacity = useTransform(x, [0, -60, -140], [0, 0.4, 1]);
  const upOpacity = useTransform(y, [0, -60, -140], [0, 0.4, 1]);
  const downOpacity = useTransform(y, [0, 60, 140], [0, 0.4, 1]);

  // Double-tap detection
  const lastTapRef = useRef(0);
  const [showHeart, setShowHeart] = useState(false);

  // Preload next poster image
  useEffect(() => {
    if (movie.poster_path) {
      const img = new (window as any).Image();
      img.src = posterUrl(movie.poster_path, "large");
    }
  }, [movie.poster_path]);

  const year = movie.release_date?.split("-")[0] || "—";
  const rating = movie.vote_average?.toFixed(1) || "N/A";
  const genreNames = (movie.genre_ids || [])
    .slice(0, 2)
    .map((id) => GENRES.find((g) => g.id === id)?.name)
    .filter(Boolean);

  const triggerDoubleTap = () => {
    if (!isActive) return;
    setShowHeart(true);
    setTimeout(() => {
      onDoubleTap();
      setShowHeart(false);
    }, 600);
  };

  const triggerSwipe = (direction: "left" | "right" | "up" | "down") => {
    if (!isActive) return;
    let exitX = 0;
    let exitY = 0;
    if (direction === "left") exitX = -600;
    if (direction === "right") exitX = 600;
    if (direction === "up") exitY = -800;
    if (direction === "down") exitY = 800;

    if (exitX !== 0) void animate(x, exitX, { duration: 0.3, ease: "easeOut" });
    if (exitY !== 0) void animate(y, exitY, { duration: 0.3, ease: "easeOut" });

    setTimeout(() => onSwipe(direction), 250);
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          triggerSwipe("left");
          break;
        case "ArrowRight":
          e.preventDefault();
          triggerSwipe("right");
          break;
        case "ArrowUp":
          e.preventDefault();
          triggerSwipe("up");
          break;
        case "ArrowDown":
          e.preventDefault();
          triggerSwipe("down");
          break;
        case " ":
          e.preventDefault();
          triggerDoubleTap();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, x, y, onSwipe, onDoubleTap]);

  const handleTap = () => {
    if (!isActive) return;
    const now = Date.now();
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap!
      triggerDoubleTap();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (!isActive) return;

    const absX = Math.abs(info.offset.x);
    const absY = Math.abs(info.offset.y);
    const velX = Math.abs(info.velocity.x);
    const velY = Math.abs(info.velocity.y);

    // Determine dominant axis
    const isHorizontal = absX > absY;
    const offset = isHorizontal ? absX : absY;
    const velocity = isHorizontal ? velX : velY;

    // Check if threshold is met
    if (offset < SWIPE_COMMIT_OFFSET && velocity < SWIPE_COMMIT_VELOCITY) {
      // Snap back
      void animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });
      void animate(y, 0, { type: "spring", stiffness: 400, damping: 30 });
      return;
    }

    let direction: "left" | "right" | "up" | "down";
    let exitX = 0;
    let exitY = 0;

    if (isHorizontal) {
      direction = info.offset.x > 0 ? "right" : "left";
      exitX = direction === "right" ? 600 : -600;
    } else {
      direction = info.offset.y > 0 ? "down" : "up";
      exitY = direction === "down" ? 800 : -800;
    }

    // Fire the swipe trigger to handle animations consistently
    triggerSwipe(direction);
  };

  return (
    <motion.div
      className="relative h-full w-full touch-none select-none overflow-hidden border-3 border-brutal-border bg-black shadow-[6px_6px_0px_#000]"
      style={{ x, y, rotate, cursor: isActive ? "grab" : "default" }}
      drag={isActive}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      onClick={handleTap}
      whileDrag={{ cursor: "grabbing" }}
    >
      {/* ── Directional Gradient Overlays ── */}
      {isActive && (
        <>
          <motion.div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent to-brutal-lime/60 mix-blend-screen z-10" style={{ opacity: rightOpacity }} />
          <motion.div className="pointer-events-none absolute inset-0 bg-gradient-to-l from-transparent to-brutal-dim/60 mix-blend-screen z-10" style={{ opacity: leftOpacity }} />
          <motion.div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-brutal-cyan/60 mix-blend-screen z-10" style={{ opacity: downOpacity }} />
          <motion.div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-transparent to-brutal-violet/60 mix-blend-screen z-10" style={{ opacity: upOpacity }} />
        </>
      )}

      {/* ── Poster image ── */}
      {movie.poster_path ? (
        <Image
          src={posterUrl(movie.poster_path, "large")}
          alt={movie.title}
          fill
          className="object-cover pointer-events-none"
          sizes="(max-width: 460px) 90vw, 340px"
          priority
          draggable={false}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-surface-2 p-6">
          <span className="text-center font-mono text-lg font-bold uppercase text-brutal-muted">
            {movie.title}
          </span>
        </div>
      )}

      {/* ── Movie info overlay (Only show on front card to fix stack bleed) ── */}
      {isActive && (
        <>
          {/* ── Gradient overlay at bottom ── */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />

          <div className="pointer-events-none absolute bottom-0 left-0 right-0 p-4 z-20">
            <h2 className="font-display text-xl font-black uppercase leading-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              {movie.title}
            </h2>
            <div className="mt-1.5 flex items-center gap-3">
              <span className="flex items-center gap-1 text-brutal-yellow">
                <Star className="h-3.5 w-3.5 fill-current" strokeWidth={2.5} />
                <span className="font-mono text-xs font-bold">{rating}</span>
              </span>
              <span className="font-mono text-xs font-bold text-brutal-dim">
                {year}
              </span>
              {genreNames.map((name) => (
                <span
                  key={name}
                  className="brutal-chip border-brutal-dim/30 px-1.5 py-0.5 text-[9px] text-brutal-muted"
                >
                  {name}
                </span>
              ))}
            </div>
            {movie.overview && (
              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-white/60">
                {movie.overview}
              </p>
            )}
          </div>

          {/* ── Rating badge — top right ── */}
          <div className="pointer-events-none absolute right-0 top-0 flex items-center gap-1 border-b-3 border-l-3 border-brutal-border bg-black px-2 py-1 z-20">
            <Star className="h-3 w-3 fill-current text-brutal-yellow" />
            <span className="font-mono text-[10px] font-bold text-brutal-yellow">
              {rating}
            </span>
          </div>
        </>
      )}

      {/* ── Direction stamp labels ── */}
      {isActive && (
        <>
          {/* RIGHT → WATCHLIST */}
          <motion.div
            className="pointer-events-none absolute left-4 top-6 -rotate-12 border-3 border-brutal-lime bg-black/50 backdrop-blur-sm px-3 py-1.5 z-30"
            style={{ opacity: rightOpacity }}
          >
            <div className="flex items-center gap-1.5">
              <Bookmark className="h-5 w-5 text-brutal-lime" strokeWidth={3} />
              <span className="font-mono text-lg font-black uppercase tracking-widest text-brutal-lime">
                WATCHLIST
              </span>
            </div>
          </motion.div>

          {/* LEFT → SKIP */}
          <motion.div
            className="pointer-events-none absolute right-4 top-6 rotate-12 border-3 border-brutal-dim bg-black/50 backdrop-blur-sm px-3 py-1.5 z-30"
            style={{ opacity: leftOpacity }}
          >
            <div className="flex items-center gap-1.5">
              <X className="h-5 w-5 text-brutal-dim" strokeWidth={3} />
              <span className="font-mono text-lg font-black uppercase tracking-widest text-brutal-dim">
                SKIP
              </span>
            </div>
          </motion.div>

          {/* UP → CINEBLOCK */}
          <motion.div
            className="pointer-events-none absolute bottom-24 left-1/2 -translate-x-1/2 border-3 border-brutal-violet bg-black/50 backdrop-blur-sm px-3 py-1.5 z-30"
            style={{ opacity: upOpacity }}
          >
            <div className="flex items-center gap-1.5">
              <ArrowUpFromLine
                className="h-5 w-5 text-brutal-violet"
                strokeWidth={3}
              />
              <span className="font-mono text-sm font-black uppercase tracking-widest text-brutal-violet">
                CINEBLOCK
              </span>
            </div>
          </motion.div>

          {/* DOWN → WATCHED */}
          <motion.div
            className="pointer-events-none absolute left-1/2 top-16 -translate-x-1/2 border-3 border-brutal-cyan bg-black/50 backdrop-blur-sm px-3 py-1.5 z-30"
            style={{ opacity: downOpacity }}
          >
            <div className="flex items-center gap-1.5">
              <Eye className="h-5 w-5 text-brutal-cyan" strokeWidth={3} />
              <span className="font-mono text-sm font-black uppercase tracking-widest text-brutal-cyan">
                WATCHED
              </span>
            </div>
          </motion.div>
        </>
      )}

      {/* ── Heart burst on double-tap ── */}
      {showHeart && (
        <motion.div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 1.4, opacity: [0, 1, 1, 0] }}
          transition={{ duration: 0.7, times: [0, 0.15, 0.6, 1] }}
        >
          <Heart
            className="h-24 w-24 fill-brutal-red text-brutal-red drop-shadow-[0_0_30px_rgba(255,50,50,0.6)]"
            strokeWidth={0}
          />
        </motion.div>
      )}
    </motion.div>
  );
}
