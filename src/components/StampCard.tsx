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

// ── Envelope Modal ────────────────────────────────────────────────────────────
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
  // Animation sequence: 0=start, 1=flap open, 2=letter visible
  const [step, setStep] = useState(0);
  const accent = isDraft ? "#3A3A3A" : "#FFE156";
  const accentDim = isDraft ? "#2a2a2a" : "#7a6800";

  return createPortal(
    // Backdrop
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(6px)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      {/* ── LIGHT RAYS — fixed to viewport center, never clipped ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        {Array.from({ length: 14 }).map((_, i) => (
          <motion.div
            key={i}
            style={{
              position: "absolute",
              width: 3,
              height: "50vh",
              bottom: "50%",
              left: "calc(50% - 1.5px)",
              transformOrigin: "bottom center",
              rotate: `${i * (360 / 14)}deg`,
              background: isDraft
                ? "linear-gradient(to top, rgba(160,160,160,0.18), transparent)"
                : "linear-gradient(to top, rgba(255,225,86,0.28), transparent)",
            }}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: [0, 1.1, 0.9], opacity: [0, 0.9, 0] }}
            transition={{ duration: 4, delay: 0.2 + i * 0.035, ease: "easeOut" }}
          />
        ))}
      </div>

      {/* ── SCENE (stops backdrop click) ── */}
      <motion.div
        style={{ width: "min(400px, 92vw)", position: "relative" }}
        initial={{ scale: 0.75, y: 50, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.75, y: 50, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close btn */}
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 z-50 w-9 h-9 flex items-center justify-center"
          style={{ border: `3px solid ${accent}`, background: "#111", color: "#aaa" }}
        >
          <X className="w-4 h-4" strokeWidth={3} />
        </button>

        {/* ── ENVELOPE BOX ── */}
        <div
          style={{
            position: "relative",
            border: `4px solid ${accent}`,
            background: isDraft ? "#181818" : "#1a1700",
            boxShadow: `6px 6px 0 ${accentDim}`,
            // perspective on the container so child 3D works
            perspective: "1000px",
            overflow: "visible",
          }}
        >
          {/* ── TOP FLAP — 3D rotates open ── */}
          <motion.div
            style={{
              position: "absolute",
              top: -4,           // cover the top border
              left: -4,
              right: -4,
              height: 90,
              zIndex: 30,
              transformOrigin: "top center",
              border: `4px solid ${accent}`,
              borderBottom: "none",
              background: isDraft ? "#202020" : "#201d00",
              overflow: "visible",
            }}
            initial={{ rotateX: 0 }}
            animate={{ rotateX: -175 }}
            transition={{ duration: 0.6, delay: 0.4, ease: [0.4, 0, 0.2, 1] }}
            onAnimationComplete={() => setStep(1)}
          >
            {/* V fold inside flap */}
            <div style={{
              position: "absolute", inset: 0,
              clipPath: "polygon(0 0, 100% 0, 50% 100%)",
              background: isDraft ? "#2a2a2a" : "#2c2700",
            }} />
            <div style={{
              position: "absolute", inset: 0,
              clipPath: "polygon(0 0, 50% 100%, 0 100%)",
              background: isDraft ? "#1a1a1a" : "#1a1800",
            }} />
            <div style={{
              position: "absolute", inset: 0,
              clipPath: "polygon(100% 0, 50% 100%, 100% 100%)",
              background: isDraft ? "#1a1a1a" : "#1a1800",
            }} />
          </motion.div>

          {/* Flap space */}
          <div style={{ height: 86 }} />

          {/* ── ENVELOPE INTERIOR (address + postage stamp) ── */}
          <div style={{ padding: "12px 16px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
            {/* Left side decorative fold lines */}
            <div style={{
              position: "absolute", left: 0, top: 86, bottom: 0,
              clipPath: "polygon(0 0, 0 100%, 46% 50%)",
              background: isDraft ? "#141414" : "#141200",
              width: "48%",
            }} />
            <div style={{
              position: "absolute", right: 0, top: 86, bottom: 0,
              clipPath: "polygon(100% 0, 100% 100%, 54% 50%)",
              background: isDraft ? "#141414" : "#141200",
              width: "48%",
            }} />
            <div style={{
              position: "absolute", left: 0, bottom: 0, right: 0, height: 40,
              clipPath: "polygon(0 100%, 100% 100%, 50% 0)",
              background: isDraft ? "#1c1c1c" : "#1c1900",
            }} />

            {/* Address */}
            <div style={{ flex: 1, minWidth: 0, position: "relative", zIndex: 2 }}>
              <p style={{ fontFamily: "monospace", fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: "0.2em" }}>TO:</p>
              <p style={{ fontFamily: "monospace", fontWeight: 900, fontSize: 15, color: isDraft ? "#888" : "#E8D840", textTransform: "uppercase", marginTop: 4, lineHeight: 1.2 }}>
                {stamp.movieTitle}
              </p>
              <p style={{ fontFamily: "monospace", fontSize: 9, color: "#444", textTransform: "uppercase", marginTop: 8, letterSpacing: "0.15em" }}>
                {formatDate(stamp.createdAt)}
              </p>
              {isDraft && (
                <span style={{ display: "inline-block", marginTop: 8, border: "1px solid #3A3A3A", padding: "2px 6px", fontFamily: "monospace", fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: "0.2em" }}>DRAFT</span>
              )}
            </div>

            {/* Postage stamp */}
            <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, position: "relative", zIndex: 2 }}>
              <div style={{
                position: "relative", width: 58, height: 72, overflow: "hidden",
                border: `3px solid ${accent}`,
                boxShadow: `0 0 0 4px ${isDraft ? "#181818" : "#1a1700"}, 0 0 0 6px ${accent}`,
              }}>
                {stamp.posterPath ? (
                  <Image src={posterUrl(stamp.posterPath, "small")} alt={stamp.movieTitle} fill className="object-cover" sizes="58px" />
                ) : (
                  <div style={{ width: "100%", height: "100%", background: "#1a1a1a" }} />
                )}
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Image src={isDraft ? "/draft_cineblock.png" : "/stamped_cineblock.png"} alt="" width={50} height={50} unoptimized
                    style={{ transform: "rotate(-15deg)", opacity: isDraft ? 0.35 : 0.8 }} />
                </div>
              </div>
              <span style={{ fontFamily: "monospace", fontSize: 7, textTransform: "uppercase", letterSpacing: "0.2em", color: isDraft ? "#333" : "#6a5800" }}>CINEBLOCK</span>
            </div>
          </div>
        </div>

        {/* ── LETTER — slides up after flap opens ── */}
        <motion.div
          style={{
            border: `4px solid ${accent}`,
            borderTop: "none",
            background: "#0d0c09",
            backgroundImage: "repeating-linear-gradient(transparent, transparent 27px, #181600 27px, #181600 28px)",
            overflow: "hidden",
            originY: 1,
          }}
          initial={{ scaleY: 0, opacity: 0 }}
          animate={step >= 1 ? { scaleY: 1, opacity: 1 } : { scaleY: 0, opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div style={{ padding: "20px 20px 8px" }}>
            <motion.p
              style={{ fontFamily: "monospace", fontSize: 13, lineHeight: "28px", color: isDraft ? "#666" : "#D8D0A8", whiteSpace: "pre-wrap", wordBreak: "break-word" }}
              initial={{ opacity: 0, y: 10 }}
              animate={step >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              transition={{ delay: 0.35, duration: 0.5 }}
            >
              {stamp.reviewText || <span style={{ fontStyle: "italic", color: "#444" }}>No review written yet.</span>}
            </motion.p>

            {/* Signature + wax seal */}
            <motion.div
              style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid #1f1e14`, display: "flex", alignItems: "center", justifyContent: "space-between" }}
              initial={{ opacity: 0 }}
              animate={step >= 1 ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
            >
              <span style={{ fontFamily: "monospace", fontSize: 9, color: "#444", textTransform: "uppercase", letterSpacing: "0.15em" }}>— {stamp.movieTitle}</span>
              <motion.div
                initial={{ scale: 0, rotate: -25, opacity: 0 }}
                animate={step >= 1 ? { scale: 1, rotate: 0, opacity: 1 } : { scale: 0 }}
                transition={{ delay: 0.8, type: "spring", stiffness: 450, damping: 13 }}
              >
                <Image src={isDraft ? "/draft_cineblock.png" : "/stamped_cineblock.png"} alt="" width={34} height={34} unoptimized style={{ opacity: 0.65 }} />
              </motion.div>
            </motion.div>
          </div>

          {/* Owner controls */}
          {isOwner && (
            <motion.div
              style={{ display: "flex", alignItems: "center", gap: 8, borderTop: `2px solid #1a1900`, padding: "10px 16px" }}
              initial={{ opacity: 0 }}
              animate={step >= 1 ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: 0.65 }}
              onClick={(e) => e.stopPropagation()}
            >
              {isDraft ? (
                <button onClick={(e) => { e.stopPropagation(); onContinue?.(stamp); }}
                  style={{ display: "flex", alignItems: "center", gap: 6, border: `2px solid #FFE156`, background: "rgba(255,225,86,0.1)", padding: "4px 10px", fontFamily: "monospace", fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#FFE156", cursor: "pointer" }}>
                  <Pencil style={{ width: 12, height: 12 }} /> CONTINUE
                </button>
              ) : (
                <button onClick={(e) => { e.stopPropagation(); onToggleVisibility?.(stamp._id, !stamp.isPublic); }}
                  style={{ display: "flex", alignItems: "center", gap: 6, border: stamp.isPublic ? "2px solid #a8ff78" : "2px solid #3A3A3A", background: stamp.isPublic ? "rgba(168,255,120,0.1)" : "transparent", padding: "4px 10px", fontFamily: "monospace", fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: stamp.isPublic ? "#a8ff78" : "#555", cursor: "pointer" }}>
                  {stamp.isPublic ? <Globe style={{ width: 12, height: 12 }} /> : <Lock style={{ width: 12, height: 12 }} />}
                  {stamp.isPublic ? "PUBLIC" : "PRIVATE"}
                </button>
              )}
              <button onClick={onDeleteClick}
                style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, border: confirmDelete ? "2px solid #ef4444" : "2px solid #3A3A3A", background: confirmDelete ? "rgba(239,68,68,0.1)" : "transparent", padding: "4px 10px", fontFamily: "monospace", fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: confirmDelete ? "#f87171" : "#555", cursor: "pointer" }}>
                <Trash2 style={{ width: 12, height: 12 }} />
                {confirmDelete ? "CONFIRM?" : "DELETE"}
              </button>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </motion.div>,
    document.body
  );
}

// ── Card (closed envelope shown in grid) ─────────────────────────────────────
export default function StampCard({ stamp, isOwner, onDelete, onToggleVisibility, onContinue }: StampCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isDraft = stamp.isDraft === true;

  // Close on Escape
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
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [modalOpen, handleKeyDown]);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDelete) {
      onDelete?.(stamp._id);
      setModalOpen(false);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 2500);
    }
  };

  return (
    <>
      {/* ── CLOSED ENVELOPE CARD — real 4-fold envelope shape ── */}
      <motion.div
        role="button"
        tabIndex={0}
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
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
      >
        {/* ── 4 envelope fold triangles ── */}

        {/* Top flap — triangle pointing DOWN (the sealed flap) */}
        <div className="absolute inset-0 pointer-events-none" style={{
          clipPath: "polygon(0 0, 100% 0, 50% 52%)",
          background: isDraft ? "#222" : "#231f08",
        }} />

        {/* Left fold — triangle pointing RIGHT */}
        <div className="absolute inset-0 pointer-events-none" style={{
          clipPath: "polygon(0 0, 0 100%, 50% 50%)",
          background: isDraft ? "#161616" : "#181500",
        }} />

        {/* Right fold — triangle pointing LEFT */}
        <div className="absolute inset-0 pointer-events-none" style={{
          clipPath: "polygon(100% 0, 100% 100%, 50% 50%)",
          background: isDraft ? "#161616" : "#181500",
        }} />

        {/* Bottom fold — triangle pointing UP */}
        <div className="absolute inset-0 pointer-events-none" style={{
          clipPath: "polygon(0 100%, 100% 100%, 50% 50%)",
          background: isDraft ? "#1c1c1c" : "#1c1900",
        }} />

        {/* ── Fold crease lines ── */}
        {/* top-left corner → center */}
        <div className="absolute pointer-events-none" style={{
          top: 0, left: 0, width: "100%", height: "100%",
          background: `linear-gradient(to bottom right, transparent calc(50% - 0.5px), ${isDraft ? "#2a2a2a" : "#2e2800"} calc(50% - 0.5px), ${isDraft ? "#2a2a2a" : "#2e2800"} calc(50% + 0.5px), transparent calc(50% + 0.5px))`,
          opacity: 0.7,
        }} />
        {/* top-right corner → center */}
        <div className="absolute pointer-events-none" style={{
          top: 0, left: 0, width: "100%", height: "100%",
          background: `linear-gradient(to bottom left, transparent calc(50% - 0.5px), ${isDraft ? "#2a2a2a" : "#2e2800"} calc(50% - 0.5px), ${isDraft ? "#2a2a2a" : "#2e2800"} calc(50% + 0.5px), transparent calc(50% + 0.5px))`,
          opacity: 0.7,
        }} />

        {/* ── Postage stamp — top right ── */}
        <div className="absolute top-3 right-3 flex flex-col items-center gap-1 z-10">
          <div className="relative overflow-hidden" style={{
            width: 40, height: 50,
            border: `2px solid ${isDraft ? "#3A3A3A" : "#FFE156"}`,
            boxShadow: isDraft
              ? "0 0 0 3px #181818, 0 0 0 5px #2a2a2a"
              : "0 0 0 3px #1a1700, 0 0 0 5px #FFE156",
          }}>
            {stamp.posterPath ? (
              <Image
                src={posterUrl(stamp.posterPath, "small")}
                alt={stamp.movieTitle}
                fill className="object-cover" sizes="40px"
              />
            ) : (
              <div className="w-full h-full" style={{ background: isDraft ? "#222" : "#1f1c00" }} />
            )}
            {/* Stamp ink */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Image
                src={isDraft ? "/draft_cineblock.png" : "/stamped_cineblock.png"}
                alt="" width={34} height={34} unoptimized
                className={`rotate-[-15deg] ${isDraft ? "opacity-35" : "opacity-80"}`}
              />
            </div>
          </div>
          <span className="font-mono text-[6px] uppercase tracking-widest"
            style={{ color: isDraft ? "#333" : "#6a5800" }}>
            CINEBLOCK
          </span>
        </div>

        {/* ── Address block — center-left ── */}
        <div className="absolute inset-0 flex flex-col justify-center pl-4 pr-16 z-10"
          style={{ paddingTop: "20%" }}>
          <p className="font-mono text-[8px] uppercase tracking-[0.25em]"
            style={{ color: isDraft ? "#444" : "#4a4200" }}>
            TO:
          </p>
          <p className="font-mono font-black text-sm uppercase tracking-tight leading-tight mt-0.5 line-clamp-2"
            style={{ color: isDraft ? "#888" : "#D8C840" }}>
            {stamp.movieTitle}
          </p>
          <p className="font-mono text-[8px] uppercase tracking-widest mt-1.5"
            style={{ color: isDraft ? "#333" : "#3a3400" }}>
            {formatDate(stamp.createdAt)}
          </p>
        </div>

        {/* Draft badge */}
        {isDraft && (
          <div className="absolute bottom-3 left-3 z-10">
            <span className="border border-[#3A3A3A] px-1.5 py-0.5 font-mono text-[8px] font-black uppercase tracking-widest text-[#555]">
              DRAFT
            </span>
          </div>
        )}

        {/* Click hint */}
        <div className="absolute bottom-3 right-3 z-10">
          <span className="font-mono text-[8px] uppercase tracking-widest"
            style={{ color: isDraft ? "#2a2a2a" : "#3a3200" }}>
            open ↑
          </span>
        </div>
      </motion.div>

      {/* ── MODAL ── */}
      {modalOpen && (
        <EnvelopeModal
          stamp={stamp}
          isOwner={isOwner}
          onClose={() => { setModalOpen(false); setConfirmDelete(false); }}
          onDelete={onDelete}
          onToggleVisibility={onToggleVisibility}
          onContinue={onContinue}
          confirmDelete={confirmDelete}
          onDeleteClick={handleDeleteClick}
        />
      )}
    </>
  );
}
