"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, SlidersHorizontal, X, ChevronDown, Command, Dices, Palette, Trophy, Tv2, Box, Sparkles, Newspaper, Users } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { GENRES, LANGUAGES, SORT_OPTIONS, generateYearRange } from "@/lib/constants";
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
  const [showFilters, setShowFilters] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [isNetflixTheme, setIsNetflixTheme] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const browseRef = useRef<HTMLDivElement>(null);
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
    const handleClickOutside = (e: MouseEvent) => {
      if (browseRef.current && !browseRef.current.contains(e.target as Node)) {
        setBrowseOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const emitFilters = useCallback(
    (q: string, g: string, y: string, l: string, s: string, rat: string, run: string) => {
      onFilterChange({ query: q, genre: g, year: y, language: l, sort: s, rating: rat, runtime: run });
    },
    [onFilterChange]
  );

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      emitFilters(value, genre, year, language, sort, rating, runtime);
    }, 350);
  };

  const handleFilterChange = (
    key: "genre" | "year" | "language" | "sort" | "rating" | "runtime",
    value: string
  ) => {
    const newState = { query, genre, year, language, sort, rating, runtime, [key]: value };
    if (key === "genre") setGenre(value);
    if (key === "year") setYear(value);
    if (key === "language") setLanguage(value);
    if (key === "sort") setSort(value);
    if (key === "rating") setRating(value);
    if (key === "runtime") setRuntime(value);
    emitFilters(newState.query, newState.genre, newState.year, newState.language, newState.sort, newState.rating, newState.runtime);
  };

  const clearAll = () => {
    setQuery("");
    setGenre("");
    setYear("");
    setLanguage("");
    setSort("popularity.desc");
    setRating("");
    setRuntime("");
    emitFilters("", "", "", "", "popularity.desc", "", "");
  };

  const hasActiveFilters = genre || year || language || sort !== "popularity.desc" || rating || runtime;

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
              onClick={() => setBrowseOpen((o) => !o)}
              className={`brutal-btn px-3 py-1.5 text-xs font-bold font-mono tracking-widest flex items-center gap-2 ${
                browseOpen
                  ? "!border-brutal-yellow !text-brutal-yellow"
                  : "bg-surface border-brutal-border hover:bg-brutal-yellow hover:text-black hover:border-brutal-yellow"
              }`}
            >
              <Box className="w-4 h-4" strokeWidth={2.5} />
              BROWSE
              <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${browseOpen ? "rotate-180" : ""}`} strokeWidth={3} />
            </button>

            {browseOpen && (
              <div className="absolute right-0 top-[calc(100%+6px)] w-[480px] bg-bg border-3 border-brutal-border shadow-brutal z-50 animate-pop-in p-4">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-brutal-border">
                  <div className="w-1.5 h-1.5 bg-brutal-yellow"></div>
                  <h4 className="text-[10px] font-mono font-black tracking-[0.2em] text-brutal-dim uppercase">Explore Cineblock</h4>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ...(SHOW_STREAMING ? [{ href: "/streaming", icon: Tv2, label: "STREAMING", desc: "Find platforms to watch your favorites", accent: "hover:border-brutal-yellow", color: "text-brutal-yellow" }] : []),
                    { href: "/recommendations", icon: Sparkles,    label: "FOR YOU", desc: "Personalized movie picks", accent: "hover:border-brutal-pink", color: "text-brutal-pink" },
                    { href: "/box-office", icon: Trophy,    label: "BOX OFFICE", desc: "Top grossing films worldwide", accent: "hover:border-brutal-lime", color: "text-brutal-lime" },
                    { href: "/collections",icon: Box,       label: "FRANCHISE VAULT", desc: "Explore cinematic universes", accent: "hover:border-brutal-violet", color: "text-brutal-violet" },
                    { href: "/news",       icon: Newspaper, label: "NEWS", desc: "Latest headlines & updates", accent: "hover:border-brutal-orange", color: "text-brutal-orange" },
                  ].map(({ href, icon: Icon, label, desc, accent, color }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setBrowseOpen(false)}
                      className={`flex items-start gap-3 p-3 bg-surface border-2 border-transparent ${accent} transition-all group`}
                    >
                      <div className={`p-2 bg-black border border-brutal-border group-hover:border-white transition-colors`}>
                        <Icon className={`w-5 h-5 ${color} shrink-0`} strokeWidth={2.5} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className={`text-xs font-display font-black tracking-wider text-brutal-white group-hover:${color} transition-colors uppercase`}>
                          {label}
                        </span>
                        <span className="text-[9px] font-mono text-brutal-dim leading-tight">
                          {desc}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ROOMS — standalone, social feature */}
          <Link
            href="/blocks"
            className="brutal-btn px-3 py-1.5 text-xs font-bold font-mono tracking-widest items-center gap-2 bg-surface border-brutal-border hover:bg-brutal-violet hover:text-black hover:border-brutal-violet hidden lg:flex"
            title="Watch Blocks"
          >
            <Users className="w-4 h-4" strokeWidth={2.5} />
            BLOCKS
          </Link>

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
            className={`hidden lg:flex brutal-btn p-1.5 sm:px-3 sm:py-1.5 text-xs font-bold font-mono uppercase tracking-widest items-center gap-1.5 ${
              isNetflixTheme
                ? "bg-[#E50914] text-white border-[#E50914]"
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-4">
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
