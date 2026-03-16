"use client";

interface StepLanguageProps {
  value: string;
  onChange: (lang: string) => void;
}

const LANGS = [
  { code: "any", label: "Any", flag: "🌍" },
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "hi", label: "Hindi", flag: "🇮🇳" },
  { code: "ko", label: "Korean", flag: "🇰🇷" },
  { code: "ja", label: "Japanese", flag: "🇯🇵" },
  { code: "fr", label: "French", flag: "🇫🇷" },
];

export default function StepLanguage({ value, onChange }: StepLanguageProps) {
  return (
    <div>
      <h2 className="font-display font-bold text-xl text-brutal-white uppercase tracking-tight mb-1">
        LANGUAGE
      </h2>
      <p className="text-brutal-muted text-xs font-mono mb-5">Pick your preferred language</p>
      <div className="flex flex-wrap gap-3">
        {LANGS.map((lang) => (
          <button
            key={lang.code}
            onClick={() => onChange(lang.code)}
            className={`px-4 py-2.5 flex items-center gap-2 transition-all duration-100 ${
              value === lang.code
                ? "bg-brutal-violet text-black border-brutal-violet shadow-none translate-x-[1px] translate-y-[1px] font-bold"
                : "brutal-btn"
            }`}
          >
            <span className="text-lg">{lang.flag}</span>
            <span className="font-mono text-xs font-bold uppercase">{lang.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
