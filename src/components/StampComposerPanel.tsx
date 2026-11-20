"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Search, Sparkles, X } from "lucide-react";
import { useConvexAuth } from "convex/react";
import { useMovieLists } from "@/hooks/useMovieLists";
import { useStampModal } from "@/components/StampProvider";
import { posterUrl } from "@/lib/constants";
import { TMDBMovie } from "@/lib/types";
import { StampRecord } from "@/components/GlassStampCard";

type MovieSearchResult = {
  id: number;
  title: string;
  poster_path: string | null;
  release_date?: string;
};

function isMovieSearchResult(value: unknown): value is MovieSearchResult {
  if (!value || typeof value !== "object") return false;
  const result = value as Record<string, unknown>;
  return typeof result.id === "number" && typeof result.title === "string" && (result.poster_path === null || typeof result.poster_path === "string");
}

type StampComposerPanelProps = {
  stamps: StampRecord[];
  onClose: () => void;
};

function toMovie(result: MovieSearchResult): TMDBMovie {
  return {
    id: result.id,
    title: result.title,
    poster_path: result.poster_path,
    original_title: result.title,
    overview: "",
    backdrop_path: null,
    release_date: result.release_date ?? "",
    vote_average: 0,
    vote_count: 0,
    genre_ids: [],
    original_language: "",
    popularity: 0,
    adult: false,
  };
}

