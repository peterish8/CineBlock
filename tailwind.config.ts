import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0D0D0D",
        surface: "var(--color-surface)",
        "surface-2": "var(--color-surface-2)",
        brutal: {
          border: "#3A3A3A",
          yellow: "var(--theme-primary)",
          lime: "#B8FF57",
          pink: "#FF6B9D",
          cyan: "#57FFF5",
          violet: "#A78BFA",
          orange: "#FF8C42",
          red: "#FF4D4D",
          white: "#F0F0F0",
          muted: "#888888",
          dim: "#555555",
          dark: "#2A2A2A",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "system-ui", "sans-serif"],
        body: ["'Inter'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "'Space Mono'", "monospace"],
        google: ["'Poppins'", "'Inter'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        brutal: "4px 4px 0px 0px #3A3A3A",
        "brutal-sm": "2px 2px 0px 0px #3A3A3A",
        "brutal-lg": "6px 6px 0px 0px #3A3A3A",
        "brutal-accent": "4px 4px 0px 0px var(--theme-primary)",
        "brutal-lime": "4px 4px 0px 0px #B8FF57",
        "brutal-pink": "4px 4px 0px 0px #FF6B9D",
        "brutal-cyan": "4px 4px 0px 0px #57FFF5",
        "brutal-violet": "4px 4px 0px 0px #A78BFA",
        "brutal-hover": "6px 6px 0px 0px var(--theme-primary)",
        "glass-sm": "0 2px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
        "glass-md": "0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.10)",
        "glass-lg": "0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.12)",
        "glass-xl": "0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.14)",
        "glow-blue":   "0 0 24px 6px rgba(96,165,250,0.4)",
        "glow-orange": "0 0 24px 6px rgba(249,115,22,0.4)",
        "glow-violet": "0 0 24px 6px rgba(139,92,246,0.4)",
        "glow-blue-sm":   "0 0 12px 2px rgba(96,165,250,0.35)",
        "glow-orange-sm": "0 0 12px 2px rgba(249,115,22,0.35)",
        none: "none",
      },
      borderWidth: {
        "3": "3px",
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out forwards",
        "poster-in": "posterIn 0.18s cubic-bezier(0.22, 1, 0.36, 1) both",
        "slide-up": "slideUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "slide-up-fast": "slideUp 0.18s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "pop-in": "popIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "spring-in": "springIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "fade-in-up": "fadeInUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "wiggle": "wiggle 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97) both",
        "shimmer": "shimmer 1.8s ease-in-out infinite",
        "progress": "progress linear forwards",
        "slide-down": "slideDown 0.25s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "scale-in": "scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "glass-float": "glassFloat 6s ease-in-out infinite",
        "glow-pulse": "glowPulse 3s ease-in-out infinite",
        "aurora": "aurora 12s ease-in-out infinite",
        "neon-trace": "neonTrace 2s linear infinite",
        "glass-emerge": "glassEmerge 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "ken-burns": "kenBurns 8s ease-in-out infinite",
        "glass-enter-bottom": "glassEnterBottom 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "glass-enter-scale": "glassEnterScale 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "hero-content-in": "heroContentIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "backdrop-reveal": "backdropReveal 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "toast-drain": "toastDrain linear forwards",
        "header-wipe": "headerWipe 0.55s ease-out forwards",
        "orb-drift-1": "orbDrift1 22s ease-in-out infinite",
        "orb-drift-2": "orbDrift2 28s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        posterIn: {
          "0%":   { opacity: "0", transform: "translateY(10px) scale(0.97)" },
          "100%": { opacity: "1", transform: "translateY(0)    scale(1)" },
        },
        slideUp: {
          "0%": { transform: "translateY(24px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-16px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        popIn: {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        springIn: {
          "0%": { transform: "scale(0.88) translateY(12px)", opacity: "0" },
          "65%": { transform: "scale(1.03) translateY(-3px)", opacity: "1" },
          "100%": { transform: "scale(1) translateY(0)", opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "20%": { transform: "rotate(-10deg)" },
          "40%": { transform: "rotate(10deg)" },
          "60%": { transform: "rotate(-5deg)" },
          "80%": { transform: "rotate(5deg)" },
        },
        shimmer: {
          "0%, 100%": { opacity: "0.08" },
          "50%": { opacity: "0.16" },
        },
        progress: {
          "0%": { width: "0%" },
          "100%": { width: "100%" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.85)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        glassFloat: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "33%": { transform: "translateY(-8px) rotate(0.5deg)" },
          "66%": { transform: "translateY(-4px) rotate(-0.5deg)" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 20px 4px rgba(96,165,250,0.3)" },
          "50%": { boxShadow: "0 0 40px 8px rgba(96,165,250,0.6), 0 0 80px 16px rgba(249,115,22,0.15)" },
        },
        aurora: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        neonTrace: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        glassEmerge: {
          "0%": { opacity: "0", transform: "translateY(16px) scale(0.97)", filter: "blur(4px)" },
          "60%": { opacity: "1", transform: "translateY(-2px) scale(1.005)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)", filter: "blur(0)" },
        },
        kenBurns: {
          "0%":   { transform: "scale(1.06) translateX(0px)" },
          "50%":  { transform: "scale(1.10) translateX(-8px)" },
          "100%": { transform: "scale(1.06) translateX(0px)" },
        },
        glassEnterBottom: {
          "0%":   { opacity: "0", transform: "translateY(40px) scale(0.96)", filter: "blur(12px)" },
          "55%":  { opacity: "1", transform: "translateY(-4px) scale(1.01)", filter: "blur(0)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)", filter: "blur(0)" },
        },
        glassEnterScale: {
          "0%":   { opacity: "0", transform: "scale(0.93) translateY(12px)", filter: "blur(6px)" },
          "60%":  { opacity: "1", transform: "scale(1.02) translateY(-2px)", filter: "blur(0)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)", filter: "blur(0)" },
        },
        heroContentIn: {
          "0%":   { opacity: "0", transform: "translateY(20px)", filter: "blur(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)",    filter: "blur(0)" },
        },
        backdropReveal: {
          "0%":   { transform: "scale(1.1)", filter: "brightness(0.2) blur(12px)" },
          "100%": { transform: "scale(1.0)", filter: "brightness(0.6) blur(0px)" },
        },
        toastDrain: {
          "0%":   { width: "100%" },
          "100%": { width: "0%" },
        },
        headerWipe: {
          "0%":   { clipPath: "inset(0 100% 0 0)" },
          "100%": { clipPath: "inset(0 0% 0 0)" },
        },
        orbDrift1: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "30%":       { transform: "translate(8vw, 6vh) scale(1.08)" },
          "65%":       { transform: "translate(-4vw, 12vh) scale(0.95)" },
        },
        orbDrift2: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "40%":       { transform: "translate(-7vw, -9vh) scale(1.1)" },
          "75%":       { transform: "translate(5vw, -4vh) scale(0.92)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
