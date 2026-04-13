"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, ChevronLeft, AlertCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRadar } from "@/hooks/useRadar";
import ReleaseTimeline from "@/components/ReleaseTimeline";
import MovieModal from "@/components/MovieModal";

export default function RadarPage() {
  const { movies, loading, error, isPersonalized } = useRadar();
  const [selectedMovie, setSelectedMovie] = useState<any | null>(null);
  const [isGlass, setIsGlass] = useState(false);

  useEffect(() => {
    setIsGlass(document.body.classList.contains("theme-glass"));
    const observer = new MutationObserver(() =>
      setIsGlass(document.body.classList.contains("theme-glass"))
    );
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const handleMovieClick = useCallback((item: any) => {
    if (item.media_type === "tv") {
      setSelectedMovie({ ...item, title: item.title || item.name, release_date: item.release_date || item.first_air_date, media_type: "tv" as const });
    } else {
      setSelectedMovie({ ...item, media_type: "movie" as const });
    }
  }, []);

  if (error) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-8 ${isGlass ? "bg-transparent" : "bg-bg"}`}>
        <div className={isGlass
          ? "max-w-md w-full rounded-2xl p-8 text-center border border-red-500/30 backdrop-blur-xl"
          : "max-w-md w-full border-4 border-brutal-red bg-surface p-8 brutal-shadow text-center"
        } style={isGlass ? { background: "rgba(30,5,5,0.7)" } : undefined}>
          <AlertCircle className={`w-12 h-12 mx-auto mb-4 ${isGlass ? "text-red-400" : "text-brutal-red"}`} />
          <h2 className={`font-display font-black uppercase text-2xl mb-2 ${isGlass ? "text-white tracking-tight" : "text-text italic"}`}>RADAR DOWN</h2>
          <p className={`text-sm mb-6 tracking-widest uppercase ${isGlass ? "text-slate-400 font-sans" : "font-mono text-brutal-dim"}`}>UPSTREAM TMDB FAILURE</p>
          <button onClick={() => window.location.reload()}
            className={isGlass
              ? "px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-sm bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 transition-all"
              : "brutal-btn px-6 py-3 bg-brutal-red text-black font-bold uppercase tracking-wider text-sm"
            }>
            RETRY CONNECTION
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className={`min-h-screen pt-20 md:pt-24 pb-20 ${isGlass ? "bg-transparent" : "bg-bg"}`}>
      {/* Header Section */}
      <div className="max-w-[1400px] mx-auto px-4 mb-10 md:mb-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <Link href="/" className={`inline-flex items-center gap-2 text-[10px] uppercase font-bold transition-colors ${isGlass ? "font-sans text-slate-500 hover:text-blue-300" : "font-mono text-brutal-dim hover:text-brutal-cyan"}`}>
              <ChevronLeft className="w-3.5 h-3.5" />
              {isGlass ? "Back" : "BACK TO MISSION CONTROL"}
            </Link>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-4">
                <h1 className={`font-display font-black uppercase tracking-tighter leading-[0.85] ${isGlass ? "text-4xl md:text-6xl text-white" : "text-5xl md:text-7xl text-text italic"}`}>
                  RELEASE{" "}
                  <span className={isGlass ? "text-blue-400" : "text-brutal-cyan"}>RADAR</span>
                </h1>
                {/* Live dot */}
                <div className="relative mt-1">
                  <div className={`w-3 h-3 rounded-full animate-ping absolute top-0 left-0 ${isGlass ? "bg-blue-400" : "bg-brutal-cyan"}`} />
                  <div className={`w-3 h-3 rounded-full relative z-10 ${isGlass ? "bg-blue-400" : "bg-brutal-cyan"}`} />
                </div>
              </div>
              <p className={`text-xs uppercase tracking-[0.18em] max-w-xl ${isGlass ? "font-sans text-slate-500" : "font-mono text-brutal-dim tracking-[0.2em]"}`}>
                {isGlass
                  ? "Tracking upcoming cinematic drops, sequels & genre surges"
                  : "SCANNING THE HORIZON FOR UPCOMING CINEMATIC DROPS — TRACKING SEQUELS & GENRE SURGES."}
              </p>
            </div>
          </div>

          {/* "ALL UPCOMING" chip — MY RADAR tab removed (was a no-op stub) */}
          <div className={isGlass
            ? "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-display font-medium border"
            : "flex items-center gap-2 px-4 py-2 border-4 border-brutal-border bg-surface"
          } style={isGlass ? { background: "rgba(96,165,250,0.10)", borderColor: "rgba(96,165,250,0.25)", color: "#93C5FD" } : undefined}>
            <Radio className="w-3.5 h-3.5" strokeWidth={2.5} />
            <span className={isGlass ? "text-xs" : "font-mono text-[10px] font-black uppercase text-brutal-white"}>
              ALL UPCOMING
            </span>
          </div>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[500px] text-center px-4">
            <div className="relative mb-10">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className={`w-24 h-24 rounded-full border-8 border-dashed ${isGlass ? "border-white/10 border-t-blue-400" : "border-brutal-border border-t-brutal-cyan"}`}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Radio className={`w-10 h-10 animate-pulse ${isGlass ? "text-blue-400" : "text-brutal-cyan"}`} />
              </div>
              {isGlass && (
                <div className="absolute inset-0 rounded-full bg-blue-400/10 blur-xl animate-pulse" />
              )}
            </div>
            <h2 className={`font-display font-black uppercase mb-4 tracking-tighter leading-none ${isGlass ? "text-3xl md:text-5xl text-white" : "text-4xl md:text-7xl text-text italic"}`}>
              INITIATING <span className={isGlass ? "text-blue-400" : "text-brutal-cyan"}>SCAN</span>
            </h2>
            <div className="flex flex-col gap-2 items-center">
              <p className={`text-[10px] uppercase font-bold tracking-[0.5em] animate-pulse ${isGlass ? "font-sans text-slate-500" : "font-mono text-brutal-dim"}`}>
                SYNCHRONIZING WITH SECTOR 7G...
              </p>
              <div className={`h-1 w-48 mx-auto relative overflow-hidden rounded-full ${isGlass ? "bg-white/10" : "bg-brutal-border"}`}>
                <motion.div
                  animate={{ x: [-200, 200] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className={`absolute inset-0 w-1/2 rounded-full ${isGlass ? "bg-blue-400" : "bg-brutal-cyan"}`}
                />
              </div>
            </div>
          </div>
        ) : (
          <ReleaseTimeline movies={movies} onMovieClick={handleMovieClick} />
        )}
      </div>

      {/* Movie Modal */}
      <AnimatePresence>
        {selectedMovie && (
          <MovieModal movie={selectedMovie} onClose={() => setSelectedMovie(null)} />
        )}
      </AnimatePresence>

      {/* Floating CTA for unpersonalized users */}
      {!isPersonalized && !loading && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 w-full max-w-xs md:max-w-md px-4">
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={isGlass
              ? "rounded-2xl p-4 flex items-center gap-3 border backdrop-blur-xl"
              : "bg-bg border-4 border-brutal-yellow p-4 shadow-[8px_8px_0px_0px_rgba(255,225,86,1)] flex items-center gap-4"
            }
            style={isGlass ? { background: "rgba(8,14,36,0.85)", borderColor: "rgba(96,165,250,0.35)" } : undefined}
          >
            <Sparkles className={`w-5 h-5 shrink-0 ${isGlass ? "text-blue-400" : "text-brutal-yellow"}`} />
            <p className={`text-xs leading-relaxed ${isGlass ? "font-sans text-slate-300" : "font-display font-black uppercase tracking-tight text-white italic"}`}>
              {isGlass
                ? "Sign in & like films to personalize your radar."
                : <>RADAR IS GENERIC — <span className="text-brutal-yellow underline">SIGN IN</span> & <span className="text-brutal-yellow underline">LIKE FILMS</span> TO PERSONALIZE THE SCAN.</>
              }
            </p>
          </motion.div>
        </div>
      )}
    </main>
  );
}
