"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface SwipeLimitScreenProps {
  todayCount: number;
  limit: number;
}

function timeUntilUtcMidnight() {
  const now = new Date();
  const next = new Date(now);
  next.setUTCDate(next.getUTCDate() + 1);
  next.setUTCHours(0, 0, 0, 0);
  const diff = next.getTime() - now.getTime();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(diff / 3_600_000))}:${pad(Math.floor((diff % 3_600_000) / 60_000))}:${pad(Math.floor((diff % 60_000) / 1000))}`;
}

export default function SwipeLimitScreen({ todayCount, limit }: SwipeLimitScreenProps) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const update = () => setTimeLeft(timeUntilUtcMidnight());
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center gap-8 px-4 text-center" style={{ background: "#020817" }}>
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-semibold text-white">That&apos;s today&apos;s swipes</h1>
        <p className="mx-auto max-w-xs text-sm text-slate-400">
          You&apos;ve used all <span className="tabular-nums">{Math.max(todayCount, limit)}</span>. Everything you saved is waiting in your lists.
        </p>
      </div>

      <div>
        <p className="text-sm text-slate-400">New swipes in</p>
        <p className="font-display text-5xl font-semibold tabular-nums tracking-[-0.02em] text-orange-300" aria-live="off">
          {timeLeft || "--:--:--"}
        </p>
      </div>

      <div className="flex gap-3">
        <Link
          href="/watchlist"
          className="flex min-h-10 items-center rounded-xl px-5 text-sm font-semibold text-white transition-[transform,background-color] duration-150 hover:bg-blue-400/25 active:scale-[0.97]"
          style={{ background: "rgba(96,165,250,0.18)", border: "1px solid rgba(96,165,250,0.45)" }}
        >
          Open watchlist
        </Link>
        <Link
          href="/"
          className="flex min-h-10 items-center rounded-xl px-5 text-sm text-slate-300 transition-colors duration-150 hover:text-white"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)" }}
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
