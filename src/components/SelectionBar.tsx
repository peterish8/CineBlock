"use client";

import { useState } from "react";
import { TMDBMovie } from "@/lib/types";
import { useBlocks } from "@/hooks/useBlocks";
import { CheckSquare, Square, X, ListPlus, Loader2, ExternalLink, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useThemeMode } from "@/hooks/useThemeMode";

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
  const isGlass = useThemeMode() === "glass";

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
        <div
          className={`px-4 py-3 flex items-center gap-3 ${
            isGlass
              ? "rounded-2xl"
              : "brutal-card border-2 border-brutal-yellow bg-bg shadow-[4px_4px_0px_0px_rgba(255,212,0,0.4)]"
          }`}
          style={isGlass ? {
            background: "rgba(8,15,40,0.90)",
            backdropFilter: "blur(24px) saturate(160%)",
            WebkitBackdropFilter: "blur(24px) saturate(160%)",
            border: "1px solid rgba(255,255,255,0.14)",
            borderRadius: "16px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
          } : undefined}
        >
          <span className={`text-[11px] font-bold shrink-0 ${isGlass ? "text-cyan-300" : "text-brutal-yellow font-mono font-black"}`}>
            {selected.size} selected
          </span>

          <button
            onClick={onToggleAll}
            className={`flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold shrink-0 transition-colors ${
              isGlass ? "rounded-lg" : "brutal-chip text-brutal-dim border-brutal-border"
            }`}
            style={isGlass ? { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(148,163,184,0.8)" } : undefined}
          >
            {allSelected ? <CheckSquare className="w-3 h-3" /> : <Square className="w-3 h-3" />}
            {allSelected ? "Deselect all" : "Select all"}
          </button>

          <button
            onClick={onClear}
            className={`flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold shrink-0 transition-colors ${
              isGlass ? "rounded-lg" : "brutal-chip text-brutal-dim border-brutal-border"
            }`}
            style={isGlass ? { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(148,163,184,0.8)" } : undefined}
          >
            <X className="w-3 h-3" /> Clear
          </button>

          <button
            onClick={() => setModalOpen(true)}
            className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold shrink-0 transition-all active:scale-[0.97] ${
              isGlass ? "rounded-xl" : "brutal-btn font-mono font-black !bg-brutal-yellow !text-black !border-brutal-yellow"
            }`}
            style={isGlass ? {
              background: "rgba(52,211,153,0.18)",
              border: "1px solid rgba(52,211,153,0.45)",
              color: "#6EE7B7",
              boxShadow: "0 4px 16px rgba(52,211,153,0.20), inset 0 1px 0 rgba(255,255,255,0.10)",
            } : undefined}
          >
            <ListPlus className="w-3.5 h-3.5" />
            Create CineBlock
          </button>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4"
          style={isGlass
            ? { background: "rgba(2,8,23,0.80)", backdropFilter: "blur(8px)" }
            : { background: "rgba(0,0,0,0.70)", backdropFilter: "blur(2px)" }
          }
        >
          <div
            className={`w-full max-w-md space-y-4 ${
              isGlass ? "" : "brutal-card border-2 border-brutal-yellow p-6"
            }`}
            style={isGlass ? {
              background: "rgba(8,15,40,0.96)",
              backdropFilter: "blur(28px) saturate(160%)",
              WebkitBackdropFilter: "blur(28px) saturate(160%)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "20px",
              boxShadow: "0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)",
              overflow: "hidden",
            } : undefined}
          >
            {/* Glass accent bar */}
            {isGlass && (
              <div style={{ height: 3, background: "linear-gradient(90deg, #34D399, #4ADE80)" }} />
            )}

            <div className={isGlass ? "p-6 space-y-4" : "space-y-4"}>
              {doneBlockId ? (
                /* Success state */
                <div className="text-center space-y-3">
                  <CheckCircle2 className={`w-10 h-10 mx-auto ${isGlass ? "text-emerald-400" : "text-brutal-lime"}`} strokeWidth={2} />
                  <p className={`font-bold ${isGlass ? "text-white text-base" : "font-display text-brutal-white uppercase"}`}>
                    {isGlass ? "CineBlock Created!" : "CINEBLOCK CREATED!"}
                  </p>
                  <p className={`text-[10px] ${isGlass ? "text-slate-400" : "font-mono text-brutal-dim"}`}>
                    {selectedMovies.length} movies added
                  </p>
                  <div className="flex gap-2 justify-center pt-1">
                    <Link
                      href="/cineblocks"
                      className={`flex items-center gap-1.5 px-4 py-2 text-[10px] font-bold transition-all active:scale-[0.97] ${
                        isGlass ? "rounded-xl" : "brutal-btn font-mono font-black !bg-brutal-lime !text-black !border-brutal-lime"
                      }`}
                      style={isGlass ? {
                        background: "rgba(52,211,153,0.18)",
                        border: "1px solid rgba(52,211,153,0.45)",
                        color: "#6EE7B7",
                      } : undefined}
                      onClick={handleClose}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View in CineBlocks
                    </Link>
                    <button
                      onClick={() => { handleClose(); onClear(); }}
                      className={`px-4 py-2 text-[10px] font-bold transition-all active:scale-[0.97] ${
                        isGlass ? "rounded-xl" : "brutal-btn font-mono font-black text-brutal-dim"
                      }`}
                      style={isGlass ? { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(148,163,184,0.8)" } : undefined}
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : creating ? (
                /* Progress state */
                <div className="text-center space-y-3">
                  <Loader2 className={`w-8 h-8 animate-spin mx-auto ${isGlass ? "text-emerald-400" : "text-brutal-yellow"}`} />
                  <p className={`text-[11px] font-bold ${isGlass ? "text-white" : "font-mono text-brutal-white uppercase"}`}>
                    {isGlass ? "Adding movies..." : "ADDING MOVIES..."}
                  </p>
                  {progress && (
                    <>
                      <p className={`text-[10px] ${isGlass ? "text-slate-400" : "font-mono text-brutal-dim"}`}>
                        {progress.done} / {progress.total}
                      </p>
                      <div
                        className={`w-full h-1.5 ${isGlass ? "rounded-full overflow-hidden" : "h-2 border-2 border-brutal-border"}`}
                        style={isGlass ? { background: "rgba(255,255,255,0.08)" } : { background: "var(--color-surface-2)" }}
                      >
                        <div
                          className={`h-full transition-all duration-300 ${isGlass ? "rounded-full" : "bg-brutal-yellow"}`}
                          style={isGlass
                            ? { width: `${(progress.done / progress.total) * 100}%`, background: "linear-gradient(90deg, #34D399, #4ADE80)" }
                            : { width: `${(progress.done / progress.total) * 100}%` }
                          }
                        />
                      </div>
                    </>
                  )}
                </div>
              ) : (
                /* Form state */
                <>
                  <div className="flex items-center justify-between">
                    <h2 className={`text-[11px] font-bold tracking-[0.15em] ${isGlass ? "text-white uppercase" : "font-mono font-black text-brutal-yellow uppercase tracking-[0.2em]"}`}>
                      New CineBlock
                    </h2>
                    <button
                      onClick={handleClose}
                      className={`flex items-center justify-center w-7 h-7 transition-colors ${
                        isGlass ? "rounded-lg hover:bg-white/10" : "text-brutal-dim hover:text-brutal-white"
                      }`}
                      style={isGlass ? { border: "1px solid rgba(255,255,255,0.12)", color: "rgba(148,163,184,0.8)" } : undefined}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className={`text-[10px] ${isGlass ? "text-slate-400" : "font-mono text-brutal-dim"}`}>
                    {selected.size} movies selected — saving as a CineBlock
                  </p>

                  <div>
                    <label className={`text-[9px] font-bold uppercase tracking-[0.15em] block mb-1.5 ${isGlass ? "text-slate-400" : "font-mono font-black text-brutal-dim tracking-[0.2em]"}`}>
                      Block Title
                    </label>
                    <input
                      autoFocus
                      type="text"
                      maxLength={60}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") void handleCreate(); }}
                      placeholder="e.g. Best Sci-Fi, Weekend Picks..."
                      className={`w-full px-3 py-2 text-[11px] ${
                        isGlass
                          ? "rounded-xl text-white placeholder:text-slate-500 outline-none"
                          : "bg-surface-2 border-2 border-brutal-border font-mono text-brutal-white placeholder:text-brutal-dim focus:border-brutal-yellow outline-none"
                      }`}
                      style={isGlass ? {
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: "#fff",
                        outline: "none",
                        borderRadius: "10px",
                      } : undefined}
                    />
                    <p className={`text-[9px] mt-1 text-right ${isGlass ? "text-slate-500" : "font-mono text-brutal-dim"}`}>{title.length}/60</p>
                  </div>

                  {/* Movie preview strip */}
                  <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
                    {selectedMovies.slice(0, 10).map((m) => (
                      <div
                        key={m.id}
                        className={`w-10 h-14 shrink-0 overflow-hidden ${
                          isGlass ? "rounded-lg" : "border-2 border-brutal-border bg-surface-2"
                        }`}
                        style={isGlass ? { border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)" } : undefined}
                      >
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
                      <div
                        className={`w-10 h-14 shrink-0 flex items-center justify-center ${
                          isGlass ? "rounded-lg" : "border-2 border-brutal-border bg-surface-2"
                        }`}
                        style={isGlass ? { border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)" } : undefined}
                      >
                        <span className={`text-[9px] font-bold ${isGlass ? "text-slate-400" : "font-mono font-bold text-brutal-dim"}`}>
                          +{selectedMovies.length - 10}
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => void handleCreate()}
                    disabled={!title.trim()}
                    className={`w-full py-3 text-[11px] font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 ${
                      isGlass
                        ? "rounded-xl"
                        : "brutal-btn font-mono font-black !bg-brutal-yellow !text-black !border-brutal-yellow"
                    }`}
                    style={isGlass ? {
                      background: "rgba(52,211,153,0.18)",
                      border: "1px solid rgba(52,211,153,0.45)",
                      color: "#6EE7B7",
                      boxShadow: "0 4px 16px rgba(52,211,153,0.20), inset 0 1px 0 rgba(255,255,255,0.10)",
                    } : undefined}
                  >
                    <ListPlus className="w-4 h-4" />
                    Create with {selected.size} movies
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
