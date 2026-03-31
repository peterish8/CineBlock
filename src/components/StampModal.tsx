"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { X, Globe, Lock } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import { posterUrl } from "@/lib/constants";
import { useToast } from "@/components/ToastProvider";

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
      restoreFocusRef.current?.focus();
    };
  }, [isOpen, onClose]);

  // Pre-fill from draft once it loads
  useEffect(() => {
    if (!isOpen || initialized || existingStamp === undefined) return;
    setInitialized(true);
    if (existingStamp?.isDraft) {
      setReviewText(existingStamp.reviewText);
      // drafts are always private, default public toggle stays true for when they publish
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
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in motion-reduce:animate-none"
        onClick={!isSubmitting ? onClose : undefined}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-stamp-modal="true"
        className="relative flex max-h-[90vh] w-full max-w-md flex-col border-4 border-brutal-border bg-bg brutal-shadow animate-slide-up motion-reduce:animate-none"
      >
        {/* Header */}
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

        {/* Movie preview */}
        <div className="flex gap-4 border-b-4 border-brutal-border bg-surface p-4">
          <div className="relative h-24 w-16 flex-shrink-0 border-2 border-brutal-border bg-brutal-border overflow-hidden">
            {movie.posterPath ? (
              <Image src={posterUrl(movie.posterPath, "small")} alt={movie.title} fill className="object-cover" sizes="64px" />
            ) : null}
          </div>
          <div className="flex flex-col justify-center gap-1">
            <span className="font-inter text-xs uppercase tracking-wider text-text-muted">
              {isDraft ? "Draft for" : "Write your stamp for"}
            </span>
            <span className="line-clamp-2 font-outfit text-lg font-bold leading-tight">{movie.title}</span>
            {isDraft && (
              <span className="font-mono text-[10px] uppercase tracking-wider text-brutal-yellow">
                DRAFT — not yet published
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-7 h-7 border-4 border-brutal-yellow border-t-transparent animate-spin" />
          </div>
        ) : isAlreadyPublished ? (
          <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
            <span className="font-mono text-xs uppercase text-brutal-dim tracking-widest">
              Already stamped for this film.
            </span>
            <span className="font-mono text-[10px] text-brutal-dim">
              Delete the stamp from your profile to re-stamp.
            </span>
          </div>
        ) : (
          <form onSubmit={(e) => void handlePublish(e)} className="flex flex-col gap-4 p-4">
            <div className="relative">
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                maxLength={280}
                placeholder="Write your stamp review..."
                rows={4}
                className="w-full resize-none border-4 border-brutal-border bg-surface p-3 font-mono text-sm text-text placeholder-text-muted focus:border-brutal-yellow focus:outline-none"
                disabled={isSubmitting}
                autoFocus={!isDraft}
              />
              <span className={`absolute bottom-2 right-2 font-mono text-[10px] ${charCount > 250 ? "text-brutal-yellow" : "text-text-muted"}`}>
                {charCount}/280
              </span>
            </div>

            {/* Visibility toggle — only relevant for publish */}
            <button
              type="button"
              onClick={() => setIsPublic((p) => !p)}
              className={`flex items-center gap-2 self-start border-2 border-brutal-border px-3 py-1.5 font-mono text-xs uppercase font-bold transition-colors ${
                isPublic
                  ? "bg-brutal-lime text-black hover:bg-brutal-lime/80"
                  : "bg-surface text-text-muted hover:bg-brutal-border/20"
              }`}
              disabled={isSubmitting}
            >
              {isPublic ? <Globe className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
              {isPublic ? "PUBLIC" : "PRIVATE"}
            </button>

            {/* Actions */}
            <div className="flex gap-3 border-t-2 border-brutal-border pt-4">
              <button
                type="submit"
                disabled={!reviewText.trim() || isSubmitting}
                className="flex-1 border-4 border-brutal-border bg-brutal-yellow px-4 py-2 font-outfit text-sm font-black uppercase text-black transition-all hover:bg-brutal-yellow/80 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "STAMPING..." : "STAMP IT"}
              </button>
              <button
                type="button"
                onClick={() => void handleDraft()}
                disabled={!reviewText.trim() || isSubmitting}
                className="flex-1 border-4 border-brutal-border bg-surface px-4 py-2 font-outfit text-sm font-black uppercase text-text-muted transition-all hover:bg-surface/80 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSubmitting ? "SAVING..." : "DRAFT IT"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
