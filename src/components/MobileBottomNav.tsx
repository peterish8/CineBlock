"use client";

import { useState } from "react";
import { useConvexAuth } from "convex/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home, Box, Users, Sparkles, Bookmark,
  Trophy, Newspaper, X, Tv2, User, LogIn,
  Heart, Eye,
} from "lucide-react";
import FindMyMovieWizard from "./FindMyMovie/FindMyMovieWizard";
import { useMovieLists } from "@/hooks/useMovieLists";

// Keep in sync with CommandHub SHOW_STREAMING flag
const SHOW_STREAMING = false;

export default function MobileBottomNav() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const pathname = usePathname();
  const { liked, watchlist, watched } = useMovieLists();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [listsOpen, setListsOpen] = useState(false);

  const totalCount = liked.length + watchlist.length + watched.length;

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path);

  const navItem = (active: boolean) =>
    `flex items-center justify-center w-12 h-12 tap-target transition-colors ${
      active ? "text-brutal-yellow" : "text-brutal-dim hover:text-brutal-muted"
    }`;

  return (
    <>
      {/* ── Fixed bottom bar ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-[60] lg:hidden bg-bg border-t-3 border-brutal-border">
        <div className="flex items-center justify-around px-2 py-2 pb-safe">

          {/* HOME */}
          <Link href="/" className={navItem(isActive("/"))}>
            <Home className="w-6 h-6" strokeWidth={2.5} />
          </Link>

          {/* BROWSE */}
          <button
            onClick={() => { setListsOpen(false); setBrowseOpen((o) => !o); }}
            className={navItem(browseOpen)}
          >
            <Box className="w-6 h-6" strokeWidth={2.5} />
          </button>

          {/* MY LISTS — raised center CTA */}
          <button
            onClick={() => { setBrowseOpen(false); setListsOpen((o) => !o); }}
            className="relative flex items-center justify-center w-14 h-14 -mt-6 bg-brutal-lime border-3 border-brutal-border shadow-[3px_3px_0px_#000] text-black"
          >
            <Bookmark className="w-6 h-6" strokeWidth={2.5} fill={totalCount > 0 ? "currentColor" : "none"} />
            {totalCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-black text-brutal-lime text-[8px] font-black font-mono w-4 h-4 flex items-center justify-center border border-brutal-border">
                {totalCount}
              </span>
            )}
          </button>

          {/* BLOCKS */}
          <Link href="/blocks" className={navItem(isActive("/blocks"))}>
            <Users className="w-6 h-6" strokeWidth={2.5} />
          </Link>

          {/* ACCOUNT */}
          <Link
            href={isAuthenticated ? "/profile" : "/sign-in"}
            className={navItem(isActive("/profile") || isActive("/sign-in"))}
          >
            {!isLoading && isAuthenticated
              ? <User className="w-6 h-6" strokeWidth={2.5} />
              : <LogIn className="w-6 h-6" strokeWidth={2.5} />
            }
          </Link>

        </div>
      </nav>

      {/* ── Browse slide-up panel — 2×2 grid ── */}
      {browseOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden bg-black/60"
          onClick={() => setBrowseOpen(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 bg-bg border-t-3 border-brutal-border panel-spring p-4 pb-20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono font-black text-brutal-dim uppercase tracking-[0.2em]">BROWSE</span>
              <button onClick={() => setBrowseOpen(false)}>
                <X className="w-4 h-4 text-brutal-dim" strokeWidth={3} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {/* Row 1 */}
              <button
                onClick={() => { setBrowseOpen(false); setWizardOpen(true); }}
                className="brutal-btn flex items-center gap-3 px-4 py-5 border-2 border-brutal-pink text-brutal-pink bg-brutal-pink/10"
              >
                <Sparkles className="w-5 h-5 shrink-0" strokeWidth={2.5} />
                <span className="font-mono text-xs font-black tracking-widest">FIND MOVIE</span>
              </button>
              <Link
                href="/box-office"
                onClick={() => setBrowseOpen(false)}
                className="brutal-btn flex items-center gap-3 px-4 py-5 border-2 border-brutal-lime text-brutal-lime bg-brutal-lime/10"
              >
                <Trophy className="w-5 h-5 shrink-0" strokeWidth={2.5} />
                <span className="font-mono text-xs font-black tracking-widest">BOX OFFICE</span>
              </Link>
              {/* Row 2 */}
              <Link
                href="/collections"
                onClick={() => setBrowseOpen(false)}
                className="brutal-btn flex items-center gap-3 px-4 py-5 border-2 border-brutal-violet text-brutal-violet bg-brutal-violet/10"
              >
                <Box className="w-5 h-5 shrink-0" strokeWidth={2.5} />
                <span className="font-mono text-xs font-black tracking-widest">COLLECTIONS</span>
              </Link>
              <Link
                href="/news"
                onClick={() => setBrowseOpen(false)}
                className="brutal-btn flex items-center gap-3 px-4 py-5 border-2 border-brutal-orange text-brutal-orange bg-brutal-orange/10"
              >
                <Newspaper className="w-5 h-5 shrink-0" strokeWidth={2.5} />
                <span className="font-mono text-xs font-black tracking-widest">NEWS</span>
              </Link>
              {/* Row 3 — For You full-width */}
              <Link
                href="/recommendations"
                onClick={() => setBrowseOpen(false)}
                className="brutal-btn col-span-2 flex items-center gap-3 px-4 py-5 border-2 border-brutal-yellow text-brutal-yellow bg-brutal-yellow/10"
              >
                <Sparkles className="w-5 h-5 shrink-0" strokeWidth={2.5} />
                <span className="font-mono text-xs font-black tracking-widest">FOR YOU</span>
              </Link>
              {/* Streaming — only when flag is on */}
              {SHOW_STREAMING && (
                <Link
                  href="/streaming"
                  onClick={() => setBrowseOpen(false)}
                  className="brutal-btn col-span-2 flex items-center gap-3 px-4 py-5 border-2 border-brutal-yellow text-brutal-yellow bg-brutal-yellow/10"
                >
                  <Tv2 className="w-5 h-5 shrink-0" strokeWidth={2.5} />
                  <span className="font-mono text-xs font-black tracking-widest">STREAMING</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── My Lists slide-up panel ── */}
      {listsOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden bg-black/60"
          onClick={() => setListsOpen(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 bg-bg border-t-3 border-brutal-border panel-spring p-4 pb-20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono font-black text-brutal-dim uppercase tracking-[0.2em]">MY LISTS</span>
              <button onClick={() => setListsOpen(false)}>
                <X className="w-4 h-4 text-brutal-dim" strokeWidth={3} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Link
                href="/liked"
                onClick={() => setListsOpen(false)}
                className="brutal-btn flex flex-col items-center gap-2 px-3 py-4 border-2 border-brutal-red text-brutal-red bg-brutal-red/10"
              >
                <Heart className="w-5 h-5 shrink-0" strokeWidth={2.5} fill={liked.length > 0 ? "currentColor" : "none"} />
                <span className="font-mono text-[10px] font-black tracking-widest">LIKED</span>
                <span className="font-display font-black text-lg">{liked.length}</span>
              </Link>
              <Link
                href="/watchlist"
                onClick={() => setListsOpen(false)}
                className="brutal-btn flex flex-col items-center gap-2 px-3 py-4 border-2 border-brutal-lime text-brutal-lime bg-brutal-lime/10"
              >
                <Bookmark className="w-5 h-5 shrink-0" strokeWidth={2.5} fill={watchlist.length > 0 ? "currentColor" : "none"} />
                <span className="font-mono text-[10px] font-black tracking-widest">WATCHLIST</span>
                <span className="font-display font-black text-lg">{watchlist.length}</span>
              </Link>
              <Link
                href="/watched"
                onClick={() => setListsOpen(false)}
                className="brutal-btn flex flex-col items-center gap-2 px-3 py-4 border-2 border-brutal-cyan text-brutal-cyan bg-brutal-cyan/10"
              >
                <Eye className="w-5 h-5 shrink-0" strokeWidth={2.5} />
                <span className="font-mono text-[10px] font-black tracking-widest">WATCHED</span>
                <span className="font-display font-black text-lg">{watched.length}</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Find My Movie wizard ── */}
      {wizardOpen && <FindMyMovieWizard onClose={() => setWizardOpen(false)} />}
    </>
  );
}
