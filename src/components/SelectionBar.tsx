"use client";

import { useState } from "react";
import { TMDBMovie } from "@/lib/types";
import { useBlocks } from "@/hooks/useBlocks";
import { CheckSquare, Square, X, ListPlus, Loader2, ExternalLink, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface SelectionBarProps {
  selected: Set<number>;
  allMovies: TMDBMovie[];
  onToggleAll: () => void;
  onClear: () => void;
}

export default function SelectionBar({ selected, allMovies, onToggleAll, onClear }: SelectionBarProps) {
  const { createBlock, addMovieToBlock } = useBlocks();
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [doneBlockId, setDoneBlockId] = useState<string | null>(null);

  const allSelected = allMovies.length > 0 && selected.size === allMovies.length;

  const selectedMovies = allMovies.filter((m) => selected.has(m.id));

  const handleCreate = async () => {
    if (!title.trim() || selectedMovies.length === 0) return;
    setCreating(true);
    setProgress({ done: 0, total: selectedMovies.length });

    try {
      const blockId = await createBlock(title.trim());
      if (!blockId) throw new Error("Failed to create block");

      for (let i = 0; i < selectedMovies.length; i++) {
        const m = selectedMovies[i];
        try {
          await addMovieToBlock(blockId, m.id, m.title || "", m.poster_path || "");
          // Respect the 500ms rate limit between adds
          if (i < selectedMovies.length - 1) {
            await new Promise((r) => setTimeout(r, 520));
          }
        } catch {
          // skip failed individual movie, keep going
        }
        setProgress({ done: i + 1, total: selectedMovies.length });
      }

      setDoneBlockId(blockId as string);
    } catch {
      // createBlock already shows a toast on failure
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setModalOpen(false);
    setTitle("");
    setProgress(null);
    setDoneBlockId(null);
  };

  return (
    <>
      {/* Floating bar */}
      <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-[90] w-[calc(100%-2rem)] max-w-lg">
        <div className="brutal-card border-2 border-brutal-yellow bg-bg px-4 py-3 flex items-center gap-3 shadow-[4px_4px_0px_0px_rgba(255,212,0,0.4)]">
          <span className="text-brutal-yellow text-[11px] font-mono font-black shrink-0">
            {selected.size} SELECTED
          </span>

          <button
            onClick={onToggleAll}
            className="brutal-chip text-brutal-dim border-brutal-border text-[9px] flex items-center gap-1 shrink-0"
          >
            {allSelected ? <CheckSquare className="w-3 h-3" /> : <Square className="w-3 h-3" />}
            {allSelected ? "DESELECT ALL" : "SELECT ALL"}
          </button>

          <button
            onClick={onClear}
            className="brutal-chip text-brutal-dim border-brutal-border text-[9px] flex items-center gap-1 shrink-0"
          >
            <X className="w-3 h-3" /> CLEAR
          </button>

          <button
            onClick={() => setModalOpen(true)}
            className="brutal-btn ml-auto px-3 py-1.5 text-[10px] font-mono font-black !bg-brutal-yellow !text-black !border-brutal-yellow flex items-center gap-1.5 shrink-0"
          >
            <ListPlus className="w-3.5 h-3.5" />
            CREATE CINEBLOCK
          </button>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="brutal-card border-2 border-brutal-yellow w-full max-w-md p-6 space-y-4">
            {doneBlockId ? (
              /* Success state */
              <div className="text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-brutal-lime mx-auto" strokeWidth={2} />
                <p className="font-display font-bold text-brutal-white uppercase">CINEBLOCK CREATED!</p>
                <p className="text-brutal-dim text-[10px] font-mono">
                  {selectedMovies.length} MOVIES ADDED
                </p>
                <div className="flex gap-2 justify-center pt-1">
                  <Link
                    href="/cineblocks"
                    className="brutal-btn px-4 py-2 text-[10px] font-mono font-black !bg-brutal-lime !text-black !border-brutal-lime flex items-center gap-1.5"
                    onClick={handleClose}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    VIEW IN CINEBLOCKS
                  </Link>
                  <button
                    onClick={() => { handleClose(); onClear(); }}
                    className="brutal-btn px-4 py-2 text-[10px] font-mono font-black text-brutal-dim"
                  >
                    DONE
                  </button>
                </div>
              </div>
            ) : creating ? (
              /* Progress state */
              <div className="text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-brutal-yellow mx-auto" />
                <p className="font-mono text-brutal-white text-[11px] font-bold uppercase">
                  ADDING MOVIES...
                </p>
                {progress && (
                  <>
                    <p className="text-brutal-dim text-[10px] font-mono">
                      {progress.done} / {progress.total}
                    </p>
                    <div className="w-full h-2 bg-surface-2 border-2 border-brutal-border">
                      <div
                        className="h-full bg-brutal-yellow transition-all duration-300"
                        style={{ width: `${(progress.done / progress.total) * 100}%` }}
                      />
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* Form state */
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-[11px] font-mono font-black text-brutal-yellow uppercase tracking-[0.2em]">
                    NEW CINEBLOCK
                  </h2>
                  <button onClick={handleClose} className="text-brutal-dim hover:text-brutal-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-[10px] font-mono text-brutal-dim">
                  {selected.size} MOVIES SELECTED — SAVING AS A CINEBLOCK
                </p>

                <div>
                  <label className="text-[9px] font-mono font-black text-brutal-dim uppercase tracking-[0.2em] block mb-1.5">
                    BLOCK TITLE
                  </label>
                  <input
                    autoFocus
                    type="text"
                    maxLength={60}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") void handleCreate(); }}
                    placeholder="e.g. Best Sci-Fi, Weekend Picks..."
                    className="w-full bg-surface-2 border-2 border-brutal-border px-3 py-2 text-[11px] font-mono text-brutal-white placeholder:text-brutal-dim focus:border-brutal-yellow outline-none"
                  />
                  <p className="text-[9px] font-mono text-brutal-dim mt-1 text-right">{title.length}/60</p>
                </div>

                {/* Movie preview strip */}
                <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
                  {selectedMovies.slice(0, 10).map((m) => (
                    <div key={m.id} className="w-10 h-14 shrink-0 border-2 border-brutal-border overflow-hidden bg-surface-2">
                      {m.poster_path && (
                        <img
                          src={`https://image.tmdb.org/t/p/w92${m.poster_path}`}
                          alt={m.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  ))}
                  {selectedMovies.length > 10 && (
                    <div className="w-10 h-14 shrink-0 border-2 border-brutal-border bg-surface-2 flex items-center justify-center">
                      <span className="text-brutal-dim text-[9px] font-mono font-bold">+{selectedMovies.length - 10}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => void handleCreate()}
                  disabled={!title.trim()}
                  className="brutal-btn w-full py-3 text-[11px] font-mono font-black !bg-brutal-yellow !text-black !border-brutal-yellow disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  <ListPlus className="w-4 h-4" />
                  CREATE WITH {selected.size} MOVIES
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
