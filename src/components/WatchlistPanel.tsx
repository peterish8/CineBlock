"use client";

import { useState, useEffect, useLayoutEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Bookmark, CheckCheck, CheckCircle, Film, Heart, Star, Trash2, X } from "lucide-react";
import { useMovieLists } from "@/hooks/useMovieLists";
import { lockPageScroll } from "@/lib/scrollLock";
import { TMDBMovie } from "@/lib/types";
import { posterUrl } from "@/lib/constants";

interface WatchlistPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onMovieClick: (movie: TMDBMovie) => void;
}

type TabId = "liked" | "queue" | "watched";

const TABS = [
  { id: "liked", label: "Liked", href: "/liked", icon: Heart, empty: "Nothing liked yet", hint: "Tap the heart on any poster." },
  { id: "queue", label: "Watchlist", href: "/watchlist", icon: Bookmark, empty: "Your watchlist is empty", hint: "Tap the bookmark on any poster." },
  { id: "watched", label: "Watched", href: "/watched", icon: CheckCheck, empty: "Nothing watched yet", hint: "Mark a film as watched from its card." },
] as const;

export default function WatchlistPanel({ isOpen, onClose, onMovieClick }: WatchlistPanelProps) {
  const { liked, toggleLiked, watchlist, toggleWatchlist, moveToWatched, watched } = useMovieLists();
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("liked");

  useLayoutEffect(() => {
    if (!mounted) return;
    return lockPageScroll();
  }, [mounted]);

  useEffect(() => {
    if (isOpen) {
      queueMicrotask(() => {
        setMounted(true);
        setClosing(false);
        setActiveTab(liked.length > 0 ? "liked" : watchlist.length > 0 ? "queue" : "watched");
      });
    } else if (mounted) {
      queueMicrotask(() => setClosing(true));
      const t = setTimeout(() => { setMounted(false); setClosing(false); }, 280);
      return () => clearTimeout(t);
    }
    // Only re-pick the starting tab when the panel opens, not on every list change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mounted, onClose]);

  if (!mounted) return null;

  const lists: Record<TabId, TMDBMovie[]> = { liked, queue: watchlist, watched };
  const tab = TABS.find((t) => t.id === activeTab)!;
  const activeList = lists[activeTab];
  const actionClass = "flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-colors duration-150";

  return (
    <div className="fixed inset-0 z-[90] flex justify-end">
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`absolute inset-0 transition-opacity duration-300 ${closing ? "opacity-0" : "opacity-100"}`}
        style={{ background: "rgba(2,8,23,0.45)", backdropFilter: "blur(8px) saturate(120%)", WebkitBackdropFilter: "blur(8px) saturate(120%)" }}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="lists-title"
        className={`relative flex h-full w-full flex-col overflow-hidden sm:my-3 sm:mr-3 sm:h-[calc(100%-1.5rem)] sm:max-w-md sm:rounded-[28px] ${closing ? "slide-to-right" : "slide-from-right"}`}
        style={{ background: "rgba(6,12,32,0.97)", border: "1px solid rgba(255,255,255,0.10)", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}
      >
        <header className="flex shrink-0 items-center justify-between px-5 pb-3 pt-5">
          <h2 id="lists-title" className="font-display !text-xl font-semibold text-white">My lists</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="-mr-1 flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition-colors duration-150 hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </header>

        <div className="shrink-0 px-5 pb-3">
          <div role="tablist" aria-label="Lists" className="flex rounded-full border border-white/[0.09] bg-white/[0.04] p-1">
            {TABS.map(({ id, label, icon: Icon }) => {
              const selected = id === activeTab;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveTab(id)}
                  className={`relative flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-full text-sm font-medium transition-colors duration-150 ${selected ? "text-white" : "text-slate-400 hover:text-slate-200"}`}
                >
                  {selected && (
                    <motion.span
                      layoutId="lists-tab-thumb"
                      aria-hidden="true"
                      className="absolute inset-0 rounded-full"
                      style={{ background: "rgba(96,165,250,0.18)", boxShadow: "inset 0 0 0 1px rgba(96,165,250,0.40)" }}
                      transition={reduceMotion ? { duration: 0 } : { type: "spring", duration: 0.35, bounce: 0 }}
                    />
                  )}
                  <Icon className="relative h-4 w-4" strokeWidth={2} />
                  <span className="relative">{label}</span>
                  <span className={`relative text-xs tabular-nums ${selected ? "text-blue-200" : "text-slate-500"}`}>{lists[id].length}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-3">
          {activeList.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 pb-16 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                <tab.icon className="h-6 w-6 text-slate-500" strokeWidth={1.75} />
              </span>
              <p className="font-display text-base font-semibold text-white">{tab.empty}</p>
              <p className="text-sm text-slate-400">{tab.hint}</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-1 pb-3">
              {activeList.map((movie) => {
                const title = movie.title || movie.name || "Untitled";
                const year = (movie.release_date || movie.first_air_date || "").slice(0, 4);
                const rating = movie.vote_average > 0 ? movie.vote_average.toFixed(1) : null;
                return (
                  <li key={movie.id} className="group relative flex items-center gap-3 rounded-2xl p-2 transition-colors duration-150 hover:bg-white/[0.05] focus-within:bg-white/[0.05]">
                    <span className="relative block h-[72px] w-12 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
                      {movie.poster_path ? (
                        <Image src={posterUrl(movie.poster_path, "small")} alt="" fill className="object-cover" sizes="48px" />
                      ) : (
                        <span className="absolute inset-0 flex items-center justify-center"><Film className="h-4 w-4 text-slate-600" /></span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <button type="button" onClick={() => onMovieClick(movie)} className="block w-full truncate text-left font-display text-base font-semibold text-white after:absolute after:inset-0 after:rounded-2xl after:content-['']">
                        {title}
                      </button>
                      {(year || rating) && (
                        <span className="mt-1 flex items-center gap-2 text-sm tabular-nums text-slate-400">
                          {rating && <span className="flex items-center gap-1 text-amber-300"><Star className="h-3 w-3 fill-current" />{rating}</span>}
                          {year && <span>{year}</span>}
                        </span>
                      )}
                    </span>
                    <span className="relative z-10 flex items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100">
                      {activeTab === "queue" && (
                        <button type="button" onClick={() => moveToWatched(movie)} aria-label={`Mark ${title} as watched`} title="Mark as watched" className={`${actionClass} hover:bg-emerald-400/10 hover:text-emerald-300`}>
                          <CheckCircle className="h-4 w-4" strokeWidth={2} />
                        </button>
                      )}
                      {activeTab !== "watched" && (
                        <button
                          type="button"
                          onClick={() => (activeTab === "liked" ? toggleLiked(movie) : toggleWatchlist(movie))}
                          aria-label={`Remove ${title} from ${tab.label.toLowerCase()}`}
                          title="Remove"
                          className={`${actionClass} hover:bg-rose-400/10 hover:text-rose-300`}
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={2} />
                        </button>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <footer className="shrink-0 border-t border-white/[0.08] px-5 py-3">
          <Link href={tab.href} onClick={onClose} className="group flex min-h-10 items-center justify-between rounded-xl px-3 text-sm font-medium text-slate-300 transition-colors duration-150 hover:bg-white/[0.06] hover:text-white">
            See all {tab.label.toLowerCase()}
            <ArrowRight className="h-4 w-4 text-slate-500 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-white" />
          </Link>
        </footer>
      </aside>
    </div>
  );
}
