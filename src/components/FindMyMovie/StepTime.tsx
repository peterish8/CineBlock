"use client";

import { useCallback, useEffect, useRef } from "react";

interface YearRangeValue {
  from: number;
  to: number;
}

interface StepTimeProps {
  value: YearRangeValue;
  onChange: (range: YearRangeValue) => void;
}

const MIN_YEAR = 1950;
const MAX_YEAR = new Date().getFullYear();

const PRESETS: { label: string; from: number; to: number }[] = [
  { label: "Last 5 years", from: MAX_YEAR - 5, to: MAX_YEAR },
  { label: "Last 15 years", from: MAX_YEAR - 15, to: MAX_YEAR },
  { label: "2000s", from: 2000, to: 2009 },
  { label: "1990s", from: 1990, to: 1999 },
  { label: "All years", from: MIN_YEAR, to: MAX_YEAR },
];

const clamp = (y: number) => Math.min(MAX_YEAR, Math.max(MIN_YEAR, y));
const toPct = (y: number) => ((y - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100;

export default function StepTime({ value, onChange }: StepTimeProps) {
  const from = clamp(value.from);
  const to = clamp(value.to);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<"from" | "to" | null>(null);

  const yearAt = useCallback((clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round(MIN_YEAR + pct * (MAX_YEAR - MIN_YEAR));
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const year = yearAt(e.clientX);
      if (year === null) return;
      if (dragging.current === "from") onChange({ from: Math.min(year, to), to });
      else onChange({ from, to: Math.max(year, from) });
    };
    const onUp = () => { dragging.current = null; };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [from, to, onChange, yearAt]);

  const handle = (which: "from" | "to") => {
    const year = which === "from" ? from : to;
    const step = (delta: number) =>
      which === "from" ? onChange({ from: clamp(Math.min(from + delta, to)), to }) : onChange({ from, to: clamp(Math.max(to + delta, from)) });
    return (
      <div
        role="slider"
        tabIndex={0}
        aria-label={which === "from" ? "Earliest year" : "Latest year"}
        aria-valuemin={MIN_YEAR}
        aria-valuemax={MAX_YEAR}
        aria-valuenow={year}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          dragging.current = which;
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); step(e.shiftKey ? -10 : -1); }
          if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); step(e.shiftKey ? 10 : 1); }
        }}
        className="group absolute top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none items-center justify-center rounded-full active:cursor-grabbing"
        style={{ left: `${toPct(year)}%`, zIndex: which === "from" ? 2 : 1 }}
      >
        <span className="h-5 w-5 rounded-full border-2 border-blue-300 bg-[#0B1430] transition-transform duration-150 group-hover:scale-110 group-active:scale-95" />
      </div>
    );
  };

  return (
    <div>
      <h2 className="font-display !text-lg font-semibold text-white">From which years?</h2>
      <p className="mt-1 text-sm text-slate-400">A tighter range gives closer matches.</p>

      <p className="mt-6 text-center font-display text-4xl font-semibold tabular-nums tracking-[-0.02em] text-white">
        {from}
        <span className="mx-3 text-slate-600">–</span>
        {to}
      </p>

      <div className="mx-3 mt-6">
        <div ref={trackRef} className="relative h-1.5 rounded-full bg-white/10">
          <div className="absolute inset-y-0 rounded-full bg-blue-400" style={{ left: `${toPct(from)}%`, width: `${toPct(to) - toPct(from)}%` }} />
          {handle("from")}
          {handle("to")}
        </div>
        <div className="mt-3 flex justify-between text-xs tabular-nums text-slate-500">
          <span>{MIN_YEAR}</span>
          <span>{MAX_YEAR}</span>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {PRESETS.map((preset) => {
          const active = preset.from === from && preset.to === to;
          return (
            <button
              key={preset.label}
              type="button"
              aria-pressed={active}
              onClick={() => onChange({ from: clamp(preset.from), to: clamp(preset.to) })}
              className={`min-h-10 rounded-full border px-4 text-sm font-medium transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.96] ${
                active
                  ? "border-blue-400/60 bg-blue-400/20 text-white"
                  : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
