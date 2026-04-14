"use client";

import { useState, useEffect } from "react";
import { useMovieLists } from "@/hooks/useMovieLists";
import { useThemeMode } from "@/hooks/useThemeMode";
import { TMDBMovie } from "@/lib/types";
import { posterUrl } from "@/lib/constants";
import Image from "next/image";
import { Heart, Bookmark, CheckCircle, Trash2, Star, X, CheckCheck, ArrowRight } from "lucide-react";
import Link from "next/link";

interface WatchlistPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onMovieClick: (movie: TMDBMovie) => void;
}

type TabId = "liked" | "queue" | "watched";

export default function WatchlistPanel({ isOpen, onClose, onMovieClick }: WatchlistPanelProps) {
  const { liked, toggleLiked, watchlist, toggleWatchlist, moveToWatched, watched } = useMovieLists() as any;
  const theme = useThemeMode();
  const isGlass = theme === "glass";

  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("liked");
  const [hoveredTab, setHoveredTab] = useState<TabId | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      setClosing(false);
      // default to first non-empty tab
      if (liked.length > 0) setActiveTab("liked");
      else if (watchlist.length > 0) setActiveTab("queue");
      else setActiveTab("watched");
    } else if (mounted) {
      setClosing(true);
      const t = setTimeout(() => { setMounted(false); setClosing(false); }, 280);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!mounted) return null;

  const tabs: { id: TabId; label: string; href: string; icon: React.ElementType; count: number; activeColor: string; chipColor: string }[] = [
    { id: "liked",   label: "LIKED",   href: "/liked",      icon: Heart,      count: liked.length,     activeColor: isGlass ? "text-rose-400"    : "text-[var(--theme-primary)]", chipColor: isGlass ? "rgba(244,63,94,0.18)"   : "" },
    { id: "queue",   label: "QUEUE",   href: "/watchlist",  icon: Bookmark,   count: watchlist.length, activeColor: isGlass ? "text-blue-400"    : "text-brutal-lime",            chipColor: isGlass ? "rgba(96,165,250,0.18)"  : "" },
    { id: "watched", label: "WATCHED", href: "/watched",    icon: CheckCheck, count: watched.length,   activeColor: isGlass ? "text-emerald-400" : "text-brutal-cyan",            chipColor: isGlass ? "rgba(52,211,153,0.18)"  : "" },
  ];

  const activeList: TMDBMovie[] = activeTab === "liked" ? liked : activeTab === "queue" ? watchlist : watched;

  function MovieRow({ movie, actions }: { movie: TMDBMovie; actions: React.ReactNode }) {
    const year = (movie.release_date || movie.first_air_date || "").split("-")[0] || "—";
    const rawRating = movie.vote_average;
    const rating = rawRating && rawRating > 0 ? rawRating.toFixed(1) : null;
    const title = movie.title || movie.name || "";

    return (
      <div
        className={`flex gap-3 px-4 py-3 cursor-pointer group transition-colors duration-150 ${isGlass ? "hover:bg-white/5" : "hover:bg-surface"}`}
        onClick={() => onMovieClick(movie)}
      >
        <div className={`w-12 h-[68px] flex-shrink-0 overflow-hidden ${isGlass ? "rounded-lg" : "border-2 border-brutal-border bg-surface-2"}`}>
          {movie.poster_path ? (
            <Image src={posterUrl(movie.poster_path, "small")} alt={title} width={48} height={68} className="object-cover w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-brutal-dim text-[8px] font-mono">N/A</div>
          )}
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <p className={`text-sm font-bold truncate leading-tight ${isGlass ? "text-white/90" : "text-brutal-white font-display uppercase"}`}>{title}</p>
          <div className="flex items-center gap-2.5 mt-1">
            {rating ? (
              <span className="flex items-center gap-1 text-amber-400">
                <Star className="w-3 h-3 fill-current" />
                <span className="text-[10px] font-mono font-bold">{rating}</span>
              </span>
            ) : (
              <span className="text-[10px] font-mono text-white/20">—</span>
            )}
            <span className={`text-[10px] font-mono font-bold ${isGlass ? "text-white/30" : "text-brutal-dim"}`}>{year}</span>
          </div>
        </div>
        {actions}
      </div>
    );
  }

  const divider = isGlass ? "1px solid rgba(255,255,255,0.07)" : undefined;

  return (
    <div className="fixed inset-0 z-[90] flex justify-end" onClick={onClose}>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 transition-opacity duration-280 ${closing ? "opacity-0" : "opacity-100"}`}
        style={{ background: isGlass ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.7)" }}
      />

      {/* Panel */}
      <div
        className={`relative w-full sm:max-w-md h-full flex flex-col ${closing ? "slide-to-right" : "slide-from-right"} ${isGlass ? "" : "bg-bg sm:border-l-3 border-brutal-border"}`}
        style={isGlass ? {
          background: "rgba(4, 10, 30, 0.98)",
          backdropFilter: "blur(48px) saturate(200%)",
          WebkitBackdropFilter: "blur(48px) saturate(200%)",
          borderLeft: "1px solid rgba(255,255,255,0.10)",
          boxShadow: "-32px 0 80px rgba(0,0,0,0.8)",
        } : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent */}
        {isGlass && <div style={{ height: "2px", background: "linear-gradient(90deg, transparent, rgba(96,165,250,0.6), rgba(52,211,153,0.4), transparent)", flexShrink: 0 }} />}

        {/* Header */}
        <div
          className={`sticky top-0 z-10 px-5 py-4 flex items-center justify-between flex-shrink-0 ${isGlass ? "" : "bg-bg border-b-3 border-brutal-border"}`}
          style={isGlass ? { background: "rgba(4,10,30,1)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", borderBottom: divider } : undefined}
        >
          <div className="flex items-center gap-3">
            <Bookmark className={`w-5 h-5 ${isGlass ? "text-emerald-400" : "text-brutal-lime"}`} fill="currentColor" strokeWidth={2.5} />
            <h2 className={`font-bold text-lg uppercase tracking-tight ${isGlass ? "text-white" : "text-brutal-white font-display"}`}>LISTS</h2>
          </div>
          <button
            onClick={onClose}
            className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${isGlass ? "text-white/50 hover:text-white/90" : "brutal-btn p-2"}`}
            style={isGlass ? { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" } : undefined}
          >
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>

        {/* Tabs — click to switch content, hover shows → to full page */}
        <div
          className={`flex flex-shrink-0 ${isGlass ? "" : "border-b-3 border-brutal-border"}`}
          style={isGlass ? { borderBottom: divider } : undefined}
        >
          {tabs.map(({ id, label, href, icon: Icon, count, activeColor, chipColor }, i) => {
            const isActive = activeTab === id;
            const isHovered = hoveredTab === id;
            return (
              <div
                key={id}
                className="flex-1 relative"
                style={i < 2 && isGlass ? { borderRight: divider } : i < 2 ? { borderRight: "3px solid var(--color-brutal-border)" } : undefined}
                onMouseEnter={() => setHoveredTab(id)}
                onMouseLeave={() => setHoveredTab(null)}
              >
                {/* Tab button — switches content */}
                <button
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center justify-center gap-1.5 py-3 text-[10px] font-mono font-bold transition-all duration-150 ${
                    isActive ? activeColor : isGlass ? "text-white/35 hover:text-white/60" : "text-brutal-dim hover:text-brutal-white"
                  }`}
                  style={isActive && isGlass ? { background: chipColor } : undefined}
                >
                  <Icon className="w-3.5 h-3.5" strokeWidth={2.5} />
                  {label}
                  <span
                    className={`px-1.5 py-0.5 rounded text-[8px] font-bold transition-all ${
                      isActive
                        ? isGlass ? `${activeColor} bg-white/8` : "brutal-chip text-inherit border-current text-[8px] px-1"
                        : "text-white/25 bg-white/4"
                    }`}
                    style={isActive && isGlass ? { border: "1px solid currentColor", opacity: 0.7 } : isGlass ? { border: "1px solid rgba(255,255,255,0.12)" } : undefined}
                  >
                    {count}
                  </span>
                </button>

                {/* Hover arrow — navigate to full page */}
                {isHovered && (
                  <Link
                    href={href}
                    onClick={onClose}
                    className={`absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded-full transition-all ${activeColor} opacity-70 hover:opacity-100`}
                    style={isGlass ? { background: chipColor, border: "1px solid currentColor" } : undefined}
                    title={`Go to ${label} page`}
                  >
                    <ArrowRight className="w-3 h-3" strokeWidth={2.5} />
                  </Link>
                )}

                {/* Active indicator bar */}
                {isActive && (
                  <div
                    className={`absolute bottom-0 left-0 right-0 h-[2px] ${isGlass ? "" : "bg-current"}`}
                    style={isGlass ? { background: `${activeColor.includes("rose") ? "rgba(244,63,94,0.8)" : activeColor.includes("blue") ? "rgba(96,165,250,0.8)" : "rgba(52,211,153,0.8)"}` } : undefined}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Active list content */}
        <div className="flex-1 overflow-y-auto">
          {activeList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-24 px-6 text-center">
              {activeTab === "liked" && <Heart className={`w-12 h-12 mb-4 ${isGlass ? "text-white/15" : "text-brutal-dim"}`} strokeWidth={1.5} />}
              {activeTab === "queue" && <Bookmark className={`w-12 h-12 mb-4 ${isGlass ? "text-white/15" : "text-brutal-dim"}`} strokeWidth={1.5} />}
              {activeTab === "watched" && <CheckCheck className={`w-12 h-12 mb-4 ${isGlass ? "text-white/15" : "text-brutal-dim"}`} strokeWidth={1.5} />}
              <p className={`font-bold uppercase text-sm ${isGlass ? "text-white/25" : "text-brutal-muted font-display"}`}>
                {activeTab === "liked" ? "No liked movies yet" : activeTab === "queue" ? "Queue is empty" : "Nothing watched yet"}
              </p>
              <p className={`text-xs font-mono mt-2 ${isGlass ? "text-white/15" : "text-brutal-dim"}`}>
                Use the icons on any poster
              </p>
            </div>
          ) : (
            <div>
              {activeList.map((movie: TMDBMovie, idx: number) => {
                const isLast = idx === activeList.length - 1;
                return (
                  <div key={movie.id} style={!isLast ? { borderBottom: divider ?? "2px solid var(--color-brutal-border)" } : undefined}>
                    <MovieRow
                      movie={movie}
                      actions={
                        activeTab === "liked" ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleLiked(movie); }}
                            className={`self-center p-1.5 rounded-full transition-colors opacity-0 group-hover:opacity-100 ${isGlass ? "text-white/30 hover:text-rose-400 hover:bg-rose-400/10" : "text-brutal-dim hover:text-brutal-red"}`}
                          >
                            <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                          </button>
                        ) : activeTab === "queue" ? (
                          <div className="flex flex-col gap-1 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => { e.stopPropagation(); moveToWatched(movie); }}
                              className={`p-1.5 rounded-full transition-colors ${isGlass ? "text-white/30 hover:text-emerald-400 hover:bg-emerald-400/10" : "text-brutal-dim hover:text-brutal-cyan"}`}
                              title="Mark as watched"
                            >
                              <CheckCircle className="w-4 h-4" strokeWidth={2.5} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleWatchlist(movie); }}
                              className={`p-1.5 rounded-full transition-colors ${isGlass ? "text-white/30 hover:text-rose-400 hover:bg-rose-400/10" : "text-brutal-dim hover:text-brutal-red"}`}
                            >
                              <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                            </button>
                          </div>
                        ) : (
                          <span className="self-center ml-1">
                            <CheckCircle className={`w-4 h-4 ${isGlass ? "text-emerald-400" : "text-brutal-cyan fill-brutal-cyan"}`} strokeWidth={2} />
                          </span>
                        )
                      }
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
