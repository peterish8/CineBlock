"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { X, Star, MapPin, Film, ExternalLink, User } from "lucide-react";
import { TMDBPerson, TMDBMovie } from "@/lib/types";
import { posterUrl } from "@/lib/constants";

interface ActorModalProps {
  actorId: number | null;
  onClose: () => void;
  onMovieClick: (movie: TMDBMovie) => void;
}

export default function ActorModal({ actorId, onClose, onMovieClick }: ActorModalProps) {
  const [person, setPerson] = useState<TMDBPerson | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchPerson = useCallback(async (id: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/movies?action=person&id=${id}`);
      if (!res.ok) throw new Error("Failed to fetch actor details");
      setPerson(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (actorId) {
      fetchPerson(actorId);
      document.body.style.overflow = "hidden";
    } else {
      setPerson(null);
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [actorId, fetchPerson]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!actorId) return null;

  const movies = (person?.movie_credits?.cast || [])
    .filter((m) => m.poster_path)
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 20);

  const age = person?.birthday
    ? Math.floor((Date.now() - new Date(person.birthday).getTime()) / 31557600000)
    : null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      {/* Dark Overlay with backdrop blur */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in" />

      {/* Neobrutalist Modal Container */}
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-bg border-3 border-brutal-border shadow-brutal-lg animate-slide-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header / Bio Section */}
        <div className="flex-shrink-0 p-5 sm:p-6 border-b-3 border-brutal-border bg-surface-2">
          <div className="flex gap-5 sm:gap-6">
            {/* Actor Photo with Brutal Border */}
            <div className="flex-shrink-0 w-24 h-32 sm:w-32 sm:h-44 border-3 border-brutal-border bg-surface overflow-hidden shadow-brutal-sm">
              {loading ? (
                <div className="w-full h-full bg-surface-2 animate-pulse" />
              ) : person?.profile_path ? (
                <Image
                  src={`https://image.tmdb.org/t/p/w342${person.profile_path}`}
                  alt={person.name}
                  width={128}
                  height={176}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-surface-2">
                  <User className="w-12 h-12 text-brutal-dim" />
                </div>
              )}
            </div>

            {/* Info column */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <h2 className="text-xl sm:text-2xl font-display font-black text-brutal-white uppercase tracking-tight mb-2 truncate">
                {person?.name || "Loading..."}
              </h2>

              <div className="flex flex-wrap gap-2 mb-4">
                {person?.known_for_department && (
                  <div className="brutal-chip bg-brutal-violet text-white px-2 py-0.5 text-[10px] font-mono font-bold uppercase">
                    {person.known_for_department}
                  </div>
                )}
                {age && (
                  <div className="brutal-chip border-brutal-border text-brutal-dim px-2 py-0.5 text-[10px] font-mono font-bold uppercase">
                    AGE: {age}
                  </div>
                )}
                {person?.place_of_birth && (
                  <div className="flex items-center gap-1.5 text-brutal-muted text-[10px] font-mono truncate max-w-full">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate uppercase">{person.place_of_birth}</span>
                  </div>
                )}
              </div>

              {!loading && person?.biography && (
                <p className="text-brutal-white text-xs leading-relaxed line-clamp-3 sm:line-clamp-4 font-medium opacity-80">
                  {person.biography}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Filmography Section */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-bg">
          <div className="flex items-center gap-2 mb-4">
            <Film className="w-4 h-4 text-brutal-violet" strokeWidth={2.5} />
            <h3 className="text-xs font-mono font-bold text-brutal-dim uppercase tracking-[0.2em]">
              FILMOGRAPHY
            </h3>
          </div>

          {loading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-surface-2 border-2 border-brutal-border animate-pulse" />
              ))}
            </div>
          ) : movies.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {movies.map((movie) => (
                <div
                  key={movie.id}
                  className="group relative aspect-[2/3] border-2 border-brutal-border bg-surface cursor-pointer hover:border-brutal-violet hover:-translate-y-1 transition-all overflow-hidden"
                  onClick={() => {
                    onMovieClick({
                      ...movie,
                      original_title: movie.title,
                      media_type: "movie",
                    } as TMDBMovie);
                    onClose();
                  }}
                >
                  <Image
                    src={posterUrl(movie.poster_path, "small")}
                    alt={movie.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 33vw, 150px"
                  />
                  
                  {/* Neobrutalist Hover Tag */}
                  <div className="absolute inset-x-0 bottom-0 p-1.5 bg-black/90 border-t-2 border-brutal-border translate-y-full group-hover:translate-y-0 transition-transform">
                    <p className="text-[9px] font-bold text-white truncate uppercase">{movie.title}</p>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 text-brutal-yellow fill-current" />
                        <span className="text-[9px] font-mono text-brutal-yellow font-bold">
                          {movie.vote_average.toFixed(1)}
                        </span>
                      </div>
                      <span className="text-[8px] font-mono text-brutal-dim">
                        {movie.release_date?.split("-")[0]}
                      </span>
                    </div>
                  </div>

                  {/* Rating mini badge */}
                  <div className="absolute top-1 right-1 px-1 bg-black border border-brutal-border">
                     <span className="text-[8px] font-mono font-bold text-brutal-yellow">
                        {movie.vote_average.toFixed(1)}
                     </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-brutal-dim font-mono text-xs uppercase tracking-widest border-2 border-dashed border-brutal-border">
              NO FILMS FOUND
            </div>
          )}
        </div>

        {/* Close Button - Brutalist Style */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 bg-surface border-3 border-brutal-border shadow-brutal-sm hover:bg-brutal-violet hover:text-white active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}
