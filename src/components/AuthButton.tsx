"use client";

import { useConvexAuth, useQuery } from "convex/react";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LogIn, User, Bookmark, ChevronDown } from "lucide-react";
import Link from "next/link";
import { api } from "../../convex/_generated/api";
import { useThemeMode } from "@/hooks/useThemeMode";

export default function AuthButton() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const theme = useThemeMode();
  const isGlass = theme === "glass";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const pendingInvites = useQuery(
    api.blocks.getPendingInvitations,
    isAuthenticated ? {} : "skip"
  );
  const inviteCount = pendingInvites?.length ?? 0;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const [showDebug, setShowDebug] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => { if (isLoading) setShowDebug(true); }, 4000);
    return () => clearTimeout(t);
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="brutal-btn p-1.5 opacity-50">
          <User className="w-4 h-4 animate-pulse" strokeWidth={2.5} />
        </div>
        {showDebug && (
          <button onClick={() => window.location.reload()}
            className="text-[9px] font-mono font-bold text-brutal-red underline decoration-2 underline-offset-2">
            STUCK? RELOAD
          </button>
        )}
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Link href="/sign-in"
        className="brutal-btn px-3 py-1.5 text-xs font-bold font-mono tracking-widest flex items-center gap-2 bg-surface border-brutal-border hover:!bg-brutal-yellow hover:!text-black hover:!border-brutal-yellow">
        <LogIn className="w-4 h-4" strokeWidth={2.5} />
        <span className="hidden sm:inline-block">SIGN IN</span>
      </Link>
    );
  }

  const divider = (
    <span className="w-px self-stretch" style={{ background: isGlass ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.15)" }} />
  );

  const itemClass = `flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono font-bold tracking-wider transition-colors duration-150 whitespace-nowrap ${
    isGlass ? "text-white/70 hover:text-white" : "text-white/70 hover:text-white"
  }`;

  return (
    <div ref={ref} className="relative flex items-center">
      {/* Expanding pill */}
      <motion.div
        layout
        className="flex items-stretch overflow-hidden"
        style={{
          borderRadius: 10,
          background: isGlass
            ? "rgba(255,255,255,0.07)"
            : "rgba(30,30,30,0.95)",
          border: isGlass
            ? "1px solid rgba(255,255,255,0.12)"
            : "2px solid rgba(255,255,255,0.15)",
        }}
        transition={{ type: "spring", stiffness: 280, damping: 24 }}
      >
        {/* Expanded items — animate in from the right side leftward */}
        <AnimatePresence>
          {open && (
            <motion.div
              key="menu-items"
              className="flex items-stretch"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "auto", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 24 }}
              style={{ overflow: "hidden" }}
            >
              <Link href="/profile" onClick={() => setOpen(false)} className={itemClass}>
                <User className="w-3.5 h-3.5" strokeWidth={2.5} />
                PROFILE
              </Link>
              {divider}
              <Link href="/watchlist" onClick={() => setOpen(false)} className={itemClass}>
                <Bookmark className="w-3.5 h-3.5" strokeWidth={2.5} />
                MY LISTS
              </Link>
              {divider}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profile icon — always visible, links to profile */}
        <Link href="/profile" className="flex items-center px-2.5 py-1.5 relative">
          <User className="w-4 h-4 text-white/80" strokeWidth={2.5} />
          {inviteCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-yellow-400 text-black text-[9px] font-black flex items-center justify-center">
              {inviteCount > 9 ? "9+" : inviteCount}
            </span>
          )}
        </Link>

        {/* Divider */}
        {divider}

        {/* Chevron — toggles expand */}
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center px-2 py-1.5"
          aria-label="Toggle profile menu"
        >
          <motion.div
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
          >
            <ChevronDown className="w-3.5 h-3.5 text-white/60" strokeWidth={2.5} />
          </motion.div>
        </button>
      </motion.div>
    </div>
  );
}
