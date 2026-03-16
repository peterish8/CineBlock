"use client";

interface StepTimeProps {
  value: number;
  onChange: (time: number) => void;
}

const TIMES = [
  { value: 90, label: "Under 90 min", sub: "Short & sweet", emoji: "⚡" },
  { value: 120, label: "90–120 min", sub: "The sweet spot", emoji: "🎬" },
  { value: 150, label: "Up to 2.5 hrs", sub: "I've got time", emoji: "🍿" },
  { value: 999, label: "Any length", sub: "Don't care", emoji: "♾️" },
];

export default function StepTime({ value, onChange }: StepTimeProps) {
  return (
    <div>
      <h2 className="font-display font-bold text-xl text-brutal-white uppercase tracking-tight mb-1">
        HOW LONG?
      </h2>
      <p className="text-brutal-muted text-xs font-mono mb-5">How much time do you have?</p>
      <div className="grid grid-cols-2 gap-3">
        {TIMES.map((t) => (
          <button
            key={t.value}
            onClick={() => onChange(t.value)}
            className={`p-5 text-left transition-all duration-100 ${
              value === t.value
                ? "bg-brutal-lime text-black border-brutal-lime shadow-none translate-x-[2px] translate-y-[2px]"
                : "brutal-card hover:!border-brutal-lime"
            }`}
          >
            <span className="text-2xl block mb-1">{t.emoji}</span>
            <span className="font-display font-bold text-sm uppercase block leading-tight">
              {t.label}
            </span>
            <span className={`text-[10px] font-mono block mt-1 ${value === t.value ? "text-black/70" : "text-brutal-dim"}`}>
              {t.sub}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
