"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Heart,
} from "lucide-react";

interface SwipeTutorialProps {
  onDismiss: () => void;
}

export default function SwipeTutorial({ onDismiss }: SwipeTutorialProps) {
  const gestures = [
    {
      icon: ArrowRight,
      label: "WATCHLIST",
      desc: "Swipe right",
      color: "text-brutal-lime",
      borderColor: "border-brutal-lime",
      x: 60,
      y: 0,
    },
    {
      icon: ArrowLeft,
      label: "SKIP",
      desc: "Swipe left",
      color: "text-brutal-dim",
      borderColor: "border-brutal-dim",
      x: -60,
      y: 0,
    },
    {
      icon: ArrowDown,
      label: "WATCHED",
      desc: "Swipe down",
      color: "text-brutal-cyan",
      borderColor: "border-brutal-cyan",
      x: 0,
      y: 60,
    },
    {
      icon: ArrowUp,
      label: "CINEBLOCK",
      desc: "Swipe up",
      color: "text-brutal-violet",
      borderColor: "border-brutal-violet",
      x: 0,
      y: -60,
    },
    {
      icon: Heart,
      label: "FAVOURITE",
      desc: "Double-tap or Space",
      color: "text-brutal-red",
      borderColor: "border-brutal-red",
      x: 0,
      y: 0,
      isTap: true,
    },
  ];

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="w-full max-w-sm">
        {/* Header */}
        <motion.div
          className="mb-8 text-center"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="font-display text-2xl font-black uppercase tracking-wider text-brutal-pink">
            How to Swipe
          </h2>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-brutal-dim">
            Discover movies with gestures
          </p>
        </motion.div>

        {/* Gesture grid */}
        <div className="grid grid-cols-2 gap-3">
          {gestures.map((g, i) => {
            const Icon = g.icon;
            return (
              <motion.div
                key={g.label}
                className={`flex items-center gap-3 border-2 ${g.borderColor} bg-black/50 px-3 py-3 ${
                  g.isTap ? "col-span-2" : ""
                }`}
                initial={{ opacity: 0, x: g.x * 0.5, y: g.y * 0.5 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{
                  delay: 0.2 + i * 0.1,
                  type: "spring",
                  stiffness: 300,
                  damping: 25,
                }}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center border-2 ${g.borderColor}`}
                >
                  <Icon
                    className={`h-5 w-5 ${g.color}`}
                    strokeWidth={2.5}
                    fill={g.isTap ? "currentColor" : "none"}
                  />
                </div>
                <div>
                  <span
                    className={`block font-mono text-xs font-black uppercase tracking-widest ${g.color}`}
                  >
                    {g.label}
                  </span>
                  <span className="font-mono text-[9px] text-brutal-dim">
                    {g.desc}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Dismiss button */}
        <motion.button
          onClick={onDismiss}
          className="brutal-btn mt-6 w-full border-2 border-brutal-pink bg-brutal-pink px-6 py-3 font-mono text-sm font-black uppercase tracking-widest text-black transition-colors hover:bg-white hover:text-brutal-pink"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          Got it!
        </motion.button>
      </div>
    </motion.div>
  );
}
