"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ArrowLeft, Lock, Search, Users, LayoutGrid, ChevronRight } from "lucide-react";

export default function DiscoverCineBlocksPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();

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
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="w-10 h-10 border-4 border-brutal-violet border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-bg flex flex-col items-center justify-center gap-6 p-6">
        <Lock className="w-14 h-14 text-brutal-dim" strokeWidth={1} />
        <p className="font-display font-bold text-xl uppercase tracking-wider text-center">
          Sign in to discover public playlists
        </p>
        <Link href="/cineblocks" className="brutal-btn px-6 py-3 text-sm font-mono uppercase">
          <ArrowLeft className="w-4 h-4 inline mr-1" />Back to CineBlocks
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg flex flex-col pb-20 lg:pb-0">
      <div className="sticky top-0 z-50 bg-bg border-b-3 border-brutal-border">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-5 flex flex-wrap items-center gap-3">
          <Link href="/cineblocks" className="brutal-btn p-2.5">
            <ArrowLeft className="w-4 h-4" strokeWidth={3} />
          </Link>
          <Users className="w-5 h-5 text-brutal-cyan" strokeWidth={2.5} />
          <h1 className="font-display font-bold text-xl sm:text-2xl text-brutal-white uppercase tracking-tight">
            Find Users
          </h1>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto w-full px-4 sm:px-6 py-8 flex flex-col gap-6">
        {/* Search box */}
        <div className="brutal-card p-4 sm:p-5 flex flex-col gap-3">
          <label className="font-mono text-[10px] uppercase tracking-widest text-brutal-dim">Search users</label>
          <div className="flex items-center gap-2 border-2 border-brutal-border bg-surface px-3 py-2.5 focus-within:border-brutal-violet">
            <Search className="w-4 h-4 text-brutal-dim flex-shrink-0" strokeWidth={2.5} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type username or name (min 2 letters)..."
              className="flex-1 bg-transparent text-sm text-brutal-white placeholder:text-brutal-dim outline-none font-body"
              autoComplete="off"
              autoFocus
            />
          </div>
          <p className="font-mono text-[10px] text-brutal-dim">
            Search by username or display name. Click a profile to see their public playlists and stamps.
          </p>
        </div>

        {/* States */}
        {!shouldSearch ? (
          <div className="brutal-card p-10 flex flex-col items-center gap-4 border-dashed">
            <Users className="w-12 h-12 text-brutal-dim" strokeWidth={1} />
            <p className="font-display font-bold uppercase text-brutal-dim tracking-wider text-center">
              Search users by username or name
            </p>
          </div>
        ) : searchResults === undefined ? (
          <div className="brutal-card p-10 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-brutal-cyan border-t-transparent animate-spin" />
          </div>
        ) : searchResults.length === 0 ? (
          <div className="brutal-card p-10 flex flex-col items-center gap-3 border-dashed">
            <LayoutGrid className="w-12 h-12 text-brutal-dim" strokeWidth={1} />
            <p className="font-display font-bold uppercase text-brutal-dim tracking-wider text-center">
              No users found for &ldquo;{debouncedQuery}&rdquo;
            </p>
          </div>
        ) : (
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b-3 border-brutal-border pb-2">
              <h2 className="font-display font-bold text-lg uppercase tracking-widest">Results</h2>
              <span className="font-mono text-[10px] text-brutal-dim">{searchResults.length} USER{searchResults.length !== 1 ? "S" : ""}</span>
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
                <div className="brutal-card p-4 flex items-center gap-4 hover:border-brutal-violet transition-colors group cursor-pointer">
                  {/* Avatar */}
                  <div className="w-12 h-12 shrink-0 bg-brutal-violet border-2 border-brutal-border flex items-center justify-center">
                    <span className="font-display font-black text-base text-black">{initials}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-bold text-base uppercase tracking-wider text-brutal-white group-hover:text-brutal-violet transition-colors truncate">
                      {displayName}
                    </p>
                    {entry.user.username && entry.user.name && (
                      <p className="font-mono text-xs text-brutal-dim truncate">{entry.user.name}</p>
                    )}
                    <p className="font-mono text-[10px] text-brutal-dim mt-1">
                      {entry.blocks.length} public playlist{entry.blocks.length !== 1 ? "s" : ""}
                    </p>
                  </div>

                  <ChevronRight className="w-4 h-4 text-brutal-dim group-hover:text-brutal-violet flex-shrink-0 transition-colors" />
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
