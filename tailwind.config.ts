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
        "slide-up": "slideUp 0.25s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "pop-in": "popIn 0.15s ease-out forwards",
        "shimmer": "shimmer 1.8s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        popIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        shimmer: {
          "0%, 100%": { opacity: "0.08" },
          "50%": { opacity: "0.16" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
