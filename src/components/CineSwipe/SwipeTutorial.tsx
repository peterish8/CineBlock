"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, ArrowUp, ArrowDown,
  Heart, Undo2, Keyboard,
} from "lucide-react";
import { useThemeMode } from "@/hooks/useThemeMode";

interface SwipeTutorialProps {
  onDismiss: () => void;
}

const gestures = [
  {
    icon: ArrowRight,
    label: "WATCHLIST",
    desc: "Swipe right",
    key: "→",
    glassColor: "text-emerald-400",
    glassBorder: "rgba(52,211,153,0.45)",
    glassGlow: "rgba(52,211,153,0.12)",
    brutalColor: "text-brutal-lime",
    brutalBorder: "border-brutal-lime",
  },
  {
    icon: ArrowLeft,
    label: "SKIP",
    desc: "Swipe left",
    key: "←",
    glassColor: "text-slate-400",
    glassGlow: "rgba(100,116,139,0.10)",
    glassBorder: "rgba(100,116,139,0.35)",
    brutalColor: "text-brutal-dim",
    brutalBorder: "border-brutal-dim",
  },
  {
    icon: ArrowDown,
    label: "WATCHED",
    desc: "Swipe down",
    key: "↓",
    glassColor: "text-cyan-400",
    glassBorder: "rgba(34,211,238,0.45)",
    glassGlow: "rgba(34,211,238,0.12)",
    brutalColor: "text-brutal-cyan",
    brutalBorder: "border-brutal-cyan",
  },
  {
    icon: ArrowUp,
    label: "CINEBLOCK",
    desc: "Swipe up",
    key: "↑",
    glassColor: "text-violet-400",
    glassBorder: "rgba(139,92,246,0.45)",
    glassGlow: "rgba(139,92,246,0.12)",
    brutalColor: "text-brutal-violet",
    brutalBorder: "border-brutal-violet",
  },
  {
    icon: Heart,
    label: "FAVOURITE",
    desc: "Double-tap",
    key: "Space",
    glassColor: "text-pink-400",
    glassBorder: "rgba(236,72,153,0.45)",
    glassGlow: "rgba(236,72,153,0.12)",
    brutalColor: "text-brutal-red",
    brutalBorder: "border-brutal-red",
    isTap: true,
  },
];

// Full keyboard cheatsheet shown on slide 2
const keybinds = [
  { keys: ["←"], label: "Skip movie", color: "rgba(100,116,139,0.8)" },
  { keys: ["→"], label: "Add to Watchlist", color: "rgba(52,211,153,0.9)" },
  { keys: ["↓"], label: "Mark as Watched", color: "rgba(34,211,238,0.9)" },
  { keys: ["↑"], label: "Add to CineBlock", color: "rgba(139,92,246,0.9)" },
  { keys: ["Space"], label: "Favourite ♥", color: "rgba(236,72,153,0.9)" },
  { keys: ["Z", "⌫"], label: "Undo last swipe", color: "rgba(248,196,113,0.9)" },
];

