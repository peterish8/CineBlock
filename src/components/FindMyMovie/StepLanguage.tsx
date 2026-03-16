"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, X } from "lucide-react";

interface StepLanguageProps {
  value: string;
  onChange: (lang: string) => void;
}

const ALL_LANGUAGES = [
  { code: "any",  native: "Any Language",          english: "",               flag: "🌍" },
  { code: "af",   native: "Afrikaans",              english: "Afrikaans",      flag: "🇿🇦" },
  { code: "sq",   native: "Shqip",                  english: "Albanian",       flag: "🇦🇱" },
  { code: "am",   native: "አማርኛ",                   english: "Amharic",        flag: "🇪🇹" },
  { code: "ar",   native: "العربية",                english: "Arabic",         flag: "🇸🇦" },
  { code: "hy",   native: "Հայերեն",                english: "Armenian",       flag: "🇦🇲" },
  { code: "az",   native: "Azərbaycan",             english: "Azerbaijani",    flag: "🇦🇿" },
  { code: "eu",   native: "Euskara",                english: "Basque",         flag: "🏴" },
  { code: "be",   native: "Беларуская",             english: "Belarusian",     flag: "🇧🇾" },
  { code: "bn",   native: "বাংলা",                   english: "Bengali",        flag: "🇧🇩" },
  { code: "bs",   native: "Bosanski",               english: "Bosnian",        flag: "🇧🇦" },
  { code: "bg",   native: "Български",              english: "Bulgarian",      flag: "🇧🇬" },
  { code: "my",   native: "မြန်မာဘာသာ",              english: "Burmese",        flag: "🇲🇲" },
  { code: "ca",   native: "Català",                 english: "Catalan",        flag: "🏴" },
  { code: "zh",   native: "中文",                    english: "Chinese",        flag: "🇨🇳" },
  { code: "hr",   native: "Hrvatski",               english: "Croatian",       flag: "🇭🇷" },
  { code: "cs",   native: "Čeština",                english: "Czech",          flag: "🇨🇿" },
  { code: "da",   native: "Dansk",                  english: "Danish",         flag: "🇩🇰" },
  { code: "nl",   native: "Nederlands",             english: "Dutch",          flag: "🇳🇱" },
  { code: "en",   native: "English",                english: "English",        flag: "🇺🇸" },
  { code: "et",   native: "Eesti",                  english: "Estonian",       flag: "🇪🇪" },
  { code: "fi",   native: "Suomi",                  english: "Finnish",        flag: "🇫🇮" },
  { code: "fr",   native: "Français",               english: "French",         flag: "🇫🇷" },
  { code: "gl",   native: "Galego",                 english: "Galician",       flag: "🇪🇸" },
  { code: "ka",   native: "ქართული",                english: "Georgian",       flag: "🇬🇪" },
  { code: "de",   native: "Deutsch",                english: "German",         flag: "🇩🇪" },
  { code: "el",   native: "Ελληνικά",               english: "Greek",          flag: "🇬🇷" },
  { code: "gu",   native: "ગુજરાતી",                 english: "Gujarati",       flag: "🇮🇳" },
  { code: "he",   native: "עברית",                  english: "Hebrew",         flag: "🇮🇱" },
  { code: "hi",   native: "हिन्दी",                  english: "Hindi",          flag: "🇮🇳" },
  { code: "hu",   native: "Magyar",                 english: "Hungarian",      flag: "🇭🇺" },
  { code: "is",   native: "Íslenska",               english: "Icelandic",      flag: "🇮🇸" },
  { code: "id",   native: "Bahasa Indonesia",       english: "Indonesian",     flag: "🇮🇩" },
  { code: "it",   native: "Italiano",               english: "Italian",        flag: "🇮🇹" },
  { code: "ja",   native: "日本語",                   english: "Japanese",       flag: "🇯🇵" },
  { code: "kn",   native: "ಕನ್ನಡ",                   english: "Kannada",        flag: "🇮🇳" },
  { code: "kk",   native: "Қазақша",                english: "Kazakh",         flag: "🇰🇿" },
  { code: "km",   native: "ភាសាខ្មែរ",               english: "Khmer",          flag: "🇰🇭" },
  { code: "ko",   native: "한국어",                   english: "Korean",         flag: "🇰🇷" },
  { code: "ku",   native: "Kurdî",                  english: "Kurdish",        flag: "🏴" },
  { code: "ky",   native: "Кыргызча",               english: "Kyrgyz",         flag: "🇰🇬" },
  { code: "lo",   native: "ລາວ",                     english: "Lao",            flag: "🇱🇦" },
  { code: "lv",   native: "Latviešu",               english: "Latvian",        flag: "🇱🇻" },
  { code: "lt",   native: "Lietuvių",               english: "Lithuanian",     flag: "🇱🇹" },
  { code: "lb",   native: "Lëtzebuergesch",         english: "Luxembourgish",  flag: "🇱🇺" },
  { code: "mk",   native: "Македонски",             english: "Macedonian",     flag: "🇲🇰" },
  { code: "ms",   native: "Bahasa Melayu",          english: "Malay",          flag: "🇲🇾" },
  { code: "ml",   native: "മലയാളം",                  english: "Malayalam",      flag: "🇮🇳" },
  { code: "mr",   native: "मराठी",                   english: "Marathi",        flag: "🇮🇳" },
  { code: "mn",   native: "Монгол",                 english: "Mongolian",      flag: "🇲🇳" },
  { code: "ne",   native: "नेपाली",                  english: "Nepali",         flag: "🇳🇵" },
  { code: "nb",   native: "Norsk",                  english: "Norwegian",      flag: "🇳🇴" },
  { code: "pa",   native: "ਪੰਜਾਬੀ",                  english: "Punjabi",        flag: "🇮🇳" },
  { code: "fa",   native: "فارسی",                  english: "Persian",        flag: "🇮🇷" },
  { code: "pl",   native: "Polski",                 english: "Polish",         flag: "🇵🇱" },
  { code: "pt",   native: "Português",              english: "Portuguese",     flag: "🇵🇹" },
  { code: "ro",   native: "Română",                 english: "Romanian",       flag: "🇷🇴" },
  { code: "ru",   native: "Русский",                english: "Russian",        flag: "🇷🇺" },
  { code: "sr",   native: "Српски",                 english: "Serbian",        flag: "🇷🇸" },
  { code: "si",   native: "සිංහල",                   english: "Sinhalese",      flag: "🇱🇰" },
  { code: "sk",   native: "Slovenčina",             english: "Slovak",         flag: "🇸🇰" },
  { code: "sl",   native: "Slovenščina",            english: "Slovenian",      flag: "🇸🇮" },
  { code: "so",   native: "Soomaali",               english: "Somali",         flag: "🇸🇴" },
  { code: "es",   native: "Español",                english: "Spanish",        flag: "🇪🇸" },
  { code: "sw",   native: "Kiswahili",              english: "Swahili",        flag: "🇰🇪" },
  { code: "sv",   native: "Svenska",                english: "Swedish",        flag: "🇸🇪" },
  { code: "tl",   native: "Filipino",               english: "Tagalog",        flag: "🇵🇭" },
  { code: "ta",   native: "தமிழ்",                   english: "Tamil",          flag: "🇮🇳" },
  { code: "te",   native: "తెలుగు",                  english: "Telugu",         flag: "🇮🇳" },
  { code: "th",   native: "ภาษาไทย",                 english: "Thai",           flag: "🇹🇭" },
  { code: "tr",   native: "Türkçe",                 english: "Turkish",        flag: "🇹🇷" },
  { code: "tk",   native: "Türkmen",                english: "Turkmen",        flag: "🇹🇲" },
  { code: "uk",   native: "Українська",             english: "Ukrainian",      flag: "🇺🇦" },
  { code: "ur",   native: "اردو",                   english: "Urdu",           flag: "🇵🇰" },
  { code: "uz",   native: "Oʻzbek",                 english: "Uzbek",          flag: "🇺🇿" },
  { code: "vi",   native: "Tiếng Việt",             english: "Vietnamese",     flag: "🇻🇳" },
  { code: "cy",   native: "Cymraeg",                english: "Welsh",          flag: "🏴󠁧󠁢󠁷󠁬󠁳󠁿" },
  { code: "yo",   native: "Yorùbá",                 english: "Yoruba",         flag: "🇳🇬" },
  { code: "zu",   native: "isiZulu",                english: "Zulu",           flag: "🇿🇦" },
];

