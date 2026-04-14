"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { WizardState } from "@/lib/tmdbQueryBuilder";
import StepKeywords from "./StepKeywords";
import StepTime from "./StepTime";
import StepLanguage from "./StepLanguage";
import ResultsGrid from "./ResultsGrid";
import MovieModal from "../MovieModal";
import { ArrowLeft, ArrowRight, Loader2, Sparkles, X } from "lucide-react";
import { motion } from "framer-motion";
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
  const [isGlass, setIsGlass] = useState(false);
  const seenIds = useRef<Set<number>>(new Set());
  const { liked, watchlist, watched } = useMovieLists();

  useEffect(() => {
    setIsGlass(document.body.classList.contains("theme-glass"));
    const observer = new MutationObserver(() =>
      setIsGlass(document.body.classList.contains("theme-glass"))
    );
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // Lock background scroll while wizard is mounted
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

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

  return createPortal(
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">

        {/* ── Layer 1: Full-screen blur + dim overlay ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0"
          style={{
            backdropFilter: "blur(20px) saturate(140%)",
            WebkitBackdropFilter: "blur(20px) saturate(140%)",
            background: "rgba(2, 5, 18, 0.88)",
          }}
          onClick={onClose}
        />

        {/* ── Layer 2: The modal card ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-xl flex flex-col max-h-[90vh] overflow-hidden"
          style={{
            zIndex: 2,
            borderRadius: isGlass ? "22px" : "4px",
            background: isGlass
              ? "linear-gradient(160deg, rgba(8,14,36,0.88) 0%, rgba(6,11,30,0.92) 100%)"
              : "var(--color-bg)",
            border: isGlass
              ? "1px solid rgba(255,255,255,0.10)"
              : "4px solid var(--color-brutal-border)",
            boxShadow: isGlass
              ? [
                  "0 0 0 1px rgba(255,255,255,0.05)",
                  "inset 0 1px 0 rgba(255,255,255,0.07)",
                  "0 8px 32px rgba(0,0,0,0.7)",
                  "0 32px 80px rgba(0,0,0,0.55)",
                ].join(", ")
              : "8px 8px 0px 0px rgba(0,0,0,1)",
            backdropFilter: isGlass ? "blur(12px)" : "none",
            WebkitBackdropFilter: isGlass ? "blur(12px)" : "none",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 shrink-0" style={isGlass ? {
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            background: "rgba(255,255,255,0.025)",
          } : {
            borderBottom: "2px solid var(--color-brutal-border)",
            background: "var(--color-surface)",
          }}>
            <div className="flex items-center gap-2.5">
              <div className={isGlass ? "p-1.5 rounded-lg" : ""} style={isGlass ? { background: "rgba(236,72,153,0.15)" } : undefined}>
                <Sparkles className={`w-5 h-5 ${isGlass ? "text-pink-400" : "text-brutal-pink"}`} strokeWidth={isGlass ? 1.5 : 2.5} />
              </div>
              <h1 className={isGlass
                ? "font-display font-bold text-lg text-white tracking-tight"
                : "font-display font-bold text-lg text-brutal-white uppercase tracking-tight"
              }>
                {isGlass ? "Find My Movie" : "FIND MY MOVIE"}
              </h1>
            </div>
            <button onClick={onClose} className={isGlass
              ? "p-2 rounded-full text-white/40 hover:text-white hover:bg-white/8 transition-all"
              : "p-2 hover:text-brutal-pink transition-colors text-brutal-white"
            }>
              <X className="w-5 h-5" strokeWidth={isGlass ? 1.5 : 3} />
            </button>
          </div>


          {results ? (
            <div className="flex-1 overflow-hidden flex flex-col">
              <ResultsGrid
                movies={results}
                onRetry={resetWizard}
                onReroll={handleReroll}
                rerolling={rerolling}
                onClose={onClose}
                onMovieClick={(m) => setSelectedMovie(m)}
                isGlass={isGlass}
              />
            </div>
          ) : loading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 py-24 gap-6">
              {isGlass ? (
                <>
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full bg-pink-500/15 blur-2xl animate-pulse" />
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 rounded-full border-2 border-dashed border-pink-400/30"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="w-7 h-7 text-pink-400 animate-pulse" strokeWidth={1.5} />
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-white font-display font-medium text-lg tracking-tight">Finding your 5 picks...</p>
                    <div className="h-0.5 w-40 rounded-full overflow-hidden bg-white/10">
                      <motion.div
                        animate={{ x: ["-100%", "200%"] }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                        className="h-full w-1/2 bg-gradient-to-r from-pink-400 to-blue-400 rounded-full"
                      />
                    </div>
                    <p className="text-slate-500 text-xs">Tuning vibe, language and timeline...</p>
                  </div>
                </>
              ) : (
                <>
                  <Loader2 className="w-12 h-12 text-brutal-pink animate-spin" />
                  <h3 className="font-display font-bold text-xl uppercase tracking-widest text-brutal-white animate-pulse">
                    FINDING 5 GREAT PICKS...
                  </h3>
                  <p className="font-mono text-xs text-brutal-muted text-center max-w-xs">
                    Tuning your vibe, language, and timeline preferences.
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 sm:pb-6">
              {/* Progress bar */}
              <div className={`h-1 mb-8 rounded-full overflow-hidden ${isGlass ? "bg-white/8" : "bg-surface-2"}`}>
                <div
                  className={`h-full transition-all duration-300 ease-out rounded-full ${isGlass ? "bg-gradient-to-r from-pink-500 to-blue-500" : "bg-brutal-pink"}`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              {step === 1 && <StepKeywords value={state.keywordId} onChange={(v) => updateState({ keywordId: v })} isGlass={isGlass} />}
              {step === 2 && <StepLanguage value={state.languages} onChange={(v) => updateState({ languages: v })} isGlass={isGlass} />}
              {step === 3 && (
                <StepTime
                  value={{ from: state.yearFrom, to: state.yearTo }}
                  onChange={(range) => updateState({ yearFrom: range.from, yearTo: range.to })}
                  isGlass={isGlass}
                />
              )}

              {error && (
                <div className={`mt-6 p-4 text-sm font-semibold ${
                  isGlass
                    ? "rounded-xl border border-red-500/30 bg-red-500/10 text-red-300"
                    : "border-l-4 border-brutal-red bg-brutal-red/10 text-brutal-red font-mono font-bold"
                }`}>
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Footer nav */}
          {!results && !loading && (
            <div className="p-4 sm:p-5 shrink-0 flex items-center justify-between" style={isGlass ? {
              borderTop: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.03)",
            } : {
              borderTop: "2px solid var(--color-brutal-border)",
              background: "var(--color-surface)",
            }}>
              <button
                onClick={handleBack}
                disabled={step === 1}
                className={`flex items-center gap-2 px-4 py-2 font-semibold text-sm uppercase tracking-wide transition-all disabled:opacity-30 ${
                  isGlass
                    ? "text-slate-400 hover:text-white rounded-2xl hover:bg-white/6 disabled:hover:bg-transparent font-medium tracking-[0.02em]"
                    : "font-mono font-bold hover:text-brutal-pink text-brutal-white disabled:hover:text-brutal-white"
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={handleNext}
                className={`flex items-center gap-2 px-5 py-2.5 font-semibold text-sm tracking-wide transition-all ${
                  isGlass
                    ? step === TOTAL_STEPS
                      ? "rounded-2xl text-white hover:brightness-110 shadow-[0_18px_44px_rgba(15,23,42,0.42)]"
                      : "rounded-2xl bg-white/6 border border-white/10 text-white hover:bg-white/10"
                    : step === TOTAL_STEPS
                      ? "brutal-btn !bg-brutal-pink !text-black !border-brutal-pink font-mono font-bold tracking-widest"
                      : "brutal-btn font-mono font-bold tracking-widest"
                }`}
                style={isGlass && step === TOTAL_STEPS ? {
                  background: "linear-gradient(135deg, rgba(99,102,241,0.72), rgba(59,130,246,0.64) 52%, rgba(16,185,129,0.52))",
                  border: "1px solid rgba(255,255,255,0.14)",
                  backdropFilter: "blur(18px)",
                  WebkitBackdropFilter: "blur(18px)",
                } : undefined}
              >
                {step === TOTAL_STEPS ? (
                  <><Sparkles className="w-4 h-4" /> {isGlass ? "Get 5 Movies" : "GET 5 MOVIES"}</>
                ) : (
                  <>{isGlass ? "Next" : "NEXT"} <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {selectedMovie && (
        <MovieModal movie={selectedMovie} onClose={onClose} onBack={() => setSelectedMovie(null)} />
      )}
    </>,
    document.body
  );
}
