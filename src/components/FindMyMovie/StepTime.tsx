"use client";

import { useRef, useCallback, useEffect } from "react";

interface YearRangeValue {
  from: number;
  to: number;
}

interface StepTimeProps {
  value: YearRangeValue;
  onChange: (range: YearRangeValue) => void;
  isGlass?: boolean;
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

export default function StepTime({ value, onChange, isGlass = false }: StepTimeProps) {
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

  const HANDLE_SIZE = 20;

  return (
    <div>
      <h2 className={isGlass ? "font-display font-semibold text-[1.9rem] text-white tracking-[-0.03em] mb-1" : "font-display font-bold text-xl text-brutal-white uppercase tracking-tight mb-1"}>
        {isGlass ? "Set the era" : "YEAR RANGE"}
      </h2>
      <p className={isGlass ? "text-[0.95rem] text-slate-400 leading-relaxed mb-5" : "text-brutal-muted text-xs font-mono mb-5"}>
        {isGlass ? "Keep the release window tight if you want more accurate matches." : "Drag the handles to set your era"}
      </p>

      <div
        className={isGlass ? "p-5 mb-4 rounded-[24px] border" : "brutal-card p-4 mb-4"}
        style={isGlass ? {
          background: "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.03))",
          borderColor: "rgba(255,255,255,0.08)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
        } : undefined}
      >
        <div className="flex items-center justify-center gap-3 mb-5">
          <span className={isGlass ? "font-display font-semibold text-[2rem] text-blue-300" : "font-display font-bold text-2xl text-brutal-cyan"}>{from}</span>
          <span className={isGlass ? "text-slate-500 text-base" : "font-mono text-brutal-dim text-sm"}>-</span>
          <span className={isGlass ? "font-display font-semibold text-[2rem] text-cyan-100" : "font-display font-bold text-2xl text-brutal-yellow"}>{to}</span>
        </div>

        <div className="relative mx-1" style={{ paddingTop: 12, paddingBottom: 20 }}>
          <div
            ref={trackRef}
            className={isGlass ? "relative h-2 rounded-full border" : "relative h-1.5 bg-surface-2 border border-brutal-border"}
            style={isGlass ? {
              background: "rgba(255,255,255,0.06)",
              borderColor: "rgba(255,255,255,0.08)",
            } : undefined}
          >
            <div
              className={isGlass ? "absolute top-0 h-full rounded-full" : "absolute top-0 h-full bg-brutal-cyan"}
              style={{
                left: `${fromPct}%`,
                width: `${Math.max(0, toPct - fromPct)}%`,
                background: isGlass ? "linear-gradient(90deg, rgba(96,165,250,0.95), rgba(34,211,238,0.92))" : undefined,
              }}
            />

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
              <div
                role="slider"
                aria-label="From year"
                aria-valuemin={MIN_YEAR}
                aria-valuemax={MAX_YEAR}
                aria-valuenow={from}
                tabIndex={0}
                onPointerDown={(e) => {
                  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                  dragging.current = "from";
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
                    e.preventDefault();
                    onChange({ from: clampYear(Math.min(from - 1, to)), to });
                  } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
                    e.preventDefault();
                    onChange({ from: clampYear(Math.min(from + 1, to)), to });
                  }
                }}
                className="cursor-grab active:cursor-grabbing"
                style={{
                  width: HANDLE_SIZE,
                  height: HANDLE_SIZE,
                  borderRadius: "50%",
                  border: isGlass ? "1px solid rgba(96,165,250,0.55)" : "2px solid var(--color-brutal-cyan)",
                  background: isGlass ? "linear-gradient(135deg, rgba(96,165,250,0.9), rgba(34,211,238,0.8))" : "repeating-linear-gradient(45deg, rgba(0,255,255,0.4) 0px, rgba(0,255,255,0.4) 3px, transparent 3px, transparent 7px)",
                  boxShadow: isGlass ? "0 0 0 4px rgba(96,165,250,0.12), 0 8px 20px rgba(37,99,235,0.28)" : "0 0 0 2px rgba(0,255,255,0.15)",
                }}
              />
            </div>

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
              <div
                role="slider"
                aria-label="To year"
                aria-valuemin={MIN_YEAR}
                aria-valuemax={MAX_YEAR}
                aria-valuenow={to}
                tabIndex={0}
                onPointerDown={(e) => {
                  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                  dragging.current = "to";
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
                    e.preventDefault();
                    onChange({ from, to: clampYear(Math.max(to - 1, from)) });
                  } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
                    e.preventDefault();
                    onChange({ from, to: clampYear(Math.max(to + 1, from)) });
                  }
                }}
                className="cursor-grab active:cursor-grabbing"
                style={{
                  width: HANDLE_SIZE,
                  height: HANDLE_SIZE,
                  borderRadius: "50%",
                  border: isGlass ? "1px solid rgba(125,211,252,0.6)" : "2px solid var(--color-brutal-yellow)",
                  background: isGlass ? "linear-gradient(135deg, rgba(103,232,249,0.92), rgba(191,219,254,0.82))" : "repeating-linear-gradient(45deg, rgba(255,230,0,0.4) 0px, rgba(255,230,0,0.4) 3px, transparent 3px, transparent 7px)",
                  boxShadow: isGlass ? "0 0 0 4px rgba(103,232,249,0.12), 0 8px 20px rgba(8,145,178,0.22)" : "0 0 0 2px rgba(255,230,0,0.15)",
                }}
              />
            </div>
          </div>

          <div className="flex justify-between mt-2">
            <span className={isGlass ? "text-[0.78rem] text-slate-500" : "font-mono text-[10px] text-brutal-dim"}>{MIN_YEAR}</span>
            <span className={isGlass ? "text-[0.78rem] text-slate-500" : "font-mono text-[10px] text-brutal-dim"}>{MAX_YEAR}</span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {marks.map((year) => (
            <button
              key={year}
              type="button"
              onClick={() => {
                if (Math.abs(year - from) <= Math.abs(year - to)) {
                  onChange({ from: clampYear(Math.min(year, to)), to });
                } else {
                  onChange({ from, to: clampYear(Math.max(year, from)) });
                }
              }}
              className={isGlass
                ? `px-2.5 py-1.5 rounded-full border text-[0.78rem] transition-colors ${
                    year >= from && year <= to ? "text-blue-200" : "text-slate-500"
                  }`
                : `px-2 py-1 border text-[10px] font-mono ${
                    year >= from && year <= to
                      ? "border-brutal-cyan text-brutal-cyan bg-brutal-cyan/10"
                      : "border-brutal-border text-brutal-dim"
                  }`}
              style={isGlass ? {
                background: year >= from && year <= to ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.03)",
                borderColor: year >= from && year <= to ? "rgba(96,165,250,0.22)" : "rgba(255,255,255,0.06)",
              } : undefined}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      <p className={isGlass ? "text-[0.8rem] text-slate-500" : "text-[10px] font-mono uppercase text-brutal-dim"}>
        {isGlass ? "Tip: the left handle is always the start year." : "Tip: handles cannot swap - left is always the start year."}
      </p>
    </div>
  );
}
