"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { X, Globe, Lock } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import { posterUrl } from "@/lib/constants";
import { useToast } from "@/components/ToastProvider";
import { useThemeMode } from "@/hooks/useThemeMode";

type StampModalProps = {
  isOpen: boolean;
  onClose: () => void;
  movie: {
    id: number;
    title: string;
    posterPath: string;
  };
};

export default function StampModal({ isOpen, onClose, movie }: StampModalProps) {
  const { isAuthenticated } = useConvexAuth();
  const { pushToast } = useToast();
  const createStamp = useMutation(api.stamps.createStamp);
  const saveDraft = useMutation(api.stamps.saveDraft);
  const isGlass = useThemeMode() === "glass";

  // Always query — hooks can't be conditional
  const existingStamp = useQuery(
    api.stamps.getMyStampForMovie,
    isAuthenticated ? { movieId: movie.id } : "skip"
  );

  const [reviewText, setReviewText] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setInitialized(false);
      setReviewText("");
      setIsPublic(true);
      return;
    }
    // Lock background scroll while modal is open
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { onClose(); return; }
      if (event.key !== "Tab") return;

      const root = document.querySelector("[data-stamp-modal='true']");
      if (!(root instanceof HTMLElement)) return;

      const focusables = Array.from(
        root.querySelectorAll<HTMLElement>(
          "button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])"
        )
      ).filter((el) => !el.hasAttribute("disabled") && el.tabIndex !== -1);

      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (!active || active === first) { event.preventDefault(); last.focus(); }
      } else if (!active || active === last) {
        event.preventDefault(); first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prev;
      restoreFocusRef.current?.focus();
    };
  }, [isOpen, onClose]);

  // Pre-fill from draft once it loads
  useEffect(() => {
    if (!isOpen || initialized || existingStamp === undefined) return;
    setInitialized(true);
    if (existingStamp?.isDraft) {
      setReviewText(existingStamp.reviewText);
    }
  }, [isOpen, initialized, existingStamp]);

  if (!isOpen || !isAuthenticated) return null;

  // Already published — nothing to do, X closes
  const isAlreadyPublished = existingStamp !== undefined && existingStamp !== null && !existingStamp.isDraft;
  const isDraft = existingStamp?.isDraft === true;
  const isLoading = existingStamp === undefined;

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = reviewText.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createStamp({
        movieId: movie.id,
        movieTitle: movie.title,
        posterPath: movie.posterPath,
        reviewText: trimmed,
        isPublic,
      });
      pushToast("success", "Stamped!");
      onClose();
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : "Failed to stamp.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDraft = async () => {
    const trimmed = reviewText.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await saveDraft({
        movieId: movie.id,
        movieTitle: movie.title,
        posterPath: movie.posterPath,
        reviewText: trimmed,
      });
      pushToast("success", "Draft saved — continue anytime from your profile.");
      onClose();
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : "Failed to save draft.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const charCount = reviewText.length;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 animate-fade-in motion-reduce:animate-none"
        style={isGlass
          ? { background: "rgba(2,8,23,0.80)", backdropFilter: "blur(8px)" }
          : { background: "rgba(0,0,0,0.70)", backdropFilter: "blur(2px)" }
        }
        onClick={!isSubmitting ? onClose : undefined}
      />

      {/* Modal container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-stamp-modal="true"
        className={`relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden animate-slide-up motion-reduce:animate-none ${
          isGlass ? "" : "border-4 border-brutal-border brutal-shadow"
        }`}
        style={isGlass ? {
          background: "rgba(8,15,40,0.96)",
          backdropFilter: "blur(28px) saturate(160%)",
          WebkitBackdropFilter: "blur(28px) saturate(160%)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "20px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)",
        } : { background: "var(--color-bg)" }}
      >
        {/* Glass: orange accent bar */}
        {isGlass && (
          <div style={{ height: 3, background: "linear-gradient(90deg, #F59E0B, #FBBF24)", flexShrink: 0 }} />
        )}

        {/* Header */}
        {isGlass ? (
          <div className="flex items-center justify-between px-6 py-4">
            <h2 id={titleId} className="font-display font-semibold text-base text-white tracking-tight">
              {isDraft ? "Continue Draft" : "The Criterion"}
            </h2>
            <button
              ref={closeButtonRef}
              onClick={onClose}
              aria-label="Close"
              className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors hover:bg-white/10"
              style={{ border: "1px solid rgba(255,255,255,0.12)", color: "rgba(148,163,184,0.8)" }}
            >
              <X className="h-3.5 w-3.5" strokeWidth={2.5} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between border-b-4 border-brutal-border bg-brutal-yellow p-4">
            <h2 id={titleId} className="font-outfit text-xl font-black uppercase tracking-wider text-black">
              {isDraft ? "CONTINUE DRAFT" : "THE CRITERION"}
            </h2>
            <button
              ref={closeButtonRef}
              onClick={onClose}
              aria-label="Close"
              className="p-1 transition-colors hover:bg-black/10"
            >
              <X className="h-6 w-6 text-black" />
            </button>
          </div>
        )}

        {/* Movie preview */}
        <div
          className={`flex gap-4 p-4 ${isGlass ? "" : "border-b-4 border-brutal-border"}`}
          style={isGlass ? {
            background: "rgba(255,255,255,0.03)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          } : { background: "var(--color-surface)" }}
        >
          <div className={`relative h-24 w-16 flex-shrink-0 overflow-hidden ${isGlass ? "rounded-xl" : "border-2 border-brutal-border bg-brutal-border"}`}>
            {movie.posterPath ? (
              <Image src={posterUrl(movie.posterPath, "small")} alt={movie.title} fill className="object-cover" sizes="64px" />
            ) : null}
          </div>
          <div className="flex flex-col justify-center gap-1">
            <span className={`text-xs uppercase tracking-wider ${isGlass ? "text-slate-400" : "font-inter text-text-muted"}`}>
              {isDraft ? "Draft for" : "Write your stamp for"}
            </span>
            <span className={`line-clamp-2 text-lg font-bold leading-tight ${isGlass ? "text-white" : "font-outfit"}`}>{movie.title}</span>
            {isDraft && (
              <span className={`text-[10px] uppercase tracking-wider ${isGlass ? "text-amber-400" : "font-mono text-brutal-yellow"}`}>
                Draft — not yet published
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className={`w-7 h-7 border-4 border-t-transparent animate-spin ${isGlass ? "border-amber-400 rounded-full" : "border-brutal-yellow"}`} />
          </div>
        ) : isAlreadyPublished ? (
          <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
            <span className={`text-xs uppercase tracking-widest ${isGlass ? "text-slate-400" : "font-mono text-brutal-dim"}`}>
              Already stamped for this film.
            </span>
            <span className={`text-[10px] ${isGlass ? "text-slate-500" : "font-mono text-brutal-dim"}`}>
              Delete the stamp from your profile to re-stamp.
            </span>
          </div>
        ) : (
          <form onSubmit={(e) => void handlePublish(e)} className="flex flex-col gap-4 p-5">
            <div className="relative">
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                maxLength={280}
                placeholder="Write your stamp review..."
                rows={4}
                className={`w-full resize-none p-3 text-sm placeholder-slate-500 ${
                  isGlass
                    ? "rounded-xl text-white bg-transparent focus:outline-none"
                    : "border-4 border-brutal-border bg-surface font-mono text-text placeholder-text-muted focus:border-brutal-yellow focus:outline-none"
                }`}
                style={isGlass ? {
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "12px",
                  color: "#fff",
                  outline: "none",
                } : undefined}
                disabled={isSubmitting}
                autoFocus={!isDraft}
              />
              <span className={`absolute bottom-2 right-2 text-[10px] ${charCount > 250 ? (isGlass ? "text-amber-400" : "text-brutal-yellow") : (isGlass ? "text-slate-500" : "text-text-muted")} ${isGlass ? "" : "font-mono"}`}>
                {charCount}/280
              </span>
            </div>

            {/* Visibility toggle */}
            <button
              type="button"
              onClick={() => setIsPublic((p) => !p)}
              className={`flex items-center gap-2 self-start px-3 py-1.5 text-xs uppercase font-bold transition-colors ${
                isGlass
                  ? "rounded-lg"
                  : `border-2 border-brutal-border font-mono ${isPublic ? "bg-brutal-lime text-black hover:bg-brutal-lime/80" : "bg-surface text-text-muted hover:bg-brutal-border/20"}`
              }`}
              style={isGlass ? (isPublic
                ? { background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.40)", color: "#6EE7B7" }
                : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(148,163,184,0.7)" }
              ) : undefined}
              disabled={isSubmitting}
            >
              {isPublic ? <Globe className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
              {isPublic ? "PUBLIC" : "PRIVATE"}
            </button>

            {/* Actions */}
            <div
              className={`flex gap-3 pt-4 ${isGlass ? "" : "border-t-2 border-brutal-border"}`}
              style={isGlass ? { borderTop: "1px solid rgba(255,255,255,0.08)" } : undefined}
            >
              <button
                type="submit"
                disabled={!reviewText.trim() || isSubmitting}
                className={`flex-1 px-4 py-2.5 text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed ${
                  isGlass
                    ? "rounded-xl"
                    : "border-4 border-brutal-border bg-brutal-yellow font-outfit font-black uppercase text-black hover:bg-brutal-yellow/80"
                }`}
                style={isGlass ? {
                  background: "rgba(249,115,22,0.18)",
                  border: "1px solid rgba(249,115,22,0.45)",
                  color: "#FB923C",
                  boxShadow: "0 4px 16px rgba(249,115,22,0.20), inset 0 1px 0 rgba(255,255,255,0.10)",
                } : undefined}
              >
                {isSubmitting ? (isGlass ? "Stamping..." : "STAMPING...") : (isGlass ? "Stamp It" : "STAMP IT")}
              </button>
              <button
                type="button"
                onClick={() => void handleDraft()}
                disabled={!reviewText.trim() || isSubmitting}
                className={`flex-1 px-4 py-2.5 text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed ${
                  isGlass
                    ? "rounded-xl"
                    : "border-4 border-brutal-border bg-surface font-outfit font-black uppercase text-text-muted hover:bg-surface/80"
                }`}
                style={isGlass ? {
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "rgba(148,163,184,0.8)",
                } : undefined}
              >
                {isSubmitting ? (isGlass ? "Saving..." : "SAVING...") : (isGlass ? "Draft It" : "DRAFT IT")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
