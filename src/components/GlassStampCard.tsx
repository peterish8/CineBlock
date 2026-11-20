"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, FilePenLine, LockKeyhole, Radio } from "lucide-react";
import { Id } from "../../convex/_generated/dataModel";
import { posterUrl } from "@/lib/constants";

export type StampRecord = {
  _id: Id<"stamps">;
  movieId: number;
  mediaType?: "movie" | "tv";
  movieTitle: string;
  posterPath: string;
  reviewText: string;
  isPublic: boolean;
  isDraft?: boolean;
  createdAt: number;
};

type GlassStampCardProps = {
  stamp: StampRecord;
  onOpen: (stamp: StampRecord) => void;
};

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export default function GlassStampCard({ stamp, onOpen }: GlassStampCardProps) {
  const isDraft = stamp.isDraft === true;
  const badge = isDraft ? "DRAFT" : stamp.isPublic ? "PUBLIC" : "PRIVATE";
  const reduceMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      layoutId={`stamp-card-${stamp._id}`}
      onClick={() => onOpen(stamp)}
      className="group relative min-h-[300px] overflow-hidden rounded-[24px] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 sm:min-h-[320px] sm:rounded-[28px]"
      whileHover={reduceMotion ? undefined : { y: -5, rotate: isDraft ? -0.25 : 0.25 }}
      whileTap={reduceMotion ? undefined : { scale: 0.985 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      style={{
        background: isDraft ? "rgba(17,25,45,0.82)" : "rgba(8,20,49,0.86)",
        border: isDraft ? "1px solid rgba(148,163,184,0.22)" : "1px solid rgba(125,211,252,0.25)",
        boxShadow: isDraft
          ? "0 18px 50px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.09)"
          : "0 18px 50px rgba(0,0,0,0.32), 0 0 30px rgba(59,130,246,0.10), inset 0 1px 0 rgba(255,255,255,0.11)",
        backdropFilter: "blur(24px) saturate(145%)",
      }}
    >
      <div className="absolute inset-0 opacity-80" style={{ background: isDraft ? "linear-gradient(140deg, rgba(148,163,184,0.08), transparent 52%)" : "linear-gradient(140deg, rgba(59,130,246,0.16), rgba(249,115,22,0.08) 55%, transparent)" }} />

      <div className="relative flex h-full flex-col p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] font-display font-medium uppercase tracking-[0.18em] text-slate-500">{formatDate(stamp.createdAt)}</span>
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-display font-semibold uppercase tracking-[0.16em]" style={isDraft
            ? { background: "rgba(148,163,184,0.14)", border: "1px solid rgba(148,163,184,0.24)", color: "#CBD5E1" }
            : { background: "rgba(96,165,250,0.16)", border: "1px solid rgba(125,211,252,0.28)", color: "#BAE6FD" }}>
            {isDraft ? <FilePenLine className="h-3 w-3" /> : stamp.isPublic ? <Radio className="h-3 w-3" /> : <LockKeyhole className="h-3 w-3" />}
            {badge}
          </span>
        </div>

        <motion.div layoutId={`stamp-image-${stamp._id}`} className="relative mt-4 flex min-h-[182px] flex-1 flex-col items-center justify-center overflow-hidden rounded-[22px] border border-white/[0.1] bg-[#07132d] px-5 py-6 text-center">
          {stamp.posterPath && <Image src={posterUrl(stamp.posterPath, "medium")} alt="" fill className="object-cover opacity-20 blur-[2px] transition-transform duration-700 group-hover:scale-110" sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 30vw" />}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.20),transparent_46%),linear-gradient(180deg,rgba(2,8,23,0.20),rgba(2,8,23,0.88))]" />
          <div className="relative z-10 flex flex-col items-center">
            <span className="text-[9px] font-display font-semibold uppercase tracking-[0.24em] text-cyan-100/60">CineBlock / stamp</span>
            <motion.div layoutId={`stamp-mark-${stamp._id}`} className="my-2.5 rounded-full shadow-[0_0_28px_rgba(96,165,250,0.24)]">
              <Image src={isDraft ? "/stamps/draft-glass.png" : "/stamps/stamped-glass.png"} alt="" width={66} height={66} className="opacity-95" unoptimized />
            </motion.div>
            <motion.h2 layoutId={`stamp-title-${stamp._id}`} className="line-clamp-2 font-display text-[1.2rem] font-semibold leading-tight tracking-[-0.025em] text-white">{stamp.movieTitle}</motion.h2>
          </div>
        </motion.div>

        <motion.p layoutId={`stamp-review-${stamp._id}`} className="mt-4 line-clamp-2 text-center text-[0.88rem] italic leading-relaxed text-slate-300/80">{stamp.reviewText || "A blank page waiting for what this film made you feel."}</motion.p>
        <div className="mt-4 flex items-center justify-between border-t border-white/[0.09] pt-3">
          <span className="text-[10px] font-display font-medium uppercase tracking-[0.14em] text-slate-500">Open stamp</span>
          <ArrowUpRight className="h-4 w-4 text-cyan-200/60 transition-colors group-hover:text-white" strokeWidth={1.8} />
        </div>
      </div>
    </motion.button>
  );
}
