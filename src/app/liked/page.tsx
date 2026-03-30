"use client";

import { TMDBMovie } from "@/lib/types";
import { posterUrl } from "@/lib/constants";
import Image from "next/image";
import Link from "next/link";
import { Heart, ArrowLeft, Star, Sparkles } from "lucide-react";
import { useState } from "react";
import MovieModal from "@/components/MovieModal";
import { useMovieLists } from "@/hooks/useMovieLists";
import MovieActionRail from "@/components/MovieActionRail";

function LikedContent() {
  const { liked } = useMovieLists();
  const [selectedMovie, setSelectedMovie] = useState<TMDBMovie | null>(null);

  return (
    <main className="min-h-screen bg-bg flex flex-col pb-16 lg:pb-0">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-bg border-b-3 border-brutal-border">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="brutal-btn p-2.5">
              <ArrowLeft className="w-4 h-4" strokeWidth={3} />
            </Link>
            <Heart className="w-5 h-5 text-[var(--theme-primary)]" fill="currentColor" strokeWidth={2.5} />
            <h1 className="font-display font-bold text-xl sm:text-2xl text-brutal-white uppercase tracking-tight">LIKED</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="brutal-chip text-[var(--theme-primary)] border-[var(--theme-primary)] text-[10px]">
              {liked.length} MOVIES
            </span>
            {liked.length > 0 && (
              <Link href="/recommendations" className="brutal-btn flex items-center gap-2 px-3 py-2 text-[10px] font-mono font-bold !bg-[var(--theme-primary)] !text-black !border-[var(--theme-primary)]">
                <Sparkles className="w-3.5 h-3.5" strokeWidth={2.5} />
                FOR YOU
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-[1600px] mx-auto w-full px-4 sm:px-6 py-6">
        {liked.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="brutal-card p-8 max-w-md w-full">
              <Heart className="w-12 h-12 text-brutal-dim mx-auto mb-4" strokeWidth={1.5} />
              <p className="font-display font-bold text-lg text-brutal-white uppercase mb-2">NO LIKED MOVIES</p>
              <p className="text-brutal-muted text-sm font-mono mb-4">
                Tap the <Heart className="w-3 h-3 inline" /> icon on any poster to like it. Liked movies power your recommendations.
              </p>
              <Link href="/" className="brutal-btn inline-flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold">
                <ArrowLeft className="w-3 h-3" strokeWidth={3} />
                BROWSE
              </Link>
            </div>
          </div>
        ) : (
          <>
            <p className="text-brutal-dim text-[10px] font-mono uppercase tracking-wider mb-4">
              ❤ {liked.length} LIKED — THESE POWER YOUR "FOR YOU" RECOMMENDATIONS
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {liked.map((movie, i) => {
                const title = movie.title || movie.name || "";
                const year = (movie.release_date || movie.first_air_date || "").split("-")[0] || "—";
                const rating = movie.vote_average?.toFixed(1) || "0";
                return (
                  <div
                    key={movie.id}
                    className="group brutal-poster relative aspect-[2/3] w-full animate-fade-in cursor-pointer"
                    style={{ animationDelay: `${(i % 30) * 30}ms` }}
                    onClick={() => setSelectedMovie(movie)}
                  >
                    {movie.poster_path ? (
                      <Image src={posterUrl(movie.poster_path, "medium")} alt={title} fill className="object-cover" sizes="17vw" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-surface-2 p-3">
                        <span className="text-brutal-muted text-xs font-mono font-bold text-center uppercase">{title}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-100 opacity-100">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-brutal-white text-xs font-display font-bold uppercase leading-tight line-clamp-2">{title}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="flex items-center gap-1 text-brutal-yellow"><Star className="w-3.5 h-3.5 fill-current" strokeWidth={2.5} /><span className="text-[11px] font-mono font-bold">{rating}</span></span>
                          <span className="text-[11px] font-mono font-bold text-brutal-dim">{year}</span>
                        </div>
                      </div>
                    </div>
                    <div className="absolute top-0 right-0 bg-black border-b-3 border-l-3 border-brutal-border px-2 py-1 flex items-center gap-1">
                      <Star className="w-3 h-3 text-brutal-yellow fill-current" /><span className="text-[10px] font-mono font-bold text-brutal-yellow">{rating}</span>
                    </div>
                    <MovieActionRail movie={movie} actions={["like", "watchlist", "watched", "add"]} />
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      <MovieModal movie={selectedMovie} onClose={() => setSelectedMovie(null)} />
    </main>
  );
}

export default function LikedPage() {
  return <LikedContent />;
}
