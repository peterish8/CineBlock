"use client";

import { useState } from "react";
import { useMovieLists } from "@/hooks/useMovieLists";
import { useThemeMode } from "@/hooks/useThemeMode";
import NetflixLayout from "@/components/streaming/NetflixLayout";
import PrimeVideoLayout from "@/components/streaming/PrimeVideoLayout";
import DisneyLayout from "@/components/streaming/DisneyLayout";
import HotstarLayout from "@/components/streaming/HotstarLayout";
import AppleTVLayout from "@/components/streaming/AppleTVLayout";

export type Platform = {
  id: string;
  name: string;
  tmdbId: string;
  logo: string;
  tagline: string;
  bg: string;
  accent: string;
  textColor: string;
  borderColor: string;
  glowColor: string;
};

const PLATFORMS: Platform[] = [
  {
    id: "netflix",
    name: "Netflix",
    tmdbId: "8",
    logo: "N",
    tagline: "Watch TV shows & movies",
    bg: "#141414",
    accent: "#E50914",
    textColor: "#ffffff",
    borderColor: "#E50914",
    glowColor: "rgba(229,9,20,0.5)",
  },
  {
    id: "prime",
    name: "Prime Video",
    tmdbId: "9|119",
    logo: "prime",
    tagline: "Included with Prime",
    bg: "#0F171E",
    accent: "#00A8E1",
    textColor: "#ffffff",
    borderColor: "#00A8E1",
    glowColor: "rgba(0,168,225,0.5)",
  },
  {
    id: "disney",
    name: "Disney+",
    tmdbId: "337|122",
    logo: "D+",
    tagline: "From Disney, Pixar, Marvel, Star Wars",
    bg: "#040714",
    accent: "#0063e5",
    textColor: "#f9f9f9",
    borderColor: "#0063e5",
    glowColor: "rgba(0,99,229,0.5)",
  },
  {
    id: "hotstar",
    name: "Hotstar",
    tmdbId: "122|337|119",
    logo: "HS",
    tagline: "India's Largest Streaming Platform",
    bg: "#1a1a2e",
    accent: "#ED1B24",
    textColor: "#ffffff",
    borderColor: "#ED1B24",
    glowColor: "rgba(237,27,36,0.5)",
  },
  {
    id: "appletv",
    name: "Apple TV+",
    tmdbId: "350",
    logo: "",
    tagline: "Original stories. Original voices.",
    bg: "#000000",
    accent: "#f5f5f7",
    textColor: "#f5f5f7",
    borderColor: "#555",
    glowColor: "rgba(245,245,247,0.3)",
  },
];

const COUNTRIES = [
  { code: "IN", name: "🇮🇳 India" },
  { code: "US", name: "🇺🇸 United States" },
  { code: "GB", name: "🇬🇧 United Kingdom" },
  { code: "AU", name: "🇦🇺 Australia" },
  { code: "CA", name: "🇨🇦 Canada" },
  { code: "DE", name: "🇩🇪 Germany" },
  { code: "FR", name: "🇫🇷 France" },
  { code: "JP", name: "🇯🇵 Japan" },
  { code: "KR", name: "🇰🇷 South Korea" },
  { code: "BR", name: "🇧🇷 Brazil" },
  { code: "MX", name: "🇲🇽 Mexico" },
  { code: "SG", name: "🇸🇬 Singapore" },
  { code: "AE", name: "🇦🇪 UAE" },
];

function StreamingContent() {
  const [step, setStep] = useState<"country" | "platform" | "watching">("country");
  const [country, setCountry] = useState<string>("");
  const [platform, setPlatform] = useState<Platform | null>(null);

  const handleCountrySelect = (code: string) => {
    setCountry(code);
    setStep("platform");
  };

  const handlePlatformSelect = (p: Platform) => {
    setPlatform(p);
    setStep("watching");
  };

  const handleBack = () => {
    if (step === "watching") { setStep("platform"); }
    else if (step === "platform") { setStep("country"); }
  };

  if (step === "country") {
    return <CountrySelector onSelect={handleCountrySelect} />;
  }

  if (step === "platform") {
    return <PlatformSelector country={country} onSelect={handlePlatformSelect} onBack={() => setStep("country")} />;
  }

  if (step === "watching" && platform) {
    const props = { platform, country, onBack: handleBack };
    if (platform.id === "netflix") return <NetflixLayout {...props} />;
    if (platform.id === "prime") return <PrimeVideoLayout {...props} />;
    if (platform.id === "disney") return <DisneyLayout {...props} />;
    if (platform.id === "hotstar") return <HotstarLayout {...props} />;
    if (platform.id === "appletv") return <AppleTVLayout {...props} />;
  }

  return null;
}

