"use client";

import { useState, useEffect } from "react";
import { Flame, Clock } from "lucide-react";
import Link from "next/link";

interface SwipeLimitScreenProps {
  todayCount: number;
  limit: number;
}

export default function SwipeLimitScreen({
  todayCount,
  limit,
}: SwipeLimitScreenProps) {
  const [timeLeft, setTimeLeft] = useState("");

  // Countdown to midnight UTC
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      tomorrow.setUTCHours(0, 0, 0, 0);

      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(
        `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
      );
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center gap-6 px-4 text-center">
      {/* Icon */}
      <div className="relative">
        <Flame className="h-20 w-20 text-brutal-pink/30" strokeWidth={1} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-2xl font-black text-brutal-pink">
            {todayCount}
          </span>
        </div>
      </div>

      {/* Message */}
      <div>
        <h1 className="font-display text-2xl font-black uppercase tracking-wider text-brutal-white">
          Daily Limit Reached
        </h1>
        <p className="mt-2 max-w-xs font-inter text-sm text-brutal-muted">
          You&apos;ve swiped through{" "}
          <span className="font-bold text-brutal-pink">{limit}</span> movies
          today! Your watchlist is stacked. Come back tomorrow for more
          discoveries 🍿
        </p>
      </div>

      {/* Countdown */}
      <div className="flex items-center gap-2 border-2 border-brutal-border bg-surface px-4 py-3">
        <Clock className="h-4 w-4 text-brutal-dim" strokeWidth={2.5} />
        <span className="font-mono text-xs uppercase tracking-widest text-brutal-dim">
          Resets in
        </span>
        <span className="font-mono text-lg font-black tracking-widest text-brutal-yellow">
          {timeLeft}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs">
        <div className="relative h-3 overflow-hidden border-2 border-brutal-border bg-surface">
          <div className="absolute inset-y-0 left-0 w-full bg-brutal-pink" />
        </div>
        <span className="mt-1 block font-mono text-[9px] uppercase tracking-widest text-brutal-dim">
          {todayCount} / {limit} swipes used
        </span>
      </div>

      {/* CTAs */}
      <div className="flex gap-3">
        <Link
          href="/"
          className="brutal-btn border-2 border-brutal-border px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-brutal-muted hover:text-brutal-white"
        >
          Explore
        </Link>
        <Link
          href="/watchlist"
          className="brutal-btn border-2 border-brutal-lime bg-brutal-lime px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-black hover:bg-white"
        >
          My Watchlist
        </Link>
      </div>
    </div>
  );
}
