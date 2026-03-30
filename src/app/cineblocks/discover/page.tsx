"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useBlocks } from "@/hooks/useBlocks";
import { posterUrl } from "@/lib/constants";
import { ArrowLeft, Lock, Search, Users, Plus, LayoutGrid } from "lucide-react";
import type { Id } from "../../../../convex/_generated/dataModel";

export default function DiscoverCineBlocksPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { myBlocks, importPublicBlock } = useBlocks();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [importingBlockId, setImportingBlockId] = useState<Id<"blocks"> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => clearTimeout(timer);
  }, [query]);

  const shouldSearch = debouncedQuery.length >= 2;
  const searchResults = useQuery(
    api.cineblocks.searchUsersPublicBlocks,
    shouldSearch ? { query: debouncedQuery } : "skip"
  );

  const usedBlocks = myBlocks?.length ?? 0;
  const limitReached = usedBlocks >= 20;

  const totalFoundBlocks = useMemo(() => {
    if (!searchResults) return 0;
    return searchResults.reduce((acc, entry) => acc + entry.blocks.length, 0);
  }, [searchResults]);

  const handleImport = async (sourceBlockId: Id<"blocks">) => {
    if (limitReached) return;
    setError(null);
    setImportingBlockId(sourceBlockId);
    try {
      await importPublicBlock(sourceBlockId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import playlist.");
    } finally {
      setImportingBlockId(null);
    }
  };

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
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/cineblocks" className="brutal-btn p-2.5"><ArrowLeft className="w-4 h-4" strokeWidth={3} /></Link>
            <Users className="w-5 h-5 text-brutal-cyan" strokeWidth={2.5} />
            <h1 className="font-display font-bold text-xl sm:text-2xl text-brutal-white uppercase tracking-tight">
              Discover Public Playlists
            </h1>
          </div>
          <span className="font-mono text-[11px] text-brutal-dim">
            YOUR PLAYLISTS: {usedBlocks} / 20
          </span>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 py-8 flex flex-col gap-6">
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
            />
          </div>
          <p className="font-mono text-[10px] text-brutal-dim">
            Browse anyone&apos;s public playlists and import them into your CineBlocks.
          </p>
          {limitReached && (
            <div className="border-2 border-red-500 bg-red-500/10 px-3 py-2 text-[11px] font-mono text-red-300 uppercase tracking-wider">
              You reached the max of 20 playlists. Delete one to import another.
            </div>
          )}
          {error && (
            <div className="border-2 border-red-500 bg-red-500/10 px-3 py-2 text-[11px] font-mono text-red-300 uppercase tracking-wider">
              {error}
            </div>
          )}
        </div>

        {!shouldSearch ? (
          <div className="brutal-card p-10 flex flex-col items-center gap-4 border-dashed">
            <Users className="w-12 h-12 text-brutal-dim" strokeWidth={1} />
            <p className="font-display font-bold uppercase text-brutal-dim tracking-wider text-center">
              Search users to see their public playlists
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
              No public playlists found for "{debouncedQuery}"
            </p>
          </div>
        ) : (
          <section className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b-3 border-brutal-border pb-2">
              <h2 className="font-display font-bold text-lg uppercase tracking-widest">Results</h2>
              <span className="font-mono text-[10px] text-brutal-dim">{totalFoundBlocks} PLAYLISTS FOUND</span>
            </div>

            {searchResults.map((entry) => (
              <div key={entry.user._id} className="brutal-card p-4 sm:p-5 flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <p className="font-display font-bold text-base uppercase tracking-wider text-brutal-white">
                    @{entry.user.username ?? "unknown"}
                  </p>
                  {entry.user.name && (
                    <p className="font-mono text-xs text-brutal-dim">{entry.user.name}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {entry.blocks.map((block) => {
                    const isImporting = importingBlockId === block._id;
                    return (
                      <div key={block._id} className="border-3 border-brutal-border bg-surface flex flex-col overflow-hidden">
                        <div className="grid grid-cols-2 aspect-video bg-surface-2 border-b-3 border-brutal-border">
                          {block.previewPosters.length > 0 ? (
                            block.previewPosters.slice(0, 4).map((path, idx) => (
                              <div key={idx} className="relative overflow-hidden bg-surface-2">
                                <Image
                                  src={posterUrl(path, "small")}
                                  alt=""
                                  fill
                                  className="object-cover"
                                  sizes="200px"
                                />
                              </div>
                            ))
                          ) : (
                            <div className="col-span-2 h-full flex items-center justify-center">
                              <LayoutGrid className="w-10 h-10 text-brutal-dim" strokeWidth={1} />
                            </div>
                          )}
                        </div>

                        <div className="p-3 flex flex-col gap-2 flex-1">
                          <h3 className="font-display font-bold text-sm uppercase tracking-wider line-clamp-2 text-brutal-white">
                            {block.title}
                          </h3>
                          <p className="font-mono text-[10px] text-brutal-dim uppercase tracking-wider">
                            {block.movieCount} / 50 movies
                          </p>

                          <div className="mt-auto flex gap-2">
                            <Link
                              href={`/cineblock/${block._id}`}
                              className="brutal-btn flex-1 flex items-center justify-center py-2 text-[10px] font-mono uppercase"
                            >
                              View
                            </Link>
                            <button
                              onClick={() => void handleImport(block._id)}
                              disabled={limitReached || isImporting || importingBlockId !== null}
                              className="brutal-btn flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-mono uppercase !bg-brutal-violet !text-black !border-brutal-violet disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              {isImporting ? "IMPORTING..." : (
                                <>
                                  <Plus className="w-3 h-3" strokeWidth={3} />
                                  Import
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
