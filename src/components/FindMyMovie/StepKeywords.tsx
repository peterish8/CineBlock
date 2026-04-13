"use client";

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
  isGlass?: boolean;
}

export default function StepKeywords({ value, onChange, isGlass = false }: StepKeywordsProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className={isGlass ? "font-display font-semibold text-[1.9rem] text-white tracking-[-0.03em] mb-1" : "font-display font-bold text-xl text-brutal-white uppercase tracking-tight mb-1"}>
          {isGlass ? "Pick a story signal" : "Any specific vibe?"}
        </h2>
        <p className={isGlass ? "text-[0.95rem] text-slate-400 leading-relaxed max-w-md" : "font-mono text-xs text-brutal-muted"}>
          {isGlass ? "Choose one strong narrative cue and we'll keep the search anchored to it." : "Pick one that excites you, or skip to cast a wider net."}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {KEYWORD_CHIPS.map((chip) => {
          const selected = value === chip.id;
          return (
            <button
              key={`${chip.id}-${chip.label}`}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(selected ? null : chip.id)}
              className={isGlass
                ? `px-3.5 py-2 rounded-[16px] text-[0.88rem] font-medium tracking-[0.01em] border transition-all duration-150 ${
                    selected ? "text-white" : "text-slate-300 hover:text-white"
                  }`
                : `px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider border-2 transition-all duration-100 ${
                    selected
                      ? "bg-brutal-pink text-black border-brutal-pink shadow-[2px_2px_0px_#000]"
                      : "bg-surface text-brutal-dim border-brutal-border hover:border-brutal-pink hover:text-brutal-pink"
                  }`}
              style={isGlass ? {
                background: selected ? "linear-gradient(135deg, rgba(79,70,229,0.34), rgba(59,130,246,0.22))" : "rgba(255,255,255,0.045)",
                borderColor: selected ? "rgba(129,140,248,0.35)" : "rgba(255,255,255,0.08)",
                boxShadow: selected ? "0 12px 28px rgba(59,130,246,0.12), inset 0 1px 0 rgba(255,255,255,0.14)" : "inset 0 1px 0 rgba(255,255,255,0.04)",
                backdropFilter: "blur(14px)",
              } : undefined}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className={isGlass ? "self-start text-[0.82rem] font-medium tracking-[0.02em] text-slate-400 hover:text-white transition-colors" : "self-start font-mono text-[10px] uppercase tracking-wider text-brutal-dim underline hover:text-brutal-white transition-colors"}
        >
          Clear selection
        </button>
      )}
    </div>
  );
}
