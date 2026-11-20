"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Check, ChevronDown, Clapperboard, Film, Hourglass, Popcorn, Star, WifiOff, X, type LucideIcon } from "lucide-react";
import type { TMDBCollectionDetail, TMDBMovie } from "@/lib/types";
import { backdropUrl, posterUrl } from "@/lib/constants";
import { useMovieLists } from "@/hooks/useMovieLists";
import { fetchCollectionDetail } from "@/lib/collectionCache";
import { franchiseTitle } from "@/components/CollectionCard";
import StatusMessage, { STATUS_PRIMARY_BUTTON } from "@/components/StatusMessage";

// Motion tokens: modal + scrim share one clock (see charles-ux-animation timing table)
const EASE_OUT = [0.32, 0.72, 0, 1] as const;
const EASE_IN = [0.55, 0, 1, 0.45] as const;
const ENTER_S = 0.26;
const EXIT_S = 0.18;

type VaultProblem = "missing" | "busy" | "offline";

interface ProblemCopy {
  icon: LucideIcon;
  title: string;
  body: string;
}

// Warm, specific, and always says what happens next
const PROBLEM_COPY: Record<VaultProblem, ProblemCopy> = {
  missing: {
    icon: Clapperboard,
    title: "This reel went missing",
    body: "TMDB isn’t listing this franchise right now. The vault checks again on its own, so it should be back soon.",
  },
  busy: {
    icon: Hourglass,
    title: "Quick intermission",
    body: "TMDB is a little busy at the moment. Give it a few seconds and try again.",
  },
  offline: {
    icon: WifiOff,
    title: "The film snapped",
    body: "The connection dropped mid-reel. Let’s thread it back in.",
  },
};

function classifyProblem(err: unknown): VaultProblem {
  const message = err instanceof Error ? err.message : "";
  if (/not found/i.test(message)) {
    return "missing";
  }
  if (/too many/i.test(message)) {
    return "busy";
  }
  return "offline";
}

interface CollectionModalProps {
  collectionId: number | null;
  /** Kept mounted but out of view while a film opened from it is on top. */
  hidden?: boolean;
  onClose: () => void;
  onMovieClick: (movie: TMDBMovie) => void;
}

export default function CollectionModal({ collectionId, hidden = false, onClose, onMovieClick }: CollectionModalProps) {
  const reduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const isOpen = collectionId !== null;

  // Remember what opened the vault, move focus to Close, and hand focus back on close.
  // (Done here rather than with autoFocus, which would fire before we record the opener.)
  useEffect(() => {
    if (isOpen) {
      openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      panelRef.current?.querySelector<HTMLElement>("[data-vault-close]")?.focus();
      return;
    }
    openerRef.current?.focus?.();
    openerRef.current = null;
  }, [isOpen]);

  // Lock page scroll while open. On close, release it unless some *other* dialog is
  // still up. This one stays mounted for its exit animation, so it must not count.
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    document.body.style.overflow = "hidden";
    return () => {
      window.setTimeout(() => {
        if (!document.querySelector('[role="dialog"]:not([data-franchise-vault])')) {
          document.body.style.overflow = "";
        }
      }, 10);
    };
  }, [isOpen]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== "Tab" || !panelRef.current) {
      return;
    }
    // Keep Tab inside the vault
    const focusables = panelRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
    );
    if (!focusables.length) {
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const enter = { duration: reduceMotion ? 0 : ENTER_S, ease: EASE_OUT };
  const exit = { duration: reduceMotion ? 0 : EXIT_S, ease: EASE_IN };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          key="franchise-vault"
          data-franchise-vault=""
          role="dialog"
          aria-modal="true"
          aria-labelledby="vault-title"
          onKeyDown={onKeyDown}
          className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center sm:p-6"
          style={hidden ? { display: "none" } : undefined}
        >
          <motion.div
            aria-hidden
            className="absolute inset-0 bg-[#020817]/70 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: enter }}
            exit={{ opacity: 0, transition: exit }}
          />
          <motion.div
            ref={panelRef}
            className="relative flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-[#050F2E] shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:rounded-2xl"
            initial={{ opacity: 0, y: reduceMotion ? 0 : 16, scale: reduceMotion ? 1 : 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: enter }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : 8, scale: reduceMotion ? 1 : 0.98, transition: exit }}
          >
            <VaultContent key={collectionId} collectionId={collectionId} onClose={onClose} onMovieClick={onMovieClick} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

interface VaultContentProps {
  collectionId: number;
  onClose: () => void;
  onMovieClick: (movie: TMDBMovie) => void;
}

