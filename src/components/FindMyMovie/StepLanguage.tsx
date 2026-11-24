"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";

interface StepLanguageProps {
  value: string[];
  onChange: (langs: string[]) => void;
}

type Language = { code: string; name: string; native?: string };

const MAX_LANGUAGES = 5;

const ALL_LANGUAGES: Language[] = [
  { code: "any", name: "Any language" },
  { code: "en", name: "English" },
  { code: "hi", name: "Hindi" },
  { code: "ta", name: "Tamil" },
  { code: "te", name: "Telugu" },
  { code: "ml", name: "Malayalam" },
  { code: "kn", name: "Kannada" },
  { code: "es", name: "Spanish", native: "Español" },
  { code: "fr", name: "French", native: "Français" },
  { code: "de", name: "German", native: "Deutsch" },
  { code: "it", name: "Italian", native: "Italiano" },
  { code: "ja", name: "Japanese", native: "日本語" },
  { code: "ko", name: "Korean", native: "한국어" },
  { code: "zh", name: "Chinese", native: "中文" },
  { code: "pt", name: "Portuguese", native: "Português" },
  { code: "ru", name: "Russian", native: "Русский" },
  { code: "ar", name: "Arabic", native: "العربية" },
  { code: "tr", name: "Turkish", native: "Türkçe" },
  { code: "id", name: "Indonesian", native: "Bahasa Indonesia" },
  { code: "th", name: "Thai", native: "ไทย" },
];

const QUICK_PICKS = ["any", "en", "hi", "ta", "te", "ml", "ko", "ja", "es", "fr"];

export function languageName(code: string) {
  return ALL_LANGUAGES.find((l) => l.code === code)?.name ?? code;
}

export default function StepLanguage({ value, onChange }: StepLanguageProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const selected = new Set(value);
  const isAny = selected.has("any");
  const chosen = isAny ? 0 : value.length;

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  const toggle = (code: string) => {
    if (code === "any") return onChange(["any"]);
    if (selected.has(code)) {
      const next = value.filter((l) => l !== code);
      return onChange(next.length ? next : ["any"]);
    }
    const withoutAny = value.filter((l) => l !== "any");
    if (withoutAny.length >= MAX_LANGUAGES) return;
    onChange([...withoutAny, code]);
  };

  const chip = (lang: Language) => {
    const isOn = selected.has(lang.code);
    const blocked = !isOn && lang.code !== "any" && chosen >= MAX_LANGUAGES;
    return (
      <button
        key={lang.code}
        type="button"
        aria-pressed={isOn}
        disabled={blocked}
        onClick={() => toggle(lang.code)}
        className={`flex min-h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-40 ${
          isOn
            ? "border-blue-400/60 bg-blue-400/20 text-white"
            : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
        }`}
      >
        {isOn && <Check className="h-3.5 w-3.5 text-blue-300" strokeWidth={3} />}
        {lang.name}
      </button>
    );
  };

  const query = search.trim().toLowerCase();
  const filtered = ALL_LANGUAGES.filter((l) => l.code !== "any" && (!query || l.name.toLowerCase().includes(query) || l.native?.toLowerCase().includes(query)));
  // Languages chosen from the full list stay visible as chips next to the quick picks.
  const extraChips = value.filter((code) => code !== "any" && !QUICK_PICKS.includes(code));

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display !text-lg font-semibold text-white">Which languages?</h2>
        <span className="text-sm tabular-nums text-slate-500">{isAny ? "Any" : `${chosen} of ${MAX_LANGUAGES}`}</span>
      </div>
      <p className="mt-1 text-sm text-slate-400">We match the film&apos;s original language.</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {[...QUICK_PICKS, ...extraChips].map((code) => chip(ALL_LANGUAGES.find((l) => l.code === code)!))}
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="flex min-h-10 items-center gap-1.5 rounded-full border border-dashed border-white/15 px-4 text-sm font-medium text-slate-400 transition-colors duration-150 hover:border-white/30 hover:text-white"
        >
          More
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {open && (
        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
          <label className="flex items-center gap-2 border-b border-white/[0.08] px-4">
            <Search className="h-4 w-4 shrink-0 text-slate-500" />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search languages"
              aria-label="Search languages"
              className="min-h-11 flex-1 bg-transparent text-base text-white outline-none placeholder:text-slate-500"
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} aria-label="Clear search" className="rounded-md p-1 text-slate-500 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            )}
          </label>
          <div className="max-h-56 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-sm text-slate-400">No language matches &ldquo;{search}&rdquo;.</p>
            ) : (
              filtered.map((lang) => {
                const isOn = selected.has(lang.code);
                const blocked = !isOn && chosen >= MAX_LANGUAGES;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    disabled={blocked}
                    onClick={() => toggle(lang.code)}
                    className="flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm text-slate-200 transition-colors duration-150 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <span className="flex-1">
                      {lang.name}
                      {lang.native && <span className="ml-2 text-slate-500">{lang.native}</span>}
                    </span>
                    {isOn && <Check className="h-4 w-4 text-blue-300" strokeWidth={2.5} />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
