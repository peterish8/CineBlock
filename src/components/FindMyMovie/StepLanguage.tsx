"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X, Plus, Check } from "lucide-react";

interface StepLanguageProps {
  value: string[];
  onChange: (langs: string[]) => void;
  isGlass?: boolean;
}

type Language = {
  code: string;
  native: string;
  english: string;
  flag: string;
};

const ALL_LANGUAGES: Language[] = [
  { code: "any", native: "Any Language", english: "", flag: "GLOBAL" },
  { code: "en", native: "English", english: "English", flag: "EN" },
  { code: "hi", native: "Hindi", english: "Hindi", flag: "HI" },
  { code: "ta", native: "Tamil", english: "Tamil", flag: "TA" },
  { code: "te", native: "Telugu", english: "Telugu", flag: "TE" },
  { code: "ml", native: "Malayalam", english: "Malayalam", flag: "ML" },
  { code: "kn", native: "Kannada", english: "Kannada", flag: "KN" },
  { code: "es", native: "Espanol", english: "Spanish", flag: "ES" },
  { code: "fr", native: "Francais", english: "French", flag: "FR" },
  { code: "de", native: "Deutsch", english: "German", flag: "DE" },
  { code: "it", native: "Italiano", english: "Italian", flag: "IT" },
  { code: "ja", native: "Nihongo", english: "Japanese", flag: "JA" },
  { code: "ko", native: "Hanguk-eo", english: "Korean", flag: "KO" },
  { code: "zh", native: "Zhongwen", english: "Chinese", flag: "ZH" },
  { code: "pt", native: "Portugues", english: "Portuguese", flag: "PT" },
  { code: "ru", native: "Russkiy", english: "Russian", flag: "RU" },
  { code: "ar", native: "Arabiyyah", english: "Arabic", flag: "AR" },
  { code: "tr", native: "Turkce", english: "Turkish", flag: "TR" },
  { code: "id", native: "Bahasa Indonesia", english: "Indonesian", flag: "ID" },
  { code: "th", native: "Phasa Thai", english: "Thai", flag: "TH" },
];

const TOP_LANGUAGE_CODES = ["any", "en", "hi", "ta", "te", "es", "fr", "ja", "ko"];

function getLabel(lang: Language) {
  if (lang.code === "any") return lang.native;
  if (lang.native === lang.english) return lang.native;
  return `${lang.native} / ${lang.english}`;
}

