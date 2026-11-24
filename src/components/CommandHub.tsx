"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Search, SlidersHorizontal, X, ChevronDown, ChevronRight, Dices, Trophy, Box, Newspaper, Users, LayoutGrid, Radio, Compass, Flame, Clapperboard, Stamp, type LucideIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { GENRES, LANGUAGES, SORT_OPTIONS, generateYearRange } from "@/lib/constants";
import { KEYWORD_CHIPS } from "./FindMyMovie/StepKeywords";
import AuthButton from "./AuthButton";
import FindMyMovieWizard from "./FindMyMovie/FindMyMovieWizard";
import { useThemeMode } from "@/hooks/useThemeMode";

const BROWSE_SECTIONS: { title?: string; items: { href: string; icon: LucideIcon; tone: string; label: string; sub: string }[] }[] = [
  {
    title: "Discover",
    items: [
      { href: "/swipe", icon: Flame, tone: "#FB923C", label: "CineSwipe", sub: "Swipe through new picks" },
      { href: "/recommendations", icon: Compass, tone: "#FB7185", label: "For you", sub: "Based on what you liked" },
      { href: "/box-office", icon: Trophy, tone: "#FBBF24", label: "Box office", sub: "This week’s top earners" },
      { href: "/collections", icon: Box, tone: "#38BDF8", label: "Franchise Vault", sub: "Series and universes" },
    ],
  },
  {
    title: "Community",
    items: [
      { href: "/cineblocks", icon: LayoutGrid, tone: "#60A5FA", label: "CineBlocks", sub: "Lists you can share" },
      { href: "/blocks", icon: Users, tone: "#34D399", label: "Watch Blocks", sub: "Plan a watch with friends" },
      { href: "/news", icon: Newspaper, tone: "#22D3EE", label: "Film news", sub: "Today’s headlines" },
    ],
  },
  {
    items: [
      { href: "/stamps", icon: Stamp, tone: "#2DD4BF", label: "Stamps", sub: "Write how a film felt" },
      { href: "/radar", icon: Radio, tone: "#F87171", label: "Release Radar", sub: "Upcoming releases" },
    ],
  },
];

