"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, SlidersHorizontal, X, ChevronDown, Command, Dices, Palette, Trophy, Tv2, Box, Sparkles, Newspaper, Users, LayoutGrid } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { GENRES, LANGUAGES, SORT_OPTIONS, generateYearRange } from "@/lib/constants";
import { KEYWORD_CHIPS } from "./FindMyMovie/StepKeywords";
import AuthButton from "./AuthButton";
import FindMyMovieWizard from "./FindMyMovie/FindMyMovieWizard";

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
  const [isNetflixTheme, setIsNetflixTheme] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const browseRef = useRef<HTMLDivElement>(null);
  const browseButtonRef = useRef<HTMLButtonElement>(null);
  const browsePanelRef = useRef<HTMLDivElement>(null);
  const years = generateYearRange();

  // Clean up pending debounce on unmount to prevent memory leaks
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  useEffect(() => {
    // Load theme setting
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "netflix") {
      setIsNetflixTheme(true);
      document.body.classList.add("theme-netflix");
    }
  }, []);

  const toggleTheme = () => {
    setIsNetflixTheme((prev) => {
      const next = !prev;
      if (next) {
        document.body.classList.add("theme-netflix");
        localStorage.setItem("theme", "netflix");
      } else {
        document.body.classList.remove("theme-netflix");
        localStorage.setItem("theme", "default");
      }
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
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const emitFilters = useCallback(
    (q: string, g: string, y: string, l: string, s: string, rat: string, run: string, kw: string) => {
      onFilterChange({ query: q, genre: g, year: y, language: l, sort: s, rating: rat, runtime: run, keyword: kw });
    },
    [onFilterChange]
  );

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

  const clearAll = () => {
    setQuery("");
    setGenre("");
    setYear("");
    setLanguage("");
    setSort("popularity.desc");
    setRating("");
    setRuntime("");
    setKeyword("");
    emitFilters("", "", "", "", "popularity.desc", "", "", "");
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
    <div className="sticky top-0 z-50 w-full bg-bg">
      {/* Single compact bar: logo | search | controls */}
      <div className="w-full px-3 sm:px-6 py-3 flex items-center gap-2 sm:gap-3">
        {/* Logo — left */}
        <Link href="/" className="hidden sm:block shrink-0" title="CineBlock">
          <Image src="/logo.png" alt="CineBlock" width={128} height={128} className="w-32 h-32 object-contain -my-6" />
        </Link>

        {/* Search bar — grows to fill middle */}
        <div className="brutal-input flex items-center px-4 py-2 flex-1 focus-within:border-brutal-yellow focus-within:shadow-brutal-accent">
          <Search className="w-4 h-4 text-brutal-dim mr-2 flex-shrink-0" strokeWidth={2.5} />
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search movies..."
            className="flex-1 bg-transparent text-brutal-white text-sm font-body placeholder:text-brutal-dim outline-none"
            id="search-input"
          />
          <div className="hidden sm:flex items-center gap-1 ml-3 brutal-chip text-brutal-dim px-2 py-0.5 text-[10px]">
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`ml-2 brutal-btn px-2 py-1.5 ${
              showFilters || hasActiveFilters
                ? "!border-brutal-lime !shadow-brutal-lime !text-brutal-lime"
                : ""
            }`}
            id="filter-toggle"
            aria-label="Toggle filters"
          >
            <SlidersHorizontal className="w-4 h-4" strokeWidth={2.5} />
          </button>

          {onSurpriseMe && (
            <button
              onClick={onSurpriseMe}
              className="ml-2 hidden sm:flex brutal-btn px-2 py-1.5 !bg-brutal-yellow !text-black !border-brutal-yellow hover:scale-105 active:scale-95 transition-transform group"
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
            {browseOpen && (
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
              />
            )}
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
                  { href: "/recommendations", icon: Sparkles,   label: "FOR YOU",         color: "hover:text-brutal-pink hover:bg-brutal-pink/10" },
                  { href: "/box-office",      icon: Trophy,     label: "BOX OFFICE",      color: "hover:text-brutal-lime hover:bg-brutal-lime/10" },
                  { href: "/collections",     icon: Box,        label: "FRANCHISE VAULT", color: "hover:text-brutal-violet hover:bg-brutal-violet/10" },
                  { href: "/cineblocks",      icon: LayoutGrid, label: "CINEBLOCKS",      color: "hover:text-brutal-cyan hover:bg-brutal-cyan/10" },
                  { href: "/cineblocks/discover", icon: Users,  label: "DISCOVER BLOCKS", color: "hover:text-brutal-yellow hover:bg-brutal-yellow/10" },
                  { href: "/blocks",          icon: Users,      label: "WATCH BLOCKS",    color: "hover:text-brutal-red hover:bg-brutal-red/10" },
                  { href: "/news",            icon: Newspaper,  label: "NEWS",            color: "hover:text-brutal-orange hover:bg-brutal-orange/10" },
                ].map(({ href, icon: Icon, label, color }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setBrowseOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3.5 text-xs font-mono font-bold text-brutal-white border-b border-brutal-border/50 last:border-0 ${color} transition-colors`}
                  >
                    <Icon className="w-4 h-4 shrink-0" strokeWidth={2.5} />
                    {label}
                  </Link>
                ))}
              </div>
            </div>
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
              isNetflixTheme
                ? "bg-[#E50914] text-white border-[#E50914] hover:bg-brutal-yellow hover:text-black hover:border-brutal-yellow"
                : "bg-surface border-brutal-border hover:bg-brutal-yellow hover:text-black hover:border-brutal-yellow"
            }`}
            title="Toggle Theme"
          >
            <Palette className="w-4 h-4" strokeWidth={2.5} />
            <span className="hidden sm:inline-block">THEME</span>
          </button>

          <div className="hidden lg:block">
            <AuthButton />
          </div>
        </div>
      </div>

      {/* Filter Panel — only renders when open */}
      {showFilters && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-4">
          <div className="bg-surface border-3 border-brutal-border p-4 shadow-brutal animate-pop-in">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 xl:grid-cols-8 gap-4">
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
        </div>
      )}



      {wizardOpen && <FindMyMovieWizard onClose={() => setWizardOpen(false)} />}
    </div>
  );
}

/* ─── Sub-components ──────────────────────────────── */

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
  return (
    <div>
      <label className="block text-[10px] font-mono font-bold text-brutal-muted uppercase tracking-[0.15em] mb-1.5">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="brutal-select w-full px-3 py-2 pr-8 text-sm font-mono"
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brutal-dim pointer-events-none" strokeWidth={3} />
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
