"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useBlocks } from "@/hooks/useBlocks";
import { useConvexAuth } from "convex/react";
import { posterUrl } from "@/lib/constants";
import { useThemeMode } from "@/hooks/useThemeMode";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import {
  ArrowLeft,
  LayoutGrid,
  Plus,
  Trash2,
  Share2,
  BookMarked,
  Globe,
  X,
  Lock,
  Search,
} from "lucide-react";

type OwnedBlockCard = Doc<"blocks"> & {
  movieCount: number;
  previewPosters: string[];
};

type SavedBlockCard = {
  _id: Id<"saved_blocks">;
  blockId: Id<"blocks">;
  block: OwnedBlockCard & { ownerName: string };
};

type BlockCardProps =
  | { block: OwnedBlockCard; isOwned: true; isGlass: boolean }
  | { block: SavedBlockCard; isOwned: false; isGlass: boolean };

// ─── Create Block Form ────────────────────────────────────────────────────────

function CreateBlockModal({ onClose, onCreate, isGlass }: { onClose: () => void; onCreate: (title: string) => Promise<Id<"blocks">>; isGlass: boolean }) {
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await onCreate(title.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create CineBlock.");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="create-block-title">
      <div
        role="button"
        tabIndex={0}
        aria-label="Close"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClose(); } }}
      />
      <div
        className={isGlass ? "relative w-full max-w-md overflow-hidden rounded-2xl" : "relative w-full max-w-md bg-bg border-4 border-brutal-border brutal-shadow animate-pop-in"}
        style={isGlass ? {
          background: "rgba(5,10,30,0.92)",
          backdropFilter: "blur(32px) saturate(160%)",
          WebkitBackdropFilter: "blur(32px) saturate(160%)",
          border: "1px solid rgba(96,165,250,0.25)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.7), 0 0 40px rgba(96,165,250,0.08)",
        } : undefined}
      >
        <div
          className={isGlass ? "flex items-center justify-between p-5" : "flex items-center justify-between p-4 border-b-4 border-brutal-border bg-brutal-violet"}
          style={isGlass ? { borderBottom: "1px solid rgba(255,255,255,0.08)" } : undefined}
        >
          <h2 id="create-block-title" className={isGlass ? "font-display font-bold text-xl text-white" : "font-display font-bold text-xl uppercase tracking-widest text-black"}>New CineBlock</h2>
          <button onClick={onClose} aria-label="Close" className={isGlass ? "flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-white transition-colors" : "p-1 hover:bg-black/10 transition-colors"}>
            <X className={isGlass ? "w-4 h-4" : "w-5 h-5 text-black"} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {error && (
            <div className={isGlass ? "rounded-xl px-3 py-2 text-sm text-red-300" : "border-2 border-red-500 bg-red-500/10 px-3 py-2 text-sm font-mono text-red-300"} style={isGlass ? { background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)" } : undefined}>
              {error}
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className={isGlass ? "text-xs text-slate-400" : "font-mono text-xs uppercase tracking-wider text-brutal-dim"}>Block Title</label>
            <input
              autoFocus
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., 3AM Sci-Fi Hits, 90s Classics..."
              maxLength={60}
              className={isGlass ? "rounded-xl px-3 py-3 text-sm text-white placeholder:text-slate-500 bg-transparent transition-colors" : "bg-surface border-2 border-brutal-border px-3 py-3 font-inter text-sm focus:border-brutal-violet transition-colors"}
              style={isGlass ? { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)" } : undefined}
            />
            <span className={isGlass ? "text-right text-[10px] text-slate-500" : "text-right text-[10px] text-brutal-dim font-mono"}>{title.length}/60</span>
          </div>
          <button
            type="submit"
            disabled={submitting || !title.trim()}
            className={isGlass
              ? "rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              : "bg-brutal-violet text-black font-display font-bold uppercase tracking-widest px-6 py-3 border-2 border-brutal-border hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"}
            style={isGlass ? { background: "rgba(96,165,250,0.20)", border: "1px solid rgba(96,165,250,0.45)" } : undefined}
          >
            {submitting ? "CREATING..." : "CREATE BLOCK"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Block Card ───────────────────────────────────────────────────────────────

function BlockCard({ block, isOwned, isGlass }: BlockCardProps) {
  const { deleteBlock } = useBlocks();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (confirmTimerRef.current !== null) clearTimeout(confirmTimerRef.current);
    };
  }, []);

  const blockData = isOwned ? block : block.block;
  const id = isOwned ? block._id : block.blockId;

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      setError(null);
      const shareUrl = `${window.location.origin}/cineblock/${id}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy the share link.");
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isOwned !== true) return;
    if (confirmDelete) {
      try {
        setError(null);
        await deleteBlock(block._id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete CineBlock.");
      }
      return;
    }

    if (confirmTimerRef.current !== null) clearTimeout(confirmTimerRef.current);
    setConfirmDelete(true);
    confirmTimerRef.current = setTimeout(() => {
      setConfirmDelete(false);
      confirmTimerRef.current = null;
    }, 3000);
  };

  return (
    <Link
      href={`/cineblock/${id}`}
      className={isGlass
        ? "group flex flex-col overflow-hidden rounded-2xl transition-all duration-200 ease-out hover:-translate-y-1 motion-reduce:transform-none motion-reduce:transition-none"
        : "group brutal-card flex flex-col overflow-hidden hover:-translate-y-1 transition-transform duration-200 ease-out motion-reduce:transform-none motion-reduce:transition-none"}
      style={isGlass ? {
        background: "rgba(8,15,40,0.72)",
        backdropFilter: "blur(24px) saturate(200%)",
        WebkitBackdropFilter: "blur(24px) saturate(200%)",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
      } : undefined}
    >
      {/* Poster collage */}
      <div className={isGlass ? "grid grid-cols-2 aspect-video relative overflow-hidden" : "grid grid-cols-2 aspect-video bg-surface-2 relative overflow-hidden border-b-4 border-brutal-border"} style={isGlass ? { background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.10)" } : undefined}>
        {blockData.previewPosters?.length > 0 ? (
          blockData.previewPosters.slice(0, 4).map((path: string, i: number) => (
            <div key={i} className="relative overflow-hidden bg-surface-2">
              <Image
                src={posterUrl(path, "small")}
                alt=""
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300 ease-out motion-reduce:transform-none motion-reduce:transition-none"
                sizes="200px"
              />
            </div>
          ))
        ) : (
          <div className="col-span-2 flex items-center justify-center h-full">
            <LayoutGrid className={isGlass ? "w-12 h-12 text-slate-600" : "w-12 h-12 text-brutal-dim"} strokeWidth={1} />
          </div>
        )}
        {/* Movie count badge */}
        <div
          className={isGlass ? "absolute bottom-2 right-2 rounded-lg px-2.5 py-1" : "absolute bottom-0 right-0 bg-black border-t-3 border-l-3 border-brutal-border px-3 py-1"}
          style={isGlass ? { background: "rgba(2,8,23,0.80)", border: "1px solid rgba(255,255,255,0.14)" } : undefined}
        >
          <span className={isGlass ? "text-xs font-semibold text-white" : "font-mono font-bold text-xs text-brutal-white"}>
            {blockData.movieCount} / 50
          </span>
        </div>
        {isOwned && (
          <div
            className={isGlass ? "absolute top-2 left-2 rounded-lg p-1.5" : `absolute top-0 left-0 border-r-3 border-b-3 border-brutal-border p-1.5 ${blockData.isPublic ? "bg-brutal-violet" : "bg-surface-2"}`}
            style={isGlass ? (blockData.isPublic
              ? { background: "rgba(96,165,250,0.25)", border: "1px solid rgba(96,165,250,0.5)" }
              : { background: "rgba(2,8,23,0.70)", border: "1px solid rgba(255,255,255,0.14)" }
            ) : undefined}
          >
            {blockData.isPublic
              ? <Globe className={isGlass ? "w-3 h-3 text-blue-200" : "w-3 h-3 text-black"} />
              : <Lock className={isGlass ? "w-3 h-3 text-slate-400" : "w-3 h-3 text-brutal-dim"} />
            }
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className={isGlass
          ? "font-display font-semibold text-sm line-clamp-1 text-white transition-colors group-hover:text-blue-300"
          : "font-display font-bold text-sm uppercase tracking-wider line-clamp-1 text-brutal-white group-hover:text-brutal-violet transition-colors"}>
          {blockData.title}
        </h3>
        {error && (
          <p className={isGlass ? "text-[10px] text-red-300" : "font-mono text-[10px] uppercase tracking-wider text-red-300"}>
            {error}
          </p>
        )}
        {!isOwned && (
          <p className={isGlass ? "text-[10px] text-slate-500" : "font-mono text-[10px] uppercase tracking-wider text-brutal-dim"}>
            by @{block.block.ownerName}
          </p>
        )}
        {/* Progress bar — shows if there are movies */}
        {blockData.movieCount > 0 && (
          <div className="flex items-center gap-2 mt-1">
            <div className={isGlass ? "flex-1 h-1.5 rounded-full overflow-hidden" : "flex-1 h-1.5 bg-surface-2 border border-brutal-border"} style={isGlass ? { background: "rgba(255,255,255,0.08)" } : undefined}>
              <div
                className={isGlass ? "h-full rounded-full transition-all duration-500" : "h-full bg-brutal-violet transition-all duration-500"}
                style={{ width: `${(blockData.movieCount / 50) * 100}%`, ...(isGlass ? { background: "linear-gradient(90deg, #60A5FA, #F97316)" } : {}) }}
              />
            </div>
            <span className={isGlass ? "text-[9px] text-slate-500" : "font-mono text-[9px] text-brutal-dim"}>{Math.round((blockData.movieCount / 50) * 100)}%</span>
          </div>
        )}
        {/* Actions row */}
        <div className="flex gap-2 mt-auto pt-2">
          <button
            onClick={handleCopyLink}
            className={isGlass
              ? "flex-1 flex items-center justify-center gap-1.5 min-h-9 rounded-lg text-[10px] font-semibold text-slate-300 transition-colors hover:text-white"
              : "brutal-btn flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-mono uppercase"}
            style={isGlass ? { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" } : undefined}
            title="Copy shareable link"
          >
            <Share2 className="w-3 h-3" />
            {copied ? "COPIED!" : "SHARE"}
          </button>
          {isOwned && (
            <button
              onClick={handleDelete}
              className={isGlass
                ? `flex items-center justify-center gap-1 min-h-9 px-3 rounded-lg text-[10px] font-semibold transition-colors ${confirmDelete ? "text-red-100" : "text-slate-400 hover:text-red-300"}`
                : `brutal-btn flex items-center justify-center gap-1 px-3 py-1.5 text-[10px] font-mono uppercase transition-colors ${confirmDelete ? "!bg-red-600 !text-white !border-red-600" : "hover:!text-red-500"}`}
              style={isGlass ? (confirmDelete
                ? { background: "rgba(239,68,68,0.35)", border: "1px solid rgba(239,68,68,0.6)" }
                : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }
              ) : undefined}
              title={confirmDelete ? "Tap again to confirm" : "Delete Block"}
              aria-label={confirmDelete ? "Tap again to confirm delete" : "Delete block"}
            >
              {confirmDelete ? "SURE?" : <Trash2 className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CineBlocksPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { myBlocks, mySavedBlocks, createBlock } = useBlocks();
  const [showCreate, setShowCreate] = useState(false);
  const isGlass = useThemeMode() === "glass";

  if (isLoading) {
    return (
      <div className={isGlass ? "min-h-screen flex items-center justify-center" : "min-h-screen flex items-center justify-center bg-bg"} style={isGlass ? { background: "#020817" } : undefined}>
        <div className={isGlass
          ? "w-10 h-10 rounded-full border-2 border-blue-400/30 border-t-blue-400 animate-spin"
          : "w-10 h-10 border-4 border-brutal-violet border-t-transparent animate-spin"} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className={isGlass ? "min-h-screen flex flex-col items-center justify-center gap-6 p-6" : "min-h-screen bg-bg flex flex-col items-center justify-center gap-6 p-6"} style={isGlass ? { background: "#020817" } : undefined}>
        <Lock className={isGlass ? "w-14 h-14 text-slate-600" : "w-14 h-14 text-brutal-dim"} strokeWidth={1} />
        <p className={isGlass ? "text-xl font-semibold text-center text-white" : "font-display font-bold text-xl uppercase tracking-wider text-center"}>
          Sign in to manage your CineBlocks
        </p>
        <Link
          href="/"
          className={isGlass ? "rounded-xl px-6 py-3 text-sm font-semibold text-slate-200 transition-colors" : "brutal-btn px-6 py-3 text-sm font-mono uppercase"}
          style={isGlass ? { background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)" } : undefined}
        >
          <ArrowLeft className="w-4 h-4 inline mr-1" />Back to Home
        </Link>
      </main>
    );
  }

  return (
    <main className={isGlass ? "min-h-screen relative overflow-x-hidden flex flex-col pb-20 lg:pb-0" : "min-h-screen bg-bg flex flex-col pb-20 lg:pb-0"} style={isGlass ? { background: "#020817" } : undefined}>
      {isGlass && (
        <>
          <div className="pointer-events-none fixed left-[-20%] top-[-15%] aspect-square w-[70vw] rounded-full opacity-30" style={{ background: "radial-gradient(circle, rgba(96,165,250,0.22) 0%, transparent 70%)", filter: "blur(90px)", zIndex: 0 }} />
          <div className="pointer-events-none fixed bottom-[-20%] right-[-15%] aspect-square w-[60vw] rounded-full opacity-25" style={{ background: "radial-gradient(circle, rgba(249,115,22,0.18) 0%, transparent 70%)", filter: "blur(110px)", zIndex: 0 }} />
        </>
      )}

      {/* Header */}
      <div
        className={isGlass ? "sticky top-0 z-50" : "sticky top-0 z-50 bg-bg border-b-3 border-brutal-border"}
        style={isGlass ? { background: "rgba(2,8,23,0.80)", backdropFilter: "blur(24px) saturate(180%)", WebkitBackdropFilter: "blur(24px) saturate(180%)", borderBottom: "1px solid rgba(255,255,255,0.08)" } : undefined}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-5 flex items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              aria-label="Back to home"
              className={isGlass ? "flex items-center justify-center w-9 h-9 rounded-xl transition-colors hover:bg-white/10" : "brutal-btn p-2.5"}
              style={isGlass ? { border: "1px solid rgba(255,255,255,0.12)", color: "rgba(148,163,184,0.8)" } : undefined}
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={3} />
            </Link>
            <LayoutGrid className={isGlass ? "w-5 h-5 text-blue-400" : "w-5 h-5 text-brutal-violet"} strokeWidth={2.5} />
            <h1 className={isGlass ? "font-display font-bold text-xl sm:text-2xl text-white tracking-tight" : "font-display font-bold text-xl sm:text-2xl text-brutal-white uppercase tracking-tight"}>
              {isGlass ? "CineBlocks" : "CineBlocks (Curated)"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/cineblocks/discover"
              aria-label="Discover users and playlists"
              className={isGlass ? "flex items-center justify-center w-9 h-9 rounded-xl transition-colors hover:bg-white/10" : "brutal-btn p-2.5"}
              style={isGlass ? { border: "1px solid rgba(255,255,255,0.12)", color: "rgba(148,163,184,0.8)" } : undefined}
              title="Discover users & playlists"
            >
              <Search className="w-4 h-4" strokeWidth={2.5} />
            </Link>
            <button
              onClick={() => setShowCreate(true)}
              disabled={(myBlocks?.length ?? 0) >= 20}
              className={isGlass
                ? "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                : "brutal-btn flex items-center gap-2 px-4 py-2.5 text-xs font-mono uppercase !bg-brutal-violet !text-black !border-brutal-violet hover:!bg-white hover:!text-black disabled:opacity-40 disabled:cursor-not-allowed"}
              style={isGlass ? { background: "rgba(96,165,250,0.18)", border: "1px solid rgba(96,165,250,0.45)" } : undefined}
              title={(myBlocks?.length ?? 0) >= 20 ? "Max 20 blocks reached" : "Create new block"}
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={3} />
              {isGlass ? "New Block" : "NEW BLOCK"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 py-8 flex flex-col gap-14 relative z-10">

        {/* My Blocks */}
        <section>
          <div className={isGlass ? "flex items-end justify-between mb-5 pb-3" : "flex items-end justify-between mb-5 border-b-3 border-brutal-border pb-3"} style={isGlass ? { borderBottom: "1px solid rgba(255,255,255,0.10)" } : undefined}>
            <h2 className={isGlass ? "text-lg font-display font-semibold text-white" : "font-display font-bold text-lg uppercase tracking-widest"}>My Blocks</h2>
            <span className={isGlass ? "text-[11px] text-slate-500 tabular-nums" : "font-mono text-[10px] text-brutal-dim"}>
              {myBlocks?.length ?? 0} / 20 used
            </span>
          </div>

          {myBlocks === undefined ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className={isGlass ? "overflow-hidden rounded-2xl animate-pulse" : "brutal-card overflow-hidden animate-pulse"} style={isGlass ? { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" } : undefined}>
                  <div className={isGlass ? "aspect-video" : "aspect-video bg-surface-2"} style={isGlass ? { background: "rgba(255,255,255,0.04)" } : undefined} />
                  <div className="p-4"><div className={isGlass ? "h-4 w-3/4 mb-2 rounded" : "h-4 bg-surface-2 w-3/4 mb-2"} style={isGlass ? { background: "rgba(255,255,255,0.08)" } : undefined} /><div className={isGlass ? "h-3 w-1/2 rounded" : "h-3 bg-surface-2 w-1/2"} style={isGlass ? { background: "rgba(255,255,255,0.08)" } : undefined} /></div>
                </div>
              ))}
            </div>
          ) : myBlocks.length === 0 ? (
            <div className={isGlass ? "p-10 flex flex-col items-center gap-4 rounded-2xl" : "brutal-card p-10 flex flex-col items-center gap-4 border-dashed"} style={isGlass ? { background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.14)" } : undefined}>
              <LayoutGrid className={isGlass ? "w-12 h-12 text-slate-600" : "w-12 h-12 text-brutal-dim"} strokeWidth={1} />
              <p className={isGlass ? "font-semibold text-slate-400" : "font-display font-bold uppercase text-brutal-dim tracking-wider"}>No blocks yet</p>
              <p className={isGlass ? "text-xs text-slate-500 text-center max-w-xs" : "font-mono text-xs text-brutal-dim text-center max-w-xs"}>
                Create your first CineBlock — a curated, shareable list of up to 50 movies.
              </p>
              <button
                onClick={() => setShowCreate(true)}
                className={isGlass
                  ? "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white transition-all"
                  : "brutal-btn flex items-center gap-2 px-5 py-2.5 text-xs font-mono uppercase !bg-brutal-violet !text-black !border-brutal-violet hover:!bg-white"}
                style={isGlass ? { background: "rgba(96,165,250,0.18)", border: "1px solid rgba(96,165,250,0.45)" } : undefined}
              >
                <Plus className="w-3 h-3" strokeWidth={3} /> Create first block
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {myBlocks.map((block) => (
                <BlockCard key={block._id} block={block} isOwned={true} isGlass={isGlass} />
              ))}
            </div>
          )}
        </section>

        {/* Saved Blocks From Others */}
        {(mySavedBlocks?.length ?? 0) > 0 && (
          <section>
            <div className={isGlass ? "flex items-end justify-between mb-5 pb-3" : "flex items-end justify-between mb-5 border-b-3 border-brutal-border pb-3"} style={isGlass ? { borderBottom: "1px solid rgba(255,255,255,0.10)" } : undefined}>
              <div className="flex items-center gap-2">
                <BookMarked className={isGlass ? "w-4 h-4 text-emerald-400" : "w-4 h-4 text-brutal-lime"} />
                <h2 className={isGlass ? "text-lg font-display font-semibold text-white" : "font-display font-bold text-lg uppercase tracking-widest"}>Saved From Others</h2>
              </div>
              <span className={isGlass ? "text-[11px] text-slate-500 tabular-nums" : "font-mono text-[10px] text-brutal-dim"}>
                {mySavedBlocks?.length} saved
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {mySavedBlocks?.map((save) => (
                <BlockCard key={save._id} block={save} isOwned={false} isGlass={isGlass} />
              ))}
            </div>
          </section>
        )}
      </div>

      {showCreate && (
        <CreateBlockModal onClose={() => setShowCreate(false)} onCreate={createBlock} isGlass={isGlass} />
      )}
    </main>
  );
}
