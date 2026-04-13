"use client";

import { useThemeMode } from "@/hooks/useThemeMode";

export default function RadarSkeleton() {
  const theme = useThemeMode();

  if (theme === "glass") {
    return (
      <div className="flex gap-3 overflow-x-auto px-3 no-scrollbar sm:gap-4 sm:px-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="min-w-[130px] shrink-0 sm:min-w-[160px]">
            <div
              className="relative mb-2.5 aspect-[2/3] overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                animationDelay: `${i * 0.15}s`,
                animation: `glassBorderPulse 2.4s ease-in-out ${i * 0.15}s infinite`,
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(110deg, transparent 20%, rgba(96,165,250,0.07) 40%, rgba(249,115,22,0.05) 55%, rgba(96,165,250,0.07) 72%, transparent 85%)",
                  animation: `shimmerGlass 2.2s ease-in-out ${i * 0.18}s infinite`,
                }}
              />
            </div>
            <div className="space-y-1.5 px-0.5">
              <div className="h-3 w-4/5 rounded-md" style={{ background: "rgba(255,255,255,0.05)", animation: `glassBorderPulse 2.4s ease-in-out ${i * 0.12}s infinite` }} />
              <div className="h-2.5 w-1/2 rounded-md" style={{ background: "rgba(255,255,255,0.03)", animation: `glassBorderPulse 2.4s ease-in-out ${i * 0.16}s infinite` }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (theme === "netflix") {
    return (
      <div className="flex gap-3 overflow-x-auto px-3 no-scrollbar sm:px-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="min-w-[135px] shrink-0 sm:min-w-[165px]">
            <div className="relative mb-2 aspect-[2/3] overflow-hidden rounded-[6px] border border-white/[0.08] bg-[#1a1a1a]">
              <div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(110deg, transparent 18%, rgba(255,255,255,0.05) 38%, rgba(229,9,20,0.10) 52%, rgba(255,255,255,0.05) 66%, transparent 84%)",
                  backgroundSize: "200% 100%",
                  animation: `shimmerSlide 1.8s ease-in-out ${i * 0.12}s infinite`,
                }}
              />
              <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/95 to-transparent" />
            </div>
            <div className="space-y-1.5 px-0.5">
              <div className="h-3 w-4/5 rounded-sm bg-white/10" />
              <div className="h-2.5 w-1/2 rounded-sm bg-white/6" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto px-4 no-scrollbar">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="min-w-[160px] animate-pulse">
          <div className="mb-3 aspect-[2/3] border-4 border-brutal-border bg-surface" />
          <div className="mb-2 h-4 w-3/4 border-2 border-brutal-border bg-surface-2" />
          <div className="h-3 w-1/2 border-2 border-brutal-border bg-surface-2" />
        </div>
      ))}
    </div>
  );
}
