"use client";

import { RotateCcw, WifiOff, type LucideIcon } from "lucide-react";

interface ErrorStateProps {
  title: string;
  message?: string;
  icon?: LucideIcon;
  onRetry?: () => void;
  retryLabel?: string;
  retrying?: boolean;
  compact?: boolean;
  className?: string;
}

/** The one way CineBlock says something went wrong: a calm icon, plain words, and a way forward. */
export default function ErrorState({
  title,
  message,
  icon: Icon = WifiOff,
  onRetry,
  retryLabel = "Try again",
  retrying = false,
  compact = false,
  className = "",
}: ErrorStateProps) {
  return (
    <div role="alert" className={`flex flex-col items-center text-center ${compact ? "gap-2 py-6" : "gap-3 py-12"} ${className}`}>
      <span
        className={`flex items-center justify-center rounded-2xl ${compact ? "h-10 w-10" : "h-14 w-14"}`}
        style={{ background: "rgba(249,115,22,0.10)", boxShadow: "inset 0 0 0 1px rgba(249,115,22,0.24)" }}
      >
        <Icon className={`${compact ? "h-5 w-5" : "h-6 w-6"} text-orange-300`} strokeWidth={1.75} />
      </span>
      <div className="space-y-1">
        <p className={`font-display font-semibold text-white ${compact ? "text-sm" : "text-base"}`}>{title}</p>
        {message && <p className="mx-auto max-w-sm text-sm leading-relaxed text-slate-400">{message}</p>}
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="mt-1 flex min-h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-white transition-[transform,background-color] duration-150 hover:bg-blue-400/25 active:scale-[0.97] disabled:opacity-60 disabled:active:scale-100"
          style={{ background: "rgba(96,165,250,0.16)", border: "1px solid rgba(96,165,250,0.40)" }}
        >
          <RotateCcw className={`h-4 w-4 ${retrying ? "animate-spin [animation-direction:reverse]" : ""}`} strokeWidth={2} />
          {retrying ? "Trying again…" : retryLabel}
        </button>
      )}
    </div>
  );
}
