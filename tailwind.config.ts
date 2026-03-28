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
        surface: "#161616",
        "surface-2": "#1E1E1E",
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
        none: "none",
      },
      borderWidth: {
        "3": "3px",
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out forwards",
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
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
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
      },
    },
  },
  plugins: [],
};

export default config;