function KeyChip({ label, color }: { label: string; color: string }) {
  const isGlass = useThemeMode() === "glass";
  return (
    <span
      className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[11px] font-black font-mono shrink-0 min-w-[28px]`}
      style={
        isGlass
          ? {
              background: "rgba(255,255,255,0.09)",
              border: `1px solid ${color}`,
              color,
              boxShadow: `0 0 8px ${color}40`,
            }
          : {
              background: "rgba(0,0,0,0.6)",
              border: `2px solid ${color}`,
              color,
            }
      }
    >
      {label}
    </span>
  );
}

export default function SwipeTutorial({ onDismiss }: SwipeTutorialProps) {
  const [direction, setDirection] = useState(0);
  const [slide, setSlide] = useState<1 | 2>(1);
  const isGlass = useThemeMode() === "glass";

  // Keyboard navigation for tutorial slides
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" && slide === 1) {
        setDirection(1);
        setSlide(2);
      } else if (e.key === "ArrowLeft" && slide === 2) {
        setDirection(-1);
        setSlide(1);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [slide]);


  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center px-6"
      style={
        isGlass
          ? { background: "rgba(2,5,18,0.92)", backdropFilter: "blur(20px)" }
          : { background: "rgba(0,0,0,0.92)" }
      }
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <AnimatePresence mode="wait">
        {slide === 1 ? (
          <motion.div
            key="slide1"
            className="w-full max-w-sm"
            initial={{ opacity: 0, x: direction === -1 ? -40 : 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction === -1 ? 40 : -40 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Header */}
            <div className="mb-6 text-center">
              <h2
                className={`text-2xl font-black uppercase tracking-wider ${
                  isGlass ? "text-white" : "font-display text-brutal-pink"
                }`}
              >
                How to Swipe
              </h2>
              <p
                className={`mt-1 text-[10px] uppercase tracking-widest ${
                  isGlass ? "text-slate-500" : "font-mono text-brutal-dim"
                }`}
              >
                Discover movies with gestures
              </p>
            </div>

            {/* Gesture grid */}
            <div className="grid grid-cols-2 gap-3">
              {gestures.map((g, i) => {
                const Icon = g.icon;
                return (
                  <motion.div
                    key={g.label}
                    className={`flex items-center gap-3 px-3 py-3 ${
                      g.isTap ? "col-span-2" : ""
                    } ${
                      isGlass
                        ? "rounded-xl"
                        : `border-2 ${g.brutalBorder} bg-black/50`
                    }`}
                    style={
                      isGlass
                        ? {
                            background: g.glassGlow,
                            border: `1px solid ${g.glassBorder}`,
                          }
                        : undefined
                    }
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.07 }}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center ${
                        isGlass ? "rounded-lg" : `border-2 ${g.brutalBorder}`
                      }`}
                      style={
                        isGlass
                          ? {
                              background: g.glassGlow,
                              border: `1px solid ${g.glassBorder}`,
                            }
                          : undefined
                      }
                    >
                      <Icon
                        className={`h-5 w-5 ${isGlass ? g.glassColor : g.brutalColor}`}
                        strokeWidth={2.5}
                        fill={g.isTap ? "currentColor" : "none"}
                      />
                    </div>
                    <div className="flex-1">
                      <span
                        className={`block text-xs font-black uppercase tracking-widest ${
                          isGlass ? g.glassColor : `font-mono ${g.brutalColor}`
                        }`}
                      >
                        {g.label}
                      </span>
                      <span
                        className={`text-[9px] ${isGlass ? "text-slate-500" : "font-mono text-brutal-dim"}`}
                      >
                        {g.desc}
                      </span>
                    </div>
                    {/* Key badge */}
                    <span
                      className={`text-[11px] font-black font-mono px-1.5 py-0.5 rounded shrink-0 ${
                        isGlass ? "text-slate-500" : "font-mono text-brutal-dim"
                      }`}
                      style={
                        isGlass
                          ? {
                              background: "rgba(255,255,255,0.06)",
                              border: "1px solid rgba(255,255,255,0.12)",
                            }
                          : { background: "rgba(0,0,0,0.4)", border: "1px solid #444" }
                      }
                    >
                      {g.key}
                    </span>
                  </motion.div>
                );
              })}
            </div>

            {/* Next button */}
            <motion.button
              onClick={() => { setDirection(1); setSlide(2); }}
              className={`mt-6 w-full flex h-12 items-center justify-center gap-2 text-sm font-black uppercase tracking-widest transition-colors ${
                isGlass
                  ? "rounded-xl"
                  : "brutal-btn border-2 border-brutal-pink bg-brutal-pink text-black font-mono hover:bg-white hover:text-brutal-pink"
              }`}
              style={
                isGlass
                  ? {
                      background: "rgba(236,72,153,0.18)",
                      border: "1px solid rgba(236,72,153,0.45)",
                      color: "#F472B6",
                    }
                  : undefined
              }
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              whileTap={{ scale: 0.97 }}
            >
              <Keyboard className="h-4 w-4" strokeWidth={2} />
              See Keyboard Shortcuts →
            </motion.button>

            {/* Step indicator */}
            
            <div className="mt-4 flex justify-center gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="h-1.5 w-6 rounded-full cursor-pointer transition-transform"
                style={isGlass ? { background: "rgba(236,72,153,0.8)" } : { background: "rgba(236,72,153,0.8)" }}
                onClick={() => { setDirection(-1); setSlide(1); }}
              />
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="h-1.5 w-6 rounded-full cursor-pointer transition-transform"
                style={isGlass ? { background: "rgba(255,255,255,0.2)" } : { background: "rgba(100,100,100,0.4)" }}
                onClick={() => { setDirection(1); setSlide(2); }}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="slide2"
            className="w-full max-w-sm"
            initial={{ opacity: 0, x: direction === -1 ? -40 : 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction === -1 ? 40 : -40 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Header */}
            <div className="mb-5 text-center">
              <h2
                className={`text-2xl font-black uppercase tracking-wider ${
                  isGlass ? "text-white" : "font-display text-brutal-pink"
                }`}
              >
                Keyboard Shortcuts
              </h2>
              <p
                className={`mt-1 text-[10px] uppercase tracking-widest ${
                  isGlass ? "text-slate-500" : "font-mono text-brutal-dim"
                }`}
              >
                For laptop / desktop users
              </p>
            </div>

            {/* Keybind rows */}
            <div
              className={`flex flex-col gap-2 p-4 ${isGlass ? "rounded-2xl" : "border-2 border-brutal-border"}`}
              style={
                isGlass
                  ? {
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.10)",
                    }
                  : undefined
              }
            >
              {keybinds.map((kb, i) => (
                <motion.div
                  key={kb.label}
                  className="flex items-center justify-between gap-3"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.08 + i * 0.06 }}
                >
                  <span
                    className={`text-xs font-bold flex-1 ${
                      isGlass ? "text-slate-300" : "font-mono text-text"
                    }`}
                  >
                    {kb.label}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {kb.keys.map((k) => (
                      <KeyChip key={k} label={k} color={kb.color} />
                    ))}
                  </div>
                </motion.div>
              ))}

              {/* Divider */}
              <div
                className="my-1 h-px"
                style={{ background: isGlass ? "rgba(255,255,255,0.07)" : "rgba(100,100,100,0.3)" }}
              />

              {/* Undo tip */}
              <motion.div
                className="flex items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 }}
              >
                <Undo2 className={`h-3.5 w-3.5 shrink-0 ${isGlass ? "text-amber-300" : "text-brutal-dim"}`} strokeWidth={2.5} />
                <p className={`text-[10px] leading-relaxed ${isGlass ? "text-slate-500" : "font-mono text-brutal-dim"}`}>
                  Nothing saves until you press <strong className={isGlass ? "text-pink-300" : ""}>Done</strong>. Undo anytime with <strong className={isGlass ? "text-amber-300" : ""}>Z</strong>.
                </p>
              </motion.div>
            </div>

          {/* Back button */}
          <motion.button
            onClick={() => { setDirection(-1); setSlide(1); }}
            className={`mt-2 w-full flex h-12 items-center justify-center gap-2 text-sm font-black uppercase tracking-widest transition-colors ${isGlass ? "rounded-xl" : "brutal-btn border-2 border-brutal-pink bg-brutal-pink text-black font-mono hover:bg-white hover:text-brutal-pink"}`}
            style={isGlass ? { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.85)" } : undefined}
            whileTap={{ scale: 0.97 }}
          >
            ← Back
          </motion.button>

            <motion.button
              onClick={onDismiss}
              className={`mt-5 w-full flex h-13 items-center justify-center text-sm font-black uppercase tracking-widest transition-all active:scale-[0.98] ${
                isGlass
                  ? "rounded-xl"
                  : "brutal-btn border-2 border-brutal-pink bg-brutal-pink text-black font-mono hover:bg-white hover:text-brutal-pink"
              }`}
              style={
                isGlass
                  ? {
                      background: "linear-gradient(135deg, rgba(236,72,153,0.85), rgba(168,85,247,0.80))",
                      border: "1px solid rgba(236,72,153,0.55)",
                      color: "#fff",
                      boxShadow: "0 0 24px rgba(236,72,153,0.35), 0 4px 16px rgba(0,0,0,0.4)",
                      height: "52px",
                    }
                  : undefined
              }
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              whileTap={{ scale: 0.97 }}
            >
              Let's Go 🍿
            </motion.button>

            {/* Step indicator */}
            
            <div className="mt-4 flex justify-center gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="h-1.5 w-6 rounded-full cursor-pointer transition-transform"
                style={isGlass ? { background: "rgba(255,255,255,0.2)" } : { background: "rgba(100,100,100,0.4)" }}
                onClick={() => { setDirection(-1); setSlide(1); }}
              />
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="h-1.5 w-6 rounded-full cursor-pointer transition-transform"
                style={isGlass ? { background: "rgba(236,72,153,0.8)" } : { background: "rgba(236,72,153,0.8)" }}
                onClick={() => { setDirection(1); setSlide(2); }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
