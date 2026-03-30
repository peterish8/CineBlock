"use client";

import { useState, useRef } from "react";
import { WizardState } from "@/lib/tmdbQueryBuilder";
import StepKeywords from "./StepKeywords";
import StepTime from "./StepTime";
import StepLanguage from "./StepLanguage";
import ResultsGrid from "./ResultsGrid";
import MovieModal from "../MovieModal";
import { ArrowLeft, ArrowRight, Loader2, Sparkles, X } from "lucide-react";
import { useMovieLists } from "@/hooks/useMovieLists";

interface FindMyMovieWizardProps {
  onClose: () => void;
}

const TOTAL_STEPS = 3;
const CURRENT_YEAR = new Date().getFullYear();

export default function FindMyMovieWizard({ onClose }: FindMyMovieWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [rerolling, setRerolling] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<any[] | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<any | null>(null);
  const seenIds = useRef<Set<number>>(new Set());
  const { liked, watchlist, watched } = useMovieLists();

  const [state, setState] = useState<WizardState>({
    keywordId: null,
    languages: ["any"],
    yearFrom: Math.max(1950, CURRENT_YEAR - 15),
    yearTo: CURRENT_YEAR,
  });

  const updateState = (updates: Partial<WizardState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const personalization = {
    likedIds: liked.map((m) => m.id),
    watchlistIds: watchlist.map((m) => m.id),
    watchedIds: watched.map((m) => m.id),
    preferredLanguages: Array.from(
      new Set(
        [...liked, ...watchlist, ...watched]
          .map((m) => m.original_language)
          .filter((lang) => Boolean(lang && lang.trim()))
      )
    ).slice(0, 5),
  };

  const fetchMovies = async (excludeIds: number[]) => {
    const res = await fetch("/api/find-movie", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...state, excludeIds, personalization }),
    });

    if (!res.ok) throw new Error("Failed to find movies");
    const data = await res.json();
    const movies = data.movies || [];
    movies.forEach((m: any) => seenIds.current.add(m.id));
    setResults(movies);
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
    else void handleSubmit();
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      await fetchMovies([]);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReroll = async () => {
    setRerolling(true);
    setError("");
    try {
      await fetchMovies([...seenIds.current]);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setRerolling(false);
    }
  };

  const resetWizard = () => {
    setResults(null);
    setStep(1);
    setError("");
    seenIds.current = new Set();
  };

  const progress = (step / TOTAL_STEPS) * 100;

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-fade-in shadow-brutal-modal-overlay">
        <div className="absolute inset-0 bg-bg/95 backdrop-blur-sm" onClick={onClose} />

        <div className="relative w-full max-w-xl brutal-card bg-bg border-4 wizard-glitch flex flex-col max-h-[90vh] overflow-hidden animate-slide-up">
          <div className="flex items-center justify-between p-4 sm:p-6 border-b-2 border-brutal-border bg-surface shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brutal-pink" />
              <h1 className="font-display font-bold text-lg text-brutal-white uppercase tracking-tight">
                FIND MY MOVIE
              </h1>
            </div>
            <button onClick={onClose} className="p-2 hover:text-brutal-pink transition-colors">
              <X className="w-5 h-5" strokeWidth={3} />
            </button>
          </div>

          {results ? (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <ResultsGrid
                movies={results}
                onRetry={resetWizard}
                onReroll={handleReroll}
                rerolling={rerolling}
                onClose={onClose}
                onMovieClick={(m) => setSelectedMovie(m)}
              />
            </div>
          ) : loading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 py-24">
              <Loader2 className="w-12 h-12 text-brutal-pink animate-spin mb-6" />
              <h3 className="font-display font-bold text-xl uppercase tracking-widest text-brutal-white mb-2 animate-pulse">
                FINDING 5 GREAT PICKS...
              </h3>
              <p className="font-mono text-xs text-brutal-muted text-center max-w-xs">
                Tuning your vibe, language, and timeline preferences.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 sm:pb-6">
              <div className="h-1 bg-surface-2 mb-8">
                <div
                  className="h-full bg-brutal-pink transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {step === 1 && <StepKeywords value={state.keywordId} onChange={(v) => updateState({ keywordId: v })} />}
              {step === 2 && <StepLanguage value={state.languages} onChange={(v) => updateState({ languages: v })} />}
              {step === 3 && (
                <StepTime
                  value={{ from: state.yearFrom, to: state.yearTo }}
                  onChange={(range) => updateState({ yearFrom: range.from, yearTo: range.to })}
                />
              )}

              {error && (
                <div className="mt-6 p-4 border-l-4 border-brutal-red bg-brutal-red/10 text-brutal-red text-sm font-mono font-bold">
                  {error}
                </div>
              )}
            </div>
          )}

          {!results && !loading && (
            <div className="p-4 sm:p-6 border-t-2 border-brutal-border bg-surface shrink-0 flex items-center justify-between">
              <button
                onClick={handleBack}
                disabled={step === 1}
                className="px-4 py-2 font-mono text-sm font-bold uppercase tracking-wider flex items-center gap-2 hover:text-brutal-pink transition-colors disabled:opacity-30 disabled:hover:text-brutal-white"
              >
                <ArrowLeft className="w-4 h-4" />
                BACK
              </button>
              <button
                onClick={handleNext}
                className={`brutal-btn flex items-center gap-2 px-6 py-2.5 font-bold font-mono tracking-widest ${
                  step === TOTAL_STEPS ? "!bg-brutal-pink !text-black !border-brutal-pink" : ""
                }`}
              >
                {step === TOTAL_STEPS ? (
                  <>
                    <Sparkles className="w-4 h-4" />
                    GET 5 MOVIES
                  </>
                ) : (
                  <>
                    NEXT
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {selectedMovie && (
        <MovieModal movie={selectedMovie} onClose={onClose} onBack={() => setSelectedMovie(null)} />
      )}
    </>
  );
}
