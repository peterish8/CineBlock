"use client";

interface StepDealbreakersProps {
  value: string[];
  onChange: (dealbreakers: string[]) => void;
}

const OPTIONS = [
  { id: "gore", label: "Extreme Gore", emoji: "🩸" },
  { id: "jumpscares", label: "Jumpscares", emoji: "😨" },
  { id: "animal-death", label: "Animal Death", emoji: "🐾" },
  { id: "sad-ending", label: "Sad Ending", emoji: "💔" },
];

export default function StepDealbreakers({ value, onChange }: StepDealbreakersProps) {
  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  const clearAll = () => onChange([]);
  const noneSelected = value.length === 0;

  return (
    <div>
      <h2 className="font-display font-bold text-xl text-brutal-white uppercase tracking-tight mb-1">
        DEALBREAKERS
      </h2>
      <p className="text-brutal-muted text-xs font-mono mb-5">Anything you want to avoid? (multi-select)</p>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {OPTIONS.map((opt) => {
          const selected = value.includes(opt.id);
          return (
            <button
              key={opt.id}
              onClick={() => toggle(opt.id)}
              className={`p-4 text-left transition-all duration-100 ${
                selected
                  ? "bg-brutal-red text-black border-brutal-red shadow-none translate-x-[2px] translate-y-[2px]"
                  : "brutal-card hover:!border-brutal-red"
              }`}
            >
              <span className="text-2xl block mb-1">{opt.emoji}</span>
              <span className="font-display font-bold text-xs uppercase block leading-tight">
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
      <button
        onClick={clearAll}
        className={`w-full p-3 text-center font-mono font-bold text-xs uppercase transition-all duration-100 ${
          noneSelected
            ? "bg-brutal-lime text-black border-brutal-lime shadow-none"
            : "brutal-btn hover:!border-brutal-lime hover:!text-brutal-lime"
        }`}
      >
        ✌️ NONE OF THESE — I'M GOOD
      </button>
    </div>
  );
}
