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
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isDraft = stamp.isDraft === true;

  const handleDeleteClick = () => {
    if (confirmDelete) {
      onDelete?.(stamp._id);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 2500);
    }
  };

  return (
    <div className={`relative overflow-hidden border-4 bg-surface flex flex-col ${isDraft ? "border-brutal-border/50 opacity-80" : "border-brutal-border"}`}>
      {/* Accent stripe — dim for drafts, yellow for published */}
      <div className={`h-2 w-full flex-shrink-0 ${isDraft ? "bg-brutal-border" : "bg-brutal-yellow"}`} />

      {/* Draft badge */}
      {isDraft && (
        <div className="absolute top-2 right-2 z-10">
          <span className="border-2 border-brutal-border bg-surface px-1.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-widest text-brutal-dim">
            DRAFT
          </span>
        </div>
      )}

      {/* Stamp watermark image */}
      <div className="pointer-events-none select-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
        <Image
          src={isDraft ? "/draft_cineblock.png" : "/stamped_cineblock.png"}
          alt=""
          width={120}
          height={120}
          className={`rotate-[-15deg] ${isDraft ? "opacity-10" : "opacity-15"}`}
        />
      </div>

      {/* Card body */}
      <div className="relative flex gap-3 p-3">
        {/* Poster */}
        <div className="relative h-24 w-16 flex-shrink-0 border-2 border-brutal-border bg-brutal-border overflow-hidden">
          {stamp.posterPath ? (
            <Image
              src={posterUrl(stamp.posterPath, "small")}
              alt={stamp.movieTitle}
              fill
              className="object-cover"
              sizes="64px"
            />
          ) : null}
        </div>

        {/* Text content */}
        <div className="flex flex-col justify-between min-w-0 flex-1 py-0.5">
          <div>
            <p className="truncate font-outfit text-xs font-black uppercase tracking-tight text-text">
              {stamp.movieTitle}
            </p>
            <p className={`mt-1 font-mono text-xs font-bold leading-snug break-words ${isDraft ? "text-text-muted italic" : "text-text"}`}>
              {stamp.reviewText}
            </p>
          </div>
          {!isDraft && (
            <p className="mt-2 font-mono text-[10px] uppercase text-text-muted">
              {formatDate(stamp.createdAt)}
            </p>
          )}
        </div>
      </div>

      {/* Owner controls */}
      {isOwner && (
        <div className="flex items-center gap-2 border-t-2 border-brutal-border px-3 py-2 bg-surface/50">
          {isDraft ? (
            /* Draft: show CONTINUE instead of visibility toggle */
            <button
              onClick={() => onContinue?.(stamp)}
              className="flex items-center gap-1 border-2 border-brutal-yellow bg-brutal-yellow/10 px-2 py-0.5 font-mono text-[10px] uppercase font-bold text-brutal-yellow hover:bg-brutal-yellow/20 transition-colors"
            >
              <Pencil className="h-3 w-3" />
              CONTINUE
            </button>
          ) : (
            /* Published: visibility toggle */
            <button
              onClick={() => onToggleVisibility?.(stamp._id, !stamp.isPublic)}
              className={`flex items-center gap-1 border-2 border-brutal-border px-2 py-0.5 font-mono text-[10px] uppercase font-bold transition-colors ${
                stamp.isPublic
                  ? "bg-brutal-lime text-black hover:bg-brutal-lime/80"
                  : "bg-surface text-text-muted hover:bg-brutal-border/20"
              }`}
              aria-label={stamp.isPublic ? "Make private" : "Make public"}
            >
              {stamp.isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
              {stamp.isPublic ? "PUBLIC" : "PRIVATE"}
            </button>
          )}

          <button
            onClick={handleDeleteClick}
            className={`ml-auto flex items-center gap-1 border-2 border-brutal-border px-2 py-0.5 font-mono text-[10px] uppercase font-bold transition-colors ${
              confirmDelete
                ? "border-red-500 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                : "bg-surface text-text-muted hover:border-red-500/50 hover:text-red-400"
            }`}
            aria-label="Delete stamp"
          >
            <Trash2 className="h-3 w-3" />
            {confirmDelete ? "CONFIRM?" : "DELETE"}
          </button>
        </div>
      )}
    </div>
  );
}