// ─── Feature Flags ────────────────────────────────────────────────────────────

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
  const currentTheme = useThemeMode();
  const [browseOpen, setBrowseOpen] = useState(false);
  const [keywordPopupOpen, setKeywordPopupOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [shortcutKey, setShortcutKey] = useState<string | null>(null);
  useEffect(() => {
    queueMicrotask(() => setShortcutKey(/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl"));
  }, []);
  const [scrolled, setScrolled] = useState(false);
  const [leftReactorFiring, setLeftReactorFiring] = useState(false);
  const [rightReactorFiring, setRightReactorFiring] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

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
  }, [clearAll]);

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
          <Image src="/brand/cineblock-icon-256.png" alt="CineBlock" width={40} height={40} className="w-10 h-10 object-contain" unoptimized />
        </Link>

        {/* Search bar — grows to fill middle */}
        <div className="group flex min-h-11 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] pl-3 pr-1.5 backdrop-blur-md transition-colors duration-150 hover:border-white/20 focus-within:border-blue-400/55 focus-within:bg-white/[0.08] sm:pl-4">
          <Search className="h-4 w-4 shrink-0 text-slate-500 transition-colors duration-150 group-focus-within:text-blue-300" strokeWidth={2.25} />
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search movies and shows…"
            aria-label="Search movies and shows"
            className="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-slate-500 sm:text-sm [&::-webkit-search-cancel-button]:hidden"
            id="search-input"
          />
          {query ? (
            <button
              type="button"
              onClick={() => { handleQueryChange(""); searchRef.current?.focus(); }}
              aria-label="Clear search"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" strokeWidth={2.25} />
            </button>
          ) : (
            shortcutKey && (
              <kbd className="hidden shrink-0 items-center rounded-md border border-white/10 bg-white/[0.05] px-1.5 py-0.5 font-sans text-[11px] text-slate-500 sm:flex">
                {shortcutKey} K
              </kbd>
            )
          )}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            id="filter-toggle"
            aria-label="Filters"
            aria-pressed={showFilters}
            title="Filters"
            className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.94] ${
              showFilters || hasActiveFilters
                ? "border-blue-400/45 bg-blue-400/20 text-blue-200"
                : "border-transparent text-slate-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" strokeWidth={2.25} />
            {hasActiveFilters && !showFilters && <span aria-hidden="true" className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-orange-400" />}
          </button>
          {onSurpriseMe && (
            <button
              type="button"
              onClick={onSurpriseMe}
              aria-label="Surprise me with a random movie"
              title="Surprise me"
              className="group/dice hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg text-orange-300 transition-[background-color,transform] duration-150 hover:bg-orange-400/15 active:scale-[0.94] sm:flex"
            >
              <Dices className="h-4 w-4 transition-transform duration-200 group-hover/dice:rotate-12" strokeWidth={2.25} />
            </button>
          )}
        </div>

        {/* Right side controls — desktop only (mobile uses bottom nav) */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">

          {/* Browse panel */}
          <div ref={browseRef} className="relative hidden lg:block">
            <button
              ref={browseButtonRef}
              type="button"
              onClick={() => setBrowseOpen((o) => !o)}
              aria-expanded={browseOpen}
              aria-controls="browse-panel"
              className={`flex min-h-10 items-center gap-2 rounded-xl border px-3.5 text-sm font-medium transition-colors duration-150 ${
                browseOpen ? "border-blue-400/45 bg-blue-400/15 text-white" : "border-white/10 bg-white/[0.05] text-slate-200 hover:border-white/20 hover:text-white"
              }`}
            >
              <Box className="h-4 w-4" strokeWidth={2} />
              Browse
              <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${browseOpen ? "rotate-180" : ""}`} strokeWidth={2.5} />
            </button>

            {/* Frosts the page behind the open panel; a click on it closes the panel. */}
            {mounted && createPortal(
              <div
                aria-hidden="true"
                className={`fixed inset-0 transition-opacity duration-300 ${browseOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
                style={{ zIndex: 110, background: "rgba(2,8,23,0.45)", backdropFilter: "blur(8px) saturate(120%)", WebkitBackdropFilter: "blur(8px) saturate(120%)" }}
                onClick={() => { setBrowseOpen(false); browseButtonRef.current?.focus(); }}
              />, document.body
            )}
            {mounted && createPortal(
              <div
                ref={browsePanelRef}
                id="browse-panel"
                role="dialog"
                aria-modal="true"
                aria-label="Explore"
                className={`fixed right-0 top-0 flex h-full w-72 flex-col transition-[transform,visibility] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${browseOpen ? "visible translate-x-0" : "invisible translate-x-full"}`}
                style={{
                  zIndex: 120,
                  background: "rgba(4, 10, 30, 0.94)",
                  backdropFilter: "blur(40px) saturate(180%)",
                  WebkitBackdropFilter: "blur(40px) saturate(180%)",
                  borderLeft: "1px solid rgba(255,255,255,0.10)",
                  boxShadow: "-32px 0 80px rgba(0,0,0,0.7)",
                }}
              >
                <div className="flex items-center justify-between px-6 pb-3 pt-5">
                  <h2 className="font-display !text-lg font-semibold text-white">Explore</h2>
                  <button
                    type="button"
                    onClick={() => { setBrowseOpen(false); browseButtonRef.current?.focus(); }}
                    aria-label="Close"
                    className="-mr-2 flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-colors duration-150 hover:bg-white/10 hover:text-white"
                  >
                    <X className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>

                <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 pb-6">
                  {BROWSE_SECTIONS.map(({ title, items }) => (
                    <div key={title ?? "more"} className="flex flex-col gap-0.5">
                      {title && <p className="px-3 pb-1 text-xs font-medium text-slate-500">{title}</p>}
                      {items.map(({ href, icon: Icon, tone, label, sub }) => (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setBrowseOpen(false)}
                          className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-150 hover:bg-white/[0.06] focus-visible:bg-white/[0.06]"
                        >
                          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl" style={{ color: tone, background: `${tone}14`, boxShadow: `inset 0 0 0 1px ${tone}33` }}>
                            <span aria-hidden="true" className="absolute inset-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100" style={{ background: `${tone}1F` }} />
                            <Icon className="relative h-[18px] w-[18px]" strokeWidth={2} />
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="text-sm font-semibold leading-tight text-white">{label}</span>
                            <span className="mt-0.5 text-xs leading-tight text-slate-400">{sub}</span>
                          </span>
                          <ChevronRight className="h-4 w-4 shrink-0 -translate-x-1 text-slate-500 opacity-0 transition-[opacity,transform] duration-150 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100" strokeWidth={2} />
                        </Link>
                      ))}
                    </div>
                  ))}
                </nav>
              </div>
            , document.body)}
          </div>

          <button
            type="button"
            onClick={() => setWizardOpen(true)}
            className="hidden min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3.5 text-sm font-medium text-slate-200 transition-colors duration-150 hover:border-white/20 hover:text-white lg:flex"
          >
            <Clapperboard className="h-4 w-4" strokeWidth={2} />
            Find a movie
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
                aria-label="Clear all filters"
                className="flex items-center justify-center rounded-full transition-transform duration-150 active:scale-90"
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
                aria-label="Randomize filters"
                className="flex items-center justify-center rounded-full transition-transform duration-150 active:scale-90"
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
            role="button"
            tabIndex={0}
            aria-label="Close"
            className="fixed inset-0 z-[70] bg-black/60"
            onClick={() => setKeywordPopupOpen(false)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setKeywordPopupOpen(false); } }}
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

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

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
          className="w-full flex items-center justify-between gap-1.5 px-3 py-2.5 text-xs rounded-xl transition-all duration-200"
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
