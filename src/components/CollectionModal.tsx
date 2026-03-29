"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X, CheckCircle, Star, Calendar, Box, Info, Heart, Bookmark } from "lucide-react";
import { TMDBCollectionDetail, TMDBMovie } from "@/lib/types";
import { backdropUrl, posterUrl } from "@/lib/constants";
import { useMovieLists } from "@/hooks/useMovieLists";

interface CollectionModalProps {
  collectionId: number | null;
  onClose: () => void;
  onMovieClick: (movie: TMDBMovie) => void;
}

export default function CollectionModal({ collectionId, onClose, onMovieClick }: CollectionModalProps) {
  const [collection, setCollection] = useState<TMDBCollectionDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isWatched, isLiked, isInWatchlist, toggleWatched, toggleLiked, toggleWatchlist } = useMovieLists();

  useEffect(() => {
    if (!collectionId) {
      setCollection(null);
      return;
    }

    const fetchCollection = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/movies?action=collection&id=${collectionId}`);
        const data = await res.json();
        if (res.ok) {
          // Sort parts by release date (UNLESS it's the custom MCU chronological timeline or Spider-man Eras)
          if (data.parts && data.id !== 9999999 && data.id !== 9999998) {
            data.parts.sort((a: any, b: any) => {
              const dateA = a.release_date || "9999";
              const dateB = b.release_date || "9999";
              return dateA.localeCompare(dateB);
            });
          }
          setCollection(data);
        } else {
          setError(data.error || "Failed to access the vault database.");
        }
      } catch (err) {
        console.error("Failed to fetch collection:", err);
        setError("Network connection lost while accessing the vault.");
      } finally {
        setLoading(false);
      }
    };

    fetchCollection();
  }, [collectionId]);

  useEffect(() => {
    if (collectionId) {
      document.body.style.overflow = "hidden";
    } else {
      setTimeout(() => {
        if (!document.querySelector('[role="dialog"]')) document.body.style.overflow = "";
      }, 10);
    }
    return () => {
      setTimeout(() => {
        if (!document.querySelector('[role="dialog"]')) document.body.style.overflow = "";
      }, 10);
    };
  }, [collectionId]);

  if (!collectionId) return null;

  const watchedCount = collection?.parts?.filter(m => isWatched(m.id)).length || 0;
  const totalCount = collection?.parts?.length || 0;
  const percentage = totalCount > 0 ? Math.round((watchedCount / totalCount) * 100) : 0;
  const hasMovies = totalCount > 0;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl max-h-screen sm:max-h-[90vh] bg-bg border-3 border-brutal-border shadow-brutal-lg animate-slide-up flex flex-col overflow-hidden">
        {/* Header Section */}
        <div className="relative h-48 sm:h-64 flex-shrink-0 bg-black border-b-3 border-brutal-border overflow-hidden">
          {collection?.backdrop_path ? (
            <Image
              src={backdropUrl(collection.backdrop_path, "large")}
              alt={collection.name}
              fill
              className="object-cover opacity-60"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-surface-2 font-mono text-brutal-dim">NO BACKDROP available</div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-bg to-transparent" />
          
          <div className="absolute bottom-6 left-6 right-6 flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <Box className="w-6 h-6 text-brutal-violet" />
              <h2 className="text-2xl sm:text-4xl font-display font-black text-brutal-white uppercase tracking-tight leading-none">
                {collection?.name || "Loading Franchise..."}
              </h2>
            </div>
            
            {totalCount > 0 && (
              <div className="flex flex-wrap items-center gap-4 mt-2">
                <div className="flex flex-col gap-1.5 min-w-[200px]">
                  <div className="flex justify-between text-[10px] font-mono font-black text-brutal-white">
                    <span>PROGRESS</span>
                    <span>{watchedCount}/{totalCount} MOVIES</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-surface border border-brutal-border">
                      <div className="h-full bg-brutal-violet shadow-[0_0_10px_rgba(139,92,246,0.5)]" style={{ width: `${percentage}%` }} />
                    </div>
                    <span className="text-[10px] font-mono font-black text-brutal-violet w-8 text-right shrink-0">{percentage}%</span>
                  </div>
                </div>
                {percentage === 100 && (
                  <div className="brutal-chip bg-brutal-lime text-black px-3 py-1 text-[10px] font-black animate-bounce shadow-brutal-sm">
                    VAULT COMPLETED
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 brutal-btn p-2.5 bg-black/50 text-white hover:bg-red-500 hover:text-white transition-all z-10"
          >
            <X className="w-5 h-5" strokeWidth={3} />
          </button>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-6 sm:p-8 bg-bg flex flex-col gap-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
               <div className="w-12 h-12 border-4 border-brutal-border border-t-brutal-violet animate-spin rounded-full" />
               <p className="font-mono font-black text-xs text-brutal-dim uppercase tracking-widest">DECRYPTING VAULT...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
               <div className="w-16 h-16 flex items-center justify-center bg-red-600/20 text-red-600 border-3 border-red-600 shadow-brutal-sm rotate-3">
                  <X className="w-8 h-8" strokeWidth={4} />
               </div>
               <h3 className="text-xl font-display font-black text-white uppercase mt-4">System Access Error</h3>
               <p className="text-xs font-mono text-red-500 uppercase max-w-xs font-bold">{error}</p>
               <button onClick={() => window.location.reload()} className="brutal-btn mt-4 px-6 py-2 bg-red-600 text-white font-mono font-black text-xs group-hover:scale-105 transition-all uppercase">REBOOT SYSTEM</button>
            </div>
          ) : !hasMovies ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
               <Box className="w-16 h-16 text-brutal-border opacity-20" />
               <h3 className="text-xl font-display font-black text-brutal-white uppercase">Vault is Empty</h3>
               <p className="text-xs font-mono text-brutal-dim uppercase max-w-xs">No movies were found for this franchise. It might be a placeholder or a very recent discovery.</p>
            </div>
          ) : (
            <>
              {collection?.overview && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-brutal-dim" />
                    <h3 className="text-[10px] font-mono font-black text-brutal-dim uppercase tracking-widest">OVERVIEW</h3>
                  </div>
                  <p className="text-brutal-white text-sm leading-relaxed opacity-80 max-w-2xl">{collection.overview}</p>
                </div>
              )}

              <div className="flex flex-col gap-6">
                <h3 className="text-[10px] font-mono font-black text-brutal-dim uppercase tracking-widest border-b border-brutal-border pb-3 flex items-center gap-2">
                   CHRONOLOGICAL VAULT
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {collection?.parts.map((movie, idx, arr) => {
                const isNewEra = movie.custom_era && (idx === 0 || movie.custom_era !== arr[idx - 1].custom_era);
                const watched = isWatched(movie.id);
                const year = movie.release_date?.split("-")[0] || "—";
                return (
                  <div key={`wrapper-${movie.id}`} className="contents">
                    {isNewEra && (
                      <div className="col-span-full mt-2 mb-2 flex items-center gap-3">
                        <div className="h-[2px] w-8 bg-brutal-border" />
                        <h4 className="text-[11px] font-mono font-black text-white bg-red-600 px-2 py-1 border-2 border-black inline-block uppercase tracking-widest shadow-brutal-sm">
                          {movie.custom_era}
                        </h4>
                        <div className="h-[2px] flex-1 bg-brutal-border" />
                      </div>
                    )}
                    <div
                      onClick={() => onMovieClick(movie)}
                      className={`group relative flex flex-col border-3 transition-all cursor-pointer ${
                        watched 
                          ? "border-brutal-lime bg-brutal-lime/5 hover:bg-brutal-lime/10" 
                          : "border-brutal-border bg-surface hover:border-brutal-violet"
                      }`}
                    >
                    <div className="relative aspect-[16/9] bg-black border-b-2 border-inherit overflow-hidden">
                       {movie.backdrop_path ? (
                         <Image
                           src={backdropUrl(movie.backdrop_path, "small")}
                           alt={movie.title}
                           fill
                           className="object-cover opacity-70 group-hover:scale-105 transition-transform duration-500"
                           sizes="400px"
                         />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center text-xs font-mono font-black opacity-30">NO PREVIEW</div>
                       )}

                       {/* Vertical status buttons — left edge */}
                       <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-center gap-1 z-20 p-1 bg-black/60 backdrop-blur-sm">
                         <button
                           onClick={(e) => { e.stopPropagation(); toggleWatched(movie); }}
                           title="Mark as Watched"
                           className={`p-1.5 border-2 transition-all ${watched ? "bg-[#22d3ee] border-[#22d3ee] text-black" : "bg-black/70 border-brutal-border text-brutal-dim hover:border-[#22d3ee] hover:text-[#22d3ee]"}`}
                         >
                           <CheckCircle className="w-3.5 h-3.5" strokeWidth={2.5} />
                         </button>
                         <button
                           onClick={(e) => { e.stopPropagation(); toggleLiked(movie); }}
                           title="Like"
                           className={`p-1.5 border-2 transition-all ${isLiked(movie.id) ? "bg-[var(--theme-primary)] border-[var(--theme-primary)] text-black" : "bg-black/70 border-brutal-border text-brutal-dim hover:border-[var(--theme-primary)] hover:text-[var(--theme-primary)]"}`}
                         >
                           <Heart className="w-3.5 h-3.5" strokeWidth={2.5} />
                         </button>
                         <button
                           onClick={(e) => { e.stopPropagation(); toggleWatchlist(movie); }}
                           title="Add to Wishlist"
                           className={`p-1.5 border-2 transition-all ${isInWatchlist(movie.id) ? "bg-[#a3e635] border-[#a3e635] text-black" : "bg-black/70 border-brutal-border text-brutal-dim hover:border-[#a3e635] hover:text-[#a3e635]"}`}
                         >
                           <Bookmark className="w-3.5 h-3.5" strokeWidth={2.5} />
                         </button>
                       </div>

                       <div className="absolute top-2 left-12 z-10">
                         <div className="bg-black border border-inherit px-1.5 py-0.5 text-[9px] font-mono font-black text-white">
                           {idx + 1}
                         </div>
                       </div>

                       {watched && (
                         <div className="absolute inset-0 bg-brutal-lime/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <CheckCircle className="w-10 h-10 text-brutal-lime fill-black drop-shadow-md" strokeWidth={2.5} />
                         </div>
                       )}
                    </div>
                    
                    <div className="p-3 flex flex-col gap-2">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className={`text-xs font-black uppercase tracking-tight line-clamp-1 flex-1 ${watched ? "text-brutal-lime" : "text-white"}`}>
                          {movie.title}
                        </h4>
                        {watched && <CheckCircle className="w-3.5 h-3.5 text-brutal-lime flex-shrink-0" strokeWidth={3} />}
                      </div>
                      
                      <div className="flex items-center gap-2">
                         <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-brutal-yellow">
                            <Star className="w-3 h-3 fill-current" />
                            {movie.vote_average.toFixed(1)}
                         </div>
                         <div className="text-[10px] font-mono font-bold text-brutal-dim">
                            {year}
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
                );
              })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
