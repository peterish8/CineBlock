"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { X, Search, CheckCircle } from "lucide-react";
import { useConvexAuth } from "convex/react";
import { useMovieLists } from "@/hooks/useMovieLists";
import { useStampModal } from "@/components/StampProvider";
import { posterUrl } from "@/lib/constants";

type MovieResult = {
  id: number;
  title: string;
  poster_path: string | null;
  release_date?: string;
};

type StampSearchModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function StampSearchModal({ isOpen, onClose }: StampSearchModalProps) {
  const { isAuthenticated } = useConvexAuth();
  const { toggleWatched, isWatched } = useMovieLists();
  const { openStampModal } = useStampModal();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MovieResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [stampingId, setStampingId] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      setLoading(false);
      return;
    }
    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setTimeout(() => inputRef.current?.focus(), 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab") return;

      const root = document.querySelector("[data-stamp-search-modal='true']");
      if (!(root instanceof HTMLElement)) return;
      const focusables = Array.from(
        root.querySelectorAll<HTMLElement>(
          "button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex='-1'])"
        )
      ).filter((el) => el.tabIndex !== -1);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (!active || active === first) { e.preventDefault(); last.focus(); }
      } else if (!active || active === last) {
        e.preventDefault(); first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      restoreFocusRef.current?.focus();
    };
  }, [isOpen, onClose]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) { setResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/movies?action=search&query=${encodeURIComponent(value.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setResults((data.results ?? []).slice(0, 8));
        }
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleStamp = async (movie: MovieResult) => {
    if (!isAuthenticated || stampingId !== null) return;

    setStampingId(movie.id);
    try {
      const wasWatched = isWatched(movie.id);
      const tmdbMovie = {
        id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path,
        original_title: movie.title,
        overview: "",
        backdrop_path: null,
        release_date: movie.release_date ?? "",
        vote_average: 0,
        vote_count: 0,
        genre_ids: [],
        original_language: "",
        popularity: 0,
        adult: false,
      };

      // Auto-mark watched if not already
      if (!wasWatched) {
        await toggleWatched(tmdbMovie);
      }

      // Open stamp modal directly
      openStampModal({
        id: movie.id,
        title: movie.title,
        posterPath: movie.poster_path ?? "",
      });

      onClose();
    } finally {
      setStampingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1050] flex items-start justify-center pt-16 px-4 sm:pt-24">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in motion-reduce:animate-none"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-stamp-search-modal="true"
        className="relative w-full max-w-lg border-4 border-brutal-border bg-bg brutal-shadow animate-slide-up motion-reduce:animate-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-4 border-brutal-border bg-brutal-yellow p-4">
          <h2 id={titleId} className="font-outfit text-lg font-black uppercase tracking-wider text-black flex items-center gap-2">
            <Image src="/stamped_cineblock.png" alt="" width={28} height={28} unoptimized />
            STAMP A FILM
          </h2>
          <button onClick={onClose} aria-label="Close" className="p-1 hover:bg-black/10 transition-colors">
            <X className="h-5 w-5 text-black" />
          </button>
        </div>

        {/* Search input */}
        <div className="relative border-b-4 border-brutal-border">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brutal-dim pointer-events-none" strokeWidth={2.5} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search any film..."
            className="w-full bg-surface pl-11 pr-4 py-4 font-mono text-sm text-text placeholder-text-muted focus:outline-none focus:bg-surface/80"
          />
          {loading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-brutal-yellow border-t-transparent animate-spin" />
          )}
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto custom-scrollbar">
          {!query.trim() ? (
            <p className="py-8 text-center font-mono text-xs uppercase text-brutal-dim tracking-widest">
              Search a film to stamp it
            </p>
          ) : results.length === 0 && !loading ? (
            <p className="py-8 text-center font-mono text-xs uppercase text-brutal-dim tracking-widest">
              No results for &ldquo;{query}&rdquo;
            </p>
          ) : (
            results.map((movie) => {
              const watched = isWatched(movie.id);
              const isStamping = stampingId === movie.id;
              const year = movie.release_date?.slice(0, 4);

              return (
                <button
                  key={movie.id}
                  onClick={() => void handleStamp(movie)}
                  disabled={isStamping || stampingId !== null}
                  className="flex items-center gap-3 w-full px-4 py-3 border-b-2 border-brutal-border/30 text-left hover:bg-surface/60 transition-colors disabled:opacity-50 last:border-b-0"
                >
                  {/* Poster */}
                  <div className="relative w-9 h-12 flex-shrink-0 border-2 border-brutal-border overflow-hidden bg-brutal-border">
                    {movie.poster_path ? (
                      <Image
                        src={posterUrl(movie.poster_path, "small")}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="36px"
                      />
                    ) : null}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-outfit text-sm font-bold uppercase tracking-tight truncate text-text">
                      {movie.title}
                    </p>
                    {year && (
                      <p className="font-mono text-[10px] text-brutal-dim">{year}</p>
                    )}
                  </div>

                  {/* State indicator */}
                  <div className="flex-shrink-0">
                    {isStamping ? (
                      <div className="w-5 h-5 border-2 border-brutal-yellow border-t-transparent animate-spin" />
                    ) : watched ? (
                      <CheckCircle className="w-5 h-5 text-brutal-cyan" strokeWidth={2.5} />
                    ) : (
                      <Image src="/stamped_cineblock.png" alt="" width={24} height={24} className="opacity-40" unoptimized />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {!isAuthenticated && (
          <div className="border-t-2 border-brutal-border px-4 py-3 bg-surface/50">
            <p className="font-mono text-[10px] uppercase text-brutal-dim text-center tracking-widest">
              Sign in to stamp films
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
