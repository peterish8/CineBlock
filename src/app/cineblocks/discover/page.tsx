"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ArrowLeft, Lock, Search, Users, LayoutGrid, ChevronRight } from "lucide-react";
import { useThemeMode } from "@/hooks/useThemeMode";

export default function DiscoverCineBlocksPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const isGlass = useThemeMode() === "glass";

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => clearTimeout(timer);
  }, [query]);

  const shouldSearch = debouncedQuery.length >= 2;
  const searchResults = useQuery(
    api.cineblocks.searchUsersPublicBlocks,
    shouldSearch ? { query: debouncedQuery } : "skip"
  );

  if (isLoading) {
    return (
      <div className={isGlass ? "min-h-screen flex items-center justify-center" : "min-h-screen flex items-center justify-center bg-bg"} style={isGlass ? { background: "#020817" } : undefined}>
        <div className={isGlass
          ? "w-10 h-10 rounded-full border-2 border-blue-400/30 border-t-blue-400 animate-spin"
          : "w-10 h-10 border-4 border-brutal-violet border-t-transparent animate-spin"} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className={isGlass ? "min-h-screen flex flex-col items-center justify-center gap-6 p-6" : "min-h-screen bg-bg flex flex-col items-center justify-center gap-6 p-6"} style={isGlass ? { background: "#020817" } : undefined}>
        <Lock className={isGlass ? "w-14 h-14 text-slate-600" : "w-14 h-14 text-brutal-dim"} strokeWidth={1} />
        <p className={isGlass ? "text-xl font-semibold text-center text-white" : "font-display font-bold text-xl uppercase tracking-wider text-center"}>
          Sign in to discover public playlists
        </p>
        <Link
          href="/cineblocks"
          className={isGlass ? "rounded-xl px-6 py-3 text-sm font-semibold text-slate-200 transition-colors" : "brutal-btn px-6 py-3 text-sm font-mono uppercase"}
          style={isGlass ? { background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)" } : undefined}
        >
          <ArrowLeft className="w-4 h-4 inline mr-1" />Back to CineBlocks
        </Link>
      </main>
    );
  }

  return (
    <main className={isGlass ? "min-h-screen relative overflow-x-hidden flex flex-col pb-20 lg:pb-0" : "min-h-screen bg-bg flex flex-col pb-20 lg:pb-0"} style={isGlass ? { background: "#020817" } : undefined}>
      {isGlass && (
        <div className="pointer-events-none fixed left-1/2 top-[-15%] -translate-x-1/2 aspect-square w-[70vw] rounded-full opacity-25" style={{ background: "radial-gradient(circle, rgba(96,165,250,0.22) 0%, transparent 70%)", filter: "blur(100px)", zIndex: 0 }} />
      )}

      <div
        className={isGlass ? "sticky top-0 z-50" : "sticky top-0 z-50 bg-bg border-b-3 border-brutal-border"}
        style={isGlass ? { background: "rgba(2,8,23,0.80)", backdropFilter: "blur(24px) saturate(180%)", WebkitBackdropFilter: "blur(24px) saturate(180%)", borderBottom: "1px solid rgba(255,255,255,0.08)" } : undefined}
      >
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-5 flex flex-wrap items-center gap-3 relative z-10">
          <Link
            href="/cineblocks"
            aria-label="Back to CineBlocks"
            className={isGlass ? "flex items-center justify-center w-9 h-9 rounded-xl transition-colors hover:bg-white/10" : "brutal-btn p-2.5"}
            style={isGlass ? { border: "1px solid rgba(255,255,255,0.12)", color: "rgba(148,163,184,0.8)" } : undefined}
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={3} />
          </Link>
          <Users className={isGlass ? "w-5 h-5 text-blue-400" : "w-5 h-5 text-brutal-cyan"} strokeWidth={2.5} />
          <h1 className={isGlass ? "font-display font-bold text-xl sm:text-2xl text-white tracking-tight" : "font-display font-bold text-xl sm:text-2xl text-brutal-white uppercase tracking-tight"}>
            Find Users
          </h1>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto w-full px-4 sm:px-6 py-8 flex flex-col gap-6 relative z-10">
        {/* Search box */}
        <div
          className={isGlass ? "p-4 sm:p-5 flex flex-col gap-3 rounded-2xl" : "brutal-card p-4 sm:p-5 flex flex-col gap-3"}
          style={isGlass ? { background: "rgba(8,15,40,0.72)", backdropFilter: "blur(24px) saturate(200%)", WebkitBackdropFilter: "blur(24px) saturate(200%)", border: "1px solid rgba(255,255,255,0.12)" } : undefined}
        >
          <label className={isGlass ? "text-xs text-slate-400" : "font-mono text-[10px] uppercase tracking-widest text-brutal-dim"}>Search users</label>
          <div
            className={isGlass ? "flex items-center gap-2 rounded-xl px-3 py-2.5" : "flex items-center gap-2 border-2 border-brutal-border bg-surface px-3 py-2.5 focus-within:border-brutal-violet"}
            style={isGlass ? { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)" } : undefined}
          >
            <Search className={isGlass ? "w-4 h-4 text-slate-500 flex-shrink-0" : "w-4 h-4 text-brutal-dim flex-shrink-0"} strokeWidth={2.5} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type username or name (min 2 letters)..."
              className={isGlass ? "flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 outline-none" : "flex-1 bg-transparent text-sm text-brutal-white placeholder:text-brutal-dim outline-none font-body"}
              autoComplete="off"
              autoFocus
            />
          </div>
          <p className={isGlass ? "text-[11px] text-slate-500" : "font-mono text-[10px] text-brutal-dim"}>
            Search by username or display name. Click a profile to see their public playlists and stamps.
          </p>
        </div>

        {/* States */}
        {!shouldSearch ? (
          <div className={isGlass ? "p-10 flex flex-col items-center gap-4 rounded-2xl" : "brutal-card p-10 flex flex-col items-center gap-4 border-dashed"} style={isGlass ? { background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.14)" } : undefined}>
            <Users className={isGlass ? "w-12 h-12 text-slate-600" : "w-12 h-12 text-brutal-dim"} strokeWidth={1} />
            <p className={isGlass ? "font-semibold text-slate-400 text-center" : "font-display font-bold uppercase text-brutal-dim tracking-wider text-center"}>
              Search users by username or name
            </p>
          </div>
        ) : searchResults === undefined ? (
          <div className={isGlass ? "p-10 flex items-center justify-center rounded-2xl" : "brutal-card p-10 flex items-center justify-center"} style={isGlass ? { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)" } : undefined}>
            <div className={isGlass ? "w-8 h-8 rounded-full border-2 border-blue-400/30 border-t-blue-400 animate-spin" : "w-8 h-8 border-4 border-brutal-cyan border-t-transparent animate-spin"} />
          </div>
        ) : searchResults.length === 0 ? (
          <div className={isGlass ? "p-10 flex flex-col items-center gap-3 rounded-2xl" : "brutal-card p-10 flex flex-col items-center gap-3 border-dashed"} style={isGlass ? { background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.14)" } : undefined}>
            <LayoutGrid className={isGlass ? "w-12 h-12 text-slate-600" : "w-12 h-12 text-brutal-dim"} strokeWidth={1} />
            <p className={isGlass ? "font-semibold text-slate-400 text-center" : "font-display font-bold uppercase text-brutal-dim tracking-wider text-center"}>
              No users found for &ldquo;{debouncedQuery}&rdquo;
            </p>
          </div>
        ) : (
          <section className="flex flex-col gap-3">
            <div className={isGlass ? "flex items-center justify-between pb-2" : "flex items-center justify-between border-b-3 border-brutal-border pb-2"} style={isGlass ? { borderBottom: "1px solid rgba(255,255,255,0.10)" } : undefined}>
              <h2 className={isGlass ? "text-lg font-display font-semibold text-white" : "font-display font-bold text-lg uppercase tracking-widest"}>Results</h2>
              <span className={isGlass ? "text-[11px] text-slate-500 tabular-nums" : "font-mono text-[10px] text-brutal-dim"}>{searchResults.length} user{searchResults.length !== 1 ? "s" : ""}</span>
            </div>

            {searchResults.map((entry) => {
              const profileUsername = entry.user.username;
              // Only navigate to /u/[username] if they have a username set
              const href = profileUsername ? `/u/${profileUsername}` : null;
              const displayName = entry.user.username
                ? `@${entry.user.username}`
                : (entry.user.name ?? "Unknown User");
              const initials = (entry.user.name ?? entry.user.username ?? "?").slice(0, 2).toUpperCase();

              const card = (
                <div
                  className={isGlass
                    ? "flex items-center gap-4 p-4 rounded-2xl transition-colors group cursor-pointer hover:bg-white/[0.04]"
                    : "brutal-card p-4 flex items-center gap-4 hover:border-brutal-violet transition-colors group cursor-pointer"}
                  style={isGlass ? { background: "rgba(8,15,40,0.72)", backdropFilter: "blur(24px) saturate(200%)", WebkitBackdropFilter: "blur(24px) saturate(200%)", border: "1px solid rgba(255,255,255,0.12)" } : undefined}
                >
                  {/* Avatar */}
                  <div
                    className={isGlass ? "w-12 h-12 shrink-0 rounded-xl flex items-center justify-center" : "w-12 h-12 shrink-0 bg-brutal-violet border-2 border-brutal-border flex items-center justify-center"}
                    style={isGlass ? { background: "rgba(96,165,250,0.15)", border: "1px solid rgba(96,165,250,0.4)" } : undefined}
                  >
                    <span className={isGlass ? "font-display font-black text-base text-blue-200" : "font-display font-black text-base text-black"}>{initials}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={isGlass
                      ? "font-display font-semibold text-base text-white transition-colors truncate group-hover:text-blue-300"
                      : "font-display font-bold text-base uppercase tracking-wider text-brutal-white group-hover:text-brutal-violet transition-colors truncate"}>
                      {displayName}
                    </p>
                    {entry.user.username && entry.user.name && (
                      <p className={isGlass ? "text-xs text-slate-500 truncate" : "font-mono text-xs text-brutal-dim truncate"}>{entry.user.name}</p>
                    )}
                    <p className={isGlass ? "text-[11px] text-slate-500 mt-1" : "font-mono text-[10px] text-brutal-dim mt-1"}>
                      {entry.blocks.length} public playlist{entry.blocks.length !== 1 ? "s" : ""}
                    </p>
                  </div>

                  <ChevronRight className={isGlass ? "w-4 h-4 text-slate-500 group-hover:text-blue-300 flex-shrink-0 transition-colors" : "w-4 h-4 text-brutal-dim group-hover:text-brutal-violet flex-shrink-0 transition-colors"} />
                </div>
              );

              return href ? (
                <Link key={entry.user._id} href={href}>
                  {card}
                </Link>
              ) : (
                <div key={entry.user._id}>{card}</div>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