function getLabel(lang: typeof ALL_LANGUAGES[number]) {
  if (lang.code === "any") return lang.native;
  if (lang.native === lang.english) return lang.native;
  return `${lang.native} / ${lang.english}`;
}

export default function StepLanguage({ value, onChange }: StepLanguageProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = ALL_LANGUAGES.find((l) => l.code === value) ?? ALL_LANGUAGES[0];

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

  const select = (code: string) => {
    onChange(code);
    setOpen(false);
    setSearch("");
  };

  return (
    <div>
      <h2 className="font-display font-bold text-xl text-brutal-white uppercase tracking-tight mb-1">
        LANGUAGE
      </h2>
      <p className="text-brutal-muted text-xs font-mono mb-5">Pick your preferred language</p>

      <div ref={containerRef} className="w-full">
        {/* Trigger */}
        <button
          onClick={() => setOpen((o) => !o)}
          className={`brutal-btn w-full px-5 py-4 flex items-center justify-between gap-3 text-left ${
            open ? "!border-brutal-violet !text-brutal-violet" : ""
          }`}
        >
          <span className="flex items-center gap-3 min-w-0">
            <span className="text-xl shrink-0">{selected.flag}</span>
            <span className="font-mono text-sm font-bold uppercase truncate">{getLabel(selected)}</span>
          </span>
          <ChevronDown
            className={`w-4 h-4 shrink-0 transition-transform duration-150 ${open ? "rotate-180 text-brutal-violet" : "text-brutal-dim"}`}
            strokeWidth={3}
          />
        </button>

        {/* Inline list — renders in flow so modal scroll handles it */}
        {open && (
          <div className="w-full mt-1 bg-bg border-3 border-brutal-border shadow-brutal animate-pop-in">
            {/* Search input */}
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

            {/* Options — no max-height, modal scroll takes over */}
            <div>
              {filtered.length === 0 ? (
                <p className="px-4 py-3 text-brutal-dim text-xs font-mono">No match</p>
              ) : (
                filtered.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => select(lang.code)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-surface transition-colors border-b border-brutal-border/40 last:border-b-0 ${
                      value === lang.code ? "bg-surface text-brutal-violet" : "text-brutal-white"
                    }`}
                  >
                    <span className="text-base shrink-0">{lang.flag}</span>
                    <span className="font-mono text-xs font-bold uppercase leading-tight">{getLabel(lang)}</span>
                    {value === lang.code && (
                      <span className="ml-auto text-brutal-violet text-[10px] font-mono font-black shrink-0">✓</span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