function VaultContent({ collectionId, onClose, onMovieClick }: VaultContentProps) {
  const { isWatched, toggleWatched } = useMovieLists();
  // The synced snapshot, live from Convex (undefined = loading, null = not synced yet)
  const snapshot = useQuery(api.franchises.getSnapshot, { collectionId });
  const [live, setLive] = useState<TMDBCollectionDetail | null>(null);
  const [problem, setProblem] = useState<VaultProblem | null>(null);
  const [attempt, setAttempt] = useState(0);

  // Only for franchises the sync hasn't reached yet: build it live through the API
  useEffect(() => {
    if (snapshot !== null) {
      return;
    }
    let cancelled = false;
    fetchCollectionDetail(collectionId)
      .then((data) => {
        if (!cancelled) {
          setLive(data);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setProblem(classifyProblem(err));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [snapshot, collectionId, attempt]);

  const retry = () => {
    setProblem(null);
    setAttempt((n) => n + 1);
  };

  const collection: TMDBCollectionDetail | null = snapshot ?? live;
  const parts = collection?.parts ?? [];
  const total = parts.length;
  const watched = parts.reduce((n, p) => n + (isWatched(p.id) ? 1 : 0), 0);
  const ratio = total ? watched / total : 0;
  const complete = total > 0 && watched === total;
  const loading = !collection && !problem;

  return (
    <>
      {/* Header: the franchise's own backdrop, fading into the panel */}
      <div className="relative h-44 shrink-0 sm:h-60">
        {collection?.backdrop_path && (
          <Image
            src={backdropUrl(collection.backdrop_path, "large")}
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 1024px, 100vw"
            // The header is a wide strip; anchor the crop above centre where faces and titles sit
            className="object-cover object-[center_30%]"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050F2E] via-[#050F2E]/70 to-[#050F2E]/10" />

        <button
          type="button"
          onClick={onClose}
          data-vault-close=""
          aria-label="Close vault"
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-[#020817]/60 text-slate-200 backdrop-blur-md transition-colors duration-150 hover:bg-[#020817]/85 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA] active:scale-[0.96]"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>

        <div className="absolute inset-x-5 bottom-4 sm:inset-x-8 sm:bottom-6">
          {collection ? (
            <h2 id="vault-title" className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {franchiseTitle(collection.name)}
            </h2>
          ) : (
            <h2 id="vault-title" className="sr-only">Loading franchise</h2>
          )}
          {loading && <div className="h-8 w-56 animate-pulse rounded-md bg-white/[0.08] motion-reduce:animate-none" aria-hidden />}

          {total > 0 && (
            <div className="mt-3 flex items-center gap-3">
              <div
                className="h-1 min-w-0 max-w-[220px] flex-1 overflow-hidden rounded-full bg-white/10"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={total}
                aria-valuenow={watched}
                aria-label="Watched in this franchise"
              >
                <div
                  className={`h-full origin-left rounded-full transition-transform duration-300 ease-[cubic-bezier(0.77,0,0.175,1)] motion-reduce:transition-none ${complete ? "bg-[#F97316]" : "bg-[#60A5FA]"}`}
                  style={{ transform: `scaleX(${ratio})` }}
                />
              </div>
              <span className={`shrink-0 whitespace-nowrap text-sm tabular-nums ${complete ? "text-[#FDBA74]" : "text-slate-300"}`}>
                {complete ? `All ${total} watched` : `${watched} of ${total} watched`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="glass-modal-scrollbar flex-1 overflow-y-auto overscroll-contain px-5 pb-8 pt-2 sm:px-8">
        {problem ? (
          <StatusMessage
            icon={PROBLEM_COPY[problem].icon}
            tone="alert"
            className="py-14"
            title={PROBLEM_COPY[problem].title}
            body={PROBLEM_COPY[problem].body}
            actions={
              <button type="button" onClick={retry} className={STATUS_PRIMARY_BUTTON}>
                Try again
              </button>
            }
          />
        ) : loading ? (
          <div className="grid grid-cols-3 gap-x-4 gap-y-6 pt-4 sm:grid-cols-4 lg:grid-cols-5" aria-hidden>
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i}>
                <div className="aspect-[2/3] animate-pulse rounded-lg bg-white/[0.05] motion-reduce:animate-none" />
                <div className="mt-2 h-3 w-3/4 rounded bg-white/[0.05]" />
              </div>
            ))}
          </div>
        ) : total === 0 ? (
          <StatusMessage
            icon={Popcorn}
            className="py-14"
            title="An empty reel, for now"
            body="No films here yet. New releases join this vault on their own."
          />
        ) : (
          <>
            {collection?.overview ? <AboutSaga text={collection.overview} /> : null}
            <ol className="mt-6 grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-4 lg:grid-cols-5">
              {parts.map((movie, idx) => {
                const newEra = movie.custom_era && (idx === 0 || movie.custom_era !== parts[idx - 1].custom_era);
                return (
                  <FilmTile
                    key={movie.id}
                    movie={movie}
                    era={newEra ? movie.custom_era : undefined}
                    watched={isWatched(movie.id)}
                    onOpen={() => onMovieClick(movie)}
                    onToggleWatched={() => toggleWatched(movie)}
                  />
                );
              })}
            </ol>
          </>
        )}
      </div>
    </>
  );
}

interface FilmTileProps {
  movie: TMDBMovie;
  /** Era heading to show before this film (Spider-Man style franchises). */
  era?: string;
  watched: boolean;
  onOpen: () => void;
  onToggleWatched: () => void;
}

function FilmTile({ movie, era, watched, onOpen, onToggleWatched }: FilmTileProps) {
  const [broken, setBroken] = useState(false);
  const year = movie.release_date?.slice(0, 4) || "TBA";
  const upcoming = Boolean(movie.release_date) && movie.release_date > new Date().toISOString().slice(0, 10);

  return (
    <>
      {era && (
        <li className="col-span-full pt-4 text-sm font-medium text-slate-300 first:pt-0" aria-hidden>
          {era}
        </li>
      )}
      <li className="group relative">
        <button
          type="button"
          onClick={onOpen}
          className="block w-full rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050F2E]"
        >
          <div className="relative aspect-[2/3] overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]">
            {movie.poster_path && !broken ? (
              <Image
                src={posterUrl(movie.poster_path, "medium")}
                alt=""
                fill
                sizes="(min-width: 1024px) 180px, (min-width: 640px) 22vw, 30vw"
                onError={() => setBroken(true)}
                // Completion as light: unwatched films sit in the dark until you've seen them
                className={`object-cover transition-[filter] duration-300 ease-out motion-reduce:transition-none ${
                  watched ? "" : "brightness-[0.5] saturate-[0.55] [@media(hover:hover)]:group-hover:brightness-[0.8]"
                }`}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Film className="h-5 w-5 text-slate-600" strokeWidth={1.5} aria-hidden />
              </div>
            )}
          </div>
          <p className={`mt-2 line-clamp-1 text-[13px] font-medium ${watched ? "text-slate-100" : "text-slate-300"}`}>
            {movie.title}
          </p>
          <p className="mt-0.5 flex items-center justify-between gap-2 text-[12px] tabular-nums text-slate-500">
            <span>{upcoming ? `Coming ${year}` : year}</span>
            {movie.vote_average > 0 && (
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-current" aria-hidden />
                {movie.vote_average.toFixed(1)}
              </span>
            )}
          </p>
        </button>

        {!upcoming && (
          <button
            type="button"
            onClick={onToggleWatched}
            aria-pressed={watched}
            aria-label={watched ? `Unmark ${movie.title} as watched` : `Mark ${movie.title} as watched`}
            title={watched ? "Watched" : "Mark as watched"}
            className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-none [&:focus-visible>span]:ring-2 [&:focus-visible>span]:ring-white"
          >
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full transition-[background-color,border-color,color,transform] duration-150 ease-out active:scale-[0.9] ${
                watched
                  ? "border border-[#60A5FA] bg-[#60A5FA] text-[#020817]"
                  : "border border-white/25 bg-[#020817]/60 text-white/70 backdrop-blur-sm hover:border-white/50 hover:text-white"
              }`}
            >
              <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
            </span>
          </button>
        )}
      </li>
    </>
  );
}

interface AboutSagaProps {
  text: string;
}

/**
 * The franchise overview, folded away so the posters lead. Opens with the grid-rows
 * expander (height animates without measuring), 250ms ease-in-out; instant under
 * reduced motion.
 */
function AboutSaga({ text }: AboutSagaProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="max-w-2xl">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="vault-about"
        className="-ml-2 flex h-10 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-slate-300 transition-colors duration-150 hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA]"
      >
        About this saga
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ease-out motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      <div
        id="vault-about"
        className={`grid transition-[grid-template-rows] duration-[250ms] ease-[cubic-bezier(0.77,0,0.175,1)] motion-reduce:transition-none ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden" inert={!open}>
          <p className="pb-2 pt-1 text-sm leading-relaxed text-slate-400">{text}</p>
        </div>
      </div>
    </div>
  );
}
