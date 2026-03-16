"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { posterUrl } from "@/lib/constants";
import { TMDBCollection } from "@/lib/types";
import { ArrowRight, Box, Play } from "lucide-react";
import { useMovieLists } from "@/hooks/useMovieLists";

interface CollectionCardProps {
  collection: TMDBCollection;
  onClick: () => void;
  // progress is now optional and recalculated internally if parts are fetched
  progress?: {
    watched: number;
    total: number;
  };
}

export default function CollectionCard({ collection, onClick, progress: manualProgress }: CollectionCardProps) {
  const { isWatched } = useMovieLists();
  
  // State for dynamic content
  const [parts, setParts] = useState<any[] | null>(null);
  const [dynamicCollage, setDynamicCollage] = useState<string[] | null>(null);
  const [collageErrors, setCollageErrors] = useState<Record<number, boolean>>({});
  const [mainError, setMainError] = useState(false);

  // Use provided collage or dynamic collage
  const collage = collection.collage || dynamicCollage;

  // Calculate progress: use manual if provided, otherwise calculate from fetched parts
  const calculatedProgress = parts 
    ? {
        watched: parts.filter(p => isWatched(p.id)).length,
        total: parts.length
      }
    : manualProgress;

  const percentage = calculatedProgress 
    ? Math.round((calculatedProgress.watched / calculatedProgress.total) * 100) 
    : 0;

  useEffect(() => {
    // Always try to fetch parts if we don't have them yet to power the collage and real progress
    if (collection.id && !parts) {
      const fetchCollectionData = async () => {
        try {
          const res = await fetch(`/api/movies?action=collection&id=${collection.id}`);
          if (res.ok) {
            const data = await res.json();
            if (data.parts && data.parts.length > 0) {
              setParts(data.parts);
              
              // Only set dynamic collage if not already provided
              if (!collection.collage) {
                const sorted = (data.id === 9999999 || data.id === 9999998) ? [...data.parts] : [...data.parts].sort((a: any, b: any) => {
                  const dateA = a.release_date || "9999";
                  const dateB = b.release_date || "9999";
                  return dateA.localeCompare(dateB);
                });
                const posters = sorted.map((p: any) => p.poster_path).filter(Boolean);
                setDynamicCollage(posters);
              }
            }
          }
        } catch (err) {
          console.error("Collection data fetch failed:", err);
        }
      };
      fetchCollectionData();
    }
  }, [collection.id, collection.collage, parts]);

  const handleCollageError = (index: number) => {
    setCollageErrors(prev => ({ ...prev, [index]: true }));
  };

  // Franchise-specific theme color (default to violet if not provided)
  const themeColor = collection.themeColor || "#8b5cf6";

  return (
    <button
      onClick={onClick}
      className={`group relative w-full flex flex-col items-start text-left focus:outline-none transition-opacity duration-300 opacity-100`}
    >
      {/* Stacked Poster Effect */}
      <div className="relative w-full aspect-[2/3] mb-4">
        {/* Layer 3 (Bottom) */}
        <div className="absolute inset-0 translate-x-3 translate-y-3 bg-brutal-border border-3 border-black group-hover:translate-x-4 group-hover:translate-y-4 transition-transform duration-200" />
        
        {/* Layer 2 (Middle) */}
        <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 bg-surface-2 border-3 border-brutal-border group-hover:translate-x-2 group-hover:translate-y-2 transition-transform duration-200" />
        
        {/* Layer 1 (Top/Main Poster) */}
        <div className="absolute inset-0 bg-black border-3 border-brutal-border overflow-hidden z-10 group-hover:-translate-x-1 group-hover:-translate-y-1 transition-transform duration-200">
          <div className="grid grid-cols-2 grid-rows-2 w-full h-full gap-0.5 bg-brutal-border">
            {[0, 1, 2, 3].map((i) => {
              const path = collage?.[i];
              const isFourthSlot = i === 3;
              const hasExactlyThree = collage?.length === 3;

              // Personalized 4th Slot Logic (if we have precisely 3 images)
              if (isFourthSlot && hasExactlyThree) {
                return (
                  <div
                    key={i}
                    style={{ backgroundColor: themeColor }}
                    className="relative w-full h-full flex flex-col items-center justify-center p-2 text-center overflow-hidden border-l border-t border-brutal-border group-hover:brightness-125 transition-all"
                  >
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                      <Box className="w-full h-full scale-150 rotate-12" />
                    </div>
                    <span className="text-[7px] font-mono font-black text-white/60 uppercase tracking-[0.2em] mb-1">
                      PERSONALIZED
                    </span>
                    <span className="text-[9px] font-display font-black text-white leading-none uppercase mb-2 line-clamp-2 drop-shadow-md">
                      {collection.name.replace(" Collection", "").replace(" collection", "")}
                    </span>
                    <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm text-white px-1.5 py-1 mt-auto border border-white/20">
                      <Play className="w-2 h-2 fill-current" />
                      <span className="text-[6px] font-mono font-black tracking-widest uppercase">
                        SEE NOW
                      </span>
                    </div>
                  </div>
                );
              }

              // Normal slot or Fallback
              return (
                <div key={i} className="relative w-full h-full bg-surface overflow-hidden">
                  {(path || collection.poster_path) && !collageErrors[i] ? (
                    <>
                      {/* Shimmer overlay while loading */}
                      <div className="absolute inset-0 brutal-shimmer opacity-20 z-0" />
                      <Image
                        src={posterUrl(path || collection.poster_path || "", "small")}
                        alt={`${collection.name} part ${i + 1}`}
                        fill
                        className={`object-cover transition-all duration-500 z-10 ${
                          path 
                            ? "opacity-90 group-hover:opacity-100 group-hover:scale-110" 
                            : "opacity-30 grayscale group-hover:grayscale-0 group-hover:opacity-50"
                        }`}
                        sizes="15vw"
                        onError={() => handleCollageError(i)}
                      />
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-surface-2 p-1">
                      <Box className="w-4 h-4 text-brutal-dim animate-pulse" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Progress Overlay */}
          {calculatedProgress && (
            <div className="absolute bottom-3 left-3 right-3 bg-black border-2 border-brutal-border p-2 z-20 flex flex-col gap-1.5 shadow-brutal-sm">
                <div className="flex justify-between items-center">
                    <span className="text-[9px] font-mono font-black text-brutal-white">{percentage}% COMPLETED</span>
                    <span className="text-[9px] font-mono font-bold text-brutal-dim">{calculatedProgress.watched}/{calculatedProgress.total}</span>
                </div>
                <div className="w-full h-1.5 bg-surface-2 border border-brutal-border">
                    <div 
                        className="h-full transition-all duration-500 shadow-[0_0_10px_rgba(255,255,255,0.2)]" 
                        style={{ width: `${percentage}%`, backgroundColor: themeColor }}
                    />
                </div>
            </div>
          )}
        </div>
      </div>

      {/* Meta Info */}
      <div className="z-20 pl-1 text-left w-full">
        <h3 className="text-lg sm:text-xl font-display font-black text-brutal-white uppercase leading-none tracking-tight group-hover:text-brutal-violet transition-colors truncate w-full">
          {collection.name}
        </h3>
        <div className="flex items-center gap-2 mt-2 font-mono text-[10px] font-bold text-brutal-dim uppercase">
          EXPLORE VAULT <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </button>
  );
}
