"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bookmark, Check, CircleCheck, Heart, Link as LinkIcon, MoreHorizontal, X } from "lucide-react";

/*
 * Movie sheet action bar — one glass pill so the icons stay legible over any backdrop.
 *
 * Storyboard (open):
 *   0ms    ⋯ rotates 90°, pill grows to fit (spring, no bounce)
 *   0ms    nearest action appears; each further one +30ms (scale .6 → 1, fade)
 * Toggle on:  icon swaps in from scale .3 with a small spring bounce (physical, playful)
 *             Like also throws a one-shot ring (secondary action, ~400ms)
 * Toggle off: icon swaps back with no bounce — undoing shouldn't celebrate
 * Press:      whole button squishes to .88 (whileTap)
 */
const SPRING = { type: "spring", duration: 0.35, bounce: 0 } as const;
const SPRING_POP = { type: "spring", duration: 0.45, bounce: 0.3 } as const;
const EXIT = { duration: 0.12, ease: [0.55, 0, 1, 0.45] } as const;
const STAGGER_S = 0.03;
const FEEDBACK_MS = 1800;

interface MovieActionBarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  liked: boolean;
  inWatchlist: boolean;
  watched: boolean;
  onToggleLike: () => void;
  onToggleWatchlist: () => void;
  onToggleWatched: () => void;
  /** Resolves true when the link reached the clipboard. */
  onCopyLink: () => Promise<boolean>;
  onClose: () => void;
}

type ShareState = "idle" | "copied" | "failed";

