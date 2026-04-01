"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Trash2, Globe, Lock, Pencil } from "lucide-react";
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

export default function StampCard({ stamp, isOwner, onDelete, onToggleVisibility, onContinue }: StampCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isDraft = stamp.isDraft === true;

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDelete) {
      onDelete?.(stamp._id);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 2500);
    }
  };

  return (
    <div className={`flex flex-col select-none ${isDraft ? "opacity-80" : ""}`}>

      {/* ── ENVELOPE ── */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((o) => !o)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setIsOpen((o) => !o); }}
        className={`relative cursor-pointer border-4 bg-[#161616] transition-all duration-150 overflow-hidden
          ${isDraft ? "border-[#3A3A3A]/60" : "border-[#3A3A3A]"}
          ${isOpen ? "border-b-0" : "hover:-translate-x-0.5 hover:-translate-y-0.5"}
        `}
        style={{ boxShadow: isOpen ? "none" : "4px 4px 0 #3A3A3A" }}
      >

        {/* ── Envelope flap (V fold at top) ── */}
        <div className="relative h-14 border-b-4 border-[#3A3A3A] overflow-hidden bg-[#111]">
          {/* Left diagonal */}
          <div
            className="absolute inset-0 bg-[#1a1a1a]"
            style={{ clipPath: "polygon(0 0, 50% 100%, 0 100%)" }}
          />
          {/* Right diagonal */}
          <div
            className="absolute inset-0 bg-[#1a1a1a]"
            style={{ clipPath: "polygon(100% 0, 50% 100%, 100% 100%)" }}
          />
          {/* Center V point highlight */}
          <div
            className="absolute inset-0"
            style={{
              clipPath: "polygon(0 0, 100% 0, 50% 100%)",
              background: isDraft ? "#1c1c1c" : "#1f1c0f",
            }}
          />
          {/* Fold crease line */}
          <div className="absolute inset-0 flex items-end justify-center pb-0.5">
            <div className="w-3 h-3 border-b-2 border-r-2 rotate-45 mb-0.5"
              style={{ borderColor: isDraft ? "#3A3A3A" : "#5a4a00" }}
            />
          </div>
          {/* Draft badge */}
          {isDraft && (
            <div className="absolute top-1.5 left-2">
              <span className="font-mono text-[9px] font-black uppercase tracking-widest text-[#3A3A3A] border border-[#3A3A3A] px-1 py-0.5">
                DRAFT
              </span>
            </div>
          )}
          {/* Date top-right */}
          <div className="absolute top-1.5 right-2 font-mono text-[9px] text-[#555] uppercase tracking-widest">
            {formatDate(stamp.createdAt)}
          </div>
        </div>

        {/* ── Envelope body ── */}
        <div className="p-4 flex items-start gap-4">

          {/* Postage stamp (movie poster) — top right */}
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            {/* "TO:" address block */}
            <div>
              <p className="font-mono text-[9px] text-[#555] uppercase tracking-[0.2em]">TO:</p>
              <p className="font-mono font-bold text-sm text-[#F0F0F0] uppercase tracking-tight leading-tight mt-0.5 line-clamp-2">
                {stamp.movieTitle}
              </p>
            </div>

            {/* Open/close hint */}
            <p className="font-mono text-[9px] text-[#444] uppercase tracking-widest mt-1">
              {isOpen ? "▲ close letter" : "▼ open letter"}
            </p>
          </div>

          {/* Postage stamp block */}
          <div className="flex-shrink-0 flex flex-col items-center gap-1">
            <div
              className="relative border-2 overflow-hidden"
              style={{
                width: 52,
                height: 64,
                borderColor: isDraft ? "#3A3A3A" : "#FFE156",
                /* Perforated stamp edge via box-shadow */
                boxShadow: isDraft
                  ? "0 0 0 3px #161616, 0 0 0 5px #3A3A3A"
                  : "0 0 0 3px #161616, 0 0 0 5px #FFE156",
              }}
            >
              {stamp.posterPath ? (
                <Image
                  src={posterUrl(stamp.posterPath, "small")}
                  alt={stamp.movieTitle}
                  fill
                  className="object-cover"
                  sizes="52px"
                />
              ) : (
                <div className="w-full h-full bg-[#222] flex items-center justify-center">
                  <span className="font-mono text-[8px] text-[#555]">NO IMG</span>
                </div>
              )}
              {/* Stamp ink overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Image
                  src={isDraft ? "/draft_cineblock.png" : "/stamped_cineblock.png"}
                  alt=""
                  width={44}
                  height={44}
                  unoptimized
                  className={`rotate-[-15deg] ${isDraft ? "opacity-25" : "opacity-70"}`}
                />
              </div>
            </div>
            {/* Stamp label */}
            <span className="font-mono text-[7px] uppercase tracking-widest" style={{ color: isDraft ? "#444" : "#7a6a00" }}>
              CINEBLOCK
            </span>
          </div>
        </div>

        {/* Bottom envelope flaps (left + right triangles meeting at center) */}
        <div className="relative h-5 overflow-hidden border-t-4 border-[#3A3A3A]">
          <div className="absolute inset-0 bg-[#1a1a1a]" style={{ clipPath: "polygon(0 100%, 50% 0, 100% 100%)" }} />
        </div>
      </div>

      {/* ── LETTER (open state) ── */}
      {isOpen && (
        <div
          className="border-4 border-t-0 bg-[#111] animate-fade-in"
          style={{ borderColor: isDraft ? "#3A3A3A" : "#FFE156", boxShadow: "4px 4px 0 #3A3A3A" }}
        >
          {/* Lined paper effect */}
          <div
            className="px-5 py-5"
            style={{
              backgroundImage: "repeating-linear-gradient(transparent, transparent 27px, #1f1f1f 27px, #1f1f1f 28px)",
            }}
          >
            {stamp.reviewText ? (
              <p className="font-mono text-sm text-[#D0D0D0] leading-7 whitespace-pre-wrap break-words">
                {stamp.reviewText}
              </p>
            ) : (
              <p className="font-mono text-sm text-[#555] italic leading-7">No review written yet.</p>
            )}
          </div>

          {/* Owner controls */}
          {isOwner && (
            <div className="flex items-center gap-2 border-t-2 border-[#2a2a2a] px-4 py-3">
              {isDraft ? (
                <button
                  onClick={(e) => { e.stopPropagation(); onContinue?.(stamp); }}
                  className="flex items-center gap-1 border-2 border-brutal-yellow bg-brutal-yellow/10 px-2 py-1 font-mono text-[10px] uppercase font-bold text-brutal-yellow hover:bg-brutal-yellow/20 transition-colors"
                >
                  <Pencil className="h-3 w-3" />
                  CONTINUE
                </button>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleVisibility?.(stamp._id, !stamp.isPublic); }}
                  className={`flex items-center gap-1 border-2 px-2 py-1 font-mono text-[10px] uppercase font-bold transition-colors ${
                    stamp.isPublic
                      ? "border-brutal-lime bg-brutal-lime/10 text-brutal-lime hover:bg-brutal-lime/20"
                      : "border-[#3A3A3A] text-[#555] hover:border-[#555]"
                  }`}
                >
                  {stamp.isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                  {stamp.isPublic ? "PUBLIC" : "PRIVATE"}
                </button>
              )}
              <button
                onClick={handleDeleteClick}
                className={`ml-auto flex items-center gap-1 border-2 px-2 py-1 font-mono text-[10px] uppercase font-bold transition-colors ${
                  confirmDelete
                    ? "border-red-500 bg-red-500/10 text-red-400"
                    : "border-[#3A3A3A] text-[#555] hover:border-red-500/50 hover:text-red-400"
                }`}
              >
                <Trash2 className="h-3 w-3" />
                {confirmDelete ? "CONFIRM?" : "DELETE"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
