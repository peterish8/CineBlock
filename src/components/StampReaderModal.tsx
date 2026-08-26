"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft, Globe2, LockKeyhole, Trash2, X } from "lucide-react";
import { posterUrl } from "@/lib/constants";
import { TMDBMovie } from "@/lib/types";
import { StampRecord } from "@/components/GlassStampCard";
import StampMarkdown from "@/components/StampMarkdown";
import MovieModal from "@/components/MovieModal";

type StampReaderModalProps = {
  stamp: StampRecord;
  busy?: boolean;
  onClose: () => void;
  onContinue: (stamp: StampRecord) => void;
  onToggleVisibility: (stamp: StampRecord) => void;
  onDelete: (stamp: StampRecord) => void;
};

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function StampReaderModal({ stamp, busy = false, onClose, onContinue, onToggleVisibility, onDelete }: StampReaderModalProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [movieOpen, setMovieOpen] = useState(false);
  const isDraft = stamp.isDraft === true;
  const movieForModal = useMemo<TMDBMovie>(() => ({
    id: stamp.movieId,
    title: stamp.movieTitle,
    original_title: stamp.movieTitle,
    overview: "",
    poster_path: stamp.posterPath || null,
    backdrop_path: stamp.posterPath || null,
    release_date: "",
    vote_average: 0,
    vote_count: 0,
    genre_ids: [],
    original_language: "en",
    popularity: 0,
    adult: false,
    media_type: stamp.mediaType ?? "movie",
  }), [stamp.mediaType, stamp.movieId, stamp.movieTitle, stamp.posterPath]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[1200] flex items-center justify-center overflow-hidden px-3 py-3 sm:px-8 sm:py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ background: "rgba(1,5,18,0.82)", backdropFilter: "blur(14px)" }}
      onClick={onClose}
    >
      <div className="fixed inset-0 overflow-hidden" aria-hidden="true">
        {stamp.posterPath && <Image src={posterUrl(stamp.posterPath, "original")} alt="" fill className="scale-110 object-cover opacity-20 blur-3xl" sizes="100vw" />}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(59,130,246,0.24),transparent_42%),linear-gradient(180deg,rgba(2,8,23,0.55),#020817_84%)]" />
      </div>

      <motion.article
          layoutId={`stamp-card-${stamp._id}`}
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className="relative flex h-[calc(100dvh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] sm:h-[calc(100dvh-4rem)] sm:rounded-[32px]"
          style={{
            background: "linear-gradient(145deg, rgba(13,29,68,0.95), rgba(5,13,34,0.98))",
            border: isDraft ? "1px solid rgba(148,163,184,0.28)" : "1px solid rgba(125,211,252,0.30)",
            boxShadow: "0 32px 100px rgba(0,0,0,0.62), 0 0 70px rgba(37,99,235,0.15), inset 0 1px 0 rgba(255,255,255,0.13)",
            backdropFilter: "blur(34px) saturate(150%)",
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="absolute inset-x-0 top-0 h-1" style={{ background: isDraft ? "linear-gradient(90deg, #64748B, #CBD5E1)" : "linear-gradient(90deg, #60A5FA, #22D3EE, #FB923C)" }} />

          <div className="flex items-center justify-between gap-3 px-5 pb-2 pt-5 sm:px-8 sm:pt-7">
            <button type="button" onClick={onClose} disabled={busy} aria-label="Back to stamps" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-[10px] font-display font-semibold uppercase tracking-[0.14em] text-slate-300 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-wait disabled:opacity-50 sm:h-auto sm:w-auto sm:gap-2 sm:px-3.5 sm:py-2">
              <ArrowLeft className="h-4 w-4" /><span className="hidden sm:inline">Back to stamps</span>
            </button>
            <button type="button" onClick={onClose} disabled={busy} aria-label="Close stamp" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-slate-400 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-wait disabled:opacity-50">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-none px-5 pb-5 sm:px-8 sm:pb-7">
            <motion.div layoutId={`stamp-image-${stamp._id}`} className="relative mt-3 flex flex-col items-center text-center">
              <button type="button" onClick={() => setMovieOpen(true)} aria-label={`Open movie details for ${stamp.movieTitle}`} className="group relative block rounded-[22px] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 sm:rounded-[24px]">
                <div className="relative aspect-[2/3] w-[min(48vw,240px)] overflow-hidden rounded-[22px] border border-white/[0.12] bg-[#07132d] shadow-[0_24px_60px_rgba(0,0,0,0.42),0_0_36px_rgba(37,99,235,0.12)] sm:w-[min(58vw,270px)] sm:rounded-[24px]">
                  {stamp.posterPath ? <Image src={posterUrl(stamp.posterPath, "original")} alt={stamp.movieTitle} fill className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" sizes="270px" /> : <div className="absolute inset-0 bg-blue-950/50" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#020817]/70 via-transparent to-transparent" />
                  <span className="absolute inset-x-3 bottom-3 rounded-full border border-white/15 bg-[#020817]/70 px-3 py-2 text-center text-[9px] font-display font-semibold uppercase tracking-[0.14em] text-cyan-100 opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">Open film details</span>
                </div>
              </button>
              <div className="mt-6 flex flex-col items-center">
                <motion.h1 layoutId={`stamp-title-${stamp._id}`} className="max-w-2xl font-display text-[clamp(1.75rem,6vw,4.8rem)] font-semibold leading-[0.94] tracking-[-0.06em] text-white sm:text-[clamp(2rem,6vw,4.8rem)]">{stamp.movieTitle}</motion.h1>
                <p className="mt-3 text-[9px] font-display uppercase tracking-[0.16em] text-slate-400 sm:mt-4 sm:text-[10px] sm:tracking-[0.18em]">{formatDate(stamp.createdAt)}</p>
              </div>
            </motion.div>
          </div>

          <div className="glass-modal-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-5 pb-7 sm:px-8 sm:pb-9">
            <div className="mx-auto mt-1 max-w-2xl border-t border-white/[0.1] pt-6 sm:mt-0 sm:pt-7">
              <motion.div layoutId={`stamp-review-${stamp._id}`} className="text-[1.04rem] leading-[1.85] tracking-[-0.01em] text-slate-200 sm:text-[1.14rem]">
                <StampMarkdown value={stamp.reviewText || "No feeling written yet. Continue this draft when it is ready."} />
              </motion.div>
            </div>

            <div className="mx-auto mt-auto w-full max-w-2xl border-t border-white/[0.08] pt-5">
              <div className="flex items-center gap-2">
                {isDraft ? (
                  <button type="button" onClick={() => onContinue(stamp)} disabled={busy} className="rounded-full border border-orange-300/35 bg-orange-300/10 px-4 py-2.5 text-[11px] font-display font-semibold uppercase tracking-[0.14em] text-orange-200 transition-colors hover:bg-orange-300/20 disabled:cursor-wait disabled:opacity-50">Continue stamp</button>
                ) : (
                  <button type="button" onClick={() => onToggleVisibility(stamp)} disabled={busy} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2.5 text-[11px] font-display font-semibold uppercase tracking-[0.14em] text-slate-300 transition-colors hover:bg-white/10 disabled:cursor-wait disabled:opacity-50">
                    {stamp.isPublic ? <Globe2 className="h-3.5 w-3.5 text-emerald-300" /> : <LockKeyhole className="h-3.5 w-3.5 text-slate-400" />}
                    {stamp.isPublic ? "Public" : "Private"}
                  </button>
                )}
                <button type="button" onClick={() => setConfirmDelete(true)} disabled={busy || confirmDelete} aria-label="Delete stamp" title="Delete stamp" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-500 transition-colors hover:border-red-300/40 hover:bg-red-400/10 hover:text-red-200 disabled:cursor-wait disabled:opacity-50">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {confirmDelete && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-300/20 bg-red-400/[0.06] px-3.5 py-3">
                  <span className="text-xs font-medium text-red-100/85">Delete this stamp?</span>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setConfirmDelete(false)} disabled={busy} className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-display font-semibold uppercase tracking-[0.12em] text-slate-300 hover:bg-white/10 disabled:opacity-50">Keep</button>
                    <button type="button" onClick={() => onDelete(stamp)} disabled={busy} className="rounded-full border border-red-300/35 bg-red-400/15 px-3 py-1.5 text-[10px] font-display font-semibold uppercase tracking-[0.12em] text-red-100 hover:bg-red-400/25 disabled:cursor-wait disabled:opacity-50">Delete</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.article>
        {movieOpen && <MovieModal movie={movieForModal} onClose={() => setMovieOpen(false)} onBack={() => setMovieOpen(false)} />}
    </motion.div>,
    document.body
  );
}