export default function MovieActionBar(props: MovieActionBarProps) {
  const { open, onOpenChange, liked, inWatchlist, watched, onToggleLike, onToggleWatchlist, onToggleWatched, onCopyLink, onClose } = props;
  const reduce = useReducedMotion() ?? false;
  const [share, setShare] = useState<{ state: ShareState; at: number }>({ state: "idle", at: 0 });
  const [likeBurst, setLikeBurst] = useState(0);

  // Feedback clears itself; copying again restarts the clock
  useEffect(() => {
    if (share.state === "idle") {
      return;
    }
    const timer = window.setTimeout(() => setShare({ state: "idle", at: 0 }), FEEDBACK_MS);
    return () => window.clearTimeout(timer);
  }, [share]);

  const copy = async () => {
    const ok = await onCopyLink();
    setShare({ state: ok ? "copied" : "failed", at: Date.now() });
  };
  const shareState = share.state;

  const like = () => {
    if (!liked) {
      setLikeBurst((n) => n + 1);
    }
    onToggleLike();
  };

  // Right-to-left reading order matches how they fan out of the ⋯ button
  const actions: ActionSpec[] = [
    {
      key: "share",
      label: shareState === "copied" ? "Link copied" : shareState === "failed" ? "Couldn’t copy" : "Copy link",
      pinnedLabel: shareState !== "idle",
      active: shareState === "copied",
      tone: "text-[#FDBA74]",
      icon: shareState === "copied" ? <Check className="h-[18px] w-[18px]" strokeWidth={2.5} /> : <LinkIcon className="h-[18px] w-[18px]" strokeWidth={2.25} />,
      iconKey: shareState,
      onClick: copy,
    },
    {
      key: "watched",
      label: watched ? "Watched" : "Mark watched",
      pressed: watched,
      active: watched,
      tone: "text-[#60A5FA]",
      icon: <CircleCheck className="h-[18px] w-[18px]" strokeWidth={2.25} fill={watched ? "currentColor" : "none"} stroke={watched ? "#020817" : "currentColor"} />,
      iconKey: String(watched),
      onClick: onToggleWatched,
    },
    {
      key: "watchlist",
      label: inWatchlist ? "In watchlist" : "Add to watchlist",
      pressed: inWatchlist,
      active: inWatchlist,
      tone: "text-[#60A5FA]",
      icon: <Bookmark className="h-[18px] w-[18px]" strokeWidth={2.25} fill={inWatchlist ? "currentColor" : "none"} />,
      iconKey: String(inWatchlist),
      onClick: onToggleWatchlist,
    },
    {
      key: "like",
      label: liked ? "Liked" : "Like",
      pressed: liked,
      active: liked,
      tone: "text-[#FB7185]",
      icon: <Heart className="h-[18px] w-[18px]" strokeWidth={2.25} fill={liked ? "currentColor" : "none"} />,
      iconKey: String(liked),
      onClick: like,
      burst: likeBurst,
    },
  ];

  return (
    <div className="flex items-center gap-2">
      <motion.div
        layout
        transition={reduce ? { duration: 0 } : SPRING}
        className="flex items-center rounded-full border border-white/10 bg-[#020817]/60 p-1 shadow-[0_8px_24px_rgba(2,8,23,0.45)] backdrop-blur-md"
        role="toolbar"
        aria-label="Film actions"
      >
        <AnimatePresence initial={false} mode="popLayout">
          {open &&
            actions.map((a, i) => (
              <motion.div
                key={a.key}
                layout
                initial={{ opacity: 0, scale: reduce ? 1 : 0.6 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  transition: reduce ? { duration: 0 } : { ...SPRING, delay: (actions.length - 1 - i) * STAGGER_S },
                }}
                exit={{ opacity: 0, scale: reduce ? 1 : 0.6, transition: reduce ? { duration: 0 } : EXIT }}
              >
                <ActionButton spec={a} reduce={reduce} />
              </motion.div>
            ))}
        </AnimatePresence>

        <motion.button
          layout
          type="button"
          onClick={(e) => { e.stopPropagation(); onOpenChange(!open); }}
          aria-expanded={open}
          aria-label={open ? "Hide film actions" : "Show film actions"}
          whileTap={reduce ? undefined : { scale: 0.88 }}
          className={`flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA] [@media(hover:hover)]:hover:bg-white/10 ${open ? "bg-white/10" : ""}`}
        >
          <motion.span animate={{ rotate: open ? 90 : 0 }} transition={reduce ? { duration: 0 } : SPRING} className="flex">
            <MoreHorizontal className="h-[18px] w-[18px]" strokeWidth={2.5} aria-hidden />
          </motion.span>
        </motion.button>
      </motion.div>

      <motion.button
        type="button"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        aria-label="Close"
        whileTap={reduce ? undefined : { scale: 0.88 }}
        className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-[#020817]/60 text-white shadow-[0_8px_24px_rgba(2,8,23,0.45)] backdrop-blur-md transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA] [@media(hover:hover)]:hover:bg-[#020817]/85"
      >
        <X className="h-5 w-5" strokeWidth={2.5} aria-hidden />
      </motion.button>
    </div>
  );
}

interface ActionSpec {
  key: string;
  label: string;
  /** Keep the label showing (e.g. "Link copied") even without hover. */
  pinnedLabel?: boolean;
  pressed?: boolean;
  active: boolean;
  tone: string;
  icon: ReactNode;
  iconKey: string;
  onClick: () => void;
  burst?: number;
}

function ActionButton({ spec, reduce }: { spec: ActionSpec; reduce: boolean }) {
  const { label, pinnedLabel, pressed, active, tone, icon, iconKey, onClick, burst } = spec;
  return (
    <div className="group/action relative">
      <motion.button
        type="button"
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        aria-label={label}
        aria-pressed={pressed}
        whileTap={reduce ? undefined : { scale: 0.88 }}
        className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA] [@media(hover:hover)]:hover:bg-white/10 ${active ? tone : "text-white"}`}
      >
        {/* One-shot ring when Like turns on */}
        {!reduce && burst ? (
          <motion.span
            key={burst}
            aria-hidden
            className="pointer-events-none absolute inset-1 rounded-full border-2 border-current"
            initial={{ scale: 0.6, opacity: 0.7 }}
            animate={{ scale: 1.6, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
          />
        ) : null}

        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={iconKey}
            className="flex"
            aria-hidden
            initial={reduce ? false : { scale: 0.3, opacity: 0, filter: "blur(3px)" }}
            animate={{ scale: 1, opacity: 1, filter: "blur(0px)", transition: reduce ? { duration: 0 } : active ? SPRING_POP : SPRING }}
            exit={{ scale: 0.3, opacity: 0, filter: "blur(3px)", transition: reduce ? { duration: 0 } : EXIT }}
          >
            {icon}
          </motion.span>
        </AnimatePresence>
      </motion.button>

      {/* Label: shows on real hover or keyboard focus, or pinned for feedback */}
      <span
        role={pinnedLabel ? "status" : undefined}
        className={`pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-[#020817]/90 px-2 py-1 text-xs font-medium text-slate-100 backdrop-blur-md transition-[opacity,transform] duration-150 ease-out motion-reduce:transition-none ${
          pinnedLabel
            ? "translate-y-0 opacity-100"
            : "-translate-y-1 opacity-0 [@media(hover:hover)]:group-hover/action:translate-y-0 [@media(hover:hover)]:group-hover/action:opacity-100 group-has-[:focus-visible]/action:translate-y-0 group-has-[:focus-visible]/action:opacity-100"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
