"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Film, Radar } from "lucide-react";
import { useRadar } from "@/hooks/useRadar";
import { posterUrl } from "@/lib/constants";
import RadarSkeleton from "./RadarSkeleton";
import ErrorState from "./ErrorState";
import { RadarMovie } from "@/lib/types";
import { useFranchiseBadges } from "@/hooks/useFranchiseBadges";
import FranchiseRibbon from "@/components/FranchiseRibbon";

interface RadarShelfProps {
  onMovieClick: (movie: RadarMovie) => void;
}

export default function RadarShelf({ onMovieClick }: RadarShelfProps) {
  const { movies, loading, error, isPersonalized } = useRadar();
  const franchiseBadges = useFranchiseBadges();

  if (loading) {
    return (
      <section className="py-8 border-b-4 border-brutal-border bg-bg/50">
        <div className="flex items-center justify-between px-4 mb-6">
          <div className="flex items-center gap-3 border-l-4 border-brutal-cyan pl-3">
            <h2 className="flex items-center gap-2 font-display text-xl font-black uppercase tracking-wider text-text italic">
              YOUR RADAR <Radar className="w-4 h-4 not-italic" strokeWidth={2.5} />
            </h2>
          </div>
        </div>
        <RadarSkeleton />
      </section>
    );
  }

  if (error) {
    return (
      <section className="px-4 py-8">
        <ErrorState
          icon={Radar}
          title="Release Radar went quiet"
          message="We couldn't load upcoming releases. Check your connection and try again."
          onRetry={() => window.location.reload()}
        />
      </section>
    );
  }

  const displayMovies = movies.slice(0, 8);

  if (displayMovies.length === 0) {
    return (
      <section className="px-4 py-8">
        <ErrorState icon={Radar} title="Nothing on the radar yet" message="Like a few films and upcoming releases you'd enjoy will show up here." />
      </section>
    );
  }

  return (
    <section className="py-8 border-b-4 border-brutal-border bg-bg/50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3 border-l-4 border-brutal-cyan pl-3">
            <h2 className="flex items-center gap-2 font-display text-xl font-black uppercase tracking-wider text-text italic">
              YOUR RADAR <Radar className="w-4 h-4 not-italic" strokeWidth={2.5} />
            </h2>
            <div className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-tighter ${
              isPersonalized ? "bg-brutal-cyan text-black" : "bg-surface border-2 border-brutal-border text-brutal-dim"
            }`}>
              {isPersonalized ? "PERSONALIZED" : "UPCOMING"}
            </div>
          </div>
          {!isPersonalized && (
             <p className="font-mono text-[9px] uppercase text-brutal-dim tracking-widest pl-4">
               LIKE MORE FILMS TO PERSONALIZE
             </p>
          )}
        </div>

        <Link 
          href="/radar" 
          className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase text-brutal-dim hover:text-text transition-colors group"
        >
          FULL TIMELINE
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Horizontal Shelf */}
      <div className="flex gap-4 overflow-x-auto px-4 pb-4 no-scrollbar">
        {displayMovies.map((movie, idx) => {
           const today = new Date().toISOString().split('T')[0];
           const isUpcoming = movie.release_date >= today;
           const releaseDate = new Date(movie.release_date);
           const monthShort = releaseDate.toLocaleString('default', { month: 'short' }).toUpperCase();
           const day = releaseDate.getDate();

           return (
             <motion.div
               key={movie.id}
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.4, delay: idx * 0.05 }}
               viewport={{ once: true }}
               whileHover={{ y: -4, boxShadow: "6px 6px 0px 0px #3A3A3A" }}
               className="min-w-[160px] max-w-[160px] cursor-pointer group"
               onClick={() => onMovieClick({ ...movie, media_type: "movie" })}
             >
               {/* Poster Card */}
               <div className="relative aspect-[2/3] border-4 border-brutal-border bg-surface brutal-shadow mb-3 overflow-hidden group-hover:border-brutal-cyan transition-colors">
                 {movie.poster_path ? (
                   <Image
                     src={posterUrl(movie.poster_path, "medium")}
                     alt={movie.title}
                     fill
                     className="object-cover group-hover:scale-105 transition-transform duration-500"
                     sizes="160px"
                     loading="lazy"
                   />
                 ) : (
                   <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                     <Film className="w-8 h-8 text-brutal-dim mb-2" />
                     <span className="font-mono text-[9px] uppercase text-brutal-dim leading-tight">No Poster</span>
                   </div>
                 )}

                 {/* Franchise Ribbon */}
                 <FranchiseRibbon badge={franchiseBadges.get(movie.id)} variant="corner" />

                 {/* Pre-release marker (Only if truly upcoming) */}
                 {isUpcoming && (
                   <div className="absolute top-2 left-2 flex flex-col items-center justify-center min-w-[36px] bg-black border-2 border-brutal-yellow p-1">
                     <span className="font-display font-black text-xs text-brutal-yellow leading-none">{day}</span>
                     <span className="font-mono font-bold text-[8px] text-brutal-yellow leading-none">{monthShort}</span>
                   </div>
                 )}
               </div>

               {/* Title & Info */}
               <div className="px-1">
                 <h3 className="font-outfit text-sm font-bold uppercase tracking-tight text-text leading-tight line-clamp-1 mb-1">
                   {movie.title}
                 </h3>
                 <div className="flex items-center gap-1.5">
                   {isUpcoming && (
                     <div className="px-1.5 py-0.5 bg-surface text-brutal-yellow border border-brutal-yellow text-[8px] font-bold uppercase tracking-tighter">
                       PRE-RELEASE
                     </div>
                   )}
                 </div>
               </div>
             </motion.div>
           );
        })}
      </div>
    </section>
  );
}
