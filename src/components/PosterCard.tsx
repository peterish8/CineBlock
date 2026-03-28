"use client";

import { memo } from "react";
import Image from "next/image";
import { Star, Heart, Bookmark, CheckCircle } from "lucide-react";
import { TMDBMovie } from "@/lib/types";
import { posterUrl } from "@/lib/constants";
import { useMovieLists } from "@/hooks/useMovieLists";

interface PosterCardProps {
  movie: TMDBMovie;
  onClick: () => void;
  index: number;
}

const PosterCard = memo(function PosterCard({ movie, onClick, index }: PosterCardProps) {
  const { isLiked, toggleLiked, isInWatchlist, toggleWatchlist, isWatched, toggleWatched } = useMovieLists();
  const hasImage = movie.poster_path !== null;
  const year = movie.release_date?.split("-")[0] || "—";
  const rating = movie.vote_average?.toFixed(1) || "N/A";
  const liked = isLiked(movie.id);
  const inWatchlist = isInWatchlist(movie.id);
  const watched = isWatched(movie.id);

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  // Prefetch backdrop on hover so modal image appears instantly on click
  // Using Image() object instead of <link rel="preload"> to avoid "unused preload" console warnings
  const prefetchBackdrop = () => {
    if (!movie.backdrop_path) return;
    const url = `https://image.tmdb.org/t/p/w780${movie.backdrop_path}`;
    const img = new (window as any).Image();
    img.src = url;
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={prefetchBackdrop}
      onTouchStart={prefetchBackdrop}

      className="group brutal-poster relative aspect-[2/3] w-full focus:outline-none animate-fade-in"
      style={{ animationDelay: `${index * 40}ms` }}
      id={`poster-${movie.id}`}
      aria-label={`View ${movie.title}`}
    >
      {/* Image */}
      {hasImage ? (
        <Image
          src={posterUrl(movie.poster_path, "medium")}
          alt={movie.title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-surface-2 p-3">
          <span className="text-brutal-muted text-xs font-mono font-bold text-center uppercase leading-tight">
            {movie.title}
          </span>
        </div>
      )}

      {/* Hover overlay - always visible on mobile */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-100 opacity-100">
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-brutal-white text-xs font-display font-bold uppercase leading-tight line-clamp-2">
            {movie.title}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1 text-brutal-yellow">
              <Star className="w-3.5 h-3.5 fill-current" strokeWidth={2.5} />
              <span className="text-[11px] font-mono font-bold">{rating}</span>
            </span>
            <span className="text-[11px] font-mono font-bold text-brutal-dim">{year}</span>
          </div>
        </div>
      </div>

      {/* Rating badge — top right */}
      <div className="absolute top-0 right-0 bg-black border-b-3 border-l-3 border-brutal-border px-2 py-1 flex items-center gap-1">
        <Star className="w-3 h-3 text-brutal-yellow fill-current" />
        <span className="text-[10px] font-mono font-bold text-brutal-yellow">{rating}</span>
      </div>

      {/* Three action buttons — top left column */}
      <div className="absolute top-0 left-0 flex flex-col border-brutal-border z-10">
        {/* Like */}
        <div
          onClick={(e) => { stop(e); toggleLiked(movie); }}
          className={`border-b-3 border-r-3 border-brutal-border px-2 py-2 min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer transition-colors duration-100 ${
            liked ? "bg-[var(--theme-primary)] text-black" : "bg-black/80 text-brutal-dim hover:text-[var(--theme-primary)]"
          }`}
          role="button"
          aria-label={liked ? "Unlike" : "Like"}
          title="Like"
        >
          <Heart className={`w-3.5 h-3.5 ${liked ? "fill-current" : ""}`} strokeWidth={2.5} />
        </div>
        {/* Watchlist */}
        <div
          onClick={(e) => { stop(e); toggleWatchlist(movie); }}
          className={`border-b-3 border-r-3 border-brutal-border px-2 py-2 min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer transition-colors duration-100 ${
            inWatchlist ? "bg-brutal-lime text-black" : "bg-black/80 text-brutal-dim hover:text-brutal-lime"
          }`}
          role="button"
          aria-label={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
          title="Watchlist"
        >
          <Bookmark className={`w-3.5 h-3.5 ${inWatchlist ? "fill-current" : ""}`} strokeWidth={2.5} />
        </div>
        {/* Watched */}
        <div
          onClick={(e) => { stop(e); toggleWatched(movie); }}
          className={`border-b-3 border-r-3 border-brutal-border px-2 py-2 min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer transition-colors duration-100 ${
            watched ? "bg-brutal-cyan text-black" : "bg-black/80 text-brutal-dim hover:text-brutal-cyan"
          }`}
          role="button"
          aria-label={watched ? "Mark as unwatched" : "Mark as watched"}
          title="Watched"
        >
          <CheckCircle className={`w-3.5 h-3.5 ${watched ? "fill-current" : ""}`} strokeWidth={2.5} />
        </div>
      </div>
    </button>
  );
});

export default PosterCard;
