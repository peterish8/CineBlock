"use client";

interface StepMoodProps {
  value: string;
  onChange: (mood: string) => void;
}

const MOODS = [
  { id: "brain-off", emoji: "🧠", label: "Turn My Brain Off", desc: "Easy, fun, no thinking needed" },
  { id: "feel-something", emoji: "🥺", label: "Feel Something", desc: "Emotional, moving, meaningful" },
  { id: "get-scared", emoji: "😱", label: "Scare Me", desc: "Horror, tension, edge of your seat" },
  { id: "laugh", emoji: "😂", label: "Make Me Laugh", desc: "Comedy, light-hearted, fun" },
  { id: "inspired", emoji: "💪", label: "Inspire Me", desc: "Real stories, triumph, motivation" },
  { id: "love", emoji: "💕", label: "Fall In Love", desc: "Romance, chemistry, warmth" },
  { id: "adventure", emoji: "🚀", label: "Take Me Somewhere", desc: "Fantasy, sci-fi, epic worlds" },
];

export default function StepMood({ value, onChange }: StepMoodProps) {
  return (
    <div>
      <h2 className="font-display font-bold text-xl text-brutal-white uppercase tracking-tight mb-1">
        WHAT'S YOUR MOOD?
      </h2>
      <p className="text-brutal-muted text-xs font-mono mb-5">Pick the vibe you're going for tonight</p>
      <div className="grid grid-cols-2 gap-3">
        {MOODS.map((mood) => (
          <button
            key={mood.id}
            onClick={() => onChange(mood.id)}
            className={`p-4 text-left transition-all duration-100 ${
              value === mood.id
                ? "bg-brutal-yellow text-black border-brutal-yellow shadow-none translate-x-[2px] translate-y-[2px]"
                : "brutal-card hover:!border-brutal-yellow"
            }`}
          >
            <span className="text-2xl block mb-1">{mood.emoji}</span>
            <span className="font-display font-bold text-sm uppercase block leading-tight">
              {mood.label}
            </span>
            <span className={`text-[10px] font-mono block mt-1 ${value === mood.id ? "text-black/70" : "text-brutal-dim"}`}>
              {mood.desc}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
