"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { useConvexAuth } from "convex/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home, Box, Users, Sparkles, Bookmark,
  Trophy, Newspaper, X, Tv2, User, LogIn,
  Heart, Eye, LayoutGrid, ArrowUp, CheckCircle, Radio, Flame,
} from "lucide-react";
import FindMyMovieWizard from "./FindMyMovie/FindMyMovieWizard";
import StampSearchModal from "./StampSearchModal";
import { useMovieLists } from "@/hooks/useMovieLists";
import { useThemeMode } from "@/hooks/useThemeMode";

const SHOW_STREAMING = false;

// Spring preset for snappy interactive elements
const navSpring = { type: "spring" as const, stiffness: 480, damping: 32 };

export default function MobileBottomNav() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const pathname = usePathname();
  const { liked, watchlist, watched } = useMovieLists();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [stampSearchOpen, setStampSearchOpen] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [listsOpen, setListsOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [smoke, setSmoke] = useState<{ x: number; y: number } | null>(null);
  const rocketControls = useAnimationControls();
  const btnRef = useRef<HTMLButtonElement>(null);
  const theme = useThemeMode();
  const isGlass = theme === "glass";
  const isNetflix = theme === "netflix";

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 200);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Trigger entrance animation whenever the button becomes visible
  useEffect(() => {
    if (showScrollTop && !listsOpen && !browseOpen) {
      // Reset controls to initial state first — if they previously ended at
      // opacity:1, start() would be a no-op and the button would stay hidden
      rocketControls.set({ opacity: 0, y: 12, scale: 0.88, scaleX: 1, scaleY: 1 });
      rocketControls.start({ opacity: 1, y: 0, scale: 1, scaleX: 1, scaleY: 1, transition: navSpring });
    }
  }, [showScrollTop, listsOpen, browseOpen]);

  const totalCount = liked.length + watchlist.length + watched.length;

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path);

  // ── Nav item: returns icon + active indicator ──
  function NavItem({
    id, active, children, onClick, href,
  }: {
    id: string;
    active: boolean;
    children: React.ReactNode;
    onClick?: () => void;
    href?: string;
  }) {
    const cls = `relative flex items-center justify-center w-12 h-12 tap-target z-10`;

    const inner = (
      <>
        {/* layoutId pill behind active icon — morphs across items */}
        {(isGlass || isNetflix) && active && (
          <motion.div
            layoutId={isGlass ? "glass-nav-indicator" : "netflix-nav-indicator"}
            className="absolute inset-1 rounded-[14px]"
            style={{
              background: isGlass ? "rgba(96,165,250,0.15)" : "rgba(229,9,20,0.22)",
              border: isGlass ? "1px solid rgba(96,165,250,0.30)" : "1px solid rgba(229,9,20,0.40)",
              boxShadow: isGlass ? "0 0 12px rgba(96,165,250,0.20)" : "0 0 16px rgba(229,9,20,0.16)",
            }}
            transition={navSpring}
          />
        )}
        <motion.div
          className="relative z-10"
          animate={
            isGlass
              ? { color: active ? "#93C5FD" : "rgba(100,116,139,1)", scale: active ? 1.12 : 1 }
              : isNetflix
              ? { color: active ? "#FFFFFF" : "rgba(255,255,255,0.45)", scale: active ? 1.08 : 1 }
              : { color: active ? "var(--theme-primary)" : "#555" }
          }
          whileTap={{ scale: 0.84 }}
          transition={navSpring}
        >
          {children}
        </motion.div>
      </>
    );

    if (href) {
      return (
        <Link href={href} className={cls} onClick={onClick}>
          {inner}
        </Link>
      );
    }
    return (
      <button className={cls} onClick={onClick}>
        {inner}
      </button>
    );
  }

  return (
    <>
      {/* ── Scroll to top ── */}
      <AnimatePresence>
        {showScrollTop && !listsOpen && !browseOpen && (
          <motion.button
            ref={btnRef}
            onClick={async () => {
              if (launching) return;
              setLaunching(true);
              const rect = btnRef.current?.getBoundingClientRect();
              if (rect) setSmoke({ x: rect.left + rect.width / 2, y: rect.bottom });
              // squish then blast off
              await rocketControls.start({
                y: [0, 6, -window.innerHeight],
                scaleX: [1, 1.18, 0.75],
                scaleY: [1, 0.82, 1.1],
                transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], times: [0, 0.12, 1] },
              });
              window.scrollTo({ top: 0, behavior: "smooth" });
              setTimeout(() => setSmoke(null), 900);
              rocketControls.set({ y: window.innerHeight, scaleX: 1, scaleY: 1 });
              await rocketControls.start({
                y: 0,
                transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.15 },
              });
              setLaunching(false);
            }}
            aria-label="Scroll to top"
            className={`fixed bottom-20 right-4 z-[59] w-10 h-10 flex items-center justify-center ${
              isGlass ? "rounded-2xl" : isNetflix ? "rounded-full border" : "bg-brutal-yellow border-3 border-brutal-border shadow-brutal text-black"
            }`}
            style={isGlass ? {
              background: "rgba(96,165,250,0.12)",
              border: "1px solid rgba(96,165,250,0.30)",
              backdropFilter: "blur(20px) saturate(160%)",
              WebkitBackdropFilter: "blur(20px) saturate(160%)",
              color: "#93C5FD",
              borderRadius: "14px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 16px rgba(96,165,250,0.15), inset 0 1px 0 rgba(255,255,255,0.10)",
            } : isNetflix ? {
              background: "rgba(24,24,24,0.95)",
              borderColor: "rgba(255,255,255,0.12)",
              color: "#FFFFFF",
              boxShadow: "0 10px 24px rgba(0,0,0,0.45)",
            } : undefined}
            animate={rocketControls}
            initial={{ opacity: 0, y: 12, scale: 0.88 }}
            exit={{ opacity: 0, y: 12, scale: 0.88 }}
          >
            <ArrowUp className="w-4 h-4" strokeWidth={isGlass ? 2 : 3} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Rocket smoke puffs ── */}
      <AnimatePresence>
        {smoke && (
          <div className="pointer-events-none fixed z-[58]" style={{ left: smoke.x, top: smoke.y }}>
            {[...Array(7)].map((_, i) => {
              const angle = (i / 7) * Math.PI + Math.PI * 0.15;
              const spread = 18 + Math.random() * 14;
              return (
                <motion.div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    width: 10 + i * 3,
                    height: 10 + i * 3,
                    x: -(5 + i * 1.5),
                    y: -(5 + i * 1.5),
                    background: isGlass
                      ? `rgba(147,197,253,${0.5 - i * 0.05})`
                      : `rgba(200,200,200,${0.55 - i * 0.05})`,
                    filter: "blur(3px)",
                  }}
                  initial={{ scale: 0.3, opacity: 0.8 }}
                  animate={{
                    x: Math.cos(angle) * spread * (0.6 + i * 0.15),
                    y: Math.sin(angle) * spread * (0.5 + i * 0.12) + 12,
                    scale: 2.5 + i * 0.4,
                    opacity: 0,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.65 + i * 0.06, ease: "easeOut", delay: i * 0.03 }}
                />
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* ── Fixed bottom bar ── */}
      <nav className={`fixed bottom-0 left-0 right-0 z-[60] lg:hidden ${!isGlass && !isNetflix ? "bg-bg border-t-3 border-brutal-border" : ""}`}>
        {isGlass ? (
          /* Glass: floating pill */
          <div className="px-3 sm:px-5 pb-safe pt-2 pb-3">
            <div
              className="flex items-center justify-around py-1.5 rounded-[26px] sm:rounded-[28px]"
              style={{
                background: "rgba(2,10,30,0.80)",
                backdropFilter: "blur(28px) saturate(180%)",
                WebkitBackdropFilter: "blur(28px) saturate(180%)",
                border: "1px solid rgba(255,255,255,0.10)",
                boxShadow: "0 -4px 24px rgba(0,0,0,0.5), 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
              }}
            >
              <NavItem id="home" active={isActive("/")} href="/"
                onClick={() => window.dispatchEvent(new CustomEvent("reset-filters"))}>
                <Home className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
              </NavItem>

              <NavItem id="browse" active={browseOpen}
                onClick={() => { setListsOpen(false); setBrowseOpen((o) => !o); }}>
                <Box className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
              </NavItem>

              {/* Centre CTA — My Lists */}
              <div className="relative -mt-5">
                <motion.button
                  onClick={() => { setBrowseOpen(false); setListsOpen((o) => !o); }}
                  className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl tap-target relative z-10"
                  style={{
                    background: listsOpen
                      ? "linear-gradient(135deg,rgba(249,115,22,0.40),rgba(96,165,250,0.30))"
                      : "linear-gradient(135deg,rgba(96,165,250,0.22),rgba(249,115,22,0.15))",
                    border: listsOpen ? "1px solid rgba(249,115,22,0.55)" : "1px solid rgba(96,165,250,0.35)",
                    backdropFilter: "blur(16px)",
                    boxShadow: listsOpen
                      ? "0 0 24px rgba(249,115,22,0.35), 0 4px 20px rgba(0,0,0,0.5)"
                      : "0 0 18px rgba(96,165,250,0.25), 0 4px 20px rgba(0,0,0,0.4)",
                  }}
                  whileTap={{ scale: 0.86 }}
                  transition={navSpring}
                >
                  <Bookmark
                    className="w-5 h-5 sm:w-6 sm:h-6"
                    style={{ color: listsOpen ? "#FB923C" : "#93C5FD" }}
                    strokeWidth={2.5}
                    fill={totalCount > 0 ? "currentColor" : "none"}
                  />
                  {totalCount > 0 && (
                    <motion.span
                      className="absolute -top-1 -right-1 text-[8px] font-black font-mono w-4 h-4 flex items-center justify-center rounded-full"
                      style={{
                        background: "#60A5FA",
                        color: "#fff",
                        border: "1.5px solid rgba(2,10,30,0.9)",
                        boxShadow: "0 0 8px rgba(96,165,250,0.5)",
                      }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 600, damping: 20 }}
                    >
                      {totalCount}
                    </motion.span>
                  )}
                </motion.button>
              </div>

              <NavItem id="blocks" active={isActive("/blocks")} href="/blocks">
                <Users className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
              </NavItem>

              <NavItem
                id="account"
                active={isActive("/profile") || isActive("/sign-in")}
                href={isAuthenticated ? "/profile" : "/sign-in"}
              >
                {!isLoading && isAuthenticated
                  ? <User className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
                  : <LogIn className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
                }
              </NavItem>
            </div>
          </div>
        ) : isNetflix ? (
          <div className="px-3 pb-safe pt-2 pb-3">
            <div
              className="flex items-center justify-around rounded-[20px] border px-2 py-1.5"
              style={{
                background: "rgba(20,20,20,0.96)",
                borderColor: "rgba(255,255,255,0.10)",
                boxShadow: "0 -6px 26px rgba(0,0,0,0.45), 0 10px 28px rgba(0,0,0,0.32)",
              }}
            >
              <NavItem id="home" active={isActive("/")} href="/" onClick={() => window.dispatchEvent(new CustomEvent("reset-filters"))}>
                <Home className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.4} />
              </NavItem>

              <NavItem id="browse" active={browseOpen} onClick={() => { setListsOpen(false); setBrowseOpen((o) => !o); }}>
                <Box className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.4} />
              </NavItem>

              <div className="relative -mt-5">
                <motion.button
                  onClick={() => { setBrowseOpen(false); setListsOpen((o) => !o); }}
                  className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border sm:h-14 sm:w-14"
                  style={{
                    background: listsOpen ? "#E50914" : "#141414",
                    borderColor: listsOpen ? "#E50914" : "rgba(255,255,255,0.18)",
                    boxShadow: listsOpen ? "0 0 18px rgba(229,9,20,0.25)" : "0 8px 20px rgba(0,0,0,0.38)",
                  }}
                  whileTap={{ scale: 0.86 }}
                  transition={navSpring}
                >
                  <Bookmark
                    className="w-5 h-5 sm:w-6 sm:h-6"
                    style={{ color: "#FFFFFF" }}
                    strokeWidth={2.4}
                    fill={totalCount > 0 ? "currentColor" : "none"}
                  />
                  {totalCount > 0 && (
                    <motion.span
                      className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-black text-white"
                      style={{ background: "#E50914" }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 600, damping: 20 }}
                    >
                      {totalCount}
                    </motion.span>
                  )}
                </motion.button>
              </div>

              <NavItem id="blocks" active={isActive("/blocks")} href="/blocks">
                <Users className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.4} />
              </NavItem>

              <NavItem
                id="account"
                active={isActive("/profile") || isActive("/sign-in")}
                href={isAuthenticated ? "/profile" : "/sign-in"}
              >
                {!isLoading && isAuthenticated
                  ? <User className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.4} />
                  : <LogIn className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.4} />
                }
              </NavItem>
            </div>
          </div>
        ) : (
          /* Brutalist: original layout */
          <div className="flex items-center justify-around px-2 py-2 pb-safe">
            <Link href="/" className={`flex items-center justify-center w-12 h-12 tap-target transition-colors ${isActive("/") ? "text-brutal-yellow" : "text-brutal-dim hover:text-brutal-muted"}`}
              onClick={() => window.dispatchEvent(new CustomEvent("reset-filters"))}>
              <Home className="w-6 h-6" strokeWidth={2.5} />
            </Link>
            <button onClick={() => { setListsOpen(false); setBrowseOpen((o) => !o); }}
              className={`flex items-center justify-center w-12 h-12 tap-target transition-colors ${browseOpen ? "text-brutal-yellow" : "text-brutal-dim hover:text-brutal-muted"}`}>
              <Box className="w-6 h-6" strokeWidth={2.5} />
            </button>
            <button onClick={() => { setBrowseOpen(false); setListsOpen((o) => !o); }}
              className={`relative flex items-center justify-center w-14 h-14 -mt-6 transition-all duration-300 bg-brutal-lime border-3 border-brutal-border shadow-[3px_3px_0px_#000] text-black`}>
              <Bookmark className="w-6 h-6" strokeWidth={2.5} fill={totalCount > 0 ? "currentColor" : "none"} />
              {totalCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 text-[8px] font-black font-mono w-4 h-4 flex items-center justify-center bg-black text-brutal-lime border border-brutal-border">
                  {totalCount}
                </span>
              )}
            </button>
            <Link href="/blocks" className={`flex items-center justify-center w-12 h-12 tap-target transition-colors ${isActive("/blocks") ? "text-brutal-yellow" : "text-brutal-dim hover:text-brutal-muted"}`}>
              <Users className="w-6 h-6" strokeWidth={2.5} />
            </Link>
            <Link href={isAuthenticated ? "/profile" : "/sign-in"}
              className={`flex items-center justify-center w-12 h-12 tap-target transition-colors ${isActive("/profile") || isActive("/sign-in") ? "text-brutal-yellow" : "text-brutal-dim hover:text-brutal-muted"}`}>
              {!isLoading && isAuthenticated
                ? <User className="w-6 h-6" strokeWidth={2.5} />
                : <LogIn className="w-6 h-6" strokeWidth={2.5} />}
            </Link>
          </div>
        )}
      </nav>

      {/* ── Browse slide-up panel ── */}
      <AnimatePresence>
        {browseOpen && (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden"
            style={isGlass ? { background: "rgba(2,6,23,0.60)" } : { background: "rgba(0,0,0,0.60)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setBrowseOpen(false)}
          >
            <motion.div
              className={`absolute bottom-0 left-0 right-0 p-4 pb-24 sm:pb-28 ${
                isGlass
                  ? "rounded-t-[28px]"
                  : "bg-bg border-t-3 border-brutal-border"
              }`}
              style={isGlass ? {
                background: "rgba(3,10,32,0.93)",
                backdropFilter: "blur(32px) saturate(160%)",
                borderTop: "1px solid rgba(96,165,250,0.20)",
                borderRadius: "28px 28px 0 0",
                boxShadow: "0 -20px 60px rgba(0,0,0,0.6), 0 -1px 0 rgba(96,165,250,0.12)",
              } : undefined}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle bar */}
              {isGlass && (
                <div className="flex justify-center mb-4">
                  <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.18)" }} />
                </div>
              )}

              {/* Header */}
              {isGlass ? (
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" style={{ boxShadow: "0 0 6px rgba(96,165,250,0.9)" }} />
                    <span className="text-[11px] font-display font-semibold tracking-[0.18em] text-slate-300 uppercase">Browse</span>
                  </div>
                  <button onClick={() => setBrowseOpen(false)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/10 transition-colors">
                    <X className="w-4 h-4" strokeWidth={2.5} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono font-black text-brutal-dim uppercase tracking-[0.2em]">BROWSE</span>
                  <button onClick={() => setBrowseOpen(false)}><X className="w-4 h-4 text-brutal-dim" strokeWidth={3} /></button>
                </div>
              )}

              <div className={`grid grid-cols-2 ${isGlass ? "gap-2" : "gap-3"}`}>
                {/* CineSwipe */}
                <Link href="/swipe" onClick={() => setBrowseOpen(false)}
                  className={`col-span-2 flex items-center gap-3 px-4 py-4 relative overflow-hidden transition-all duration-200 ${
                    isGlass
                      ? "rounded-2xl border text-pink-300 hover:border-pink-400/40 active:scale-[0.98]"
                      : "brutal-btn border-2 border-brutal-pink text-brutal-pink bg-brutal-pink/10 py-5"
                  }`}
                  style={isGlass ? {
                    background: "linear-gradient(120deg,rgba(236,72,153,0.12),rgba(96,165,250,0.08))",
                    borderColor: "rgba(236,72,153,0.22)",
                  } : undefined}>
                  <Flame className={`shrink-0 ${isGlass ? "w-4 h-4" : "w-5 h-5"}`} strokeWidth={2.5} />
                  <span className={`font-black tracking-widest ${isGlass ? "font-display text-xs" : "font-mono text-xs"}`}>CINESWIPE</span>
                  <span className={`ml-auto uppercase tracking-widest ${isGlass ? "text-[9px] font-display text-pink-400/70" : "text-[9px] font-mono font-bold text-brutal-pink/60"}`}>NEW</span>
                </Link>

                {[
                  { onClick: () => { setBrowseOpen(false); setWizardOpen(true); }, icon: Sparkles, label: "FIND MOVIE", color: "blue" },
                  { onClick: () => { setBrowseOpen(false); setStampSearchOpen(true); }, icon: CheckCircle, label: "STAMP FILMS", color: "orange" },
                ].map(({ onClick, icon: Icon, label, color }) => (
                  <button key={label} onClick={onClick}
                    className={`flex items-center gap-3 px-4 transition-all duration-200 active:scale-[0.97] ${
                      isGlass
                        ? "py-4 rounded-2xl border text-slate-300 hover:text-white"
                        : "brutal-btn py-5 border-2 border-brutal-pink text-brutal-pink bg-brutal-pink/10"
                    }`}
                    style={isGlass ? {
                      background: "rgba(255,255,255,0.06)",
                      borderColor: "rgba(255,255,255,0.10)",
                    } : undefined}>
                    <Icon className={`shrink-0 ${isGlass ? "w-4 h-4 text-slate-400" : "w-5 h-5"}`} strokeWidth={2.5} />
                    <span className={`font-black tracking-widest ${isGlass ? "font-display text-xs" : "font-mono text-xs"}`}>{label}</span>
                  </button>
                ))}

                {[
                  { href: "/box-office",   icon: Trophy,     label: "BOX OFFICE",      brutalColor: "lime" },
                  { href: "/radar",        icon: Radio,      label: "RADAR",            brutalColor: "cyan", pulse: true },
                  { href: "/collections", icon: Box,        label: "FRANCHISE VAULT",  brutalColor: "violet" },
                  { href: "/news",         icon: Newspaper,  label: "NEWS",             brutalColor: "orange" },
                  { href: "/cineblocks",   icon: LayoutGrid, label: "CINEBLOCKS",       brutalColor: "cyan" },
                  { href: "/recommendations", icon: Sparkles, label: "FOR YOU",         brutalColor: "yellow" },
                ].map(({ href, icon: Icon, label, brutalColor, pulse }) => (
                  <Link key={href} href={href} onClick={() => setBrowseOpen(false)}
                    className={`flex items-center gap-3 px-4 transition-all duration-200 relative active:scale-[0.97] ${
                      isGlass
                        ? "py-4 rounded-2xl border text-slate-300 hover:text-white"
                        : `brutal-btn py-5 border-2 border-brutal-${brutalColor} text-brutal-${brutalColor} bg-brutal-${brutalColor}/10`
                    }`}
                    style={isGlass ? {
                      background: "rgba(255,255,255,0.06)",
                      borderColor: "rgba(255,255,255,0.10)",
                    } : undefined}>
                    <Icon className={`shrink-0 ${isGlass ? "w-4 h-4 text-slate-400" : "w-5 h-5"}`} strokeWidth={2.5} />
                    <span className={`font-black tracking-widest ${isGlass ? "font-display text-[10px]" : "font-mono text-xs"}`}>{label}</span>
                    {pulse && isGlass && (
                      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" style={{ boxShadow: "0 0 6px rgba(96,229,250,0.8)" }} />
                    )}
                  </Link>
                ))}

                {SHOW_STREAMING && (
                  <Link href="/streaming" onClick={() => setBrowseOpen(false)}
                    className={`col-span-2 flex items-center gap-3 px-4 py-4 transition-all duration-200 ${isGlass ? "rounded-2xl border text-slate-300" : "brutal-btn py-5 border-2 border-brutal-yellow text-brutal-yellow bg-brutal-yellow/10"}`}
                    style={isGlass ? { background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.10)" } : undefined}>
                    <Tv2 className={`shrink-0 ${isGlass ? "w-4 h-4 text-slate-400" : "w-5 h-5"}`} strokeWidth={2.5} />
                    <span className={`font-black tracking-widest ${isGlass ? "font-display text-xs" : "font-mono text-xs"}`}>STREAMING</span>
                  </Link>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── My Lists slide-up panel ── */}
      <AnimatePresence>
        {listsOpen && (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden"
            style={isGlass ? { background: "rgba(2,6,23,0.60)" } : { background: "rgba(0,0,0,0.60)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setListsOpen(false)}
          >
            <motion.div
              className={`absolute bottom-0 left-0 right-0 p-4 pb-24 sm:pb-28 ${isGlass ? "rounded-t-[28px]" : "bg-bg border-t-3 border-brutal-border"}`}
              style={isGlass ? {
                background: "rgba(3,10,32,0.93)",
                backdropFilter: "blur(32px) saturate(160%)",
                borderTop: "1px solid rgba(96,165,250,0.20)",
                borderRadius: "28px 28px 0 0",
                boxShadow: "0 -20px 60px rgba(0,0,0,0.6)",
              } : undefined}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
              onClick={(e) => e.stopPropagation()}
            >
              {isGlass && (
                <div className="flex justify-center mb-4">
                  <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.18)" }} />
                </div>
              )}

              {isGlass ? (
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" style={{ boxShadow: "0 0 6px rgba(96,165,250,0.9)" }} />
                    <span className="text-[11px] font-display font-semibold tracking-[0.18em] text-slate-300 uppercase">My Lists</span>
                  </div>
                  <button onClick={() => setListsOpen(false)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/10 transition-colors">
                    <X className="w-4 h-4" strokeWidth={2.5} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono font-black text-brutal-dim uppercase tracking-[0.2em]">MY LISTS</span>
                  <button onClick={() => setListsOpen(false)}><X className="w-4 h-4 text-brutal-dim" strokeWidth={3} /></button>
                </div>
              )}

              <div className={`grid grid-cols-3 ${isGlass ? "gap-2" : "gap-3"}`}>
                {[
                  { href: "/liked",      icon: Heart,     label: "LIKED",     count: liked.length,     fill: liked.length > 0,     glass: "text-rose-300 hover:bg-rose-500/15 hover:border-rose-400/30" },
                  { href: "/watchlist",  icon: Bookmark,  label: "WATCHLIST", count: watchlist.length, fill: watchlist.length > 0, glass: "text-blue-300 hover:bg-blue-500/15 hover:border-blue-400/30" },
                  { href: "/watched",    icon: Eye,       label: "WATCHED",   count: watched.length,   fill: false,                glass: "text-slate-300 hover:bg-white/[0.12] hover:border-blue-400/30" },
                ].map(({ href, icon: Icon, label, count, fill, glass }) => (
                  <Link key={href} href={href} onClick={() => setListsOpen(false)}
                    className={`flex flex-col items-center gap-2 px-3 py-4 transition-all duration-200 active:scale-[0.96] ${
                      isGlass
                        ? `rounded-2xl border border-white/[0.10] bg-white/[0.06] ${glass}`
                        : `brutal-btn border-2`
                    }`}
                    style={isGlass ? {} : undefined}>
                    <Icon className="w-5 h-5 shrink-0" strokeWidth={2.5} fill={fill ? "currentColor" : "none"} />
                    <span className={`text-[10px] font-black tracking-widest ${isGlass ? "font-display" : "font-mono"}`}>{label}</span>
                    <span className="font-display font-black text-lg">{count}</span>
                  </Link>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {wizardOpen && <FindMyMovieWizard onClose={() => setWizardOpen(false)} />}
      {stampSearchOpen && (
        <StampSearchModal isOpen={stampSearchOpen} onClose={() => setStampSearchOpen(false)} />
      )}
    </>
  );
}
