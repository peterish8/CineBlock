"use client";

import { useState, useEffect } from "react";
import { Flame, Clock } from "lucide-react";
import Link from "next/link";
import { useThemeMode } from "@/hooks/useThemeMode";

interface SwipeLimitScreenProps {
  todayCount: number;
  limit: number;
}

export default function SwipeLimitScreen({
  todayCount,
  limit,
}: SwipeLimitScreenProps) {
  const isGlass = useThemeMode() === "glass";
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
    <div className="flex min-h-[80vh] flex-col items-center justify-center gap-6 px-4 text-center" style={isGlass ? { background: "#020817" } : undefined}>
      {/* Icon */}
      <div className="relative">
        <Flame className={isGlass ? "h-20 w-20 text-orange-400/30" : "h-20 w-20 text-brutal-pink/30"} strokeWidth={1} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={isGlass ? "font-display text-2xl font-black text-orange-300" : "font-display text-2xl font-black text-brutal-pink"}>
            {todayCount}
          </span>
        </div>
      </div>

      {/* Message */}
      <div>
        <h1 className={isGlass ? "text-2xl font-black uppercase tracking-wider text-white" : "font-display text-2xl font-black uppercase tracking-wider text-brutal-white"}>
          Daily Limit Reached
        </h1>
        <p className={isGlass ? "mt-2 max-w-xs text-sm text-slate-400" : "mt-2 max-w-xs font-inter text-sm text-brutal-muted"}>
          You&apos;ve swiped through{" "}
          <span className={isGlass ? "font-bold text-orange-300" : "font-bold text-brutal-pink"}>{limit}</span> movies
          today! Your watchlist is stacked. Come back tomorrow for more discoveries.
        </p>
      </div>

      {/* Countdown */}
      <div
        className={isGlass ? "flex items-center gap-2 rounded-xl px-4 py-3" : "flex items-center gap-2 border-2 border-brutal-border bg-surface px-4 py-3"}
        style={isGlass ? { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" } : undefined}
      >
        <Clock className={isGlass ? "h-4 w-4 text-slate-400" : "h-4 w-4 text-brutal-dim"} strokeWidth={2.5} />
        <span className={isGlass ? "text-xs uppercase tracking-widest text-slate-400" : "font-mono text-xs uppercase tracking-widest text-brutal-dim"}>
          Resets in
        </span>
        <span className={isGlass ? "text-lg font-black tracking-widest text-blue-300" : "font-mono text-lg font-black tracking-widest text-brutal-yellow"}>
          {timeLeft}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs">
        <div
          className={isGlass ? "relative h-3 overflow-hidden rounded-full" : "relative h-3 overflow-hidden border-2 border-brutal-border bg-surface"}
          style={isGlass ? { background: "rgba(255,255,255,0.08)" } : undefined}
        >
          <div className="absolute inset-y-0 left-0 w-full" style={isGlass ? { background: "linear-gradient(90deg, #F97316, #FB923C)" } : undefined} />
          {!isGlass && <div className="absolute inset-y-0 left-0 w-full bg-brutal-pink" />}
        </div>
        <span className={isGlass ? "mt-1 block text-[9px] uppercase tracking-widest text-slate-500" : "mt-1 block font-mono text-[9px] uppercase tracking-widest text-brutal-dim"}>
          {todayCount} / {limit} swipes used
        </span>
      </div>

      {/* CTAs */}
      <div className="flex gap-3">
        <Link
          href="/"
          className={isGlass ? "rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-300 transition-colors hover:text-white" : "brutal-btn border-2 border-brutal-border px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-brutal-muted hover:text-brutal-white"}
          style={isGlass ? { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)" } : undefined}
        >
          Explore
        </Link>
        <Link
          href="/watchlist"
          className={isGlass ? "rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest text-emerald-200 transition-colors" : "brutal-btn border-2 border-brutal-lime bg-brutal-lime px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-black hover:bg-white"}
          style={isGlass ? { background: "rgba(52,211,153,0.16)", border: "1px solid rgba(52,211,153,0.4)" } : undefined}
        >
          My Watchlist
        </Link>
      </div>
    </div>
  );
}
