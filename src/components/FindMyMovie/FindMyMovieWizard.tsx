"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { WizardState } from "@/lib/tmdbQueryBuilder";
import { TMDBMovie } from "@/lib/types";
import { useMovieLists } from "@/hooks/useMovieLists";
import StepKeywords, { KEYWORD_CHIPS } from "./StepKeywords";
import StepTime from "./StepTime";
import StepLanguage, { languageName } from "./StepLanguage";
import ResultsGrid from "./ResultsGrid";
import MovieModal from "../MovieModal";
import ErrorState from "../ErrorState";

interface FindMyMovieWizardProps {
  onClose: () => void;
}

const STEPS = ["Story", "Language", "Era"] as const;
const CURRENT_YEAR = new Date().getFullYear();

export default function FindMyMovieWizard({ onClose }: FindMyMovieWizardProps) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [rerolling, setRerolling] = useState(false);
  const [failed, setFailed] = useState(false);
  const [results, setResults] = useState<TMDBMovie[] | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<TMDBMovie | null>(null);
  const seenIds = useRef<Set<number>>(new Set());
  const { liked, watchlist, watched } = useMovieLists();
  const reduceMotion = useReducedMotion();

  const [state, setState] = useState<WizardState>({
    keywordId: null,
    languages: ["any"],
    yearFrom: Math.max(1950, CURRENT_YEAR - 15),
    yearTo: CURRENT_YEAR,
  });
  const updateState = (updates: Partial<WizardState>) => setState((prev) => ({ ...prev, ...updates }));

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    if (selectedMovie) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, selectedMovie]);

  const fetchMovies = async (excludeIds: number[]) => {
    const res = await fetch("/api/find-movie", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...state,
        excludeIds,
        personalization: {
          likedIds: liked.map((m) => m.id),
          watchlistIds: watchlist.map((m) => m.id),
          watchedIds: watched.map((m) => m.id),
          preferredLanguages: [...new Set([...liked, ...watchlist, ...watched].map((m) => m.original_language).filter((l) => l?.trim()))].slice(0, 5),
        },
      }),
    });
    if (!res.ok) throw new Error("Failed to find movies");
    const movies = ((await res.json()).movies || []) as TMDBMovie[];
    movies.forEach((m) => seenIds.current.add(m.id));
    setResults(movies);
  };

  const search = async () => {
    setLoading(true);
    setFailed(false);
    try {
      await fetchMovies([]);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  const reroll = async () => {
    setRerolling(true);
    try {
      await fetchMovies([...seenIds.current]);
    } catch {
      setFailed(true);
    } finally {
      setRerolling(false);
    }
  };

  const startOver = () => {
    setResults(null);
    setFailed(false);
    setStep(0);
    seenIds.current = new Set();
  };

  const isLast = step === STEPS.length - 1;
  const keywordLabel = KEYWORD_CHIPS.find((chip) => chip.id === state.keywordId)?.label ?? "Any story";
  const languageLabel = state.languages.includes("any") ? "Any language" : state.languages.map(languageName).join(", ");
  const summary = `${keywordLabel} · ${languageLabel} · ${state.yearFrom}–${state.yearTo}`;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0"
          style={{ background: "rgba(2,8,23,0.6)", backdropFilter: "blur(10px) saturate(120%)", WebkitBackdropFilter: "blur(10px) saturate(120%)" }}
          onClick={onClose}
          aria-hidden="true"
        />

        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="find-movie-title"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: 6 }}
          transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
          className="relative flex h-[min(620px,88vh)] w-full max-w-3xl flex-col overflow-hidden rounded-3xl"
          style={{ background: "rgba(6,12,32,0.97)", border: "1px solid rgba(255,255,255,0.10)", boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }}
        >
          {/* Header */}
          <div className="flex shrink-0 items-start justify-between gap-4 px-5 pb-4 pt-5 sm:px-8 sm:pt-7">
            <div>
              <h1 id="find-movie-title" className="font-display !text-xl font-semibold tracking-tight text-white sm:!text-2xl">Find a movie</h1>
              <p className="mt-0.5 text-sm text-slate-400">
                {results ? summary : loading ? "Looking through thousands of films…" : `Step ${step + 1} of ${STEPS.length} · everything is optional`}
              </p>
            </div>
            <button type="button" onClick={onClose} aria-label="Close" className="-mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors duration-150 hover:bg-white/10 hover:text-white">
              <X className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>

          {results ? (
            <ResultsGrid movies={results} onStartOver={startOver} onReroll={reroll} rerolling={rerolling} onMovieClick={setSelectedMovie} />
          ) : loading ? (
            <div className="grid flex-1 grid-cols-2 content-center gap-4 px-5 pb-8 sm:grid-cols-3 sm:px-8 md:grid-cols-5" role="status" aria-label="Finding movies">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i}>
                  <div className="aspect-[2/3] animate-pulse rounded-xl bg-white/[0.06]" />
                  <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-white/[0.06]" />
                </div>
              ))}
            </div>
          ) : failed ? (
            <ErrorState
              title="The reel snapped"
              message="We couldn't reach the movie database. Your picks are saved, so just try again."
              onRetry={() => void search()}
              className="px-6"
            />
          ) : (
            <>
              {/* Step tabs double as progress */}
              <div className="flex shrink-0 gap-2 px-5 sm:px-8" role="tablist" aria-label="Steps">
                {STEPS.map((label, i) => (
                  <button
                    key={label}
                    type="button"
                    role="tab"
                    aria-selected={i === step}
                    onClick={() => setStep(i)}
                    className="group flex-1 text-left"
                  >
                    <span className={`block h-1 rounded-full transition-colors duration-200 ${i <= step ? "bg-blue-400" : "bg-white/10 group-hover:bg-white/20"}`} />
                    <span className={`mt-2 block text-xs font-medium transition-colors duration-150 ${i === step ? "text-white" : "text-slate-500 group-hover:text-slate-300"}`}>{label}</span>
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-8">
                {step === 0 && <StepKeywords value={state.keywordId} onChange={(v) => updateState({ keywordId: v })} />}
                {step === 1 && <StepLanguage value={state.languages} onChange={(v) => updateState({ languages: v })} />}
                {step === 2 && (
                  <StepTime value={{ from: state.yearFrom, to: state.yearTo }} onChange={(r) => updateState({ yearFrom: r.from, yearTo: r.to })} />
                )}
              </div>

              <div className="flex shrink-0 items-center justify-between gap-3 border-t border-white/[0.08] px-5 py-4 sm:px-8">
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className={`flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-slate-400 transition-colors duration-150 hover:bg-white/[0.06] hover:text-white ${step === 0 ? "invisible" : ""}`}
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={() => (isLast ? void search() : setStep((s) => s + 1))}
                  className="flex min-h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold text-white transition-[transform,background-color] duration-150 hover:bg-blue-400/30 active:scale-[0.97]"
                  style={{ background: "rgba(96,165,250,0.22)", border: "1px solid rgba(96,165,250,0.5)" }}
                >
                  {isLast ? "Show 5 movies" : "Next"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>

      {selectedMovie && <MovieModal movie={selectedMovie} onClose={onClose} onBack={() => setSelectedMovie(null)} />}
    </>,
    document.body,
  );
}
