"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LogIn, User, Bookmark, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { api } from "../../convex/_generated/api";

const SPRING = { type: "spring", stiffness: 380, damping: 32 } as const;

export default function AuthButton() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const transition = reduceMotion ? { duration: 0 } : SPRING;

  const pendingInvites = useQuery(api.blocks.getPendingInvitations, isAuthenticated ? {} : "skip");
  const inviteCount = pendingInvites?.length ?? 0;

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const [slowAuth, setSlowAuth] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => { if (isLoading) setSlowAuth(true); }, 4000);
    return () => clearTimeout(t);
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-10 w-20 animate-pulse rounded-xl bg-white/[0.06]" role="status" aria-label="Checking sign-in" />
        {slowAuth && (
          <button type="button" onClick={() => window.location.reload()} className="text-xs text-slate-400 underline-offset-4 hover:text-white hover:underline">
            Reload
          </button>
        )}
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Link
        href="/sign-in"
        className="flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3 text-sm font-medium text-slate-200 transition-colors duration-150 hover:border-white/20 hover:text-white"
      >
        <LogIn className="h-4 w-4" strokeWidth={2} />
        <span className="hidden sm:inline">Sign in</span>
      </Link>
    );
  }

  const divider = <span aria-hidden="true" className="my-2 w-px bg-white/10" />;
  const itemClass = "flex items-center gap-2 whitespace-nowrap px-3 text-sm font-medium text-slate-300 transition-colors duration-150 hover:bg-white/[0.06] hover:text-white";

  return (
    <div ref={ref} className="relative flex items-center">
      {/* The menu opens sideways out of the account control; only the chevron flips. */}
      <motion.div
        layout
        transition={transition}
        className="flex h-10 items-stretch overflow-hidden rounded-xl border border-white/10 bg-white/[0.05]"
      >
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="account-items"
              id="account-menu"
              className="flex items-stretch overflow-hidden"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "auto", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={transition}
            >
              <Link href="/profile" onClick={() => setOpen(false)} className={itemClass}>
                <User className="h-4 w-4 text-slate-400" strokeWidth={2} />
                Profile
                {inviteCount > 0 && <span className="text-xs tabular-nums text-orange-300">{inviteCount} new</span>}
              </Link>
              {divider}
              <Link href="/watchlist" onClick={() => setOpen(false)} className={itemClass}>
                <Bookmark className="h-4 w-4 text-slate-400" strokeWidth={2} />
                My lists
              </Link>
              {divider}
            </motion.div>
          )}
        </AnimatePresence>

        <Link href="/profile" aria-label="Profile" className="relative flex items-center px-2.5 text-slate-200 transition-colors duration-150 hover:bg-white/[0.06] hover:text-white">
          <User className="h-4 w-4" strokeWidth={2} />
          {inviteCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-400 px-1 text-[10px] font-semibold tabular-nums text-[#020817]">
              {inviteCount > 9 ? "9+" : inviteCount}
            </span>
          )}
        </Link>

        {divider}

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="account-menu"
          aria-label={open ? "Hide account links" : "Show account links"}
          className="flex items-center px-2 text-slate-400 transition-colors duration-150 hover:bg-white/[0.06] hover:text-white"
        >
          <motion.span className="flex" animate={{ rotate: open ? 180 : 0 }} transition={transition}>
            <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
          </motion.span>
        </button>
      </motion.div>
    </div>
  );
}