export default function StepLanguage({ value, onChange, isGlass = false }: StepLanguageProps) {
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
      <h2 className={isGlass ? "font-display font-semibold text-[1.9rem] text-white tracking-[-0.03em] mb-1" : "font-display font-bold text-xl text-brutal-white uppercase tracking-tight mb-1"}>
        {isGlass ? "Choose language" : "LANGUAGES"}
      </h2>
      <p className={isGlass ? "text-[0.95rem] text-slate-400 leading-relaxed mb-5" : "text-brutal-muted text-xs font-mono mb-5"}>
        {isGlass ? "Prioritize the original language. We'll stay strict unless you leave it open." : "Pick up to 5 languages"}
      </p>

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
                className={isGlass
                  ? `px-3.5 py-2.5 text-[0.88rem] font-medium rounded-[16px] border transition-all ${
                      selected ? "text-white" : "text-slate-300 hover:text-white"
                    } disabled:opacity-40 disabled:cursor-not-allowed`
                  : `px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider border-2 transition-all ${
                      selected
                        ? "bg-brutal-violet text-black border-brutal-violet"
                        : "bg-surface text-brutal-dim border-brutal-border hover:border-brutal-violet hover:text-brutal-violet"
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                style={isGlass ? {
                  background: selected ? "linear-gradient(135deg, rgba(79,70,229,0.34), rgba(59,130,246,0.22))" : "rgba(255,255,255,0.045)",
                  borderColor: selected ? "rgba(129,140,248,0.35)" : "rgba(255,255,255,0.08)",
                  backdropFilter: "blur(14px)",
                } : undefined}
              >
                {lang.flag} {lang.native}
              </button>
            );
          })}

          <button
            onClick={() => setOpen((o) => !o)}
            className={isGlass
              ? `px-3.5 py-2.5 text-[0.88rem] font-medium rounded-[16px] border transition-all flex items-center gap-1 ${
                  open ? "text-white" : "text-slate-300 hover:text-white"
                }`
              : `px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider border-2 transition-all flex items-center gap-1 ${
                  open
                    ? "bg-brutal-pink text-black border-brutal-pink"
                    : "bg-surface text-brutal-dim border-brutal-border hover:border-brutal-pink hover:text-brutal-pink"
                }`}
            style={isGlass ? {
              background: open ? "linear-gradient(135deg, rgba(168,85,247,0.26), rgba(79,70,229,0.18))" : "rgba(255,255,255,0.045)",
              borderColor: open ? "rgba(196,181,253,0.32)" : "rgba(255,255,255,0.08)",
              backdropFilter: "blur(14px)",
            } : undefined}
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={3} />
            {isGlass ? "More languages" : "MORE"}
          </button>
        </div>

        <div
          className={isGlass ? "mb-4 rounded-[18px] px-3.5 py-3 border" : "mb-4 border-2 border-brutal-border bg-surface px-3 py-2"}
          style={isGlass ? { background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" } : undefined}
        >
          <p className={isGlass ? "text-[0.88rem] text-slate-300" : "text-[10px] font-mono uppercase text-brutal-dim"}>
            Selected ({value.includes("any") ? "Any" : `${value.length}/5`}): {selectedLabels}
          </p>
        </div>

        {open && (
          <div
            className={isGlass ? "w-full mt-1 rounded-[22px] animate-pop-in overflow-hidden border" : "w-full mt-1 bg-bg border-3 border-brutal-border shadow-brutal animate-pop-in"}
            style={isGlass ? {
              background: "rgba(8,14,36,0.94)",
              borderColor: "rgba(255,255,255,0.10)",
              boxShadow: "0 20px 48px rgba(0,0,0,0.35)",
              backdropFilter: "blur(24px)",
            } : undefined}
          >
            <div
              className={isGlass ? "flex items-center gap-2 px-3 py-3 border-b sticky top-0 z-10" : "flex items-center gap-2 px-3 py-2.5 border-b-2 border-brutal-border sticky top-0 bg-bg z-10"}
              style={isGlass ? { borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" } : undefined}
            >
              <Search className={`w-3.5 h-3.5 shrink-0 ${isGlass ? "text-slate-400" : "text-brutal-dim"}`} strokeWidth={2.5} />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search language..."
                className={isGlass ? "flex-1 bg-transparent text-white text-[0.92rem] outline-none placeholder:text-slate-500" : "flex-1 bg-transparent text-brutal-white text-xs font-mono outline-none placeholder:text-brutal-dim"}
              />
              {search && (
                <button onClick={() => setSearch("")}>
                  <X className={`w-3.5 h-3.5 ${isGlass ? "text-slate-500 hover:text-white" : "text-brutal-dim hover:text-brutal-white"}`} strokeWidth={2.5} />
                </button>
              )}
            </div>

            <div className="max-h-72 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className={isGlass ? "px-4 py-3 text-slate-400 text-sm" : "px-4 py-3 text-brutal-dim text-xs font-mono"}>No match</p>
              ) : (
                filtered.map((lang) => {
                  const selected = selectedSet.has(lang.code);
                  const disabled = !selected && lang.code !== "any" && !canAddMore;
                  return (
                    <button
                      key={lang.code}
                      onClick={() => toggleLanguage(lang.code)}
                      disabled={disabled}
                      className={isGlass
                        ? `w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b last:border-b-0 ${
                            selected ? "bg-white/7 text-white" : "text-slate-200 hover:bg-white/5"
                          } disabled:opacity-40 disabled:cursor-not-allowed`
                        : `w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors border-b border-brutal-border/40 last:border-b-0 ${
                            selected ? "bg-surface text-brutal-violet" : "text-brutal-white hover:bg-surface"
                          } disabled:opacity-40 disabled:cursor-not-allowed`}
                      style={isGlass ? { borderColor: "rgba(255,255,255,0.06)" } : undefined}
                    >
                      <span className="text-sm shrink-0 font-semibold">{lang.flag}</span>
                      <span className={isGlass ? "text-[0.92rem] font-medium leading-tight" : "font-mono text-xs font-bold uppercase leading-tight"}>{getLabel(lang)}</span>
                      {selected && (
                        <Check className={`ml-auto w-3 h-3 shrink-0 ${isGlass ? "text-blue-300" : "text-brutal-violet"}`} strokeWidth={3} />
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
          className={isGlass ? "mt-2 text-[0.82rem] font-medium tracking-[0.02em] text-slate-400 hover:text-white" : "mt-2 text-[10px] font-mono uppercase tracking-wider text-brutal-dim underline hover:text-brutal-white"}
        >
          Reset to Any language
        </button>
      )}
    </div>
  );
}
