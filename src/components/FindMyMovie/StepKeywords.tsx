"use client";

// TMDB keyword IDs for each vibe tag.
// You can verify or add more at: https://www.themoviedb.org/keyword/{id}
export const KEYWORD_CHIPS = [
  // Narrative / Setting
  { label: "Time Loop",        id: 9714     },
  { label: "Based on Novel",   id: 818      },
  { label: "True Story",       id: 9672     },
  { label: "Found Footage",    id: 11308    },
  { label: "Dystopia",         id: 4565     },
  { label: "Post-Apocalyptic", id: 4458     },
  { label: "Heist",            id: 10349    },
  { label: "Road Trip",        id: 1721     },
  { label: "Coming of Age",    id: 10683    },
  { label: "Survival",         id: 5565     },

  // Tone / Feel
  { label: "Cult Classic",     id: 12554    },
  { label: "Mind Bending",     id: 4344     },
  { label: "Tear Jerker",      id: 11800    },
  { label: "Feel Good",        id: 15060    },
  { label: "Dark Humour",      id: 10941    },
  { label: "Plot Twist",       id: 3801     },
  { label: "Slow Burn",        id: 282      },

  // Character / Relationship
  { label: "Revenge",          id: 3995     },
  { label: "Unlikely Duo",     id: 3265     },
  { label: "Found Family",     id: 193498   },
  { label: "Antihero",         id: 9748     },

  // World
  { label: "Space Travel",     id: 803      },
  { label: "Parallel Universe",id: 207317   },
  { label: "Artificial Intelligence", id: 9951 },
  { label: "Time Travel",      id: 10537    },
  { label: "Underwater",       id: 11322    },
];

interface StepKeywordsProps {
  value: number | null;
  onChange: (id: number | null) => void;
}

export default function StepKeywords({ value, onChange }: StepKeywordsProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display font-bold text-xl text-brutal-white uppercase tracking-tight mb-1">
          Any specific vibe?
        </h2>
        <p className="font-mono text-xs text-brutal-muted">
          Pick one that excites you — or skip to cast a wider net.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {KEYWORD_CHIPS.map((chip) => {
          const selected = value === chip.id;
          return (
            <button
              key={`${chip.id}-${chip.label}`}
              onClick={() => onChange(selected ? null : chip.id)}
              className={`px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider border-2 transition-all duration-100 ${
                selected
                  ? "bg-brutal-pink text-black border-brutal-pink shadow-[2px_2px_0px_#000]"
                  : "bg-surface text-brutal-dim border-brutal-border hover:border-brutal-pink hover:text-brutal-pink"
              }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {value && (
        <button
          onClick={() => onChange(null)}
          className="self-start font-mono text-[10px] uppercase tracking-wider text-brutal-dim underline hover:text-brutal-white transition-colors"
        >
          Clear selection
        </button>
      )}
    </div>
  );
}
