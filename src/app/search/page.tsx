"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ArrowLeft, Search, ChevronRight, User } from "lucide-react";

export default function SearchUsersPage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => clearTimeout(timer);
  }, [query]);

  const shouldSearch = debouncedQuery.length >= 2;
  const searchResults = useQuery(
    api.users.searchUsers,
    shouldSearch ? { query: debouncedQuery } : "skip"
  );

  return (
    <div className="min-h-screen bg-bg pb-16 lg:pb-0">
      {/* Top bar */}
      <div className="sticky top-0 z-50 bg-bg border-b-3 border-brutal-border px-4 sm:px-8 py-5 flex items-center gap-4">
        <Link href="/" className="brutal-btn p-2.5 shrink-0">
          <ArrowLeft className="w-4 h-4" strokeWidth={3} />
        </Link>
        <span className="font-display font-black text-lg text-brutal-white tracking-tight">
          SEARCH <span className="text-brutal-yellow">USERS</span>
        </span>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-8 space-y-6 animate-fade-in">

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brutal-dim pointer-events-none" strokeWidth={2.5} />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or username..."
            className="w-full brutal-input pl-10 pr-4 py-3 font-mono text-sm text-text placeholder-text-muted focus:border-brutal-yellow focus:outline-none bg-surface"
          />
        </div>

        {/* Results */}
        {!shouldSearch ? (
          <div className="py-12 text-center">
            <p className="font-mono text-xs uppercase text-brutal-dim tracking-widest">
              Type at least 2 characters to search
            </p>
          </div>
        ) : searchResults === undefined ? (
          <div className="py-12 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-brutal-yellow border-t-transparent animate-spin" />
          </div>
        ) : searchResults.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-brutal-border">
            <p className="font-mono text-xs uppercase text-brutal-dim tracking-widest">
              No users found for &ldquo;{debouncedQuery}&rdquo;
            </p>
          </div>
        ) : (
          <div className="flex flex-col border-4 border-brutal-border overflow-hidden">
            {searchResults.map((user, i) => {
              const displayName = user.name || "CineBlock User";
              const initials = displayName.slice(0, 2).toUpperCase();
              const href = user.username ? `/user/${user.username}` : null;

              const inner = (
                <div className={`flex items-center gap-4 px-4 py-3.5 transition-colors ${href ? "hover:bg-surface/80 cursor-pointer" : "opacity-50 cursor-default"} ${i > 0 ? "border-t-2 border-brutal-border" : ""}`}>
                  {/* Avatar */}
                  <div className="w-10 h-10 shrink-0 bg-brutal-yellow border-2 border-brutal-border flex items-center justify-center overflow-hidden">
                    {user.image ? (
                      <Image src={user.image} alt={displayName} width={40} height={40} className="w-full h-full object-cover" unoptimized />
                    ) : (
                      <span className="font-display font-black text-sm text-black">{initials}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-outfit font-black text-sm uppercase tracking-tight text-text truncate">
                      {displayName}
                    </p>
                    {user.username ? (
                      <p className="font-mono text-xs text-brutal-dim">@{user.username}</p>
                    ) : (
                      <p className="font-mono text-xs text-brutal-dim italic">No username set</p>
                    )}
                  </div>

                  {href && <ChevronRight className="w-4 h-4 text-brutal-dim shrink-0" strokeWidth={2.5} />}
                </div>
              );

              return href ? (
                <Link key={user._id} href={href}>
                  {inner}
                </Link>
              ) : (
                <div key={user._id}>{inner}</div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
