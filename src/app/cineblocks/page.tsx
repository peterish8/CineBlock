"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useBlocks } from "@/hooks/useBlocks";
import { useConvexAuth } from "convex/react";
import { posterUrl } from "@/lib/constants";
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
  Users,
  Search,
} from "lucide-react";

// ─── Create Block Form ────────────────────────────────────────────────────────

function CreateBlockModal({ onClose, onCreate }: { onClose: () => void; onCreate: (title: string) => Promise<any> }) {
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
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-bg border-4 border-brutal-border brutal-shadow animate-pop-in">
        <div className="flex items-center justify-between p-4 border-b-4 border-brutal-border bg-brutal-violet">
          <h2 className="font-display font-bold text-xl uppercase tracking-widest text-black">New CineBlock</h2>
          <button onClick={onClose} className="p-1 hover:bg-black/10 transition-colors">
            <X className="w-5 h-5 text-black" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {error && (
            <div className="border-2 border-red-500 bg-red-500/10 px-3 py-2 text-sm font-mono text-red-300">
              {error}
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-xs uppercase tracking-wider text-brutal-dim">Block Title</label>
            <input
              autoFocus
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., 3AM Sci-Fi Hits, 90s Classics..."
              maxLength={60}
              className="bg-surface border-2 border-brutal-border px-3 py-3 font-inter text-sm focus:outline-none focus:border-brutal-violet transition-colors"
            />
            <span className="text-right text-[10px] text-brutal-dim font-mono">{title.length}/60</span>
          </div>
          <button
            type="submit"
            disabled={submitting || !title.trim()}
            className="bg-brutal-violet text-black font-display font-bold uppercase tracking-widest px-6 py-3 border-2 border-brutal-border hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? "CREATING..." : "CREATE BLOCK"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Block Card ───────────────────────────────────────────────────────────────

function BlockCard({ block, isOwned }: { block: any; isOwned: boolean }) {
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
      className="group brutal-card flex flex-col overflow-hidden hover:-translate-y-1 transition-transform duration-200 ease-out motion-reduce:transform-none motion-reduce:transition-none"
    >
      {/* Poster collage */}
      <div className="grid grid-cols-2 aspect-video bg-surface-2 relative overflow-hidden border-b-4 border-brutal-border">
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
            <LayoutGrid className="w-12 h-12 text-brutal-dim" strokeWidth={1} />
          </div>
        )}
        {/* Movie count badge */}
        <div className="absolute bottom-0 right-0 bg-black border-t-3 border-l-3 border-brutal-border px-3 py-1">
          <span className="font-mono font-bold text-xs text-brutal-white">
            {blockData.movieCount} / 50
          </span>
        </div>
        {isOwned && (
          <div className={`absolute top-0 left-0 border-r-3 border-b-3 border-brutal-border p-1.5 ${blockData.isPublic ? "bg-brutal-violet" : "bg-surface-2"}`}>
            {blockData.isPublic
              ? <Globe className="w-3 h-3 text-black" />
              : <Lock className="w-3 h-3 text-brutal-dim" />
            }
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="font-display font-bold text-sm uppercase tracking-wider line-clamp-1 text-brutal-white group-hover:text-brutal-violet transition-colors">
          {blockData.title}
        </h3>
        {error && (
          <p className="font-mono text-[10px] uppercase tracking-wider text-red-300">
            {error}
          </p>
        )}
        {!isOwned && (
          <p className="font-mono text-[10px] uppercase tracking-wider text-brutal-dim">
            by @{blockData.ownerName}
          </p>
        )}
        {/* Progress bar — shows if there are movies */}
        {blockData.movieCount > 0 && (
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1.5 bg-surface-2 border border-brutal-border">
              <div
                className="h-full bg-brutal-violet transition-all duration-500"
                style={{ width: `${(blockData.movieCount / 50) * 100}%` }}
              />
            </div>
            <span className="font-mono text-[9px] text-brutal-dim">{Math.round((blockData.movieCount / 50) * 100)}%</span>
          </div>
        )}
        {/* Actions row */}
        <div className="flex gap-2 mt-auto pt-2">
          <button
            onClick={handleCopyLink}
            className="brutal-btn flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-mono uppercase"
            title="Copy shareable link"
          >
            <Share2 className="w-3 h-3" />
            {copied ? "COPIED!" : "SHARE"}
          </button>
          {isOwned && (
            <button
              onClick={handleDelete}
              className={`brutal-btn flex items-center justify-center gap-1 px-3 py-1.5 text-[10px] font-mono uppercase transition-colors ${
                confirmDelete ? "!bg-red-600 !text-white !border-red-600" : "hover:!text-red-500"
              }`}
              title={confirmDelete ? "Tap again to confirm" : "Delete Block"}
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="w-10 h-10 border-4 border-brutal-violet border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-bg flex flex-col items-center justify-center gap-6 p-6">
        <Lock className="w-14 h-14 text-brutal-dim" strokeWidth={1} />
        <p className="font-display font-bold text-xl uppercase tracking-wider text-center">
          Sign in to manage your CineBlocks
        </p>
        <Link href="/" className="brutal-btn px-6 py-3 text-sm font-mono uppercase">
          <ArrowLeft className="w-4 h-4 inline mr-1" />Back to Home
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg flex flex-col pb-20 lg:pb-0">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-bg border-b-3 border-brutal-border">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="brutal-btn p-2.5"><ArrowLeft className="w-4 h-4" strokeWidth={3} /></Link>
            <LayoutGrid className="w-5 h-5 text-brutal-violet" strokeWidth={2.5} />
            <h1 className="font-display font-bold text-xl sm:text-2xl text-brutal-white uppercase tracking-tight">
              CineBlocks (Curated)
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/cineblocks/discover"
              className="brutal-btn p-2.5"
              title="Discover users & playlists"
            >
              <Search className="w-4 h-4" strokeWidth={2.5} />
            </Link>
            <button
              onClick={() => setShowCreate(true)}
              disabled={(myBlocks?.length ?? 0) >= 20}
              className="brutal-btn flex items-center gap-2 px-4 py-2.5 text-xs font-mono uppercase !bg-brutal-violet !text-black !border-brutal-violet hover:!bg-white hover:!text-black disabled:opacity-40 disabled:cursor-not-allowed"
              title={(myBlocks?.length ?? 0) >= 20 ? "Max 20 blocks reached" : "Create new block"}
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={3} />
              NEW BLOCK
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 py-8 flex flex-col gap-14">

        {/* My Blocks */}
        <section>
          <div className="flex items-end justify-between mb-5 border-b-3 border-brutal-border pb-3">
            <h2 className="font-display font-bold text-lg uppercase tracking-widest">My Blocks</h2>
            <span className="font-mono text-[10px] text-brutal-dim">
              {myBlocks?.length ?? 0} / 20 USED
            </span>
          </div>

          {myBlocks === undefined ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="brutal-card overflow-hidden animate-pulse">
                  <div className="aspect-video bg-surface-2" />
                  <div className="p-4"><div className="h-4 bg-surface-2 w-3/4 mb-2" /><div className="h-3 bg-surface-2 w-1/2" /></div>
                </div>
              ))}
            </div>
          ) : myBlocks.length === 0 ? (
            <div className="brutal-card p-10 flex flex-col items-center gap-4 border-dashed">
              <LayoutGrid className="w-12 h-12 text-brutal-dim" strokeWidth={1} />
              <p className="font-display font-bold uppercase text-brutal-dim tracking-wider">No blocks yet</p>
              <p className="font-mono text-xs text-brutal-dim text-center max-w-xs">
                Create your first CineBlock — a curated, shareable list of up to 50 movies.
              </p>
              <button
                onClick={() => setShowCreate(true)}
                className="brutal-btn flex items-center gap-2 px-5 py-2.5 text-xs font-mono uppercase !bg-brutal-violet !text-black !border-brutal-violet hover:!bg-white"
              >
                <Plus className="w-3 h-3" strokeWidth={3} /> CREATE FIRST BLOCK
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {myBlocks.map((block) => (
                <BlockCard key={block._id} block={block} isOwned={true} />
              ))}
            </div>
          )}
        </section>

        {/* Saved Blocks From Others */}
        {(mySavedBlocks?.length ?? 0) > 0 && (
          <section>
            <div className="flex items-end justify-between mb-5 border-b-3 border-brutal-border pb-3">
              <div className="flex items-center gap-2">
                <BookMarked className="w-4 h-4 text-brutal-lime" />
                <h2 className="font-display font-bold text-lg uppercase tracking-widest">Saved From Others</h2>
              </div>
              <span className="font-mono text-[10px] text-brutal-dim">
                {mySavedBlocks?.length} SAVED
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {mySavedBlocks?.map((save) => (
                <BlockCard key={save._id} block={save} isOwned={false} />
              ))}
            </div>
          </section>
        )}
      </div>

      {showCreate && (
        <CreateBlockModal onClose={() => setShowCreate(false)} onCreate={createBlock} />
      )}
    </main>
  );
}
