"use client";

import { useState, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { X, Check, Heart, Bookmark, Eye, Ban, SkipForward, Sparkles, ListVideo } from "lucide-react";
import { SessionSwipe } from "@/hooks/useCineSwipeEngine";
import { useToast } from "@/components/ToastProvider";
import { useThemeMode } from "@/hooks/useThemeMode";
import Image from "next/image";
import { posterUrl } from "@/lib/constants";
import { motion, AnimatePresence } from "framer-motion";

// ── Category config ──────────────────────────────────────────────
type Action = "liked" | "watchlist" | "watched" | "block" | "skip";

const CATEGORIES: {
  id: Action;
  label: string;
  icon: React.ElementType;
  glassColor: string;
  glassBorder: string;
  glassGlow: string;
  brutalColor: string;
}[] = [
  {
    id: "liked",
    label: "Liked",
    icon: Heart,
    glassColor: "rgba(244,63,94,0.18)",
    glassBorder: "rgba(244,63,94,0.50)",
    glassGlow: "rgba(244,63,94,0.35)",
    brutalColor: "text-brutal-red border-brutal-red",
  },
  {
    id: "watchlist",
    label: "Watchlist",
    icon: Bookmark,
    glassColor: "rgba(52,211,153,0.16)",
    glassBorder: "rgba(52,211,153,0.45)",
    glassGlow: "rgba(52,211,153,0.30)",
    brutalColor: "text-brutal-lime border-brutal-lime",
  },
  {
    id: "watched",
    label: "Watched",
    icon: Eye,
    glassColor: "rgba(34,211,238,0.16)",
    glassBorder: "rgba(34,211,238,0.45)",
    glassGlow: "rgba(34,211,238,0.30)",
    brutalColor: "text-brutal-cyan border-brutal-cyan",
  },
  {
    id: "block",
    label: "Cineblock (Playlist)",
    icon: ListVideo,
    glassColor: "rgba(167,139,250,0.16)",
    glassBorder: "rgba(167,139,250,0.45)",
    glassGlow: "rgba(167,139,250,0.30)",
    brutalColor: "text-brutal-violet border-brutal-violet",
  },
  {
    id: "skip",
    label: "Skip",
    icon: SkipForward,
    glassColor: "rgba(100,116,139,0.14)",
    glassBorder: "rgba(100,116,139,0.35)",
    glassGlow: "rgba(100,116,139,0.20)",
    brutalColor: "text-brutal-dim border-brutal-dim",
  },
];

interface CineSwipeEngine {
  sessionSwipes: SessionSwipe[];
  setIsReviewing: (v: boolean) => void;
}

export default function SwipeSummaryScreen({ engine }: { engine: CineSwipeEngine }) {
  const isGlass = useThemeMode() === "glass";
  const [isCommiting, setIsCommiting] = useState(false);
  const recordSwipeBatch = useMutation(api.cineswipe.recordSwipeBatch);
  const router = useRouter();
  const { pushToast } = useToast();

  // Local mutable copy of swipes so user can drag-reassign
  const [swipes, setSwipes] = useState<SessionSwipe[]>(() => engine.sessionSwipes);

  // Drag state
  const draggingMovie = useRef<{ swipe: SessionSwipe; fromAction: Action } | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [overBucket, setOverBucket] = useState<Action | null>(null);

  // ── Memoized Buckets ──
  const buckets = useMemo(() => {
    const b: Record<Action, SessionSwipe[]> = {
      liked: [], watchlist: [], watched: [], block: [], skip: []
    };
    swipes.forEach(s => {
      if (b[s.action]) b[s.action].push(s);
    });
    return b;
  }, [swipes]);

  // Drag handlers (HTML5 DnD)
  const onDragStart = useCallback((swipe: SessionSwipe, fromAction: Action) => {
    draggingMovie.current = { swipe, fromAction };
    setDraggingId(swipe.movie.id);
  }, []);

  const onDragEnd = useCallback(() => {
    setDraggingId(null);
    setOverBucket(null);
    draggingMovie.current = null;
  }, []);

  const onDragOverBucket = useCallback((e: React.DragEvent, action: Action) => {
    e.preventDefault();
    setOverBucket(action);
  }, []);

  const onDropBucket = useCallback((e: React.DragEvent, toAction: Action) => {
    e.preventDefault();
    if (!draggingMovie.current) return;
    const { swipe } = draggingMovie.current;
    if (swipe.action === toAction) return;
    setSwipes((prev) =>
      prev.map((s) =>
        s.movie.id === swipe.movie.id ? { ...s, action: toAction } : s
      )
    );
    setOverBucket(null);
    draggingMovie.current = null;
    setDraggingId(null);
  }, []);

  const handleConfirm = useCallback(async () => {
    setIsCommiting(true);
    try {
      const payload = swipes.map((s: SessionSwipe) => ({
        movieId: s.movie.id,
        movieTitle: s.movie.title,
        posterPath: s.movie.poster_path || "",
        genreIds: s.movie.genre_ids || [],
        action: s.action,
      }));
      await recordSwipeBatch({ swipes: payload });
      pushToast("success", "Session saved! 🍿");
      router.push("/");
    } catch (e: any) {
      pushToast("error", e.message || "Failed to save session");
      setIsCommiting(false);
    }
  }, [swipes, recordSwipeBatch, pushToast, router]);

  const total = swipes.length;

  return (
    <div
      className="mx-auto flex h-[100dvh] w-full max-w-[460px] md:max-w-[720px] lg:max-w-[1100px] xl:max-w-[1280px] flex-col overflow-hidden"
      style={isGlass ? { background: "#020817" } : undefined}
    >
      {/* ── Header ── */}
      <div
        className={`flex items-center justify-between px-5 lg:px-10 py-3 lg:py-4 shrink-0 ${
          isGlass ? "" : "border-b-2 border-brutal-border"
        }`}
        style={
          isGlass
            ? {
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(2,10,30,0.85)",
                backdropFilter: "blur(20px)",
              }
            : undefined
        }
      >
        <div>
          <h1
            className={`text-xl lg:text-3xl font-black uppercase tracking-wider ${
              isGlass ? "text-white font-display" : "font-outfit"
            }`}
          >
            Session Review
          </h1>
          <p
            className={`text-[10px] lg:text-xs font-bold uppercase tracking-widest mt-0.5 lg:mt-1 ${
              isGlass ? "text-slate-500" : "font-mono text-text-muted"
            }`}
          >
            {total} movies · drag cards between buckets to reassign
          </p>
        </div>
        <button
          onClick={() => engine.setIsReviewing(false)}
          disabled={isCommiting}
          title="Back to Swiping"
          className={`flex items-center justify-center w-9 h-9 lg:w-10 lg:h-10 transition-colors ${
            isGlass ? "rounded-xl hover:bg-white/10" : "brutal-btn border-2 border-transparent hover:border-brutal-border hover:bg-surface-2"
          }`}
          style={
            isGlass
              ? { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(148,163,184,0.8)" }
              : undefined
          }
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-10 py-4 lg:py-6 flex flex-col gap-4 lg:gap-5 [&::-webkit-scrollbar]:hidden">

        {/* ── Top 4 buckets: 4-col on desktop ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {CATEGORIES.filter(c => c.id !== "skip").map((cat) => {
            const movies = buckets[cat.id];
            const isOver = overBucket === cat.id;
            const Icon = cat.icon;

            return (
              <div
                key={cat.id}
                onDragOver={(e) => onDragOverBucket(e, cat.id)}
                onDragLeave={() => setOverBucket(null)}
                onDrop={(e) => onDropBucket(e, cat.id)}
                className="flex flex-col transition-all duration-150"
                style={
                  isGlass
                    ? {
                        background: isOver ? cat.glassColor : "rgba(255,255,255,0.03)",
                        border: `1px solid ${isOver ? cat.glassBorder : "rgba(255,255,255,0.07)"}`,
                        borderRadius: "18px",
                        boxShadow: isOver ? `0 0 24px ${cat.glassGlow}` : "none",
                        padding: "14px",
                        minHeight: "160px",
                        transition: "all 0.15s ease",
                      }
                    : {
                        border: isOver ? `2px dashed currentColor` : "2px dashed rgba(100,100,100,0.2)",
                        padding: "10px",
                        borderRadius: "8px",
                        minHeight: "160px",
                      }
                }
              >
                {/* Bucket header */}
                <div className="flex items-center gap-2 mb-3">
                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 ${isGlass ? "" : cat.brutalColor.split(" ")[0]}`}
                    style={isGlass ? { color: cat.glassBorder } : undefined}
                    strokeWidth={2.5}
                  />
                  <span
                    className={`text-[10px] lg:text-[11px] font-black uppercase tracking-widest leading-tight ${
                      isGlass ? "" : cat.brutalColor.split(" ")[0]
                    }`}
                    style={isGlass ? { color: cat.glassBorder } : undefined}
                  >
                    {cat.label}
                  </span>
                  <span
                    className={`text-[10px] font-bold ml-auto ${
                      isGlass ? "text-slate-600" : "font-mono text-brutal-dim"
                    }`}
                  >
                    {movies.length}
                  </span>
                </div>

                {/* Poster area */}
                {movies.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    <AnimatePresence>
                      {movies.map((s) => (
                        <motion.div
                          key={s.movie.id}
                          layout
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: draggingId === s.movie.id ? 0.35 : 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.18 }}
                          draggable
                          onDragStart={() => onDragStart(s, cat.id)}
                          onDragEnd={onDragEnd}
                          className="relative shrink-0 cursor-grab active:cursor-grabbing"
                          style={
                            isGlass
                              ? {
                                  width: 76,
                                  height: 114,
                                  borderRadius: "10px",
                                  overflow: "hidden",
                                  border: `1px solid ${cat.glassBorder}`,
                                  boxShadow: `0 4px 16px rgba(0,0,0,0.45)`,
                                }
                              : {
                                  width: 76,
                                  height: 114,
                                  border: `2px solid currentColor`,
                                  overflow: "hidden",
                                  borderRadius: "4px",
                                }
                          }
                        >
                          {s.movie.poster_path ? (
                            <Image
                              src={posterUrl(s.movie.poster_path, "small")}
                              alt={s.movie.title}
                              fill
                              className="object-cover pointer-events-none"
                              sizes="76px"
                              draggable={false}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center p-1 text-center text-[8px] font-bold uppercase text-slate-500 break-words">
                              {s.movie.title}
                            </div>
                          )}
                          <div
                            className="absolute bottom-0 left-0 right-0 h-5 flex items-center justify-center"
                            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75), transparent)" }}
                          >
                            <div className="flex gap-0.5">
                              {[0,1,2].map(i => (
                                <div key={i} className="w-0.5 h-1.5 rounded-full bg-white/40" />
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div
                    className="flex-1 flex items-center justify-center rounded-xl"
                    style={
                      isGlass
                        ? { background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.07)" }
                        : { border: "2px dashed rgba(100,100,100,0.2)" }
                    }
                  >
                    <span className={`text-[9px] uppercase tracking-widest ${isGlass ? "text-slate-700" : "font-mono text-brutal-dim/40"}`}>
                      {isOver ? "Drop here" : "Empty"}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Skip bucket: full-width with wrapping grid ── */}
        {(() => {
          const cat = CATEGORIES.find(c => c.id === "skip")!;
          const movies = buckets["skip"];
          const isOver = overBucket === "skip";
          const Icon = cat.icon;

          return (
            <div
              onDragOver={(e) => onDragOverBucket(e, "skip")}
              onDragLeave={() => setOverBucket(null)}
              onDrop={(e) => onDropBucket(e, "skip")}
              className="transition-all duration-150"
              style={
                isGlass
                  ? {
                      background: isOver ? cat.glassColor : "rgba(255,255,255,0.03)",
                      border: `1px solid ${isOver ? cat.glassBorder : "rgba(255,255,255,0.07)"}`,
                      borderRadius: "18px",
                      boxShadow: isOver ? `0 0 24px ${cat.glassGlow}` : "none",
                      padding: "14px",
                      transition: "all 0.15s ease",
                    }
                  : {
                      border: isOver ? `2px dashed currentColor` : "2px dashed rgba(100,100,100,0.2)",
                      padding: "10px",
                      borderRadius: "8px",
                    }
              }
            >
              <div className="flex items-center gap-2 mb-3">
                <Icon
                  className={`w-3.5 h-3.5 shrink-0 ${isGlass ? "" : cat.brutalColor.split(" ")[0]}`}
                  style={isGlass ? { color: cat.glassBorder } : undefined}
                  strokeWidth={2.5}
                />
                <span
                  className={`text-[10px] lg:text-[11px] font-black uppercase tracking-widest ${
                    isGlass ? "" : cat.brutalColor.split(" ")[0]
                  }`}
                  style={isGlass ? { color: cat.glassBorder } : undefined}
                >
                  {cat.label}
                </span>
                <span
                  className={`text-[10px] font-bold ml-2 ${isGlass ? "text-slate-600" : "font-mono text-brutal-dim"}`}
                >
                  {movies.length}
                </span>
                {isOver && movies.length > 0 && (
                  <span className="text-[9px] uppercase tracking-widest ml-auto animate-pulse" style={{ color: cat.glassBorder }}>
                    Drop here
                  </span>
                )}
              </div>

              {movies.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  <AnimatePresence>
                    {movies.map((s) => (
                      <motion.div
                        key={s.movie.id}
                        layout
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: draggingId === s.movie.id ? 0.35 : 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.18 }}
                        draggable
                        onDragStart={() => onDragStart(s, cat.id)}
                        onDragEnd={onDragEnd}
                        className="relative shrink-0 cursor-grab active:cursor-grabbing"
                        style={
                          isGlass
                            ? {
                                width: 72,
                                height: 108,
                                borderRadius: "10px",
                                overflow: "hidden",
                                border: `1px solid ${cat.glassBorder}`,
                                boxShadow: `0 3px 12px rgba(0,0,0,0.4)`,
                              }
                            : {
                                width: 72,
                                height: 108,
                                border: `2px solid currentColor`,
                                overflow: "hidden",
                                borderRadius: "4px",
                              }
                        }
                      >
                        {s.movie.poster_path ? (
                          <Image
                            src={posterUrl(s.movie.poster_path, "small")}
                            alt={s.movie.title}
                            fill
                            className="object-cover pointer-events-none"
                            sizes="72px"
                            draggable={false}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center p-1 text-center text-[8px] font-bold uppercase text-slate-500 break-words">
                            {s.movie.title}
                          </div>
                        )}
                        <div
                          className="absolute bottom-0 left-0 right-0 h-5 flex items-center justify-center"
                          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75), transparent)" }}
                        >
                          <div className="flex gap-0.5">
                            {[0,1,2].map(i => (
                              <div key={i} className="w-0.5 h-1.5 rounded-full bg-white/40" />
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div
                  className="flex items-center justify-center h-12 rounded-xl"
                  style={
                    isGlass
                      ? { background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.07)" }
                      : { border: "2px dashed rgba(100,100,100,0.2)" }
                  }
                >
                  <span className={`text-[9px] uppercase tracking-widest ${isGlass ? "text-slate-700" : "font-mono text-brutal-dim/40"}`}>
                    Drop movies here
                  </span>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* ── Footer: Save button ── */}
      <div
        className="shrink-0 px-4 lg:px-10 pb-6 pt-3"
        style={
          isGlass
            ? { borderTop: "1px solid rgba(255,255,255,0.07)", background: "rgba(2,10,30,0.90)", backdropFilter: "blur(20px)" }
            : { borderTop: "2px solid var(--brutal-border)", background: "var(--bg)" }
        }
      >
        <button
          onClick={handleConfirm}
          disabled={isCommiting}
          className={`relative w-full lg:max-w-sm lg:mx-auto flex h-14 items-center justify-center gap-3 overflow-hidden font-black uppercase tracking-widest text-sm transition-all duration-200 disabled:opacity-50 active:scale-[0.98] ${
            isGlass ? "rounded-2xl" : "brutal-btn border-2 border-brutal-pink bg-brutal-pink text-black hover:bg-white hover:text-brutal-pink font-mono"
          }`}
          style={
            isGlass
              ? {
                  display: "flex",
                  background: isCommiting
                    ? "rgba(236,72,153,0.15)"
                    : "linear-gradient(135deg, rgba(236,72,153,0.90) 0%, rgba(168,85,247,0.85) 50%, rgba(96,165,250,0.80) 100%)",
                  border: "1px solid rgba(236,72,153,0.60)",
                  boxShadow: isCommiting
                    ? "none"
                    : "0 0 32px rgba(236,72,153,0.45), 0 0 64px rgba(168,85,247,0.25), 0 8px 24px rgba(0,0,0,0.5)",
                  color: "#fff",
                }
              : undefined
          }
        >
          {/* Animated shimmer on glass */}
          {isGlass && !isCommiting && (
            <motion.div
              className="pointer-events-none absolute inset-0"
              style={{
                background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)",
                backgroundSize: "200% 100%",
              }}
              animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
              transition={{ repeat: Infinity, duration: 2.4, ease: "linear" }}
            />
          )}
          {isCommiting ? (
            <span className="animate-pulse">Saving Session...</span>
          ) : (
            <>
              <Sparkles className="h-5 w-5" strokeWidth={2} />
              Confirm &amp; Save
            </>
          )}
        </button>
      </div>
    </div>
  );
}


