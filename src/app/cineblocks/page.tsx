"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useBlocks } from "@/hooks/useBlocks";
import { useConvexAuth } from "convex/react";
import { posterUrl } from "@/lib/constants";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { MAX_BLOCKS_PER_USER, MAX_BLOCK_TITLE_LENGTH, MAX_MOVIES_PER_BLOCK } from "../../../convex/limits";
import { ArrowLeft, Check, Globe, LayoutGrid, Link2, Lock, LogIn, Plus, Search, Trash2, X } from "lucide-react";

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
  | { block: OwnedBlockCard; isOwned: true }
  | { block: SavedBlockCard; isOwned: false };

const SURFACE = { background: "rgba(8,15,40,0.72)", border: "1px solid rgba(255,255,255,0.12)" };
const PRIMARY = { background: "rgba(96,165,250,0.18)", border: "1px solid rgba(96,165,250,0.45)" };
const QUIET = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" };

// ─── Create Block Form ────────────────────────────────────────────────────────

function CreateBlockModal({ onClose, onCreate }: { onClose: () => void; onCreate: (title: string) => Promise<Id<"blocks">> }) {
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await onCreate(title.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create the CineBlock. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="create-block-title">
      <div aria-hidden="true" className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl animate-pop-in"
        style={{ background: "rgba(5,10,30,0.94)", backdropFilter: "blur(32px) saturate(160%)", WebkitBackdropFilter: "blur(32px) saturate(160%)", border: "1px solid rgba(255,255,255,0.14)", boxShadow: "0 24px 60px rgba(0,0,0,0.7)" }}
      >
        <div className="flex items-center justify-between px-5 pt-5">
          <h2 id="create-block-title" className="font-display text-xl font-semibold text-white">New CineBlock</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="-mr-2 flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-white/10 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <label htmlFor="block-title" className="text-sm text-slate-300">Title</label>
              <span className="text-xs tabular-nums text-slate-500">{title.length}/{MAX_BLOCK_TITLE_LENGTH}</span>
            </div>
            <input
              id="block-title"
              autoFocus
              type="text"
              autoComplete="off"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="3 AM sci-fi, 90s comfort films…"
              maxLength={MAX_BLOCK_TITLE_LENGTH}
              className="rounded-xl px-3 py-3 text-base text-white placeholder:text-slate-500 transition-colors focus:border-blue-400/60"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.16)" }}
            />
            {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
          </div>
          <button
            type="submit"
            disabled={submitting || !title.trim()}
            className="rounded-xl px-6 py-3 text-sm font-semibold text-white transition-[transform,background-color] duration-150 hover:bg-blue-400/25 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
            style={PRIMARY}
          >
            {submitting ? "Creating…" : "Create block"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Block Card ───────────────────────────────────────────────────────────────

function BlockCard({ block, isOwned }: BlockCardProps) {
  const { deleteBlock } = useBlocks();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (confirmTimerRef.current !== null) clearTimeout(confirmTimerRef.current);
  }, []);

  const blockData = isOwned ? block : block.block;
  const id = isOwned ? block._id : block.blockId;

  const handleCopyLink = async () => {
    try {
      setError(null);
      await navigator.clipboard.writeText(`${window.location.origin}/cineblock/${id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Couldn't copy the link.");
    }
  };

  const handleDelete = async () => {
    if (isOwned !== true) return;
    if (confirmDelete) {
      setDeleting(true);
      try {
        setError(null);
        await deleteBlock(block._id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't delete the CineBlock.");
        setDeleting(false);
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
    // The title link stretches over the whole card; the action buttons sit above it, so no button is nested in a link.
    <article className="group relative flex flex-col overflow-hidden rounded-2xl transition-colors duration-150 hover:border-white/25" style={SURFACE}>
      <div className="relative grid aspect-video grid-cols-2 overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
        {blockData.previewPosters?.length > 0 ? (
          blockData.previewPosters.slice(0, 4).map((path: string, i: number) => (
            <div key={i} className="relative overflow-hidden">
              <Image src={posterUrl(path, "small")} alt="" fill className="object-cover" sizes="200px" />
            </div>
          ))
        ) : (
          <div className="col-span-2 flex h-full items-center justify-center">
            <LayoutGrid className="h-10 w-10 text-slate-600" strokeWidth={1} />
          </div>
        )}
        <span className="absolute bottom-2 right-2 rounded-lg px-2 py-0.5 text-xs font-medium tabular-nums text-white" style={{ background: "rgba(2,8,23,0.82)" }}>
          {blockData.movieCount}/{MAX_MOVIES_PER_BLOCK}
        </span>
        {isOwned && (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs text-slate-200" style={{ background: "rgba(2,8,23,0.82)" }}>
            {blockData.isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
            {blockData.isPublic ? "Public" : "Private"}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="line-clamp-1 font-display text-sm font-semibold text-white transition-colors duration-150 group-hover:text-blue-300">
          <Link href={`/cineblock/${id}`} className="after:absolute after:inset-0 after:content-['']">
            {blockData.title}
          </Link>
        </h3>
        {!isOwned && <p className="text-xs text-slate-400">by @{block.block.ownerName}</p>}
        {error && <p role="alert" className="text-xs text-red-300">{error}</p>}

        <div className="relative z-10 mt-auto flex gap-2 pt-3">
          <button
            type="button"
            onClick={() => void handleCopyLink()}
            className="flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-lg text-xs font-medium text-slate-300 transition-[transform,color] duration-150 hover:text-white active:scale-[0.97]"
            style={QUIET}
          >
            {copied ? <Check className="h-3.5 w-3.5 text-blue-300" /> : <Link2 className="h-3.5 w-3.5" />}
            <span className="inline-block min-w-[4.5ch] text-left">{copied ? "Copied" : "Share"}</span>
          </button>
          {isOwned && (
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={deleting}
              className={`flex min-h-10 min-w-10 items-center justify-center rounded-lg px-3 text-xs font-medium transition-[transform,color,background-color] duration-150 active:scale-[0.97] disabled:opacity-50 ${confirmDelete ? "text-red-100" : "text-slate-400 hover:text-red-300"}`}
              style={confirmDelete ? { background: "rgba(239,68,68,0.30)", border: "1px solid rgba(239,68,68,0.55)" } : QUIET}
              aria-label={confirmDelete ? "Confirm delete" : `Delete ${blockData.title}`}
            >
              {confirmDelete ? (deleting ? "Deleting…" : "Delete?") : <Trash2 className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CineBlocksPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { myBlocks, mySavedBlocks, createBlock } = useBlocks();
  const [showCreate, setShowCreate] = useState(false);
  const atBlockLimit = (myBlocks?.length ?? 0) >= MAX_BLOCKS_PER_USER;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "#020817" }}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-400/30 border-t-blue-400" role="status" aria-label="Loading" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-5 p-6 text-center" style={{ background: "#020817" }}>
        <LayoutGrid className="h-10 w-10 text-slate-500" strokeWidth={1.25} />
        <div className="space-y-1">
          <h1 className="font-display text-xl font-semibold text-white">Sign in to build CineBlocks</h1>
          <p className="text-sm text-slate-400">Make shareable lists of up to {MAX_MOVIES_PER_BLOCK} titles.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/sign-in?returnTo=/cineblocks" className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-400/25" style={PRIMARY}>
            <LogIn className="h-4 w-4" /> Sign in
          </Link>
          <Link href="/" className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm text-slate-300 transition-colors hover:text-white" style={QUIET}>
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen flex-col overflow-x-hidden pb-20 lg:pb-0" style={{ background: "#020817" }}>
      <div
        className="sticky top-0 z-50"
        style={{ background: "rgba(2,8,23,0.80)", backdropFilter: "blur(24px) saturate(180%)", WebkitBackdropFilter: "blur(24px) saturate(180%)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" aria-label="Back to home" className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-white/10 hover:text-white" style={{ border: "1px solid rgba(255,255,255,0.12)" }}>
              <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
            </Link>
            <h1 className="font-display text-xl font-semibold tracking-tight text-white sm:text-2xl">CineBlocks</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/cineblocks/discover" aria-label="Discover people and CineBlocks" title="Discover" className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-white/10 hover:text-white" style={{ border: "1px solid rgba(255,255,255,0.12)" }}>
              <Search className="h-4 w-4" strokeWidth={2.5} />
            </Link>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              disabled={atBlockLimit}
              title={atBlockLimit ? `You've reached the ${MAX_BLOCKS_PER_USER}-block limit` : undefined}
              className="flex min-h-10 min-w-10 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 text-sm font-semibold text-white transition-[transform,background-color] duration-150 hover:bg-blue-400/25 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 sm:px-4"
              style={PRIMARY}
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              <span className="sr-only sm:not-sr-only">New block</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-12 px-4 py-8 sm:px-6">
        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-display text-lg font-semibold text-white">My blocks</h2>
            <span className="text-sm tabular-nums text-slate-400">{myBlocks?.length ?? 0} of {MAX_BLOCKS_PER_USER}</span>
          </div>

          {myBlocks === undefined ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="overflow-hidden rounded-2xl" style={SURFACE}>
                  <div className="aspect-video animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
                  <div className="space-y-2 p-4">
                    <div className="h-4 w-3/4 animate-pulse rounded" style={{ background: "rgba(255,255,255,0.08)" }} />
                    <div className="h-10 animate-pulse rounded-lg" style={{ background: "rgba(255,255,255,0.05)" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : myBlocks.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl px-6 py-12 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)" }}>
              <LayoutGrid className="h-10 w-10 text-slate-500" strokeWidth={1.25} />
              <p className="font-display font-semibold text-white">No blocks yet</p>
              <p className="max-w-xs text-sm text-slate-400">A CineBlock is a list of up to {MAX_MOVIES_PER_BLOCK} titles you can keep private or share.</p>
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="mt-2 flex min-h-10 items-center gap-2 rounded-xl px-5 text-sm font-semibold text-white transition-[transform,background-color] duration-150 hover:bg-blue-400/25 active:scale-[0.97]"
                style={PRIMARY}
              >
                <Plus className="h-4 w-4" strokeWidth={2.5} /> Create your first block
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {myBlocks.map((block) => <BlockCard key={block._id} block={block} isOwned />)}
            </div>
          )}
        </section>

        {(mySavedBlocks?.length ?? 0) > 0 && (
          <section>
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="font-display text-lg font-semibold text-white">Saved from others</h2>
              <span className="text-sm tabular-nums text-slate-400">{mySavedBlocks?.length}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {mySavedBlocks?.map((save) => <BlockCard key={save._id} block={save} isOwned={false} />)}
            </div>
          </section>
        )}
      </div>

      {showCreate && <CreateBlockModal onClose={() => setShowCreate(false)} onCreate={createBlock} />}
    </main>
  );
}
