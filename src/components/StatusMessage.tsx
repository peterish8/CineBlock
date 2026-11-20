"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

/** Primary action inside a {@link StatusMessage}. */
export const STATUS_PRIMARY_BUTTON =
  "inline-flex h-11 items-center justify-center rounded-xl bg-[#60A5FA] px-5 text-sm font-semibold text-[#020817] transition-[background-color,transform] duration-150 hover:bg-[#93C5FD] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#020817] active:scale-[0.96]";

/** Secondary action inside a {@link StatusMessage}. */
export const STATUS_SECONDARY_BUTTON =
  "inline-flex h-11 items-center justify-center rounded-xl border border-white/10 px-5 text-sm font-medium text-slate-200 transition-[background-color,transform] duration-150 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA] active:scale-[0.96]";

interface StatusMessageProps {
  icon: LucideIcon;
  /** A short, warm headline in the film-night voice. */
  title: string;
  /** One plain sentence saying what happened and what to do. */
  body: string;
  actions?: ReactNode;
  /** Use "alert" for failures so screen readers announce them. */
  tone?: "info" | "alert";
  className?: string;
}

/**
 * The one way the app says "something's empty" or "something went wrong": centred,
 * a line icon in a soft glass circle, a warm title, a plain explanation, and the way
 * out. Fades up once (no loops); static under reduced motion.
 */
export default function StatusMessage({ icon: Icon, title, body, actions, tone = "info", className = "" }: StatusMessageProps) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      role={tone === "alert" ? "alert" : "status"}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
      className={`mx-auto flex w-full max-w-sm flex-col items-center px-4 text-center ${className}`}
    >
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-full border bg-white/[0.04] ${
          tone === "alert" ? "border-[#F97316]/30 text-[#FDBA74]" : "border-white/10 text-[#60A5FA]"
        }`}
        aria-hidden
      >
        <Icon className="h-6 w-6" strokeWidth={1.75} />
      </div>
      <h2 className="mt-5 text-lg font-semibold text-slate-100">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{body}</p>
      {actions ? <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{actions}</div> : null}
    </motion.div>
  );
}
