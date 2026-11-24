"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ArrowLeft, ChevronRight, LogIn, Search, Users } from "lucide-react";

const SURFACE = { background: "rgba(8,15,40,0.72)", border: "1px solid rgba(255,255,255,0.12)" };

export default function DiscoverCineBlocksPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => clearTimeout(timer);
  }, [query]);

  const shouldSearch = debouncedQuery.length >= 2;
  const searchResults = useQuery(api.cineblocks.searchUsersPublicBlocks, shouldSearch ? { query: debouncedQuery } : "skip");

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "#020817" }}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-400/30 border-t-blue-400" role="status" aria-label="Loading" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-5 p-6 text-center" style={{ background: "#020817" }}>
        <Users className="h-10 w-10 text-slate-500" strokeWidth={1.25} />
        <h1 className="font-display text-xl font-semibold text-white">Sign in to find people&apos;s CineBlocks</h1>
        <Link
          href="/sign-in?returnTo=/cineblocks/discover"
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-400/25"
          style={{ background: "rgba(96,165,250,0.18)", border: "1px solid rgba(96,165,250,0.45)" }}
        >
          <LogIn className="h-4 w-4" /> Sign in
        </Link>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen flex-col overflow-x-hidden pb-20 lg:pb-0" style={{ background: "#020817" }}>
      <div
        className="sticky top-0 z-50"
        style={{ background: "rgba(2,8,23,0.80)", backdropFilter: "blur(24px) saturate(180%)", WebkitBackdropFilter: "blur(24px) saturate(180%)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="mx-auto flex max-w-[900px] items-center gap-3 px-4 py-4 sm:px-6">
          <Link href="/cineblocks" aria-label="Back to CineBlocks" className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-white/10 hover:text-white" style={{ border: "1px solid rgba(255,255,255,0.12)" }}>
            <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
          </Link>
          <h1 className="font-display text-xl font-semibold tracking-tight text-white sm:text-2xl">Find people</h1>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[900px] flex-col gap-6 px-4 py-8 sm:px-6">
        <div>
          <label htmlFor="people-search" className="sr-only">Search by username or name</label>
          <div className="flex items-center gap-3 rounded-2xl px-4 transition-colors focus-within:border-blue-400/60" style={SURFACE}>
            <Search className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={2.5} />
            <input
              id="people-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Username or name"
              className="min-h-12 flex-1 bg-transparent text-base text-white outline-none placeholder:text-slate-500"
              autoComplete="off"
              autoFocus
            />
          </div>
          <p className="mt-2 text-sm text-slate-400">Open a profile to see their public CineBlocks and stamps.</p>
        </div>

        {!shouldSearch ? null : searchResults === undefined ? (
          <div className="flex justify-center py-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-400/30 border-t-blue-400" role="status" aria-label="Searching" />
          </div>
        ) : searchResults.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">No one matches &ldquo;{debouncedQuery}&rdquo;.</p>
        ) : (
          <section className="flex flex-col gap-3" aria-label="Results">
            <p className="text-sm tabular-nums text-slate-400">{searchResults.length} {searchResults.length === 1 ? "person" : "people"}</p>
            {searchResults.map((entry) => {
              const username = entry.user.username;
              const initials = (entry.user.name ?? username ?? "?").slice(0, 2).toUpperCase();
              const body = (
                <>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(96,165,250,0.15)", border: "1px solid rgba(96,165,250,0.35)" }}>
                    <span className="font-display text-base font-semibold text-blue-200">{initials}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-base font-semibold text-white transition-colors duration-150 group-hover:text-blue-300">
                      {username ? `@${username}` : (entry.user.name ?? "Unnamed member")}
                    </p>
                    {username && entry.user.name && <p className="truncate text-sm text-slate-400">{entry.user.name}</p>}
                    <p className="mt-0.5 text-xs tabular-nums text-slate-500">
                      {entry.blocks.length} public CineBlock{entry.blocks.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </>
              );

              // Members without a username have no public profile page to open.
              return username ? (
                <Link key={entry.user._id} href={`/u/${username}`} className="group flex items-center gap-4 rounded-2xl p-4 transition-colors duration-150 hover:border-white/25" style={SURFACE}>
                  {body}
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-500 transition-colors duration-150 group-hover:text-blue-300" />
                </Link>
              ) : (
                <div key={entry.user._id} className="flex items-center gap-4 rounded-2xl p-4" style={SURFACE}>
                  {body}
                </div>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
