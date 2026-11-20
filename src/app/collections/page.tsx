"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Clapperboard, Popcorn, Search, X } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import CollectionCard from "@/components/CollectionCard";
import CollectionModal from "@/components/CollectionModal";
import MovieModal from "@/components/MovieModal";
import StatusMessage, { STATUS_SECONDARY_BUTTON } from "@/components/StatusMessage";
import type { TMDBMovie } from "@/lib/types";

export default function CollectionsPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<TMDBMovie | null>(null);

  // The catalog lives in Convex: new franchises appear here as the discovery cron adds them
  const catalog = useQuery(api.franchises.listCatalog);

  // Filtering is local and instant; deferring keeps typing smooth over hundreds of cards
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const franchises = useMemo(
    () => (catalog ?? []).filter((c) => !deferredQuery || c.name.toLowerCase().includes(deferredQuery)),
    [catalog, deferredQuery]
  );

  return (
    <main className="min-h-screen bg-[#020817] pb-24 pt-6 text-slate-100 lg:pb-16">
      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="-ml-2 flex h-10 items-center gap-1 rounded-lg px-2 text-sm font-medium text-slate-400 transition-colors duration-150 hover:bg-white/[0.06] hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA]"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
          Back
        </button>

        <header className="mt-8 flex flex-col gap-6 sm:mt-12 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">Franchise Vault</h1>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-slate-400">
              Every saga in order. Mark films as watched and each vault fills in.
            </p>
          </div>

          <div className="relative w-full md:max-w-sm">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setQuery("");
                }
              }}
              placeholder="Search franchises"
              aria-label="Search franchises"
              className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-10 pr-11 text-[15px] text-slate-100 outline-none transition-colors duration-150 placeholder:text-slate-500 focus:border-[#60A5FA]/60 focus:bg-white/[0.06] [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-white/[0.08] hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA]"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            )}
          </div>
        </header>

        <p className="mt-10 h-5 text-[13px] tabular-nums text-slate-500" aria-live="polite">
          {catalog === undefined
            ? ""
            : deferredQuery
              ? `${franchises.length} ${franchises.length === 1 ? "match" : "matches"}`
              : `${franchises.length} franchises`}
        </p>

        {catalog === undefined ? (
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4 xl:grid-cols-5" aria-hidden>
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i}>
                <div className="aspect-[2/3] animate-pulse rounded-xl bg-white/[0.04] motion-reduce:animate-none" />
                <div className="mt-3 h-4 w-2/3 rounded bg-white/[0.04]" />
              </div>
            ))}
          </div>
        ) : catalog.length === 0 ? (
          <StatusMessage
            icon={Popcorn}
            className="py-24"
            title="Popcorn’s still popping"
            body="The vault is stocking its shelves from TMDB. Check back in a few minutes."
          />
        ) : franchises.length > 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4 xl:grid-cols-5">
            {franchises.map((f) => (
              <CollectionCard key={f.key} franchise={f} onClick={() => setSelectedCollectionId(f.key)} />
            ))}
          </div>
        ) : (
          <StatusMessage
            icon={Clapperboard}
            className="py-24"
            title={`No saga called “${query.trim()}” yet`}
            body="Try a shorter name, like “Bond” or “Matrix”. New franchises join the vault on their own."
            actions={
              <button type="button" onClick={() => setQuery("")} className={STATUS_SECONDARY_BUTTON}>
                Show all franchises
              </button>
            }
          />
        )}
      </div>

      <CollectionModal
        collectionId={selectedCollectionId}
        hidden={selectedMovie !== null}
        onClose={() => setSelectedCollectionId(null)}
        onMovieClick={setSelectedMovie}
      />

      <MovieModal
        movie={selectedMovie}
        onBack={() => setSelectedMovie(null)}
        onClose={() => { setSelectedMovie(null); setSelectedCollectionId(null); }}
      />
    </main>
  );
}
