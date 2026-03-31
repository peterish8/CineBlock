"use client";

import { useEffect, useRef, useMemo } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";
import { Film, Calendar } from "lucide-react";
import { RadarMovie } from "@/lib/types";
import { posterUrl } from "@/lib/constants";
import { FRANCHISE_MAP } from "@/lib/franchises";

interface ReleaseTimelineProps {
  movies: RadarMovie[];
  onMovieClick: (movie: any) => void;
}

export default function ReleaseTimeline({ movies, onMovieClick }: ReleaseTimelineProps) {
  const desktopContainerRef = useRef<HTMLDivElement>(null);

  // Group movies by Month/Year
  const groups = useMemo(() => {
    const map = new Map<string, { label: string; date: Date; movies: RadarMovie[] }>();

    movies.forEach((m) => {
      const d = new Date(m.release_date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const label = d.toLocaleString("default", { month: "short", year: "numeric" }).toUpperCase();
      
      if (!map.has(key)) {
        map.set(key, { label, date: d, movies: [] });
      }
      map.get(key)!.movies.push(m);
    });

    return Array.from(map.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [movies]);

  // Robust "Grab to Scroll" logic for Desktop
  useEffect(() => {
    const slider = desktopContainerRef.current;
    if (!slider) return;

    let isDown = false;
    let startX: number;
    let scrollLeft: number;

    const handleMouseDown = (e: MouseEvent) => {
      isDown = true;
      slider.classList.add('active');
      startX = e.pageX - slider.offsetLeft;
      scrollLeft = slider.scrollLeft;
    };

    const handleMouseLeave = () => {
      isDown = false;
      slider.classList.remove('active');
    };

    const handleMouseUp = () => {
      isDown = false;
      slider.classList.remove('active');
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - slider.offsetLeft;
      const walk = (x - startX) * 2; // Scroll speed multiplier
      slider.scrollLeft = scrollLeft - walk;
    };

    slider.addEventListener('mousedown', handleMouseDown);
    slider.addEventListener('mouseleave', handleMouseLeave);
    slider.addEventListener('mouseup', handleMouseUp);
    slider.addEventListener('mousemove', handleMouseMove);

    return () => {
      slider.removeEventListener('mousedown', handleMouseDown);
      slider.removeEventListener('mouseleave', handleMouseLeave);
      slider.removeEventListener('mouseup', handleMouseUp);
      slider.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="w-full select-none cursor-grab active:cursor-grabbing overflow-hidden">
      {/* ── DESKTOP TIMELINE (Horizontal) ── */}
      <div 
        ref={desktopContainerRef}
        className="hidden md:flex flex-col relative w-full overflow-x-auto min-h-[600px] pt-24 pb-60 no-scrollbar select-none scroll-smooth active:cursor-grabbing"
      >
        {/* The central Axis line — thicker and more prominent */}
        <div className="absolute top-[130px] left-0 right-0 h-[4px] bg-brutal-border/40 z-0" />

        <div className="flex px-[15%] gap-8 items-start relative z-10 w-max min-w-full">
          {groups.map((group, groupIdx) => (
            <div key={group.label} className="flex gap-6 items-start">
              {group.movies.map((movie, movieIdx) => {
                const date = new Date(movie.release_date);
                const day = date.getDate().toString().padStart(2, '0');
                const month = date.toLocaleString('default', { month: 'short' }).toUpperCase();
                const year = date.getFullYear();

                const today = new Date().toISOString().split('T')[0];
                const isUpcoming = movie.release_date >= today;

                return (
                  <div key={movie.id} className="relative flex flex-col items-center">
                    {/* Month/Year Label (only on first movie of group) */}
                    {movieIdx === 0 && (
                      <div className="absolute -top-[90px] left-0 pointer-events-none">
                        <div className="flex flex-col">
                          <span className="font-mono text-[11px] font-black text-brutal-cyan tracking-[0.4em] mb-1">
                            {year}
                          </span>
                          <span className="font-display text-4xl font-black text-white uppercase tracking-tighter bg-bg pr-6">
                            {group.label.split(' ')[0]}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Day Marker / Tick — Positioned relative to the axis at 130px */}
                    <div className="absolute top-[34px] flex flex-col items-center z-20 pointer-events-none">
                       {/* Glowing Dot */}
                       <div className="relative mb-2">
                          <div className="w-3 h-3 bg-brutal-cyan border-2 border-black shadow-[0_0_12px_rgba(34,211,238,0.6)]" />
                       </div>
                       
                       {/* Date Label */}
                       <div className="flex flex-col items-center bg-bg px-2 py-1 border-2 border-brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-4">
                          <span className="font-mono font-bold text-[8px] text-brutal-dim leading-none mb-1">{month}</span>
                          <span className="font-display font-black text-lg text-text leading-none">{day}</span>
                       </div>

                       {/* Vertical connection line — significantly shorter */}
                       <div className="w-[2px] h-14 bg-brutal-border/60" />
                    </div>

                    {/* Movie Card */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 100 }}
                      whileInView={{ opacity: 1, scale: 1, y: 130 }}
                      transition={{ type: "spring", stiffness: 200, damping: 20, delay: movieIdx * 0.05 }}
                      viewport={{ once: true, margin: "-50px" }}
                      whileHover={{ scale: 1.05, zIndex: 100, transition: { duration: 0.2 } }}
                      onClick={(e) => {
                        // Prevent click if we were dragging
                        onMovieClick(movie);
                      }}
                      className="cursor-pointer relative z-10"
                    >
                      <div className="w-[180px] bg-surface border-4 border-brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:border-brutal-cyan hover:shadow-[8px_8px_0px_0px_var(--theme-primary)] transition-all overflow-hidden">
                        <div className="relative aspect-[2/3] w-full border-b-4 border-brutal-border">
                          {movie.poster_path ? (
                            <Image
                              src={posterUrl(movie.poster_path, "medium")}
                              alt={movie.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                              sizes="180px"
                              draggable={false}
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                               <Film className="w-10 h-10 text-brutal-dim" />
                            </div>
                          )}

                          {/* Franchise Ribbon (Desktop) */}
                          {FRANCHISE_MAP[movie.id] && (
                            <div className="absolute top-0 right-0 overflow-hidden w-20 h-20 pointer-events-none z-20">
                              <div className={`absolute top-4 -right-6 w-[120px] py-1 ${FRANCHISE_MAP[movie.id].color} ${FRANCHISE_MAP[movie.id].borderColor} border-y-2 text-[8px] font-mono font-black text-white text-center rotate-45 shadow-sm uppercase tracking-widest`}>
                                {FRANCHISE_MAP[movie.id].name}
                              </div>
                            </div>
                          )}
                          
                          {/* Release Year Overlay (Only if truly upcoming) */}
                          {isUpcoming && (
                            <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/80 backdrop-blur-sm border border-white/20 text-[8px] font-mono font-bold text-white uppercase z-20">
                              Upcoming
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <h4 className="font-outfit text-sm font-black uppercase text-text line-clamp-1 leading-tight tracking-tight mb-1">
                            {movie.title}
                          </h4>
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[9px] text-brutal-cyan font-bold">
                              {month} {day}, {year}
                            </span>
                            <div className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-brutal-cyan animate-pulse" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          ))}
          {/* Spacer at the end to allow the last item to be centered */}
          <div className="min-w-[400px]" />
        </div>
      </div>

      {/* ── MOBILE TIMELINE (Vertical) ── */}
      <div className="md:hidden flex flex-col gap-8 px-4 pb-20">
        {groups.map((group, groupIdx) => (
          <div key={group.label} className="flex flex-col gap-6">
            <motion.div 
               initial={{ opacity: 0 }}
               whileInView={{ opacity: 1 }}
               viewport={{ once: true }}
               className="flex items-center gap-4"
            >
              <div className="h-[2px] flex-1 bg-brutal-lime" />
              <h3 className="font-mono text-xs font-black text-brutal-lime uppercase tracking-[0.3em] bg-bg px-2">
                 — {group.label} —
              </h3>
              <div className="h-[2px] flex-1 bg-brutal-lime" />
            </motion.div>

            <div className="flex flex-col gap-4">
              {group.movies.map((movie, idx) => (
                <motion.div
                  key={movie.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  viewport={{ once: true }}
                  onClick={() => onMovieClick(movie)}
                  className="flex items-stretch gap-4 bg-surface border-2 border-brutal-border brutal-shadow active:scale-[0.98] transition-transform"
                >
                  {/* Small Poster */}
                  <div className="relative w-20 flex-shrink-0 border-r-2 border-brutal-border">
                    {movie.poster_path ? (
                      <Image
                        src={posterUrl(movie.poster_path, "small")}
                        alt={movie.title}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Film className="w-6 h-6 text-brutal-dim" />
                      </div>
                    )}

                    {/* Franchise Badge (Mobile - Tiny Corner) */}
                    {FRANCHISE_MAP[movie.id] && (
                      <div className={`absolute top-0 left-0 ${FRANCHISE_MAP[movie.id].color} ${FRANCHISE_MAP[movie.id].borderColor} border-r-2 border-b-2 px-1.5 py-0.5 text-[7px] font-mono font-black text-white uppercase tracking-tighter z-10`}>
                        {FRANCHISE_MAP[movie.id].name}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 p-3 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-1">
                       <Calendar className="w-3 h-3 text-brutal-cyan" />
                       <span className="font-mono text-[10px] font-bold text-text">
                         {new Date(movie.release_date).toLocaleDateString('default', { day: 'numeric', month: 'short' }).toUpperCase()}
                       </span>
                    </div>
                    <h4 className="font-outfit text-sm font-black uppercase text-text leading-tight mb-1">
                      {movie.title}
                    </h4>
                    <p className="font-mono text-[9px] text-brutal-dim line-clamp-2 leading-relaxed">
                      {movie.overview}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
