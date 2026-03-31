"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { posterUrl } from "@/lib/constants";

type StampNudgeProps = {
  movie: { id: number; title: string; posterPath: string };
  onOpen: () => void;
  onDismiss: () => void;
};

const DURATION = 5000;

export default function StampNudge({ movie, onOpen, onDismiss }: StampNudgeProps) {
  const [progress, setProgress] = useState(100);
  const startRef = useRef<number>(Date.now());
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    startRef.current = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      const remaining = Math.max(0, 100 - (elapsed / DURATION) * 100);
      setProgress(remaining);
      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    timerRef.current = setTimeout(() => {
      onDismiss();
    }, DURATION);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, [onDismiss]);

  const handleOpen = () => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    onOpen();
  };

  return (
    <div className="fixed bottom-20 right-4 z-[1200] w-64 border-4 border-brutal-border bg-bg brutal-shadow animate-slide-up motion-reduce:animate-none lg:bottom-6">
      {/* Progress bar — drains left to right */}
      <div className="h-1 w-full bg-brutal-border overflow-hidden">
        <div
          className="h-full bg-brutal-yellow transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Content */}
      <button
        onClick={handleOpen}
        className="flex items-center gap-3 w-full p-3 text-left hover:bg-surface/60 transition-colors"
      >
        {/* Mini poster */}
        <div className="relative w-10 h-14 flex-shrink-0 border-2 border-brutal-border overflow-hidden bg-brutal-border">
          {movie.posterPath && (
            <Image
              src={posterUrl(movie.posterPath, "small")}
              alt={movie.title}
              fill
              className="object-cover"
              sizes="40px"
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-mono text-[9px] uppercase tracking-widest text-brutal-yellow font-black">
            Write a stamp?
          </p>
          <p className="font-outfit text-xs font-bold uppercase truncate text-text mt-0.5">
            {movie.title}
          </p>
          <p className="font-mono text-[9px] text-brutal-dim mt-1 uppercase tracking-wider">
            Tap to open →
          </p>
        </div>
      </button>

      {/* Dismiss */}
      <button
        onClick={onDismiss}
        className="absolute top-2 right-2 text-brutal-dim hover:text-text transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" strokeWidth={3} />
      </button>
    </div>
  );
}
