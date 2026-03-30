"use client";

import { useRef, useCallback, useEffect } from "react";

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

function clampYear(y: number) {
  return Math.min(MAX_YEAR, Math.max(MIN_YEAR, y));
}

function pctToYear(pct: number) {
  return Math.round(MIN_YEAR + pct * (MAX_YEAR - MIN_YEAR));
}

function yearToPct(year: number) {
  return ((year - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100;
}

export default function StepTime({ value, onChange }: StepTimeProps) {
  const from = clampYear(value.from);
  const to = clampYear(value.to);

  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<"from" | "to" | null>(null);

  const clientXToYear = useCallback((clientX: number) => {
    const el = trackRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return pctToYear(pct);
  }, []);

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!dragging.current) return;
      const year = clientXToYear(e.clientX);
      if (year === null) return;
      if (dragging.current === "from") {
        onChange({ from: clampYear(Math.min(year, to)), to });
      } else {
        onChange({ from, to: clampYear(Math.max(year, from)) });
      }
    },
    [from, to, onChange, clientXToYear]
  );

  const handlePointerUp = useCallback(() => {
    dragging.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  const fromPct = yearToPct(from);
  const toPct = yearToPct(to);

  const marks: number[] = [];
  for (let year = 1950; year <= MAX_YEAR; year += 10) marks.push(year);
  if (marks[marks.length - 1] !== MAX_YEAR) marks.push(MAX_YEAR);

  // Handle size
  const HANDLE_SIZE = 20;
  const HALF = HANDLE_SIZE / 2;

  return (
    <div>
      <h2 className="font-display font-bold text-xl text-brutal-white uppercase tracking-tight mb-1">
        YEAR RANGE
      </h2>
      <p className="text-brutal-muted text-xs font-mono mb-5">
        Drag the handles to set your era
      </p>

      <div className="brutal-card p-4 mb-4">
        {/* Year range display */}
        <div className="flex items-center justify-center gap-3 mb-5">
          <span className="font-display font-bold text-2xl text-brutal-cyan">{from}</span>
          <span className="font-mono text-brutal-dim text-sm">—</span>
          <span className="font-display font-bold text-2xl text-brutal-yellow">{to}</span>
        </div>

        {/* Track wrapper */}
        <div className="relative mx-1" style={{ paddingTop: 12, paddingBottom: 20 }}>

          {/* ── Track bar (the progress line) ── */}
          <div
            ref={trackRef}
            className="relative h-1.5 bg-surface-2 border border-brutal-border"
          >
            {/* Active cyan fill */}
            <div
              className="absolute top-0 h-full bg-brutal-cyan"
              style={{
                left: `${fromPct}%`,
                width: `${Math.max(0, toPct - fromPct)}%`,
              }}
            />

            {/* ── FROM handle (cyan dot on the line) ── */}
            <div
              className="absolute"
              style={{
                top: "50%",
                left: `${fromPct}%`,
                transform: "translate(-50%, -50%)",
                zIndex: 12,
                touchAction: "none",
              }}
            >
              {/* Dot */}
              <div
                onPointerDown={(e) => {
                  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                  dragging.current = "from";
                }}
                className="cursor-grab active:cursor-grabbing"
                style={{
                  width: HANDLE_SIZE,
                  height: HANDLE_SIZE,
                  borderRadius: "50%",
                  border: "2px solid var(--color-brutal-cyan)",
                  background: `repeating-linear-gradient(45deg, rgba(0,255,255,0.4) 0px, rgba(0,255,255,0.4) 3px, transparent 3px, transparent 7px)`,
                  boxShadow: "0 0 0 2px rgba(0,255,255,0.15)",
                }}
              />
            </div>

            {/* ── TO handle (yellow dot on the line) ── */}
            <div
              className="absolute"
              style={{
                top: "50%",
                left: `${toPct}%`,
                transform: "translate(-50%, -50%)",
                zIndex: 11,
                touchAction: "none",
              }}
            >
              {/* Dot */}
              <div
                onPointerDown={(e) => {
                  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                  dragging.current = "to";
                }}
                className="cursor-grab active:cursor-grabbing"
                style={{
                  width: HANDLE_SIZE,
                  height: HANDLE_SIZE,
                  borderRadius: "50%",
                  border: "2px solid var(--color-brutal-yellow)",
                  background: `repeating-linear-gradient(45deg, rgba(255,230,0,0.4) 0px, rgba(255,230,0,0.4) 3px, transparent 3px, transparent 7px)`,
                  boxShadow: "0 0 0 2px rgba(255,230,0,0.15)",
                }}
              />
            </div>
          </div>

          {/* Min / max edge labels */}
          <div className="flex justify-between mt-2">
            <span className="font-mono text-[10px] text-brutal-dim">{MIN_YEAR}</span>
            <span className="font-mono text-[10px] text-brutal-dim">{MAX_YEAR}</span>
          </div>
        </div>

        {/* Decade quick-picks */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {marks.map((year) => (
            <button
              key={year}
              onClick={() => {
                if (Math.abs(year - from) <= Math.abs(year - to)) {
                  onChange({ from: clampYear(Math.min(year, to)), to });
                } else {
                  onChange({ from, to: clampYear(Math.max(year, from)) });
                }
              }}
              className={`px-2 py-1 border text-[10px] font-mono ${
                year >= from && year <= to
                  ? "border-brutal-cyan text-brutal-cyan bg-brutal-cyan/10"
                  : "border-brutal-border text-brutal-dim"
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      <p className="text-[10px] font-mono uppercase text-brutal-dim">
        Tip: handles cannot swap — left is always the start year.
      </p>
    </div>
  );
}
