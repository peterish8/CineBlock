"use client";

import { useState, useRef } from "react";
import { WizardState } from "@/lib/tmdbQueryBuilder";
import StepMood from "./StepMood";
import StepTime from "./StepTime";
import StepIntensity from "./StepIntensity";
import StepLanguage from "./StepLanguage";
import StepDealbreakers from "./StepDealbreakers";
import ResultsGrid from "./ResultsGrid";
import { ArrowLeft, ArrowRight, Loader2, Sparkles, X } from "lucide-react";

interface FindMyMovieWizardProps {
  onClose: () => void;
}

export default function FindMyMovieWizard({ onClose }: FindMyMovieWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [rerolling, setRerolling] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<any[] | null>(null);
  const seenIds = useRef<Set<number>>(new Set());

  const [state, setState] = useState<WizardState>({
    mood: "brain-off",
    maxRuntime: 120,
    intensity: "moderate",
    language: "any",
    dealbreakers: [],
  });

  const updateState = (updates: Partial<WizardState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (step < 5) setStep((s) => s + 1);
    else handleSubmit();
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/find-movie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...state, excludeIds: [] }),
      });
      if (!res.ok) throw new Error("Failed to find movies");
      const data = await res.json();
      const movies = data.movies || [];
      movies.forEach((m: any) => seenIds.current.add(m.id));
      setResults(movies);
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
      const res = await fetch("/api/find-movie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...state, excludeIds: [...seenIds.current] }),
      });
      if (!res.ok) throw new Error("Failed to find movies");
      const data = await res.json();
      const movies = data.movies || [];
      movies.forEach((m: any) => seenIds.current.add(m.id));
      setResults(movies);
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

  const progress = (step / 5) * 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-fade-in shadow-brutal-modal-overlay">
      <div className="absolute inset-0 bg-bg/95 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-xl brutal-card bg-bg border-4 wizard-glitch flex flex-col max-h-[90vh] overflow-hidden animate-slide-up">
        {/* Header */}
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

        {/* Content */}
        {results ? (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <ResultsGrid
              movies={results}
              onRetry={resetWizard}
              onReroll={handleReroll}
              rerolling={rerolling}
              onClose={onClose}
            />
          </div>
        ) : loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 py-24">
            <Loader2 className="w-12 h-12 text-brutal-pink animate-spin mb-6" />
            <h3 className="font-display font-bold text-xl uppercase tracking-widest text-brutal-white mb-2 animate-pulse">
              MAGIC HAPPENING...
            </h3>
            <p className="font-mono text-xs text-brutal-muted text-center max-w-xs">
              Consulting the algorithm, brewing the potions, finding your perfect movie.
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

            {step === 1 && <StepMood value={state.mood} onChange={(v) => updateState({ mood: v as any })} />}
            {step === 2 && <StepTime value={state.maxRuntime} onChange={(v) => updateState({ maxRuntime: v as any })} />}
            {step === 3 && <StepIntensity value={state.intensity} onChange={(v) => updateState({ intensity: v as any })} />}
            {step === 4 && <StepLanguage value={state.language} onChange={(v) => updateState({ language: v as any })} />}
            {step === 5 && <StepDealbreakers value={state.dealbreakers} onChange={(v) => updateState({ dealbreakers: v as any })} />}

            {error && (
              <div className="mt-6 p-4 border-l-4 border-brutal-red bg-brutal-red/10 text-brutal-red text-sm font-mono font-bold">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Footer — only during steps */}
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
                step === 5 ? "!bg-brutal-pink !text-black !border-brutal-pink" : ""
              }`}
            >
              {step === 5 ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  FIND MOVIE
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
  );
}
