"use client";

import { Check } from "lucide-react";

// TMDB keyword IDs for each vibe tag.
// You can verify or add more at: https://www.themoviedb.org/keyword/{id}
export const KEYWORD_CHIPS = [
  { label: "Time Loop", id: 10854 },
  { label: "Based on Novel", id: 818 },
  { label: "True Story", id: 9672 },
  { label: "Found Footage", id: 11308 },
  { label: "Dystopia", id: 4565 },
  { label: "Post-Apocalyptic", id: 4458 },
  { label: "Heist", id: 10349 },
  { label: "Road Trip", id: 1721 },
  { label: "Coming of Age", id: 10683 },
  { label: "Survival", id: 5565 },
  { label: "Cult Classic", id: 12554 },
  { label: "Mind Bending", id: 4344 },
  { label: "Tear Jerker", id: 11800 },
  { label: "Feel Good", id: 15060 },
  { label: "Dark Humour", id: 10941 },
  { label: "Plot Twist", id: 3801 },
  { label: "Slow Burn", id: 282 },
  { label: "Revenge", id: 3995 },
  { label: "Unlikely Duo", id: 3265 },
  { label: "Found Family", id: 193498 },
  { label: "Antihero", id: 9748 },
  { label: "Space Travel", id: 803 },
  { label: "Parallel Universe", id: 207317 },
  { label: "Artificial Intelligence", id: 9951 },
  { label: "Time Travel", id: 4379 },
  { label: "Underwater", id: 11322 },
  { label: "K-Drama", id: 318385 },
  { label: "C-Drama", id: 292014 },
];

interface StepKeywordsProps {
  value: number | null;
  onChange: (id: number | null) => void;
}

export default function StepKeywords({ value, onChange }: StepKeywordsProps) {
  return (
    <div>
      <h2 className="font-display !text-lg font-semibold text-white">What kind of story?</h2>
      <p className="mt-1 text-sm text-slate-400">Pick one, or skip to keep it open. Tap again to clear.</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {KEYWORD_CHIPS.map((chip) => {
          const selected = value === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(selected ? null : chip.id)}
              className={`flex min-h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.96] ${
                selected
                  ? "border-blue-400/60 bg-blue-400/20 text-white"
                  : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
              }`}
            >
              {selected && <Check className="h-3.5 w-3.5 text-blue-300" strokeWidth={3} />}
              {chip.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
