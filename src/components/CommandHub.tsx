"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, SlidersHorizontal, X, ChevronDown, Command, Dices, Palette, Trophy, Tv2, Box, Sparkles, Newspaper, Users } from "lucide-react";
import Link from "next/link";
import { GENRES, LANGUAGES, SORT_OPTIONS, generateYearRange } from "@/lib/constants";
import AuthButton from "./AuthButton";
import FindMyMovieWizard from "./FindMyMovie/FindMyMovieWizard";

interface CommandHubProps {
  onFilterChange: (filters: {
    query: string;
    genre: string;
    year: string;
    language: string;
    sort: string;
    rating: string;
    runtime: string;
    adult: boolean;
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
  const [adult, setAdult] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [isNetflixTheme, setIsNetflixTheme] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const browseRef = useRef<HTMLDivElement>(null);
  const years = generateYearRange();

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
    (q: string, g: string, y: string, l: string, s: string, rat: string, run: string, a: boolean) => {
      onFilterChange({ query: q, genre: g, year: y, language: l, sort: s, rating: rat, runtime: run, adult: a });
    },
    [onFilterChange]
  );

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      emitFilters(value, genre, year, language, sort, rating, runtime, adult);
    }, 350);
  };

  const handleFilterChange = (
    key: "genre" | "year" | "language" | "sort" | "rating" | "runtime" | "adult",
    value: string | boolean
  ) => {
    const newState = { query, genre, year, language, sort, rating, runtime, adult, [key]: value };
    if (key === "genre") setGenre(value as string);
    if (key === "year") setYear(value as string);
    if (key === "language") setLanguage(value as string);
    if (key === "sort") setSort(value as string);
    if (key === "rating") setRating(value as string);
    if (key === "runtime") setRuntime(value as string);
    if (key === "adult") setAdult(value as boolean);
    emitFilters(newState.query, newState.genre, newState.year, newState.language, newState.sort, newState.rating, newState.runtime, newState.adult);
  };

  const clearAll = () => {
    setQuery("");
    setGenre("");
    setYear("");
    setLanguage("");
    setSort("popularity.desc");
    setRating("");
    setRuntime("");
    setAdult(false);
    emitFilters("", "", "", "", "popularity.desc", "", "", false);
  };

  const hasActiveFilters = genre || year || language || sort !== "popularity.desc" || rating || runtime || adult;

  return (
    <div className="sticky top-0 z-50 w-full bg-bg">
      {/* Single compact bar: logo | search | controls */}
      <div className="w-full px-4 sm:px-6 py-3 flex items-center gap-3">
        {/* Logo — left */}
        <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight select-none shrink-0" title="CineBlock">
          <span className="text-brutal-white">CINE</span>
          <span className="text-brutal-yellow">BLOCK</span>
        </h1>

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
              className="ml-2 brutal-btn px-2 py-1.5 !bg-brutal-yellow !text-black !border-brutal-yellow hover:scale-105 active:scale-95 transition-transform group"
              title="Surprise Me!"
            >
              <Dices className="w-4 h-4 group-hover:rotate-12 transition-transform" strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 shrink-0">

          {/* BROWSE dropdown — Streaming, Box Office, Collections, News */}
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
              <div className="absolute right-0 top-[calc(100%+6px)] w-52 bg-bg border-3 border-brutal-border shadow-brutal z-50 animate-pop-in">
                {[
                  { href: "/streaming",  icon: Tv2,       label: "STREAMING",   accent: "hover:border-l-brutal-yellow",  color: "text-brutal-yellow"  },
                  { href: "/box-office", icon: Trophy,    label: "BOX OFFICE",  accent: "hover:border-l-brutal-lime",    color: "text-brutal-lime"    },
                  { href: "/collections",icon: Box,       label: "COLLECTIONS", accent: "hover:border-l-brutal-violet",  color: "text-brutal-violet"  },
                  { href: "/news",       icon: Newspaper, label: "NEWS",        accent: "hover:border-l-brutal-orange",  color: "text-brutal-orange"  },
                ].map(({ href, icon: Icon, label, color }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setBrowseOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 border-b-2 border-brutal-border last:border-b-0 hover:bg-surface transition-colors group"
                  >
                    <Icon className={`w-4 h-4 ${color} shrink-0`} strokeWidth={2.5} />
                    <span className={`text-xs font-mono font-black tracking-widest text-brutal-dim group-hover:${color} transition-colors`}>
                      {label}
                    </span>
                  </Link>
                ))}
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

          {/* THEME toggle */}
          <button
            onClick={toggleTheme}
            className={`brutal-btn p-1.5 sm:px-3 sm:py-1.5 text-xs font-bold font-mono uppercase tracking-widest flex items-center gap-1.5 ${
              isNetflixTheme
                ? "bg-[#E50914] text-white border-[#E50914]"
                : "bg-surface border-brutal-border hover:bg-brutal-yellow hover:text-black hover:border-brutal-yellow"
            }`}
            title="Toggle Theme"
          >
            <Palette className="w-4 h-4" strokeWidth={2.5} />
            <span className="hidden sm:inline-block">THEME</span>
          </button>

          <AuthButton />
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
              <FilterSelect
                label="ADULT CONTENT"
                value={adult ? "true" : ""}
                onChange={(v) => handleFilterChange("adult", v === "true")}
                options={[
                  { value: "true", label: "Yes" }
                ]}
                placeholder="No"
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
                  {adult && (
                    <ActiveChip label="Adult: Yes" color="pink" onRemove={() => handleFilterChange("adult", false)} />
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

      {/* Hard border line */}
      <div className="h-[3px] bg-brutal-border" />

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
