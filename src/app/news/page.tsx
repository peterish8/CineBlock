"use client";

import Link from "next/link";
import { ArrowLeft, Newspaper, RefreshCw } from "lucide-react";
import NewsFeed from "@/components/NewsFeed";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import { useThemeMode } from "@/hooks/useThemeMode";

export default function NewsPage() {
  const invalidateToday = useMutation(api.news.invalidateToday);
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const isGlass = useThemeMode() === "glass";

  const handleRefresh = async () => {
    setRefreshing(true);
    await invalidateToday();
    await new Promise((r) => setTimeout(r, 800));
    setRefreshKey((k) => k + 1);
    setRefreshing(false);
  };

  return (
    <main
      className={`min-h-screen flex flex-col pb-16 lg:pb-0 ${isGlass ? "relative overflow-x-hidden" : "bg-bg"}`}
      style={isGlass ? { background: "#020817" } : undefined}
    >
      {/* Glass depth orb */}
      {isGlass && (
        <div className="pointer-events-none fixed left-[-15%] top-[-10%] aspect-square w-[65vw] rounded-full opacity-25" style={{ background: "radial-gradient(circle, rgba(249,115,22,0.22) 0%, transparent 70%)", filter: "blur(100px)", zIndex: 0 }} />
      )}

      {/* Sticky header */}
      <div
        className={`sticky top-0 z-50 ${isGlass ? "" : "bg-bg border-b-3 border-brutal-border"}`}
        style={isGlass ? {
          background: "rgba(2,8,23,0.80)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        } : undefined}
      >
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-5 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className={isGlass ? "flex items-center justify-center w-9 h-9 rounded-xl transition-colors hover:bg-white/10" : "brutal-btn p-2.5"}
              style={isGlass ? { border: "1px solid rgba(255,255,255,0.12)", color: "rgba(148,163,184,0.8)" } : undefined}
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={3} />
            </Link>
            <Newspaper className={`w-5 h-5 ${isGlass ? "text-orange-400" : "text-brutal-orange"}`} strokeWidth={2.5} />
            <h1 className={`font-display font-bold text-xl sm:text-2xl tracking-tight ${isGlass ? "text-white" : "text-brutal-white uppercase"}`}>
              {isGlass ? "Movie News" : "MOVIE NEWS"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => void handleRefresh()}
              disabled={refreshing}
              className={`flex items-center justify-center transition-all disabled:opacity-40 ${
                isGlass
                  ? "w-9 h-9 rounded-xl hover:bg-white/10 active:scale-[0.95]"
                  : "brutal-btn p-2 hover:!border-brutal-orange hover:!text-brutal-orange"
              }`}
              style={isGlass ? { border: "1px solid rgba(255,255,255,0.12)", color: "rgba(148,163,184,0.8)" } : undefined}
              title="Refresh news"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} strokeWidth={2.5} />
            </button>
            <span
              className={`px-2 py-0.5 text-[10px] font-bold ${isGlass ? "rounded-lg" : "brutal-chip text-brutal-orange border-brutal-orange"}`}
              style={isGlass ? { background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.30)", color: "#FB923C" } : undefined}
            >
              Daily Feed
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-[1600px] mx-auto w-full px-4 sm:px-6 py-6 relative z-10">
        <p className={`text-[10px] uppercase tracking-wider mb-4 ${isGlass ? "text-slate-500" : "text-brutal-dim font-mono"}`}>
          Latest from Variety · Deadline · Hollywood Reporter · Collider · Reddit
        </p>
        <NewsFeed key={refreshKey} />
      </div>
    </main>
  );
}
