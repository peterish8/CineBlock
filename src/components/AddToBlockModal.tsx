"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { Plus, X, FolderPlus } from "lucide-react";
import { Id } from "../../convex/_generated/dataModel";
import { posterUrl } from "@/lib/constants";
import { useBlocks } from "@/hooks/useBlocks";

type AddToBlockModalProps = {
  isOpen: boolean;
  onClose: () => void;
  movie: {
    id: number;
    title: string;
    posterPath: string;
  };
};

export default function AddToBlockModal({ isOpen, onClose, movie }: AddToBlockModalProps) {
  const { myBlocks, addMovieToBlock, createBlock } = useBlocks();
  const [newBlockName, setNewBlockName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [addingToBlockId, setAddingToBlockId] = useState<Id<"blocks"> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;

    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const root = document.querySelector("[data-cineblock-modal='true']");
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
        if (!active || active === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (!active || active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      restoreFocusRef.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAdd = async (blockId: Id<"blocks">) => {
    setError(null);
    setAddingToBlockId(blockId);

    try {
      await addMovieToBlock(blockId, movie.id, movie.title, movie.posterPath || "");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add movie to CineBlock.");
    } finally {
      setAddingToBlockId(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockName.trim()) return;

    setError(null);
    setIsCreating(true);

    try {
      const newBlockId = await createBlock(newBlockName.trim());
      if (newBlockId) {
        await handleAdd(newBlockId);
      }
      setNewBlockName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create CineBlock.");
    } finally {
      setIsCreating(false);
    }
  };

  const busy = isCreating || addingToBlockId !== null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in motion-reduce:animate-none" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-cineblock-modal="true"
        className="relative flex max-h-[90vh] w-full max-w-md flex-col border-4 border-brutal-border bg-bg brutal-shadow animate-slide-up motion-reduce:animate-none"
      >
        <div className="flex items-center justify-between border-b-4 border-brutal-border bg-brutal-violet p-4">
          <h2 id={titleId} className="font-outfit text-xl font-bold uppercase tracking-wider text-black">
            Add to CineBlock
          </h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close add to CineBlock modal"
            className="p-1 transition-colors hover:bg-black/10"
          >
            <X className="h-6 w-6 text-black" />
          </button>
        </div>

        <div className="flex gap-4 border-b-4 border-brutal-border bg-surface p-4">
          <div className="relative h-24 w-16 flex-shrink-0 border-2 border-brutal-border bg-brutal-border">
            {movie.posterPath ? (
              <Image src={posterUrl(movie.posterPath, "small")} alt={movie.title} fill className="object-cover" />
            ) : null}
          </div>
          <div className="flex flex-col justify-center">
            <span className="font-inter text-sm uppercase tracking-wider text-text-muted">Adding</span>
            <span className="line-clamp-2 font-outfit text-lg font-bold leading-tight">{movie.title}</span>
          </div>
        </div>

        <div className="custom-scrollbar flex flex-1 flex-col gap-3 overflow-y-auto p-4">
          {error && (
            <div className="border-2 border-red-500 bg-red-500/10 px-3 py-2 text-sm font-mono text-red-300">
              {error}
            </div>
          )}

          {myBlocks === undefined ? (
            <div className="py-4 text-center font-outfit uppercase">Loading Blocks...</div>
          ) : myBlocks.length === 0 ? (
            <div className="border-2 border-dashed border-brutal-border py-4 text-center font-outfit uppercase text-text-muted">
              You haven&apos;t created any CineBlocks yet.
            </div>
          ) : (
            myBlocks.map((block) => {
              const isFull = block.movieCount >= 50;
              const isAddingHere = addingToBlockId === block._id;

              return (
                <button
                  key={block._id}
                  onClick={() => void handleAdd(block._id)}
                  disabled={isFull || busy}
                  className={`flex items-center justify-between border-2 border-brutal-border p-3 text-left transition-all group ${
                    isFull || busy
                      ? "cursor-not-allowed bg-surface/50 opacity-50"
                      : "cursor-pointer bg-surface hover:-translate-y-1 hover:border-brutal-violet hover:shadow-[4px_4px_0px_#000]"
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap font-outfit text-md font-bold">
                      {block.title}
                    </span>
                    <span className="font-inter text-xs uppercase tracking-wider text-text-muted">
                      {block.movieCount} / 50 Movies
                    </span>
                  </div>

                  {isFull ? (
                    <span className="text-xs font-bold uppercase text-red-500">FULL</span>
                  ) : isAddingHere ? (
                    <span className="text-xs font-bold uppercase text-brutal-violet">ADDING...</span>
                  ) : (
                    <Plus className="h-5 w-5 opacity-50 transition-colors group-hover:text-brutal-violet group-hover:opacity-100" />
                  )}
                </button>
              );
            })
          )}
        </div>

        <div className="border-t-4 border-brutal-border bg-surface-2 p-4">
          {myBlocks && myBlocks.length >= 20 ? (
            <div className="text-center font-outfit text-sm uppercase text-text-muted">
              Maximum 20 CineBlocks reached.
            </div>
          ) : (
            <form onSubmit={handleCreate} className="flex flex-col gap-2">
              <span className="font-outfit text-sm uppercase tracking-wider">Or Create New</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="E.g., 90s Midnight Sci-Fi"
                  value={newBlockName}
                  onChange={(e) => setNewBlockName(e.target.value)}
                  maxLength={60}
                  className="flex-1 border-2 border-brutal-border bg-bg px-3 py-2 font-inter text-sm transition-colors focus:border-brutal-violet focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={busy || !newBlockName.trim()}
                  className="flex items-center gap-1 border-2 border-brutal-border bg-brutal-violet px-4 py-2 font-outfit font-bold text-black transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isCreating ? "..." : <FolderPlus className="h-5 w-5" />}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