export default function StampComposerPanel({ stamps, onClose }: StampComposerPanelProps) {
  const { isAuthenticated } = useConvexAuth();
  const { watched, isWatched, toggleWatched } = useMovieLists();
  const { openStampModal } = useStampModal();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MovieSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [selectionError, setSelectionError] = useState("");
  const [selectingId, setSelectingId] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRequestRef = useRef<AbortController | null>(null);

  const stampedIds = useMemo(() => new Set(stamps.map((stamp) => stamp.movieId)), [stamps]);
  const unstampedWatched = watched.filter((movie) => !stampedIds.has(movie.id));

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      searchRequestRef.current?.abort();
    };
  }, [onClose]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setSearchError("");
    setSelectionError("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    searchRequestRef.current?.abort();
    searchRequestRef.current = null;
    if (!value.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setResults([]);
    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      searchRequestRef.current = controller;
      setLoading(true);
      try {
        const response = await fetch(`/api/movies?action=search&query=${encodeURIComponent(value.trim())}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Search failed. Please try again.");
        const data = (await response.json()) as { results?: unknown };
        setResults(Array.isArray(data.results) ? data.results.filter(isMovieSearchResult).slice(0, 10) : []);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setResults([]);
        setSearchError(error instanceof Error ? error.message : "Search failed. Please try again.");
      } finally {
        if (searchRequestRef.current === controller) {
          searchRequestRef.current = null;
          setLoading(false);
        }
      }
    }, 280);
  };

  const chooseMovie = async (movie: MovieSearchResult | TMDBMovie) => {
    if (!isAuthenticated || selectingId !== null || stampedIds.has(movie.id)) return;
    setSelectionError("");
    setSelectingId(movie.id);
    try {
      const normalized: TMDBMovie = "overview" in movie ? movie : toMovie(movie);
      if (!isWatched(normalized.id)) await toggleWatched(normalized);
      openStampModal({ id: normalized.id, title: normalized.title, posterPath: normalized.poster_path ?? "" });
      onClose();
    } catch (error) {
      setSelectionError(error instanceof Error ? error.message : "Could not open the stamp editor. Please try again.");
    } finally {
      setSelectingId(null);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[1050] flex items-end justify-center p-0 sm:items-center sm:p-5"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ background: "rgba(1,5,18,0.70)", backdropFilter: "blur(18px) saturate(140%)" }}
      >
        <motion.section
          role="dialog"
          aria-modal="true"
          aria-labelledby="stamp-composer-title"
          initial={{ y: 45, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 45, opacity: 0, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          onClick={(event) => event.stopPropagation()}
          className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-[30px] sm:rounded-[30px]"
          style={{
            background: "linear-gradient(145deg, rgba(9,21,51,0.97), rgba(3,10,29,0.98))",
            border: "1px solid rgba(125,211,252,0.22)",
            boxShadow: "0 32px 100px rgba(0,0,0,0.6), 0 0 80px rgba(59,130,246,0.12), inset 0 1px 0 rgba(255,255,255,0.10)",
            backdropFilter: "blur(30px) saturate(150%)",
          }}
        >
          <div className="absolute inset-x-0 top-0 h-1" style={{ background: "linear-gradient(90deg, #60A5FA, #22D3EE, #FB923C)" }} />
          <div className="flex items-start justify-between gap-4 px-5 pb-4 pt-6 sm:px-6">
            <div>
              <p className="flex items-center gap-2 text-[9px] font-display font-semibold uppercase tracking-[0.22em] text-orange-200/75"><Sparkles className="h-3 w-3" /> New stamp</p>
              <h2 id="stamp-composer-title" className="mt-1.5 font-display text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl">Choose a film.</h2>
              <p className="mt-1.5 max-w-lg text-xs leading-relaxed text-slate-400">Pick from watched films or search the cinema.</p>
            </div>
            <button type="button" onClick={onClose} aria-label="Close stamp picker" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-slate-400 hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button>
          </div>

          <div className="px-5 pb-5 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-display font-semibold uppercase tracking-[0.18em] text-slate-500">Watched films</p>
              </div>
            </div>

            <div className="glass-shelf-scrollbar mt-3 flex gap-3 overflow-x-auto pb-2">
              {unstampedWatched.map((movie) => (
                <button key={movie.id} type="button" onClick={() => void chooseMovie(movie)} disabled={!isAuthenticated || selectingId !== null} className="group relative w-[112px] shrink-0 text-left disabled:opacity-50">
                  <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05] shadow-lg transition-transform group-hover:-translate-y-1">
                    {movie.poster_path && <Image src={posterUrl(movie.poster_path, "medium")} alt="" fill className="object-cover" sizes="112px" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#020817] via-transparent to-transparent opacity-90" />
                    <span className="absolute bottom-2 left-2 right-2 line-clamp-2 text-[11px] font-display font-semibold leading-tight text-white">{movie.title}</span>
                  </div>
                  <span className="mt-2 block text-center text-[9px] font-display uppercase tracking-[0.12em] text-slate-500 transition-colors group-hover:text-cyan-200">Stamp this</span>
                </button>
              ))}
              {unstampedWatched.length === 0 && <div className="flex min-w-full items-center justify-center rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-xs text-slate-500">Search below to choose a film, or mark a title as watched first.</div>}
            </div>

            <div className="mt-4 flex items-center gap-2 text-[10px] font-display uppercase tracking-[0.18em] text-slate-500"><span className="h-px flex-1 bg-white/10" /> Search the cinema <span className="h-px flex-1 bg-white/10" /></div>
            <label className="relative mt-4 block">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input value={query} onChange={(event) => handleQueryChange(event.target.value)} placeholder="Search any movie or series..." autoFocus className="w-full rounded-2xl border border-white/10 bg-white/[0.06] py-3.5 pl-11 pr-12 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-300/45" />
              {loading && <span role="status" aria-label="Searching" className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-blue-300/40 border-t-transparent" />}
            </label>

            {(searchError || selectionError) && <p role="alert" className="mt-3 rounded-2xl border border-red-300/20 bg-red-400/[0.07] px-4 py-3 text-xs leading-5 text-red-100">{searchError || selectionError}</p>}

            <div aria-busy={loading} className="mt-3 overflow-hidden rounded-2xl border border-white/[0.08] bg-black/10">
              {!query.trim() ? (
                <p className="px-4 py-6 text-center text-xs text-slate-500">Search by title to find a film outside your watched shelf.</p>
              ) : results.length === 0 && !loading ? (
                <p className="px-4 py-6 text-center text-xs text-slate-500">No films found for “{query}”.</p>
              ) : (
                results.map((movie) => {
                  const alreadyStamped = stampedIds.has(movie.id);
                  return (
                    <button key={movie.id} type="button" onClick={() => void chooseMovie(movie)} disabled={!isAuthenticated || alreadyStamped || selectingId !== null} className="flex w-full items-center gap-3 border-b border-white/[0.06] px-4 py-3 text-left last:border-0 hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-45">
                      <div className="relative h-12 w-9 shrink-0 overflow-hidden rounded-lg bg-white/[0.06]">{movie.poster_path && <Image src={posterUrl(movie.poster_path, "small")} alt="" fill className="object-cover" sizes="36px" />}</div>
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-display font-semibold text-white">{movie.title}</p><p className="mt-0.5 text-[10px] text-slate-500">{movie.release_date?.slice(0, 4) || "Release year unknown"}</p></div>
                      {alreadyStamped ? <span className="inline-flex items-center gap-1 text-[9px] font-display uppercase tracking-[0.12em] text-emerald-300"><CheckCircle2 className="h-3.5 w-3.5" />Stamped</span> : <span className="text-[9px] font-display uppercase tracking-[0.12em] text-cyan-200">Choose</span>}
                    </button>
                  );
                })
              )}
            </div>

            {!isAuthenticated && <p className="mt-4 text-center text-xs text-slate-500"> <Link href="/sign-in" onClick={onClose} className="text-blue-300 underline underline-offset-4">Sign in</Link> to save stamps to your profile.</p>}
          </div>
        </motion.section>
      </motion.div>
    </AnimatePresence>
  );
}
