"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Search, SlidersHorizontal, X, ChevronDown, Command, Dices, Palette, Trophy, Tv2, Box, Sparkles, Newspaper, Users, LayoutGrid, CheckCircle, Radio } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { GENRES, LANGUAGES, SORT_OPTIONS, generateYearRange } from "@/lib/constants";
import { KEYWORD_CHIPS } from "./FindMyMovie/StepKeywords";
import AuthButton from "./AuthButton";
import FindMyMovieWizard from "./FindMyMovie/FindMyMovieWizard";
import StampSearchModal from "./StampSearchModal";
import type { ThemeName } from "@/lib/types";
import { applyThemeToDocument, readStoredTheme, useThemeMode } from "@/hooks/useThemeMode";
import { getNextTheme } from "@/lib/themeConfig";

// ─── Feature Flags ────────────────────────────────────────────────────────────
const SHOW_STREAMING = false; // set to true when streaming page is ready

interface CommandHubProps {
  onFilterChange: (filters: {
    query: string;
    genre: string;
    year: string;
    language: string;
    sort: string;
    rating: string;
    runtime: string;
    keyword: string;
  }) => void;
  onSurpriseMe?: () => void;
}

export default function CommandHub({ onFilterChange, onSurpriseMe }: CommandHubProps) {
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("");
  const [year, setYear] = useState("");
  const [language, setLanguage] = useState("");
  const [sort, setSort] = useState("popularity.desc");
  const [rating, setRating] = useState("");
  const [runtime, setRuntime] = useState("");
  const [keyword, setKeyword] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [stampSearchOpen, setStampSearchOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ThemeName>("default");
  const [browseOpen, setBrowseOpen] = useState(false);
  const [keywordPopupOpen, setKeywordPopupOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [leftReactorFiring, setLeftReactorFiring] = useState(false);
  const [rightReactorFiring, setRightReactorFiring] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  
  const searchRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const browseRef = useRef<HTMLDivElement>(null);
  const browseButtonRef = useRef<HTMLButtonElement>(null);
  const browsePanelRef = useRef<HTMLDivElement>(null);
  const years = generateYearRange();

  // Clean up pending debounce on unmount to prevent memory leaks
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const emitFilters = useCallback(
    (q: string, g: string, y: string, l: string, s: string, rat: string, run: string, kw: string) => {
      onFilterChange({ query: q, genre: g, year: y, language: l, sort: s, rating: rat, runtime: run, keyword: kw });
    },
    [onFilterChange]
  );

  const clearAll = useCallback(() => {
    setQuery("");
    setGenre("");
    setYear("");
    setLanguage("");
    setSort("popularity.desc");
    setRating("");
    setRuntime("");
    setKeyword("");
    emitFilters("", "", "", "", "popularity.desc", "", "", "");
  }, [emitFilters]);

  const fireLeftReactor = useCallback(() => {
    setLeftReactorFiring(true);
    setTimeout(() => setLeftReactorFiring(false), 700);
    clearAll();
  }, [clearAll]);

  const fireRightReactor = useCallback(() => {
    setRightReactorFiring(true);
    setTimeout(() => setRightReactorFiring(false), 700);
    // Only randomize: genre, keyword, sort, rating — nothing else touched
    const randomGenre = GENRES[Math.floor(Math.random() * GENRES.length)];
    const randomSort = SORT_OPTIONS[Math.floor(Math.random() * SORT_OPTIONS.length)].value;
    const ratingOptions = ["", "7", "8"];
    const randomRating = ratingOptions[Math.floor(Math.random() * ratingOptions.length)];
    const randomKeyword = Math.random() < 0.5
      ? KEYWORD_CHIPS[Math.floor(Math.random() * KEYWORD_CHIPS.length)].id.toString()
      : "";
    setGenre(randomGenre.id.toString());
    setSort(randomSort);
    setRating(randomRating);
    setKeyword(randomKeyword);
    emitFilters(query, randomGenre.id.toString(), year, language, randomSort, randomRating, runtime, randomKeyword);
  }, [emitFilters, query, year, language, runtime]);

  useEffect(() => {
    const saved = readStoredTheme();
    setCurrentTheme(saved);
    applyThemeToDocument(saved);
  }, []);

  const toggleTheme = () => {
    setCurrentTheme((prev) => {
      const next = getNextTheme(prev);
      applyThemeToDocument(next);
      return next;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") {
        searchRef.current?.blur();
        setShowFilters(false);
        setBrowseOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    
    // Listen for global reset-filters event (from nav buttons)
    const handleReset = () => clearAll();
    window.addEventListener("reset-filters", handleReset);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("reset-filters", handleReset);
    };
  }, []);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      emitFilters(value, genre, year, language, sort, rating, runtime, keyword);
    }, 350);
  };

  const handleFilterChange = (
    key: "genre" | "year" | "language" | "sort" | "rating" | "runtime" | "keyword",
    value: string
  ) => {
    const newState = { query, genre, year, language, sort, rating, runtime, keyword, [key]: value };
    if (key === "genre") setGenre(value);
    if (key === "year") setYear(value);
    if (key === "language") setLanguage(value);
    if (key === "sort") setSort(value);
    if (key === "rating") setRating(value);
    if (key === "runtime") setRuntime(value);
    if (key === "keyword") setKeyword(value);
    emitFilters(newState.query, newState.genre, newState.year, newState.language, newState.sort, newState.rating, newState.runtime, newState.keyword);
  };

  const hasActiveFilters = genre || year || language || sort !== "popularity.desc" || rating || runtime || keyword;

  // Focus management for the browse side panel
  useEffect(() => {
    if (!browseOpen) return;
    // Move initial focus into panel
    const panel = browsePanelRef.current;
    if (panel) {
      const first = panel.querySelector<HTMLElement>(
        "button, a[href], [tabindex]:not([tabindex='-1'])"
      );
      first?.focus();
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setBrowseOpen(false);
        browseButtonRef.current?.focus();
        return;
      }
      if (e.key !== "Tab") return;
      const panel = browsePanelRef.current;
      if (!panel) return;
      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>(
          "button:not([disabled]), a[href], [tabindex]:not([tabindex='-1'])"
        )
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (!active || active === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (!active || active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [browseOpen]);

  return (
    <div
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        currentTheme === "glass"
          ? "glass-nav"
          : scrolled
          ? ""
          : "bg-bg"
      }`}
      style={currentTheme === "glass"
        ? scrolled
          ? {
              background: "linear-gradient(180deg, rgba(6,12,30,0.78), rgba(6,12,30,0.62))",
              backdropFilter: "blur(34px) saturate(220%)",
              WebkitBackdropFilter: "blur(34px) saturate(220%)",
              borderBottom: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "0 10px 34px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.08)",
            }
          : undefined
        : scrolled
        ? {
            background: "rgba(13, 13, 13, 0.82)",
            backdropFilter: "blur(22px) saturate(160%)",
            WebkitBackdropFilter: "blur(22px) saturate(160%)",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.45)",
          }
        : undefined}
    >
      {/* Single compact bar: logo | search | controls */}
      <div className="w-full px-3 sm:px-6 py-3 flex items-center gap-2 sm:gap-3">
        {/* Logo — left */}
        <Link 
          href="/" 
          className="hidden sm:block shrink-0" 
          title="CineBlock"
          onClick={() => window.dispatchEvent(new CustomEvent("reset-filters"))}
        >
          <Image src="/logo.png" alt="CineBlock" width={40} height={40} className="w-10 h-10 object-contain" unoptimized />
        </Link>

        {/* Search bar — grows to fill middle */}
        <div className={`flex items-center px-3 sm:px-4 py-2 flex-1 transition-all duration-200 ${
          currentTheme === "glass"
            ? "rounded-xl border focus-within:shadow-[0_0_0_3px_rgba(96,165,250,0.18),0_0_20px_rgba(96,165,250,0.10)]"
            : "brutal-input focus-within:border-brutal-yellow focus-within:shadow-brutal-accent"
        }`}
          style={currentTheme === "glass" ? {
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.11)",
            backdropFilter: "blur(12px)",
          } : undefined}
        >
          <Search
            className={`w-4 h-4 mr-2 flex-shrink-0 transition-colors duration-200 ${
              currentTheme === "glass" ? "text-slate-500 focus-within:text-blue-400" : "text-brutal-dim"
            }`}
            strokeWidth={2.5}
          />
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search movies..."
            className={`flex-1 bg-transparent text-sm outline-none ${
              currentTheme === "glass"
                ? "text-white placeholder:text-slate-500 font-display"
                : "text-brutal-white font-body placeholder:text-brutal-dim"
            }`}
            id="search-input"
          />
          {/* Kbd shortcut */}
          <div className={`hidden sm:flex items-center gap-1 ml-3 px-2 py-0.5 text-[10px] ${
            currentTheme === "glass"
              ? "text-slate-500 bg-white/5 border border-white/10 rounded-md"
              : "brutal-chip text-brutal-dim"
          }`}>
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>
          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`ml-2 transition-all duration-200 active:scale-90 ${
              currentTheme === "glass"
                ? `px-2 py-1.5 rounded-lg ${
                    showFilters || hasActiveFilters
                      ? "bg-blue-500/25 border border-blue-400/50 text-blue-300 shadow-[0_0_12px_rgba(96,165,250,0.20)]"
                      : "bg-white/6 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                  }`
                : `brutal-btn px-2 py-1.5 ${showFilters || hasActiveFilters ? "!border-brutal-lime !shadow-brutal-lime !text-brutal-lime" : ""}`
            }`}
            id="filter-toggle"
            aria-label="Toggle filters"
          >
            <SlidersHorizontal className="w-4 h-4" strokeWidth={2.5} />
          </button>

          {onSurpriseMe && (
            <button
              onClick={onSurpriseMe}
              className={`ml-2 hidden sm:flex px-2 py-1.5 active:scale-90 transition-all group ${
                currentTheme === "glass"
                  ? "rounded-lg bg-orange-500/18 border border-orange-400/30 text-orange-300 hover:bg-orange-500/28 hover:border-orange-400/50"
                  : "brutal-btn !bg-brutal-yellow !text-black !border-brutal-yellow hover:scale-105"
              }`}
              title="Surprise Me!"
            >
              <Dices className="w-4 h-4 group-hover:rotate-12 transition-transform" strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Right side controls — desktop only (mobile uses bottom nav) */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">

          {/* BROWSE dropdown — Streaming, Box Office, Franchise Vault, News */}
          <div ref={browseRef} className="relative hidden lg:block">
            <button
              ref={browseButtonRef}
              onClick={() => setBrowseOpen((o) => !o)}
              aria-expanded={browseOpen}
              aria-controls="browse-panel"
              className={`brutal-btn px-3 py-1.5 text-xs font-bold font-mono tracking-widest flex items-center gap-2 ${
                browseOpen
                  ? "!border-brutal-yellow !text-brutal-yellow"
                  : "bg-surface border-brutal-border hover:bg-brutal-yellow hover:text-black hover:border-brutal-yellow"
              }`}
            >
              <Box className="w-4 h-4" strokeWidth={2.5} />
              BROWSE
              <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${browseOpen ? "rotate-90" : "-rotate-90"}`} strokeWidth={3} />
            </button>

            {/* Side panel overlay */}
            {browseOpen && mounted && createPortal(
              <div
                role="button"
                aria-label="Close side panel"
                tabIndex={0}
                className="fixed inset-0 z-40"
                onClick={() => { setBrowseOpen(false); browseButtonRef.current?.focus(); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
                    setBrowseOpen(false);
                    browseButtonRef.current?.focus();
                  }
                }}
              />, document.body
            )}
            {/* ── Explore panel ── */}
            {mounted && createPortal(currentTheme === "glass" ? (
              /* GLASS VERSION — premium frosted glass sidebar */
              <div
                ref={browsePanelRef}
                id="browse-panel"
                role="dialog"
                aria-modal="true"
                aria-label="Browse navigation"
                className={`fixed right-0 top-0 h-full w-72 z-50 flex flex-col transition-transform duration-300 ease-out ${browseOpen ? "translate-x-0" : "translate-x-full"}`}
                style={{
                  background: "rgba(4, 10, 30, 0.92)",
                  backdropFilter: "blur(40px) saturate(180%)",
                  WebkitBackdropFilter: "blur(40px) saturate(180%)",
                  borderLeft: "1px solid rgba(96,165,250,0.25)",
                  boxShadow: "-32px 0 80px rgba(0,0,0,0.8), inset 1px 0 0 rgba(255,255,255,0.08)",
                }}
              >
                {/* Top accent line */}
                <div style={{ height: "2px", background: "linear-gradient(90deg, transparent, #60A5FA, #F97316, transparent)" }} />

                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(96,165,250,0.15)", border: "1px solid rgba(96,165,250,0.35)", boxShadow: "0 0 16px rgba(96,165,250,0.3)" }}>
                      <Box className="w-4 h-4" style={{ color: "#60A5FA" }} strokeWidth={2} />
                    </div>
                    <div>
                      <div className="text-xs font-mono tracking-[0.2em] uppercase" style={{ color: "rgba(96,165,250,0.7)" }}>Navigation</div>
                      <div className="text-sm font-bold text-white leading-none mt-0.5">Explore</div>
                    </div>
                  </div>
                  <button
                    onClick={() => { setBrowseOpen(false); browseButtonRef.current?.focus(); }}
                    className="w-8 h-8 flex items-center justify-center rounded-xl text-white transition-all duration-150"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.12)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                    }}
                  >
                    <X className="w-4 h-4" strokeWidth={2} />
                  </button>
                </div>

                {/* Nav list */}
                <div className="flex flex-col flex-1 overflow-y-auto px-3 py-3 gap-0.5">

                  {/* Section label */}
                  <div className="px-3 pb-1 pt-1">
                    <span className="text-[10px] font-mono tracking-[0.2em] uppercase" style={{ color: "rgba(255,255,255,0.3)" }}>Discover</span>
                  </div>

                  {[
                    ...(SHOW_STREAMING ? [{ href: "/streaming", icon: Tv2,        label: "Streaming",       sub: "Stream anywhere",    iconColor: "#60A5FA", glow: "rgba(96,165,250,0.25)" }] : []),
                    { href: "/swipe",           icon: Sparkles,   label: "CineSwipe",       sub: "Swipe to discover",  iconColor: "#F472B6", glow: "rgba(244,114,182,0.25)" },
                    { href: "/recommendations", icon: Sparkles,   label: "For You",         sub: "Personalized picks", iconColor: "#FB923C", glow: "rgba(251,146,60,0.25)" },
                    { href: "/box-office",      icon: Trophy,     label: "Box Office",      sub: "This week's hits",   iconColor: "#A3E635", glow: "rgba(163,230,53,0.25)" },
                    { href: "/collections",     icon: Box,        label: "Franchise Vault", sub: "Series & universes", iconColor: "#A78BFA", glow: "rgba(167,139,250,0.25)" },
                  ].map(({ href, icon: Icon, label, sub, iconColor, glow }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setBrowseOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150"
                      style={{ color: "rgba(255,255,255,0.85)", textDecoration: "none" }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = `${iconColor}18`;
                        e.currentTarget.style.borderLeft = `2px solid ${iconColor}`;
                        e.currentTarget.style.paddingLeft = "10px";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.borderLeft = "none";
                        e.currentTarget.style.paddingLeft = "12px";
                      }}
                    >
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${iconColor}20`, border: `1px solid ${iconColor}55`, boxShadow: `0 0 12px ${glow}` }}>
                        <Icon className="w-[18px] h-[18px]" style={{ color: iconColor }} strokeWidth={2} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[13px] font-semibold leading-tight text-white">{label}</span>
                        <span className="text-[11px] leading-tight mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{sub}</span>
                      </div>
                    </Link>
                  ))}

                  {/* Divider */}
                  <div className="mx-3 my-2" style={{ height: "1px", background: "rgba(255,255,255,0.07)" }} />

                  {/* Section label */}
                  <div className="px-3 pb-1">
                    <span className="text-[10px] font-mono tracking-[0.2em] uppercase" style={{ color: "rgba(255,255,255,0.3)" }}>Community</span>
                  </div>

                  {[
                    { href: "/cineblocks", icon: LayoutGrid, label: "CineBlocks",   sub: "Curated lists",     iconColor: "#22D3EE", glow: "rgba(34,211,238,0.25)" },
                    { href: "/blocks",     icon: Users,      label: "Watch Blocks", sub: "Group watchlists",  iconColor: "#F87171", glow: "rgba(248,113,113,0.25)" },
                    { href: "/news",       icon: Newspaper,  label: "Film News",    sub: "Latest updates",    iconColor: "#FB923C", glow: "rgba(251,146,60,0.25)" },
                  ].map(({ href, icon: Icon, label, sub, iconColor, glow }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setBrowseOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150"
                      style={{ color: "rgba(255,255,255,0.85)", textDecoration: "none" }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = `${iconColor}18`;
                        e.currentTarget.style.borderLeft = `2px solid ${iconColor}`;
                        e.currentTarget.style.paddingLeft = "10px";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.borderLeft = "none";
                        e.currentTarget.style.paddingLeft = "12px";
                      }}
                    >
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${iconColor}20`, border: `1px solid ${iconColor}55`, boxShadow: `0 0 12px ${glow}` }}>
                        <Icon className="w-[18px] h-[18px]" style={{ color: iconColor }} strokeWidth={2} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[13px] font-semibold leading-tight text-white">{label}</span>
                        <span className="text-[11px] leading-tight mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{sub}</span>
                      </div>
                    </Link>
                  ))}

                  {/* Divider */}
                  <div className="mx-3 my-2" style={{ height: "1px", background: "rgba(255,255,255,0.07)" }} />

                  {/* Stamp a Film */}
                  <button
                    onClick={() => { setBrowseOpen(false); setStampSearchOpen(true); }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-left w-full"
                    style={{ color: "rgba(255,255,255,0.85)" }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = "rgba(255,225,86,0.12)";
                      e.currentTarget.style.borderLeft = "2px solid #FFE156";
                      e.currentTarget.style.paddingLeft = "10px";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.borderLeft = "none";
                      e.currentTarget.style.paddingLeft = "12px";
                    }}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,225,86,0.15)", border: "1px solid rgba(255,225,86,0.4)", boxShadow: "0 0 12px rgba(255,225,86,0.2)" }}>
                      <CheckCircle className="w-[18px] h-[18px] text-yellow-300" strokeWidth={2} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[13px] font-semibold leading-tight text-white">Stamp a Film</span>
                      <span className="text-[11px] leading-tight mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Mark as watched</span>
                    </div>
                  </button>

                  {/* Release Radar */}
                  <Link
                    href="/radar"
                    onClick={() => setBrowseOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150"
                    style={{ color: "rgba(255,255,255,0.85)", textDecoration: "none" }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = "rgba(34,211,238,0.12)";
                      e.currentTarget.style.borderLeft = "2px solid #22D3EE";
                      e.currentTarget.style.paddingLeft = "10px";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.borderLeft = "none";
                      e.currentTarget.style.paddingLeft = "12px";
                    }}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 relative" style={{ background: "rgba(34,211,238,0.15)", border: "1px solid rgba(34,211,238,0.4)", boxShadow: "0 0 12px rgba(34,211,238,0.25)" }}>
                      <Radio className="w-[18px] h-[18px] text-cyan-400" strokeWidth={2} />
                      <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" style={{ boxShadow: "0 0 6px rgba(34,211,238,1)" }} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[13px] font-semibold leading-tight text-white">Release Radar</span>
                      <span className="text-[11px] leading-tight mt-0.5" style={{ color: "rgba(34,211,238,0.7)" }}>Live updates</span>
                    </div>
                  </Link>
                </div>

                {/* Footer glow strip */}
                <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(249,115,22,0.5), transparent)" }} />
              </div>
            ) : (
              /* BRUTALIST VERSION — unchanged */
              <div
                ref={browsePanelRef}
                id="browse-panel"
                role="dialog"
                aria-modal="true"
                aria-label="Browse navigation"
                className={`fixed right-0 top-0 h-full w-56 bg-bg border-l-3 border-brutal-border z-50 flex flex-col transition-transform duration-200 ${browseOpen ? "translate-x-0" : "translate-x-full"}`}
              >
                <div className="flex items-center justify-between px-4 py-4 border-b-3 border-brutal-border">
                  <span className="text-[10px] font-mono font-black tracking-[0.2em] text-brutal-dim uppercase">Explore</span>
                  <button onClick={() => { setBrowseOpen(false); browseButtonRef.current?.focus(); }} className="text-brutal-dim hover:text-brutal-white transition-colors">
                    <X className="w-4 h-4" strokeWidth={2.5} />
                  </button>
                </div>
                <div className="flex flex-col flex-1 overflow-y-auto">
                  {[
                    ...(SHOW_STREAMING ? [{ href: "/streaming", icon: Tv2, label: "STREAMING", color: "hover:text-brutal-yellow hover:bg-brutal-yellow/10" }] : []),
                    { href: "/swipe",           icon: Sparkles,   label: "CINESWIPE",       color: "hover:text-brutal-pink hover:bg-brutal-pink/10" },
                    { href: "/recommendations", icon: Sparkles,   label: "FOR YOU",         color: "hover:text-brutal-pink hover:bg-brutal-pink/10" },
                    { href: "/box-office",      icon: Trophy,     label: "BOX OFFICE",      color: "hover:text-brutal-lime hover:bg-brutal-lime/10" },
                    { href: "/collections",     icon: Box,        label: "FRANCHISE VAULT", color: "hover:text-brutal-violet hover:bg-brutal-violet/10" },
                    { href: "/cineblocks",      icon: LayoutGrid, label: "CINEBLOCKS",      color: "hover:text-brutal-cyan hover:bg-brutal-cyan/10" },
                    { href: "/blocks",          icon: Users,      label: "WATCH BLOCKS",    color: "hover:text-brutal-red hover:bg-brutal-red/10" },
                    { href: "/news",            icon: Newspaper,  label: "NEWS",            color: "hover:text-brutal-orange hover:bg-brutal-orange/10" },
                  ].map(({ href, icon: Icon, label, color }) => (
                    <Link key={href} href={href} onClick={() => setBrowseOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3.5 text-xs font-mono font-bold text-brutal-white border-b border-brutal-border/50 last:border-0 ${color} transition-colors`}>
                      <Icon className="w-4 h-4 shrink-0" strokeWidth={2.5} />{label}
                    </Link>
                  ))}
                  <button onClick={() => { setBrowseOpen(false); setStampSearchOpen(true); }}
                    className="flex items-center gap-3 px-4 py-3.5 text-xs font-mono font-bold text-brutal-white border-b border-brutal-border/50 hover:text-brutal-yellow hover:bg-brutal-yellow/10 transition-colors text-left">
                    <CheckCircle className="w-4 h-4 shrink-0" strokeWidth={2.5} />STAMP A FILM
                  </button>
                  <Link href="/radar" onClick={() => setBrowseOpen(false)}
                    className="flex items-center gap-3 px-4 py-3.5 text-xs font-mono font-bold text-brutal-white border-b border-brutal-border/50 hover:text-brutal-cyan hover:bg-brutal-cyan/10 transition-colors text-left relative group">
                    <Radio className="w-4 h-4 shrink-0 group-hover:animate-pulse" strokeWidth={2.5} />RELEASE RADAR
                    <div className="absolute top-1/2 -translate-y-1/2 right-4 w-2 h-2 bg-brutal-cyan rounded-full shadow-[0_0_8px_rgba(87,255,245,0.5)]" />
                  </Link>
                </div>
              </div>
            ), document.body)}
          </div>

          {/* FIND MOVIE — primary CTA */}
          <button
            onClick={() => setWizardOpen(true)}
            className="brutal-btn px-3 py-1.5 text-xs font-bold font-mono tracking-widest items-center gap-2 bg-surface border-brutal-border hover:bg-brutal-pink hover:text-black hover:border-brutal-pink hidden lg:flex"
            title="Find My Movie"
          >
            <Sparkles className="w-4 h-4" strokeWidth={2.5} />
            FIND MOVIE
          </button>

          {/* THEME toggle — desktop only; mobile toggle lives in Profile page */}
          <button
            onClick={toggleTheme}
            className={`hidden lg:flex brutal-btn p-1.5 sm:px-3 sm:py-1.5 text-xs font-bold font-mono uppercase tracking-widest items-center gap-1.5 transition-all ${
              currentTheme === "netflix"
                ? "bg-[#E50914] text-white border-[#E50914] hover:bg-brutal-yellow hover:text-black hover:border-brutal-yellow"
                : currentTheme === "glass"
                ? "bg-blue-500/20 text-blue-300 border-blue-500/40 hover:bg-blue-500/30 hover:border-blue-400"
                : "bg-surface border-brutal-border hover:bg-brutal-yellow hover:text-black hover:border-brutal-yellow"
            }`}
            title={`Theme: ${currentTheme} — click to cycle`}
          >
            <Palette className="w-4 h-4" strokeWidth={2.5} />
            <span className="hidden sm:inline-block">
              {currentTheme === "default" ? "THEME" : currentTheme === "netflix" ? "NETFLIX" : "GLASS"}
            </span>
          </button>

          <div className="hidden lg:block">
            <AuthButton />
          </div>
        </div>
      </div>

      {/* Filter Panel — only renders when open */}
      {showFilters && (
        <div className={`max-w-6xl mx-auto pb-3 sm:pb-4 animate-pop-in ${currentTheme === "glass" ? "px-0 sm:px-2 flex items-center gap-3" : "px-3 sm:px-6"}`}>

          {/* Left arc reactor — glass only */}
          {currentTheme === "glass" && (
            <div className="relative shrink-0 hidden sm:flex flex-col items-center gap-1 group">
              <button
                onClick={fireLeftReactor}
                title="Clear all filters"
                className="flex items-center justify-center rounded-full transition-transform duration-150 active:scale-90 focus:outline-none"
                style={{ width: 40, height: 40 }}
              >
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"
                style={{ filter: leftReactorFiring ? "drop-shadow(0 0 8px rgba(96,165,250,0.9))" : undefined }}
              >
                {/* Outer ring */}
                <circle cx="20" cy="20" r="18" stroke="rgba(96,165,250,0.25)" strokeWidth="1"/>
                {/* Mid ring */}
                <circle cx="20" cy="20" r="13" stroke="rgba(96,165,250,0.45)" strokeWidth="1">
                  <animate attributeName="opacity" values="0.45;0.9;0.45" dur="2s" repeatCount="indefinite"/>
                </circle>
                {/* Rotating dashes */}
                <circle cx="20" cy="20" r="10" stroke="rgba(96,165,250,0.35)" strokeWidth="1" strokeDasharray="6 4">
                  <animateTransform attributeName="transform" type="rotate" from="0 20 20" to="360 20 20" dur={leftReactorFiring ? "0.4s" : "6s"} repeatCount="indefinite"/>
                </circle>
                {/* Inner glow ring */}
                <circle cx="20" cy="20" r="6" fill="rgba(96,165,250,0.12)" stroke="rgba(96,165,250,0.7)" strokeWidth="1.2">
                  <animate attributeName="opacity" values="0.7;1;0.7" dur="1.6s" repeatCount="indefinite"/>
                </circle>
                {/* Core */}
                <circle cx="20" cy="20" r="3" fill="rgba(96,165,250,1)">
                  <animate attributeName="opacity" values="1;0.5;1" dur={leftReactorFiring ? "0.1s" : "1.6s"} repeatCount="indefinite"/>
                </circle>
                {/* Core glow */}
                <circle cx="20" cy="20" r="3" fill="rgba(96,165,250,0.6)" filter="url(#glow-l)"/>
                <defs>
                  <filter id="glow-l" x="-100%" y="-100%" width="300%" height="300%">
                    <feGaussianBlur stdDeviation="3" result="blur"/>
                    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                </defs>
              </svg>
              </button>
              <span className="text-[9px] font-display tracking-widest uppercase opacity-0 group-hover:opacity-60 transition-opacity duration-200" style={{ color: "#93C5FD" }}>RESET</span>
            </div>
          )}

          <div className={`${currentTheme === "glass" ? "flex-1 min-w-0 rounded-2xl" : "flex-1 min-w-0"}`}
            style={currentTheme === "glass" ? {
              background: "rgba(4,12,36,0.80)",
              backdropFilter: "blur(20px) saturate(150%)",
              border: "1px solid rgba(255,255,255,0.10)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
              padding: "10px 14px",
            } : undefined}
          >
            {/* ── Mobile: 3D wheel spinner ── */}
            <div className="sm:hidden">
              <MobileFilterWheel
                theme={currentTheme}
                defs={[
                  { key: "genre",    label: "GENRE",    value: genre,    options: GENRES.map((g) => ({ value: g.id.toString(), label: g.name })),       placeholder: "All Genres"    },
                  { key: "sort",     label: "SORT BY",  value: sort,     options: SORT_OPTIONS.map((s) => ({ value: s.value, label: s.label })),         placeholder: "Popular"       },
                  { key: "year",     label: "YEAR",     value: year,     options: years.map((y) => ({ value: y, label: y })),                            placeholder: "All Years"     },
                  { key: "language", label: "LANGUAGE", value: language, options: LANGUAGES.map((l) => ({ value: l.code, label: l.name })),              placeholder: "All Languages" },
                  { key: "rating",   label: "RATING",   value: rating,   options: [{ value: "7", label: "7+ Good" }, { value: "8", label: "8+ Great" }], placeholder: "Any Rating"    },
                  { key: "keyword",  label: "KEYWORD",  value: keyword,  options: KEYWORD_CHIPS.map((k) => ({ value: k.id.toString(), label: k.label })), placeholder: "Any Vibe"     },
                  { key: "runtime",  label: "RUNTIME",  value: runtime,  options: [{ value: "90", label: "< 90 min" }, { value: "120", label: "< 120 min" }], placeholder: "Any Length" },
                ]}
                onSelect={(key, value) => handleFilterChange(key, value)}
              />
            </div>

            {/* ── Desktop: grid / flex ── */}
            <div className={`hidden sm:${currentTheme === "glass" ? "flex" : "grid"} ${currentTheme === "glass"
              ? "gap-2"
              : "grid-cols-2 sm:grid-cols-4 md:grid-cols-7 xl:grid-cols-8 gap-4"
            }`}>
              <FilterSelect
                label="GENRE"
                value={genre}
                onChange={(v) => handleFilterChange("genre", v)}
                options={GENRES.map((g) => ({ value: g.id.toString(), label: g.name }))}
                placeholder="All Genres"
              />
              <FilterSelect
                label="YEAR"
                value={year}
                onChange={(v) => handleFilterChange("year", v)}
                options={years.map((y) => ({ value: y, label: y }))}
                placeholder="All Years"
              />
              <FilterSelect
                label="LANGUAGE"
                value={language}
                onChange={(v) => handleFilterChange("language", v)}
                options={LANGUAGES.map((l) => ({ value: l.code, label: l.name }))}
                placeholder="All Languages"
              />
              <FilterSelect
                label="SORT BY"
                value={sort}
                onChange={(v) => handleFilterChange("sort", v)}
                options={SORT_OPTIONS.map((s) => ({ value: s.value, label: s.label }))}
                placeholder="Popular"
              />
              <FilterSelect
                label="RATING"
                value={rating}
                onChange={(v) => handleFilterChange("rating", v)}
                options={[
                  { value: "7", label: "7+ (Good)" },
                  { value: "8", label: "8+ (Great)" }
                ]}
                placeholder="Any"
              />
              <FilterSelect
                label="RUNTIME"
                value={runtime}
                onChange={(v) => handleFilterChange("runtime", v)}
                options={[
                  { value: "90", label: "< 90m" },
                  { value: "120", label: "< 120m" }
                ]}
                placeholder="Any"
              />
              <FilterSelect
                label="KEYWORD"
                value={keyword}
                onChange={(v) => handleFilterChange("keyword", v)}
                options={KEYWORD_CHIPS.map((k) => ({ value: k.id.toString(), label: k.label }))}
                placeholder="Any"
              />
            </div>

            {hasActiveFilters && (
              <div className="mt-4 flex items-center justify-between border-t-2 border-brutal-border pt-3">
                <div className="flex flex-wrap gap-2">
                  {genre && (
                    <ActiveChip
                      label={GENRES.find((g) => g.id.toString() === genre)?.name || genre}
                      color="lime"
                      onRemove={() => handleFilterChange("genre", "")}
                    />
                  )}
                  {year && (
                    <ActiveChip label={year} color="cyan" onRemove={() => handleFilterChange("year", "")} />
                  )}
                  {language && (
                    <ActiveChip
                      label={LANGUAGES.find((l) => l.code === language)?.name || language}
                      color="pink"
                      onRemove={() => handleFilterChange("language", "")}
                    />
                  )}
                  {rating && (
                    <ActiveChip label={`Rating: ${rating}+`} color="lime" onRemove={() => handleFilterChange("rating", "")} />
                  )}
                  {runtime && (
                    <ActiveChip label={`Runtime: <${runtime}m`} color="cyan" onRemove={() => handleFilterChange("runtime", "")} />
                  )}
                  {keyword && (
                    <ActiveChip
                      label={KEYWORD_CHIPS.find((k) => k.id.toString() === keyword)?.label || keyword}
                      color="pink"
                      onRemove={() => handleFilterChange("keyword", "")}
                    />
                  )}
                </div>
                <button
                  onClick={clearAll}
                  className="brutal-chip text-brutal-red border-brutal-red hover:bg-brutal-red hover:text-black transition-colors"
                >
                  CLEAR ALL
                </button>
              </div>
            )}
          </div>

          {/* Right arc reactor — glass only */}
          {currentTheme === "glass" && (
            <div className="relative shrink-0 hidden sm:flex flex-col items-center gap-1 group">
              <button
                onClick={fireRightReactor}
                title="Randomize filters"
                className="flex items-center justify-center rounded-full transition-transform duration-150 active:scale-90 focus:outline-none"
                style={{ width: 40, height: 40 }}
              >
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"
                  style={{ filter: rightReactorFiring ? "drop-shadow(0 0 8px rgba(249,115,22,0.9))" : undefined }}
                >
                  <circle cx="20" cy="20" r="18" stroke="rgba(249,115,22,0.25)" strokeWidth="1"/>
                  <circle cx="20" cy="20" r="13" stroke="rgba(249,115,22,0.45)" strokeWidth="1">
                    <animate attributeName="opacity" values="0.45;0.9;0.45" dur="2s" begin="0.5s" repeatCount="indefinite"/>
                  </circle>
                  <circle cx="20" cy="20" r="10" stroke="rgba(249,115,22,0.35)" strokeWidth="1" strokeDasharray="6 4">
                    <animateTransform attributeName="transform" type="rotate" from="360 20 20" to="0 20 20" dur={rightReactorFiring ? "0.4s" : "6s"} repeatCount="indefinite"/>
                  </circle>
                  <circle cx="20" cy="20" r="6" fill="rgba(249,115,22,0.12)" stroke="rgba(249,115,22,0.7)" strokeWidth="1.2">
                    <animate attributeName="opacity" values="0.7;1;0.7" dur="1.6s" begin="0.4s" repeatCount="indefinite"/>
                  </circle>
                  <circle cx="20" cy="20" r="3" fill="rgba(249,115,22,1)">
                    <animate attributeName="opacity" values="1;0.5;1" dur={rightReactorFiring ? "0.1s" : "1.6s"} begin="0.4s" repeatCount="indefinite"/>
                  </circle>
                  <circle cx="20" cy="20" r="3" fill="rgba(249,115,22,0.6)" filter="url(#glow-r)"/>
                  <defs>
                    <filter id="glow-r" x="-100%" y="-100%" width="300%" height="300%">
                      <feGaussianBlur stdDeviation="3" result="blur"/>
                      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                  </defs>
                </svg>
              </button>
              <span className="text-[9px] font-display tracking-widest uppercase opacity-0 group-hover:opacity-60 transition-opacity duration-200" style={{ color: "#FB923C" }}>RANDOM</span>
            </div>
          )}
        </div>
      )}



      {/* ── Keyword picker popup (mobile only) ── */}
      {keywordPopupOpen && mounted && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[70] bg-black/60"
            onClick={() => setKeywordPopupOpen(false)}
          />
          {/* Bottom sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-[71] bg-bg border-t-3 border-brutal-border rounded-t-2xl max-h-[75svh] flex flex-col animate-slide-up">
            <div className="flex items-center justify-between px-4 py-3 border-b-2 border-brutal-border shrink-0">
              <span className="text-[11px] font-mono font-black tracking-[0.2em] uppercase text-brutal-dim">Keyword / Vibe</span>
              <button onClick={() => setKeywordPopupOpen(false)} className="text-brutal-dim hover:text-brutal-white transition-colors">
                <X className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>
            <div className="overflow-y-auto p-4 flex flex-wrap gap-2">
              {/* Clear chip */}
              <button
                onClick={() => { handleFilterChange("keyword", ""); setKeywordPopupOpen(false); }}
                className={`brutal-chip text-xs font-mono font-bold transition-colors ${!keyword ? "bg-brutal-yellow text-black border-brutal-yellow" : "text-brutal-dim border-brutal-border hover:text-brutal-white"}`}
              >
                ANY
              </button>
              {KEYWORD_CHIPS.map((k) => {
                const active = keyword === k.id.toString();
                return (
                  <button
                    key={k.id}
                    onClick={() => { handleFilterChange("keyword", active ? "" : k.id.toString()); setKeywordPopupOpen(false); }}
                    className={`brutal-chip text-xs font-mono font-bold transition-colors ${active ? "bg-brutal-lime text-black border-brutal-lime" : "text-brutal-white border-brutal-border hover:border-brutal-lime hover:text-brutal-lime"}`}
                  >
                    {k.label}
                  </button>
                );
              })}
            </div>
          </div>
        </>,
        document.body
      )}

      {wizardOpen && <FindMyMovieWizard onClose={() => setWizardOpen(false)} />}
      {stampSearchOpen && (
        <StampSearchModal
          isOpen={stampSearchOpen}
          onClose={() => setStampSearchOpen(false)}
        />
      )}
    </div>
  );
}

/* ─── Sub-components ──────────────────────────────── */

// ─── Mobile Filter Wheel ─────────────────────────────────────────────────────
type FilterKey = "genre" | "year" | "language" | "sort" | "rating" | "runtime" | "keyword";

interface WheelFilterDef {
  key: FilterKey;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  placeholder: string;
}

function MobileFilterWheel({
  defs,
  theme,
  onSelect,
}: {
  defs: WheelFilterDef[];
  theme: string;
  onSelect: (key: FilterKey, value: string) => void;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [dragX, setDragX] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchStartTime = useRef(0);
  const total = defs.length;
  const isGlass = theme === "glass";

  const go = (delta: number) =>
    setActiveIdx((prev) => ((prev + delta) % total + total) % total);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartTime.current = Date.now();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    setDragX(dx);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const velocity = Math.abs(dx) / Math.max(1, Date.now() - touchStartTime.current); // px/ms
    setDragX(0);
    if (Math.abs(dx) > 44 || velocity > 0.28) go(dx < 0 ? 1 : -1);
    touchStartX.current = null;
  };

  const isDragging = dragX !== 0;
  // How much to physically shift cards during drag (damped so they don't fly too far)
  const shift = dragX * 0.52;

  const active = defs[activeIdx];
  const prevDef = defs[((activeIdx - 1) + total) % total];
  const nextDef = defs[(activeIdx + 1) % total];

  const edgeBg = isGlass ? "4,12,36" : "10,10,10";

  const cardStyle = (isActive: boolean, hasValue: boolean): React.CSSProperties => ({
    borderRadius: 14,
    padding: "10px 14px",
    textAlign: "center",
    background: isActive
      ? (isGlass
          ? (hasValue ? "rgba(18,40,90,0.92)" : "rgba(12,25,60,0.88)")
          : (hasValue ? "#1c1c1c" : "#181818"))
      : (isGlass ? "rgba(8,16,40,0.70)" : "#131313"),
    border: isActive
      ? (hasValue
          ? (isGlass ? "1px solid rgba(96,165,250,0.55)" : "2px solid #FFE156")
          : (isGlass ? "1px solid rgba(255,255,255,0.22)" : "2px solid #444"))
      : (isGlass ? "1px solid rgba(255,255,255,0.09)" : "1px solid #2a2a2a"),
    backdropFilter: isActive && isGlass ? "blur(20px) saturate(180%)" : "none",
    WebkitBackdropFilter: isActive && isGlass ? "blur(20px) saturate(180%)" : "none",
    boxShadow: isActive
      ? (isGlass
          ? "0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.10)"
          : "0 4px 16px rgba(0,0,0,0.6)")
      : "none",
  });

  const renderCardContent = (def: WheelFilterDef, isActive: boolean) => {
    const displayValue = def.value
      ? (def.options.find((o) => o.value === def.value)?.label ?? def.value)
      : "Any";
    return (
      <>
        <div style={{
          fontSize: 8, letterSpacing: "0.20em", textTransform: "uppercase",
          fontFamily: "monospace", marginBottom: 5,
          color: isActive
            ? (isGlass ? "rgba(148,163,184,0.7)" : "rgba(255,255,255,0.45)")
            : (isGlass ? "rgba(148,163,184,0.35)" : "rgba(255,255,255,0.2)"),
        }}>
          {def.label}
        </div>
        <div style={{
          fontSize: 12, fontWeight: 700, fontFamily: "monospace",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          color: isActive
            ? (def.value
                ? (isGlass ? "#93C5FD" : "#FFE156")
                : (isGlass ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.85)"))
            : (isGlass ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.3)"),
        }}>
          {displayValue}
        </div>
      </>
    );
  };

  return (
    <div>
      {/* ── Wheel row ── */}
      <div
        className="relative select-none"
        style={{ height: 76, touchAction: "pan-y" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Outer clip wrapper — separate from 3D context so overflow:hidden doesn't flatten transforms */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 20 }}>
          {/* Left curved shadow */}
          <div className="absolute inset-y-0 left-0" style={{
            width: "32%",
            background: `radial-gradient(ellipse 130% 120% at 0% 50%, rgba(${edgeBg},1) 0%, rgba(${edgeBg},0.75) 40%, transparent 72%)`,
          }} />
          {/* Right curved shadow */}
          <div className="absolute inset-y-0 right-0" style={{
            width: "32%",
            background: `radial-gradient(ellipse 130% 120% at 100% 50%, rgba(${edgeBg},1) 0%, rgba(${edgeBg},0.75) 40%, transparent 72%)`,
          }} />
        </div>

        {/* 3D row — flex, no overflow clipping so 3D transforms are preserved */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 px-2">

          {/* Prev — curves INTO left, brightens when swiping right */}
          <button
            type="button"
            onClick={() => !isDragging && go(-1)}
            style={{
              flex: "0 0 100px", height: 58,
              transformOrigin: "right center",
              transform: `perspective(500px) rotateY(${42 - (dragX > 0 ? Math.min(dragX / 4, 38) : 0)}deg) scale(${0.82 + (dragX > 0 ? Math.min(dragX / 600, 0.16) : 0)}) translateX(${shift}px)`,
              transition: isDragging ? "none" : "transform 0.38s cubic-bezier(0.34,1.2,0.64,1), opacity 0.25s ease",
              opacity: Math.min(1, 0.55 + (dragX > 0 ? dragX / 140 : 0)),
              cursor: "pointer",
              ...cardStyle(false, !!prevDef.value),
            }}
          >
            {renderCardContent(prevDef, false)}
          </button>

          {/* Center — active, flat-facing, follows finger */}
          <div
            style={{
              flex: "1", maxWidth: 180, height: 62,
              transform: `translateX(${shift}px)`,
              transition: isDragging ? "none" : "transform 0.38s cubic-bezier(0.34,1.2,0.64,1), box-shadow 0.25s ease",
              zIndex: 10,
              ...cardStyle(true, !!active.value),
            }}
          >
            {renderCardContent(active, true)}
          </div>

          {/* Next — curves INTO right, brightens when swiping left */}
          <button
            type="button"
            onClick={() => !isDragging && go(1)}
            style={{
              flex: "0 0 100px", height: 58,
              transformOrigin: "left center",
              transform: `perspective(500px) rotateY(${-42 + (dragX < 0 ? Math.min(-dragX / 4, 38) : 0)}deg) scale(${0.82 + (dragX < 0 ? Math.min(-dragX / 600, 0.16) : 0)}) translateX(${shift}px)`,
              transition: isDragging ? "none" : "transform 0.38s cubic-bezier(0.34,1.2,0.64,1), opacity 0.25s ease",
              opacity: Math.min(1, 0.55 + (dragX < 0 ? -dragX / 140 : 0)),
              cursor: "pointer",
              ...cardStyle(false, !!nextDef.value),
            }}
          >
            {renderCardContent(nextDef, false)}
          </button>
        </div>
      </div>

      {/* ── Active filter selector below wheel ── */}
      <div style={{ marginTop: 10, padding: "0 2px" }}>
        <FilterSelect
          label={active.label}
          value={active.value}
          onChange={(v) => onSelect(active.key, v)}
          options={active.options}
          placeholder={active.placeholder}
        />
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  const theme = useThemeMode();
  const isGlass = theme === "glass";
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 180 });

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ref.current && !ref.current.contains(target)) setOpen(false);
    };
    const scrollHandler = () => setOpen(false);
    document.addEventListener("mousedown", handler);
    window.addEventListener("scroll", scrollHandler, { passive: true, capture: true });
    return () => {
      document.removeEventListener("mousedown", handler);
      window.removeEventListener("scroll", scrollHandler, { capture: true });
    };
  }, [open]);

  const handleToggle = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropW = Math.max(rect.width, 200);
      // keep dropdown within viewport
      const left = Math.min(rect.left, window.innerWidth - dropW - 8);
      setDropdownPos({ top: rect.bottom + 6, left: Math.max(8, left), width: dropW });
    }
    setOpen(v => !v);
  };

  const selectedLabel = options.find((o) => o.value === value)?.label ?? placeholder;

  if (isGlass) {
    const dropdownEl = open && mounted ? createPortal(
      <div
        ref={ref}
        style={{
          position: "fixed",
          top: dropdownPos.top,
          left: dropdownPos.left,
          width: dropdownPos.width,
          zIndex: 9999,
          background: "rgba(4,12,36,0.97)",
          border: "1px solid rgba(96,165,250,0.20)",
          backdropFilter: "blur(28px) saturate(180%)",
          WebkitBackdropFilter: "blur(28px) saturate(180%)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        <div className="max-h-60 overflow-y-auto py-1 scrollbar-thin">
          <button
            type="button"
            onClick={() => { onChange(""); setOpen(false); }}
            className="w-full text-left px-3 py-2.5 text-xs font-display transition-colors duration-100"
            style={{
              color: !value ? "#93C5FD" : "rgba(148,163,184,0.7)",
              background: !value ? "rgba(96,165,250,0.10)" : "transparent",
            }}
          >
            {placeholder}
          </button>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className="w-full text-left px-3 py-2.5 text-xs font-display transition-colors duration-100"
              style={{
                color: value === opt.value ? "#93C5FD" : "rgba(148,163,184,0.7)",
                background: value === opt.value ? "rgba(96,165,250,0.10)" : "transparent",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>,
      document.body
    ) : null;

    return (
      <div className="w-full">
        <label className="block text-[10px] font-display font-bold uppercase tracking-[0.15em] mb-1.5 text-slate-500">
          {label}
        </label>
        <button
          ref={buttonRef}
          type="button"
          onClick={handleToggle}
          className="w-full flex items-center justify-between gap-1.5 px-3 py-2.5 text-xs rounded-xl transition-all duration-200 focus:outline-none"
          style={{
            background: value ? "rgba(96,165,250,0.12)" : "rgba(255,255,255,0.06)",
            border: value ? "1px solid rgba(96,165,250,0.38)" : "1px solid rgba(255,255,255,0.10)",
            color: value ? "#93C5FD" : "rgba(148,163,184,0.75)",
            backdropFilter: "blur(8px)",
          }}
        >
          <span className="font-display truncate">{selectedLabel}</span>
          <ChevronDown
            className="ml-1 shrink-0 w-3.5 h-3.5 transition-transform duration-200"
            style={{
              color: value ? "#93C5FD" : "rgba(100,116,139,0.8)",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
            }}
            strokeWidth={2}
          />
        </button>
        {dropdownEl}
      </div>
    );
  }

  return (
    <div>
      <label className="block text-[10px] font-mono font-bold uppercase tracking-[0.15em] mb-1.5 text-brutal-muted">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="brutal-select font-mono w-full px-3 py-2 pr-8 text-xs sm:text-sm"
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <ChevronDown
          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-brutal-dim"
          strokeWidth={3}
        />
      </div>
    </div>
  );
}

function ActiveChip({
  label,
  color,
  onRemove,
}: {
  label: string;
  color: "lime" | "cyan" | "pink";
  onRemove: () => void;
}) {
  const colorMap = {
    lime: "border-brutal-lime text-brutal-lime",
    cyan: "border-brutal-cyan text-brutal-cyan",
    pink: "border-brutal-pink text-brutal-pink",
  };

  return (
    <span className={`brutal-chip inline-flex items-center gap-1.5 ${colorMap[color]}`}>
      {label.toUpperCase()}
      <button onClick={onRemove} className="hover:opacity-60 transition-opacity">
        <X className="w-3 h-3" strokeWidth={3} />
      </button>
    </span>
  );
}
