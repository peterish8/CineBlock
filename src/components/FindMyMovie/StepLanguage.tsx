"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X, Plus, Check } from "lucide-react";

interface StepLanguageProps {
  value: string[];
  onChange: (langs: string[]) => void;
}

type Language = {
  code: string;
  native: string;
  english: string;
  flag: string;
};

const ALL_LANGUAGES: Language[] = [
  { code: "any", native: "Any Language", english: "", flag: "🌐" },
  { code: "en", native: "English", english: "English", flag: "🇬🇧" },
  { code: "hi", native: "Hindi", english: "Hindi", flag: "🇮🇳" },
  { code: "ta", native: "Tamil", english: "Tamil", flag: "🇮🇳" },
  { code: "te", native: "Telugu", english: "Telugu", flag: "🇮🇳" },
  { code: "ml", native: "Malayalam", english: "Malayalam", flag: "🇮🇳" },
  { code: "kn", native: "Kannada", english: "Kannada", flag: "🇮🇳" },
  { code: "es", native: "Espanol", english: "Spanish", flag: "🇪🇸" },
  { code: "fr", native: "Francais", english: "French", flag: "🇫🇷" },
  { code: "de", native: "Deutsch", english: "German", flag: "🇩🇪" },
  { code: "it", native: "Italiano", english: "Italian", flag: "🇮🇹" },
  { code: "ja", native: "Nihongo", english: "Japanese", flag: "🇯🇵" },
  { code: "ko", native: "Hanguk-eo", english: "Korean", flag: "🇰🇷" },
  { code: "zh", native: "Zhongwen", english: "Chinese", flag: "🇨🇳" },
  { code: "pt", native: "Portugues", english: "Portuguese", flag: "🇵🇹" },
  { code: "ru", native: "Russkiy", english: "Russian", flag: "🇷🇺" },
  { code: "ar", native: "Arabiyyah", english: "Arabic", flag: "🇸🇦" },
  { code: "tr", native: "Turkce", english: "Turkish", flag: "🇹🇷" },
  { code: "id", native: "Bahasa Indonesia", english: "Indonesian", flag: "🇮🇩" },
  { code: "th", native: "Phasa Thai", english: "Thai", flag: "🇹🇭" },
];

const TOP_LANGUAGE_CODES = ["any", "en", "hi", "ta", "te", "es", "fr", "ja", "ko"];

function getLabel(lang: Language) {
  if (lang.code === "any") return lang.native;
  if (lang.native === lang.english) return lang.native;
  return `${lang.native} / ${lang.english}`;
}

export default function StepLanguage({ value, onChange }: StepLanguageProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selectedSet = new Set(value);
  const topLanguages = TOP_LANGUAGE_CODES.map((code) => ALL_LANGUAGES.find((l) => l.code === code)).filter(Boolean) as Language[];

  const filtered = search.trim()
    ? ALL_LANGUAGES.filter(
        (l) =>
          l.native.toLowerCase().includes(search.toLowerCase()) ||
          l.english.toLowerCase().includes(search.toLowerCase())
      )
    : ALL_LANGUAGES;

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const canAddMore = value.includes("any") || value.length < 5;

  const toggleLanguage = (code: string) => {
    const exists = selectedSet.has(code);

    if (code === "any") {
      onChange(["any"]);
      return;
    }

    if (exists) {
      const next = value.filter((lang) => lang !== code);
      onChange(next.length > 0 ? next : ["any"]);
      return;
    }

    const withoutAny = value.filter((lang) => lang !== "any");
    if (withoutAny.length >= 5) return;
    onChange([...withoutAny, code]);
  };

  const selectedLabels = ALL_LANGUAGES
    .filter((lang) => selectedSet.has(lang.code))
    .map((lang) => getLabel(lang))
    .join(", ");

  return (
    <div>
      <h2 className="font-display font-bold text-xl text-brutal-white uppercase tracking-tight mb-1">
        LANGUAGES
      </h2>
      <p className="text-brutal-muted text-xs font-mono mb-5">Pick up to 5 languages</p>

      <div ref={containerRef} className="w-full">
        <div className="mb-3 flex flex-wrap gap-2">
          {topLanguages.map((lang) => {
            const selected = selectedSet.has(lang.code);
            const disabled = !selected && lang.code !== "any" && !canAddMore;
            return (
              <button
                key={lang.code}
                onClick={() => toggleLanguage(lang.code)}
                disabled={disabled}
                className={`px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider border-2 transition-all ${
                  selected
                    ? "bg-brutal-violet text-black border-brutal-violet"
                    : "bg-surface text-brutal-dim border-brutal-border hover:border-brutal-violet hover:text-brutal-violet"
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {lang.flag} {lang.native}
              </button>
            );
          })}

          <button
            onClick={() => setOpen((o) => !o)}
            className={`px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider border-2 transition-all flex items-center gap-1 ${
              open
                ? "bg-brutal-pink text-black border-brutal-pink"
                : "bg-surface text-brutal-dim border-brutal-border hover:border-brutal-pink hover:text-brutal-pink"
            }`}
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={3} />
            MORE
          </button>
        </div>

        <div className="mb-4 border-2 border-brutal-border bg-surface px-3 py-2">
          <p className="text-[10px] font-mono uppercase text-brutal-dim">
            Selected ({value.includes("any") ? "Any" : `${value.length}/5`}): {selectedLabels}
          </p>
        </div>

        {open && (
          <div className="w-full mt-1 bg-bg border-3 border-brutal-border shadow-brutal animate-pop-in">
            <div className="flex items-center gap-2 px-3 py-2.5 border-b-2 border-brutal-border sticky top-0 bg-bg z-10">
              <Search className="w-3.5 h-3.5 text-brutal-dim shrink-0" strokeWidth={2.5} />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search language..."
                className="flex-1 bg-transparent text-brutal-white text-xs font-mono outline-none placeholder:text-brutal-dim"
              />
              {search && (
                <button onClick={() => setSearch("")}>
                  <X className="w-3.5 h-3.5 text-brutal-dim hover:text-brutal-white" strokeWidth={2.5} />
                </button>
              )}
            </div>

            <div className="max-h-72 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="px-4 py-3 text-brutal-dim text-xs font-mono">No match</p>
              ) : (
                filtered.map((lang) => {
                  const selected = selectedSet.has(lang.code);
                  const disabled = !selected && lang.code !== "any" && !canAddMore;
                  return (
                    <button
                      key={lang.code}
                      onClick={() => toggleLanguage(lang.code)}
                      disabled={disabled}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors border-b border-brutal-border/40 last:border-b-0 ${
                        selected ? "bg-surface text-brutal-violet" : "text-brutal-white hover:bg-surface"
                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      <span className="text-base shrink-0">{lang.flag}</span>
                      <span className="font-mono text-xs font-bold uppercase leading-tight">{getLabel(lang)}</span>
                      {selected && (
                        <Check className="ml-auto w-3 h-3 text-brutal-violet shrink-0" strokeWidth={3} />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {!value.includes("any") && (
        <button
          onClick={() => onChange(["any"])}
          className="mt-2 text-[10px] font-mono uppercase tracking-wider text-brutal-dim underline hover:text-brutal-white"
        >
          Reset to Any language
        </button>
      )}
    </div>
  );
}
