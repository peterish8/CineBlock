"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Trash2, Globe, Lock, Pencil, X } from "lucide-react";
import { Id } from "../../convex/_generated/dataModel";
import { posterUrl } from "@/lib/constants";

type Stamp = {
  _id: Id<"stamps">;
  movieId: number;
  movieTitle: string;
  posterPath: string;
  reviewText: string;
  isPublic: boolean;
  isDraft?: boolean;
  createdAt: number;
};

type StampCardProps = {
  stamp: Stamp;
  isOwner: boolean;
  onDelete?: (stampId: Id<"stamps">) => void;
  onToggleVisibility?: (stampId: Id<"stamps">, isPublic: boolean) => void;
  onContinue?: (stamp: Stamp) => void;
};

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

/*
  Animation Phases:
  0 → envelope appears at center (layoutId hero from grid)
  1 → flap opens (rotateX upward, perspective)
  2 → letter peeks up from inside envelope
  3 → envelope body drops + fades, letter zooms large to center
*/
function EnvelopeModal({
  stamp, isOwner, onClose, onToggleVisibility, onContinue, confirmDelete, onDeleteClick,
}: {
  stamp: Stamp; isOwner: boolean; onClose: () => void;
  onDelete?: (id: Id<"stamps">) => void;
  onToggleVisibility?: (id: Id<"stamps">, val: boolean) => void;
  onContinue?: (s: Stamp) => void;
  confirmDelete: boolean; onDeleteClick: (e: React.MouseEvent) => void;
}) {
  const isDraft = stamp.isDraft === true;
  const accent = isDraft ? "#3A3A3A" : "#FFE156";
  const accentDim = isDraft ? "#2a2a2a" : "#7a6800";

  // 0=sealed, 1=flap opening, 2=letter peeking, 3=zoomed in
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 600);   // Flap opens
    const t2 = setTimeout(() => setPhase(2), 1500);  // Cover slides perfectly down completely, message zooms into place
    const t3 = setTimeout(() => setPhase(3), 2000);  // Close button & controls pop in gracefully afterwards
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const skip = () => setPhase(3);

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.95)" }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClose}
    >
      <div
        style={{ width: "min(440px, 86vw)", position: "relative" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Close button ── */}
        <motion.button
          onClick={onClose}
          initial={{ opacity: 0 }} animate={{ opacity: phase >= 3 ? 1 : 0 }} transition={{ duration: 0.4 }}
          style={{
            position: "absolute", top: -50, right: -12, zIndex: 200,
            width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
            border: `2px solid ${accent}`, background: "#111", color: "#666", cursor: "pointer",
            pointerEvents: phase >= 3 ? "auto" : "none",
          }}
        >
          <X style={{ width: 14, height: 14, strokeWidth: 2.5 }} />
        </motion.button>

        {/* ── Tap to skip ── */}
        <AnimatePresence>
          {phase < 3 && (
            <motion.p
              onClick={skip}
              initial={{ opacity: 0 }} animate={{ opacity: 0.25 }} exit={{ opacity: 0 }}
              transition={{ delay: 0.8 }}
              style={{
                textAlign: "center", fontFamily: "monospace", fontSize: 9,
                color: "#666", textTransform: "uppercase", letterSpacing: "0.2em",
                marginBottom: 12, cursor: "pointer",
              }}
            >
              tap to skip
            </motion.p>
          )}
        </AnimatePresence>

        {/* ══════════════════════════════════════════
            SCENE: envelope + letter stacked
        ══════════════════════════════════════════ */}
        <div style={{ position: "relative" }}>

          {/* ── LETTER (always behind, peeks then zooms) ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 0 }}
            style={{
              position: "absolute",
              top: 0, left: 8, right: 8,
              zIndex: phase >= 2 ? 10 : 1,
              background: "#E8DFC4",
              backgroundImage: `
                radial-gradient(ellipse at 20% 80%, rgba(180,160,110,0.25) 0%, transparent 50%),
                radial-gradient(ellipse at 75% 20%, rgba(160,140,90,0.15) 0%, transparent 40%),
                radial-gradient(ellipse at 50% 50%, transparent 60%, rgba(120,100,60,0.12) 100%)
              `,
              border: `2px solid ${isDraft ? "#3A3A3A" : "#C4B078"}`,
              boxShadow: `0 8px 40px rgba(0,0,0,0.5), 3px 3px 0 ${accentDim}`,
              willChange: "transform",
            }}
            animate={
              phase < 2
                ? { y: 0, scale: 0.94, opacity: 0 }
                : { y: 0, scale: 1.05, opacity: 1 }   // Fully resolves symmetrically in center!
            }
            transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* fold crease */}
            <div style={{
              position: "absolute", left: 0, right: 0, top: "50%", height: 1,
              background: "linear-gradient(90deg, transparent, rgba(160,140,90,0.25) 20%, rgba(160,140,90,0.35) 50%, rgba(160,140,90,0.25) 80%, transparent)",
              pointerEvents: "none",
            }} />
            {/* corner aging */}
            <div style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              background: `
                radial-gradient(circle at 0% 0%, rgba(100,80,40,0.1) 0%, transparent 14%),
                radial-gradient(circle at 100% 0%, rgba(100,80,40,0.08) 0%, transparent 10%),
                radial-gradient(circle at 0% 100%, rgba(100,80,40,0.08) 0%, transparent 10%),
                radial-gradient(circle at 100% 100%, rgba(100,80,40,0.1) 0%, transparent 14%)
              `,
            }} />

            <div style={{ padding: "28px 28px 14px", position: "relative" }}>
              {/* header */}
              <div style={{ marginBottom: 18, paddingBottom: 14, borderBottom: `1px solid ${isDraft ? "#444" : "rgba(160,140,90,0.4)"}` }}>
                <p style={{ fontFamily: "'Georgia', serif", fontSize: 10, color: isDraft ? "#666" : "#9a8a50", textTransform: "uppercase", letterSpacing: "0.15em" }}>
                  {formatDate(stamp.createdAt)} {isDraft ? "· DRAFT" : ""}
                </p>
                <p style={{ fontFamily: "'Georgia', serif", fontWeight: 700, fontSize: 18, color: isDraft ? "#555" : "#3a3010", marginTop: 4, lineHeight: 1.25, fontStyle: "italic" }}>
                  {stamp.movieTitle}
                </p>
              </div>

              {/* review body */}
              <p style={{ fontFamily: "'Georgia', serif", fontSize: 14, lineHeight: 1.9, color: isDraft ? "#555" : "#4a4020", whiteSpace: "pre-wrap", wordBreak: "break-word", fontStyle: "italic" }}>
                {stamp.reviewText || <span style={{ color: "#aaa" }}>No review written yet.</span>}
              </p>

              {/* signature */}
              <div style={{ marginTop: 24, paddingTop: 14, borderTop: `1px solid ${isDraft ? "#444" : "rgba(160,140,90,0.3)"}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontFamily: "'Georgia', serif", fontSize: 10, color: isDraft ? "#555" : "#9a8a50", fontStyle: "italic", letterSpacing: "0.1em" }}>
                  — {stamp.movieTitle}
                </span>
                <Image src={isDraft ? "/draft_cineblock.png" : "/stamped_cineblock.png"} alt="" width={38} height={38} unoptimized style={{ opacity: 0.55, filter: "sepia(0.3)" }} />
              </div>
            </div>

            {/* owner controls */}
            {isOwner && phase >= 3 && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                style={{ display: "flex", alignItems: "center", gap: 8, borderTop: `1px solid ${isDraft ? "#444" : "rgba(160,140,90,0.3)"}`, padding: "10px 16px", background: isDraft ? "rgba(30,30,30,0.5)" : "rgba(200,185,140,0.28)" }}
                onClick={(e) => e.stopPropagation()}
              >
                {isDraft ? (
                  <button onClick={(e) => { e.stopPropagation(); onContinue?.(stamp); }}
                    style={{ display: "flex", alignItems: "center", gap: 6, border: "1px solid #8a6f00", background: "rgba(138,111,0,0.08)", padding: "5px 12px", fontFamily: "'Georgia', serif", fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#6a5500", cursor: "pointer", letterSpacing: "0.05em" }}>
                    <Pencil style={{ width: 12, height: 12 }} /> Continue
                  </button>
                ) : (
                  <button onClick={(e) => { e.stopPropagation(); onToggleVisibility?.(stamp._id, !stamp.isPublic); }}
                    style={{ display: "flex", alignItems: "center", gap: 6, border: stamp.isPublic ? "1px solid #4a7a4a" : "1px solid #999", background: "transparent", padding: "5px 12px", fontFamily: "'Georgia', serif", fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: stamp.isPublic ? "#4a7a4a" : "#777", cursor: "pointer", letterSpacing: "0.05em" }}>
                    {stamp.isPublic ? <Globe style={{ width: 12, height: 12 }} /> : <Lock style={{ width: 12, height: 12 }} />}
                    {stamp.isPublic ? "Public" : "Private"}
                  </button>
                )}
                <button onClick={onDeleteClick}
                  style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, border: confirmDelete ? "1px solid #cc3333" : "1px solid #aaa", background: "transparent", padding: "5px 12px", fontFamily: "'Georgia', serif", fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: confirmDelete ? "#cc3333" : "#777", cursor: "pointer", letterSpacing: "0.05em" }}>
                  <Trash2 style={{ width: 12, height: 12 }} />
                  {confirmDelete ? "Confirm?" : "Delete"}
                </button>
              </motion.div>
            )}
          </motion.div>

          {/* ══ ENVELOPE BODY + FLAP (front, drops away in phase 3) ══ */}
          <motion.div
            layoutId={`envelope-${stamp._id}`}
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "3/2",
              background: isDraft ? "#1e1e1e" : "#1a1700",
              border: `3px solid ${accent}`,
              overflow: "hidden",
              zIndex: 2,
              willChange: "transform, opacity",
              boxShadow: `0 8px 40px rgba(0,0,0,0.5), 4px 4px 0 ${accentDim}`,
            }}
            initial={{ y: 0, opacity: 1, scale: 1 }}
            animate={
              phase >= 2
                ? { y: 550, opacity: 0, scale: 0.9 }  // completely sliding down and away!
                : { y: 0, opacity: 1, scale: 1 }
            }
            transition={{ duration: 1.1, ease: [0.4, 0, 1, 1] }}
          >
            {/* ── FLAP (separate animated element, rotates open) ── */}
            <div style={{ position: "absolute", inset: 0, perspective: "800px", perspectiveOrigin: "50% 0%", zIndex: 10 }}>
              <motion.div
                initial={{ rotateX: 0, opacity: 1 }}
                style={{
                  position: "absolute",
                  top: 0, left: 0, right: 0,
                  height: "52%",
                  transformOrigin: "top center",
                  willChange: "transform",
                  transformStyle: "preserve-3d",
                }}
                animate={
                  phase >= 1
                    ? { rotateX: -175, opacity: [1, 1, 0] }
                    : { rotateX: 0, opacity: 1 }
                }
                transition={
                  phase >= 1
                    ? { duration: 0.9, ease: [0.4, 0, 0.2, 1], opacity: { times: [0, 0.8, 1], duration: 0.9 } }
                    : { duration: 0.3 }
                }
              >
                {/* flap triangle background */}
                <div style={{
                  position: "absolute", inset: 0,
                  clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                  background: isDraft ? "#2c2c2c" : "#2a2500",
                  backfaceVisibility: "hidden",
                }} />
                
                {/* wax seal — affixed exactly to the tip of the flap so it goes up with it */}
                <div style={{
                  position: "absolute",
                  bottom: 0,          /* sits right at the tip (bottom of the 52% height div) */
                  left: "50%",
                  transform: "translateX(-50%) translateY(50%)", /* centers it exactly on the tip */
                  zIndex: 11,
                  backfaceVisibility: "hidden", /* hides it when flap flips past 90 degrees */
                }}>
                  <Image
                    src={isDraft ? "/draft_cineblock.png" : "/stamped_cineblock.png"}
                    alt="seal" width={84} height={84} unoptimized
                    style={{ opacity: isDraft ? 0.5 : 0.95, filter: isDraft ? "grayscale(1)" : "drop-shadow(0 4px 8px rgba(0,0,0,0.4))" }}
                  />
                </div>
              </motion.div>
            </div>

            {/* stamp lines removed to keep typography clean */}


            {/* postage stamp (matching grid card exactly) */}
            <div style={{ position: "absolute", bottom: 12, right: 12, zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{
                position: "relative", width: 50, height: 62,
                background: isDraft ? "#2a2a2a" : "#FFE156",
                boxShadow: isDraft ? "0 3px 10px rgba(0,0,0,0.8)" : "0 3px 14px rgba(255,225,86,0.5)",
                WebkitMaskImage: `radial-gradient(circle at 50% 0,transparent 5px,black 5px) top/12px 6px repeat-x,radial-gradient(circle at 50% 100%,transparent 5px,black 5px) bottom/12px 6px repeat-x,radial-gradient(circle at 0 50%,transparent 5px,black 5px) left/6px 12px repeat-y,radial-gradient(circle at 100% 50%,transparent 5px,black 5px) right/6px 12px repeat-y,linear-gradient(black,black) center/calc(100% - 12px) calc(100% - 12px) no-repeat`,
                maskImage: `radial-gradient(circle at 50% 0,transparent 5px,black 5px) top/12px 6px repeat-x,radial-gradient(circle at 50% 100%,transparent 5px,black 5px) bottom/12px 6px repeat-x,radial-gradient(circle at 0 50%,transparent 5px,black 5px) left/6px 12px repeat-y,radial-gradient(circle at 100% 50%,transparent 5px,black 5px) right/6px 12px repeat-y,linear-gradient(black,black) center/calc(100% - 12px) calc(100% - 12px) no-repeat`,
              }}>
                <div style={{ position: "absolute", top: 5, left: 5, right: 5, bottom: 5, overflow: "hidden" }}>
                  {stamp.posterPath
                    ? <Image src={posterUrl(stamp.posterPath, "small")} alt={stamp.movieTitle} fill className="object-cover" sizes="40px" />
                    : <div style={{ width: "100%", height: "100%", background: isDraft ? "#222" : "#1f1c00" }} />}
                </div>
              </div>
              <span style={{ fontFamily: "monospace", fontSize: 8, textTransform: "uppercase", letterSpacing: "0.15em", color: isDraft ? "#333" : "#6a5800" }}>CINEBLOCK</span>
            </div>

            {/* title (matching grid card exactly) */}
            <div style={{ position: "absolute", bottom: 12, left: 12, zIndex: 10, paddingRight: 70 }}>
              <p style={{ fontFamily: "monospace", fontWeight: 900, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.1em", color: isDraft ? "#444" : "#6a5800", lineHeight: 1.2, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {stamp.movieTitle}
              </p>
              {isDraft && (
                <span style={{ marginTop: 4, display: "inline-block", border: "1px solid #3A3A3A", padding: "1px 6px", fontFamily: "monospace", fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "#444" }}>DRAFT</span>
              )}
            </div>
          </motion.div>

        </div>
      </div>
    </motion.div>,
    document.body
  );
}

/* ── Grid Card ─────────────────────────────────────────────────────────────── */
export default function StampCard({ stamp, isOwner, onDelete, onToggleVisibility, onContinue }: StampCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isDraft = stamp.isDraft === true;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setModalOpen(false);
  }, []);

  useEffect(() => {
    if (modalOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.removeEventListener("keydown", handleKeyDown); document.body.style.overflow = ""; };
  }, [modalOpen, handleKeyDown]);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDelete) { onDelete?.(stamp._id); setModalOpen(false); }
    else { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 2500); }
  };

  return (
    <>
      {/* ── Closed envelope in grid ── */}
      <motion.div
        layoutId={`envelope-${stamp._id}`}
        role="button" tabIndex={0}
        aria-label={`Open stamp for ${stamp.movieTitle}`}
        onClick={() => setModalOpen(true)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setModalOpen(true); }}
        className="relative cursor-pointer select-none overflow-hidden"
        style={{
          aspectRatio: "3/2",
          border: `4px solid ${isDraft ? "#3A3A3A" : "#FFE156"}`,
          boxShadow: isDraft ? "5px 5px 0 #2a2a2a" : "5px 5px 0 #7a6800",
          opacity: isDraft ? 0.8 : 1,
          background: isDraft ? "#181818" : "#1a1700",
        }}
        whileHover={{ x: -3, y: -3, boxShadow: isDraft ? "8px 8px 0 #2a2a2a" : "8px 8px 0 #FFE156" }}
        whileTap={{ scale: 0.97 }}
        transition={{ 
          layout: { type: "tween", duration: 0.35, ease: [0.25, 1, 0.5, 1] },
          default: { type: "spring", stiffness: 400, damping: 20 }
        }}
      >
        {/* top flap */}
        <div className="absolute inset-0 pointer-events-none" style={{ clipPath: "polygon(0 0,100% 0,50% 52%)", background: isDraft ? "#242424" : "#252008" }} />

        {/* seal */}
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <Image src={isDraft ? "/draft_cineblock.png" : "/stamped_cineblock.png"} alt="seal" width={88} height={88} unoptimized
            style={{ opacity: isDraft ? 0.4 : 0.95, filter: isDraft ? "grayscale(1)" : "drop-shadow(0 0 12px rgba(255,225,86,0.5))" }} />
        </div>

        {/* postage stamp */}
        <div className="absolute bottom-3 right-3 z-10 flex flex-col items-center gap-1">
          <div style={{
            position: "relative", width: 50, height: 62,
            background: isDraft ? "#2a2a2a" : "#FFE156",
            boxShadow: isDraft ? "0 3px 10px rgba(0,0,0,0.8)" : "0 3px 14px rgba(255,225,86,0.5)",
            WebkitMaskImage: `radial-gradient(circle at 50% 0,transparent 5px,black 5px) top/12px 6px repeat-x,radial-gradient(circle at 50% 100%,transparent 5px,black 5px) bottom/12px 6px repeat-x,radial-gradient(circle at 0 50%,transparent 5px,black 5px) left/6px 12px repeat-y,radial-gradient(circle at 100% 50%,transparent 5px,black 5px) right/6px 12px repeat-y,linear-gradient(black,black) center/calc(100% - 12px) calc(100% - 12px) no-repeat`,
            maskImage: `radial-gradient(circle at 50% 0,transparent 5px,black 5px) top/12px 6px repeat-x,radial-gradient(circle at 50% 100%,transparent 5px,black 5px) bottom/12px 6px repeat-x,radial-gradient(circle at 0 50%,transparent 5px,black 5px) left/6px 12px repeat-y,radial-gradient(circle at 100% 50%,transparent 5px,black 5px) right/6px 12px repeat-y,linear-gradient(black,black) center/calc(100% - 12px) calc(100% - 12px) no-repeat`,
          }}>
            <div style={{ position: "absolute", top: 5, left: 5, right: 5, bottom: 5, overflow: "hidden" }}>
              {stamp.posterPath
                ? <Image src={posterUrl(stamp.posterPath, "small")} alt={stamp.movieTitle} fill className="object-cover" sizes="40px" />
                : <div style={{ width: "100%", height: "100%", background: isDraft ? "#222" : "#1f1c00" }} />}
            </div>
          </div>
          <span className="font-mono text-[6px] uppercase tracking-wider" style={{ color: isDraft ? "#333" : "#6a5800" }}>CINEBLOCK</span>
        </div>

        {/* title */}
        <div className="absolute bottom-3 left-3 z-10 pr-14">
          <p className="font-mono font-black text-[9px] uppercase tracking-wider line-clamp-2 leading-tight" style={{ color: isDraft ? "#444" : "#6a5800" }}>
            {stamp.movieTitle}
          </p>
          {isDraft && (
            <span className="mt-1 inline-block border border-[#3A3A3A] px-1.5 py-px font-mono text-[7px] font-black uppercase tracking-widest text-[#444]">DRAFT</span>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {modalOpen && (
          <EnvelopeModal
            stamp={stamp} isOwner={isOwner}
            onClose={() => { setModalOpen(false); setConfirmDelete(false); }}
            onDelete={onDelete} onToggleVisibility={onToggleVisibility} onContinue={onContinue}
            confirmDelete={confirmDelete} onDeleteClick={handleDeleteClick}
          />
        )}
      </AnimatePresence>
    </>
  );
}
