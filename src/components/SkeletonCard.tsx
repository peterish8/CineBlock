"use client";

import { useThemeMode } from "@/hooks/useThemeMode";

export default function SkeletonCard() {
  const theme = useThemeMode();

  if (theme === "glass") {
    return (
      <div
        className="relative aspect-[2/3] w-full overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 14,
          animation: "glassBorderPulse 2.4s ease-in-out infinite",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(110deg, transparent 15%, rgba(96,165,250,0.08) 35%, rgba(139,92,246,0.06) 48%, rgba(249,115,22,0.07) 58%, rgba(96,165,250,0.08) 72%, transparent 85%)",
            backgroundSize: "200% 100%",
            animation: "shimmerGlass 2.2s ease-in-out infinite",
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 space-y-1.5 p-3">
          <div className="h-3 w-4/5 rounded-md" style={{ background: "rgba(255,255,255,0.06)" }} />
          <div className="h-2.5 w-2/5 rounded-md" style={{ background: "rgba(255,255,255,0.04)" }} />
        </div>
      </div>
    );
  }

  return <div className="aspect-[2/3] brutal-shimmer" />;
}
