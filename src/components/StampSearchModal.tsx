"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { X, Search, CheckCircle } from "lucide-react";
import { useConvexAuth } from "convex/react";
import { useMovieLists } from "@/hooks/useMovieLists";
import { useStampModal } from "@/components/StampProvider";
import { posterUrl } from "@/lib/constants";
import { useThemeMode } from "@/hooks/useThemeMode";

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
  const isGlass = useThemeMode() === "glass";

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
    // Lock background scroll while modal is open
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
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
      document.body.style.overflow = prev;
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
    <div className="fixed inset-0 z-[1050] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 animate-fade-in motion-reduce:animate-none"
        style={isGlass ? {
          background: "rgba(2,5,18,0.88)",
          backdropFilter: "blur(20px) saturate(140%)",
          WebkitBackdropFilter: "blur(20px) saturate(140%)",
        } : { background: "rgba(0,0,0,0.70)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-stamp-search-modal="true"
        className="relative w-full max-w-lg animate-slide-up motion-reduce:animate-none overflow-hidden"
        style={isGlass ? {
          background: "rgba(8,15,40,0.96)",
          backdropFilter: "blur(28px) saturate(160%)",
          WebkitBackdropFilter: "blur(28px) saturate(160%)",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: "20px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.7), 0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)",
        } : {
          border: "4px solid var(--color-brutal-border)",
          background: "var(--color-bg)",
          boxShadow: "8px 8px 0px 0px rgba(0,0,0,1)",
        }}
      >
        {/* Accent bar (glass only) */}
        {isGlass && (
          <div style={{ height: 3, background: "linear-gradient(90deg, #FBBF24, #F59E0B)" }} />
        )}

        {/* Header */}
        <div
          className="flex items-center justify-between p-4"
          style={isGlass ? {
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            background: "rgba(255,255,255,0.025)",
          } : {
            borderBottom: "4px solid var(--color-brutal-border)",
            background: "var(--color-brutal-yellow)",
          }}
        >
          <h2 id={titleId} className={`flex items-center gap-2 ${isGlass ? "font-display font-semibold text-base text-white tracking-tight" : "font-outfit text-lg font-black uppercase tracking-wider text-black"}`}>
            <Image src="/stamped_cineblock.png" alt="" width={isGlass ? 24 : 28} height={isGlass ? 24 : 28} unoptimized className={isGlass ? "opacity-90" : ""} />
            {isGlass ? "Stamp a Film" : "STAMP A FILM"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className={isGlass
              ? "flex items-center justify-center w-7 h-7 rounded-lg transition-colors hover:bg-white/10"
              : "p-1 hover:bg-black/10 transition-colors"}
            style={isGlass ? { border: "1px solid rgba(255,255,255,0.12)", color: "rgba(148,163,184,0.8)" } : undefined}
          >
            <X className={isGlass ? "w-3.5 h-3.5" : "h-5 w-5 text-black"} strokeWidth={isGlass ? 2.5 : 2} />
          </button>
        </div>

        {/* Search input */}
        <div
          className="relative"
          style={isGlass ? { borderBottom: "1px solid rgba(255,255,255,0.07)" } : { borderBottom: "4px solid var(--color-brutal-border)" }}
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: isGlass ? "rgba(148,163,184,0.5)" : undefined }} strokeWidth={2.5} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search any film..."
            className="w-full pl-11 pr-4 py-4 font-mono text-sm focus:outline-none"
            style={isGlass ? {
              background: "transparent",
              color: "rgba(255,255,255,0.9)",
            } : {
              background: "var(--color-surface)",
              color: "var(--color-text)",
            }}
          />
          {loading && (
            <div
              className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-t-transparent animate-spin rounded-full"
              style={{ borderColor: isGlass ? "rgba(251,191,36,0.6)" : undefined, borderTopColor: "transparent" }}
            />
          )}
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto custom-scrollbar">
          {!query.trim() ? (
            <p className="py-8 text-center font-mono text-xs uppercase tracking-widest" style={{ color: isGlass ? "rgba(148,163,184,0.5)" : undefined }}>
              Search a film to stamp it
            </p>
          ) : results.length === 0 && !loading ? (
            <p className="py-8 text-center font-mono text-xs uppercase tracking-widest" style={{ color: isGlass ? "rgba(148,163,184,0.5)" : undefined }}>
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
                  className="flex items-center gap-3 w-full px-4 py-3 text-left transition-colors disabled:opacity-50 last:border-b-0"
                  style={isGlass ? { borderBottom: "1px solid rgba(255,255,255,0.05)" } : { borderBottom: "2px solid rgba(var(--color-brutal-border-rgb),0.3)" }}
                  onMouseEnter={e => isGlass && ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)")}
                  onMouseLeave={e => isGlass && ((e.currentTarget as HTMLElement).style.background = "transparent")}
                >
                  {/* Poster */}
                  <div
                    className="relative w-9 h-12 flex-shrink-0 overflow-hidden"
                    style={isGlass ? { borderRadius: "6px", border: "1px solid rgba(255,255,255,0.10)" } : { border: "2px solid var(--color-brutal-border)" }}
                  >
                    {movie.poster_path ? (
                      <Image src={posterUrl(movie.poster_path, "small")} alt="" fill className="object-cover" sizes="36px" />
                    ) : null}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${isGlass ? "font-display text-white/90 tracking-tight" : "font-outfit uppercase tracking-tight text-text"}`}>
                      {movie.title}
                    </p>
                    {year && (
                      <p className="font-mono text-[10px]" style={{ color: isGlass ? "rgba(148,163,184,0.5)" : undefined }}>{year}</p>
                    )}
                  </div>

                  {/* State indicator */}
                  <div className="flex-shrink-0">
                    {isStamping ? (
                      <div className="w-5 h-5 border-2 border-t-transparent animate-spin rounded-full" style={{ borderColor: isGlass ? "rgba(251,191,36,0.6)" : undefined, borderTopColor: "transparent" }} />
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
          <div
            className="px-4 py-3"
            style={isGlass ? { borderTop: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" } : { borderTop: "2px solid var(--color-brutal-border)", background: "var(--color-surface)" }}
          >
            <p className="font-mono text-[10px] uppercase text-center tracking-widest" style={{ color: isGlass ? "rgba(148,163,184,0.5)" : undefined }}>
              Sign in to stamp films
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