/* ─── Step 1: Country Selector ─── */
function CountrySelector({ onSelect }: { onSelect: (code: string) => void }) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-12"
      style={{ background: "radial-gradient(ellipse at top, #1a1a2e 0%, #000 60%)" }}>
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 mb-6">
          <span className="text-3xl font-bold text-white tracking-tight">MOVIE<span className="text-yellow-400">X</span></span>
          <span className="text-white/30 text-xl">×</span>
          <span className="text-white/70 text-lg font-semibold tracking-wider">STREAMING</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
          Where are you watching from?
        </h1>
        <p className="text-white/50 text-lg">We'll show you what's available in your region</p>
      </div>

      {/* Country Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-w-4xl w-full">
        {COUNTRIES.map((c) => (
          <button
            key={c.code}
            onClick={() => onSelect(c.code)}
            onMouseEnter={() => setHovered(c.code)}
            onMouseLeave={() => setHovered(null)}
            className="relative px-4 py-4 rounded-xl border text-sm font-semibold transition-all duration-200"
            style={{
              background: hovered === c.code ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
              borderColor: hovered === c.code ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.1)",
              color: hovered === c.code ? "#fff" : "rgba(255,255,255,0.7)",
              transform: hovered === c.code ? "translateY(-2px) scale(1.03)" : "none",
              boxShadow: hovered === c.code ? "0 8px 32px rgba(255,255,255,0.08)" : "none",
            }}
          >
            {c.name}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Step 2: Platform Selector ─── */
function PlatformSelector({
  country, onSelect, onBack
}: {
  country: string;
  onSelect: (p: Platform) => void;
  onBack: () => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const countryName = COUNTRIES.find(c => c.code === country)?.name || country;

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-12"
      style={{ background: "radial-gradient(ellipse at center, #0d0d1a 0%, #000 70%)" }}>
      {/* Back */}
      <button onClick={onBack} className="absolute top-6 left-6 text-white/50 hover:text-white text-sm transition-colors flex items-center gap-2">
        ← Back
      </button>

      <div className="text-center mb-12">
        <p className="text-white/40 text-sm mb-2 uppercase tracking-widest font-mono">
          {countryName}
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
          Choose your platform
        </h1>
        <p className="text-white/50 text-lg">Pick a streaming service to browse with its own look & feel</p>
      </div>

      {/* Platform Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl w-full">
        {PLATFORMS.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelect(p)}
            onMouseEnter={() => setHovered(p.id)}
            onMouseLeave={() => setHovered(null)}
            className="relative flex flex-col items-center gap-4 p-8 rounded-2xl border-2 transition-all duration-300 text-left overflow-hidden"
            style={{
              background: hovered === p.id ? `${p.bg}CC` : `${p.bg}88`,
              borderColor: hovered === p.id ? p.accent : "rgba(255,255,255,0.08)",
              boxShadow: hovered === p.id ? `0 0 40px ${p.glowColor}, 0 8px 32px rgba(0,0,0,0.5)` : "0 4px 16px rgba(0,0,0,0.4)",
              transform: hovered === p.id ? "translateY(-4px) scale(1.02)" : "none",
            }}
          >
            {/* Glow spot behind logo */}
            {hovered === p.id && (
              <div className="absolute top-6 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full blur-2xl pointer-events-none"
                style={{ background: p.glowColor }} />
            )}

            {/* Logo */}
            <div className="relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl tracking-tighter"
              style={{ background: p.accent, color: p.id === "appletv" ? "#000" : "#fff" }}>
              {p.id === "netflix" ? <span className="text-3xl font-black italic">N</span>
                : p.id === "prime" ? <span className="text-xs font-bold leading-tight text-center">prime<br/>video</span>
                : p.id === "disney" ? <span className="text-xl font-black">D+</span>
                : p.id === "hotstar" ? <span className="text-sm font-black">HOT<br/>STAR</span>
                : <span className="text-sm font-bold"></span>
              }
            </div>

            <div className="relative z-10 text-center">
              <p className="text-white font-bold text-lg">{p.name}</p>
              <p className="text-white/50 text-xs mt-1">{p.tagline}</p>
            </div>

            {/* Arrow */}
            {hovered === p.id && (
              <div className="absolute bottom-4 right-5 text-white/50 text-xl animate-pulse">→</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function StreamingPage() {
  return <StreamingContent />;
}
