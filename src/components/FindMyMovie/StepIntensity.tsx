"use client";

import { Coffee, Scale, Flame } from "lucide-react";

interface StepIntensityProps {
  value: string;
  onChange: (intensity: string) => void;
}

const LEVELS = [
  { id: "light", label: "Chill", desc: "Easy watch, feel-good energy", icon: Coffee },
  { id: "moderate", label: "Balanced", desc: "Good story, some weight", icon: Scale },
  { id: "intense", label: "Heavy", desc: "Critically acclaimed, demands attention", icon: Flame },
];

export default function StepIntensity({ value, onChange }: StepIntensityProps) {
  return (
    <div>
      <h2 className="font-display font-bold text-xl text-brutal-white uppercase tracking-tight mb-1">
        INTENSITY LEVEL
      </h2>
      <p className="text-brutal-muted text-xs font-mono mb-5">How deep do you want to go?</p>
      <div className="grid grid-cols-1 gap-3">
        {LEVELS.map((level) => (
          <button
            key={level.id}
            onClick={() => onChange(level.id)}
            className={`p-5 text-left transition-all duration-100 flex items-center gap-4 ${
              value === level.id
                ? "bg-brutal-cyan text-black border-brutal-cyan shadow-none translate-x-[2px] translate-y-[2px]"
                : "brutal-card hover:!border-brutal-cyan"
            }`}
          >
            <level.icon className="w-7 h-7 shrink-0" strokeWidth={2} />
            <div>
              <span className="font-display font-bold text-sm uppercase block leading-tight">
                {level.label}
              </span>
              <span className={`text-[10px] font-mono block mt-0.5 ${value === level.id ? "text-black/70" : "text-brutal-dim"}`}>
                {level.desc}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
