"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, ChevronLeft, LayoutGrid, LayoutList, Lock, Sparkles, Filter, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRadar } from "@/hooks/useRadar";
import ReleaseTimeline from "@/components/ReleaseTimeline";
import MovieModal from "@/components/MovieModal";
import { TMDBMovie } from "@/lib/types";

export default function RadarPage() {
  const { movies, loading, error, isPersonalized } = useRadar();
  const [selectedMovie, setSelectedMovie] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "personalized">("all");

  const handleMovieClick = useCallback((item: any) => {
    if (item.media_type === "tv") {
      const asMovie = {
        ...item,
        title: item.title || item.name,
        release_date: item.release_date || item.first_air_date,
        media_type: "tv" as const
      };
      setSelectedMovie(asMovie);
    } else {
      setSelectedMovie({ ...item, media_type: "movie" as const });
    }
  }, []);

  const filteredMovies = activeTab === "personalized" 
    ? movies.filter(m => true) // In our API, movies are already merged. We could re-filter if we had flags.
    : movies;

  if (error) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-8">
        <div className="max-w-md w-full border-4 border-brutal-red bg-surface p-8 brutal-shadow text-center">
            <AlertCircle className="w-12 h-12 text-brutal-red mx-auto mb-4" />
            <h2 className="font-display font-black uppercase text-2xl mb-2 text-text italic">RADAR DOWN</h2>
            <p className="font-mono text-sm text-brutal-dim mb-6 tracking-widest uppercase">UPSTREAM TMDB FAILURE</p>
            <button 
                onClick={() => window.location.reload()}
                className="brutal-btn px-6 py-3 bg-brutal-red text-black font-bold uppercase tracking-wider text-sm"
            >
                RETRY CONNECTION
            </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-bg pt-20 md:pt-24 pb-20">
      {/* Header Section */}
      <div className="max-w-[1400px] mx-auto px-4 mb-10 md:mb-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
             <Link href="/" className="inline-flex items-center gap-2 font-mono text-[10px] uppercase font-bold text-brutal-dim hover:text-brutal-cyan transition-colors">
               <ChevronLeft className="w-3.5 h-3.5" />
               BACK TO MISSION CONTROL
             </Link>
             <div className="flex flex-col gap-2">
                <div className="flex items-center gap-4">
                   <h1 className="font-display text-5xl md:text-7xl font-black uppercase tracking-tighter text-text leading-[0.8] italic">
                     RELEASE <span className="text-brutal-cyan">RADAR</span>
                   </h1>
                   <div className="relative group">
                     <div className="w-3 h-3 bg-brutal-cyan rounded-full animate-ping absolute top-0 left-0" />
                     <div className="w-3 h-3 bg-brutal-cyan rounded-full relative z-10" />
                   </div>
                </div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-brutal-dim max-w-xl">
                  SCANNING THE HORIZON FOR UPCOMING CINEMATIC DROPS — TRACKING SEQUELS & GENRE SURGES.
                </p>
             </div>
          </div>

          {/* Tab Filter */}
          <div className="flex bg-surface border-4 border-brutal-border p-1.5 brutal-shadow">
             <button 
               onClick={() => setActiveTab("all")}
               className={`flex items-center gap-2 px-4 py-2 font-mono text-[10px] font-black uppercase transition-all ${activeTab === "all" ? "bg-text text-black" : "text-brutal-dim hover:text-text"}`}
             >
               <LayoutGrid className="w-3.5 h-3.5" />
               ALL UPCOMING
             </button>
             <button 
               onClick={() => setActiveTab("personalized")}
               className={`flex items-center gap-2 px-4 py-2 font-mono text-[10px] font-black uppercase transition-all ${activeTab === "personalized" ? "bg-brutal-cyan text-black" : "text-brutal-dim hover:text-text"}`}
             >
               {isPersonalized ? <Sparkles className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
               MY RADAR
             </button>
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
                   className="w-24 h-24 border-8 border-brutal-border border-t-brutal-cyan rounded-full border-dashed"
                 />
                 <div className="absolute inset-0 flex items-center justify-center">
                    <Radio className="w-10 h-10 text-brutal-cyan animate-pulse" />
                 </div>
              </div>
              <h2 className="font-display text-4xl md:text-7xl font-black uppercase text-text italic mb-4 tracking-tighter leading-none">
                INITIATING <span className="text-brutal-cyan">SCAN</span>
              </h2>
              <div className="flex flex-col gap-1">
                 <p className="font-mono text-[10px] uppercase font-bold tracking-[0.5em] text-brutal-dim animate-pulse">
                   SYNCHRONIZING WITH SECTOR 7G...
                 </p>
                 <div className="h-1 w-48 bg-brutal-border mx-auto relative overflow-hidden">
                    <motion.div 
                      animate={{ x: [-200, 200] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute inset-0 w-1/2 bg-brutal-cyan"
                    />
                 </div>
              </div>
           </div>
         ) : (
             <ReleaseTimeline movies={filteredMovies} onMovieClick={handleMovieClick} />
         )}
      </div>

      {/* Movie Modal Integration */}
      <AnimatePresence>
        {selectedMovie && (
          <MovieModal
            movie={selectedMovie}
            onClose={() => setSelectedMovie(null)}
          />
        )}
      </AnimatePresence>

      {/* Floating CTA for unpersonalized users */}
      {!isPersonalized && !loading && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 w-full max-w-xs md:max-w-md px-4">
           <motion.div 
             initial={{ y: 100 }}
             animate={{ y: 0 }}
             className="bg-bg border-4 border-brutal-yellow p-4 shadow-[8px_8px_0px_0px_rgba(255,225,86,1)] flex items-center justify-between gap-4"
           >
              <div className="flex items-center gap-3">
                 <Sparkles className="w-6 h-6 text-brutal-yellow" />
                 <p className="font-display font-black text-xs uppercase tracking-tight text-white italic">
                   RADAR IS GENERIC — <span className="text-brutal-yellow underline">SIGN IN</span> & <span className="text-brutal-yellow underline">LIKE FILMS</span> TO PERSONALIZED THE SCAN.
                 </p>
              </div>
           </motion.div>
        </div>
      )}
    </main>
  );
}
