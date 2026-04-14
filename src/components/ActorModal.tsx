"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { X, MapPin, Film, Star, User } from "lucide-react";
import { TMDBPerson, TMDBMovie } from "@/lib/types";
import { posterUrl } from "@/lib/constants";
import { useThemeMode } from "@/hooks/useThemeMode";

interface ActorModalProps {
  actorId: number | null;
  onClose: () => void;
  onMovieClick: (movie: TMDBMovie) => void;
}

export default function ActorModal({ actorId, onClose, onMovieClick }: ActorModalProps) {
  const [person, setPerson] = useState<TMDBPerson | null>(null);
  const [loading, setLoading] = useState(false);
  const isGlass = useThemeMode() === "glass";

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
      {/* Overlay */}
      <div
        className="absolute inset-0 animate-fade-in"
        style={isGlass
          ? { background: "rgba(2,8,23,0.80)", backdropFilter: "blur(8px)" }
          : { background: "rgba(0,0,0,0.80)", backdropFilter: "blur(2px)" }
        }
      />

      {/* Modal container */}
      <div
        className={`relative w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up ${
          isGlass ? "" : "bg-bg border-3 border-brutal-border shadow-brutal-lg"
        }`}
        style={isGlass ? {
          background: "rgba(8,15,40,0.96)",
          backdropFilter: "blur(28px) saturate(160%)",
          WebkitBackdropFilter: "blur(28px) saturate(160%)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "20px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)",
        } : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glass: accent bar */}
        {isGlass && (
          <div style={{ height: 3, background: "linear-gradient(90deg, #F97316, #FB923C)", flexShrink: 0, borderRadius: "20px 20px 0 0" }} />
        )}

        {/* Header / Bio Section */}
        <div
          className={`flex-shrink-0 p-5 sm:p-6 ${isGlass ? "glass-actor-panel" : "border-b-3 border-brutal-border bg-surface-2"}`}
        >
          <div className="flex gap-5 sm:gap-6">
            {/* Actor Photo */}
            <div
              className={`flex-shrink-0 w-24 h-32 sm:w-32 sm:h-44 overflow-hidden ${
                isGlass ? "rounded-2xl" : "border-3 border-brutal-border bg-surface shadow-brutal-sm"
              }`}
              style={isGlass ? { border: "1px solid rgba(255,255,255,0.12)" } : undefined}
            >
              {loading ? (
                <div className={`w-full h-full animate-pulse ${isGlass ? "bg-white/5" : "bg-surface-2"}`} />
              ) : person?.profile_path ? (
                <Image
                  src={`https://image.tmdb.org/t/p/w342${person.profile_path}`}
                  alt={person.name}
                  width={128}
                  height={176}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className={`w-full h-full flex items-center justify-center ${isGlass ? "bg-white/5" : "bg-surface-2"}`}>
                  <User className={`w-12 h-12 ${isGlass ? "text-slate-500" : "text-brutal-dim"}`} />
                </div>
              )}
            </div>

            {/* Info column */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <h2 className={`text-xl sm:text-2xl font-display font-black tracking-tight mb-2 truncate ${isGlass ? "text-white" : "text-brutal-white uppercase"}`}>
                {person?.name || "Loading..."}
              </h2>

              <div className="flex flex-wrap gap-2 mb-4">
                {person?.known_for_department && (
                  <div
                    className={`px-2 py-0.5 text-[10px] font-bold uppercase ${isGlass ? "rounded-lg" : "brutal-chip bg-brutal-violet text-white"}`}
                    style={isGlass ? { background: "rgba(139,92,246,0.18)", border: "1px solid rgba(139,92,246,0.40)", color: "#C4B5FD" } : undefined}
                  >
                    {person.known_for_department}
                  </div>
                )}
                {age && (
                  <div
                    className={`px-2 py-0.5 text-[10px] font-bold uppercase ${isGlass ? "rounded-lg" : "brutal-chip border-brutal-border text-brutal-dim"}`}
                    style={isGlass ? { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(148,163,184,0.8)" } : undefined}
                  >
                    Age: {age}
                  </div>
                )}
                {person?.place_of_birth && (
                  <div className={`flex items-center gap-1.5 text-[10px] truncate max-w-full ${isGlass ? "text-slate-400" : "text-brutal-muted font-mono"}`}>
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate uppercase">{person.place_of_birth}</span>
                  </div>
                )}
              </div>

              {!loading && person?.biography && (
                <p className={`text-xs leading-relaxed line-clamp-3 sm:line-clamp-4 ${isGlass ? "text-slate-300" : "text-brutal-white font-medium opacity-80"}`}>
                  {person.biography}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Filmography Section */}
        <div className={`flex-1 overflow-y-auto p-5 sm:p-6 ${isGlass ? "" : "bg-bg"}`}>
          <div className="flex items-center gap-2 mb-4">
            <Film className={`w-4 h-4 ${isGlass ? "text-orange-400" : "text-brutal-violet"}`} strokeWidth={2.5} />
            <h3 className={`text-xs font-bold uppercase tracking-[0.2em] ${isGlass ? "text-slate-400" : "font-mono text-brutal-dim"}`}>
              Filmography
            </h3>
          </div>

          {loading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className={`aspect-[2/3] animate-pulse ${isGlass ? "rounded-xl bg-white/5" : "bg-surface-2 border-2 border-brutal-border"}`}
                />
              ))}
            </div>
          ) : movies.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {movies.map((movie) => (
                <div
                  key={movie.id}
                  className={`group relative aspect-[2/3] cursor-pointer overflow-hidden transition-all ${
                    isGlass
                      ? "glass-actor-movie rounded-xl"
                      : "border-2 border-brutal-border bg-surface hover:border-brutal-violet hover:-translate-y-1"
                  }`}
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

                  {/* Hover overlay */}
                  <div
                    className={`absolute inset-x-0 bottom-0 p-1.5 translate-y-full group-hover:translate-y-0 transition-transform ${
                      isGlass ? "" : "bg-black/90 border-t-2 border-brutal-border"
                    }`}
                    style={isGlass ? { background: "rgba(8,15,40,0.92)", borderTop: "1px solid rgba(255,255,255,0.10)", borderRadius: "0 0 12px 12px" } : undefined}
                  >
                    <p className={`text-[9px] font-bold text-white truncate ${isGlass ? "" : "uppercase"}`}>{movie.title}</p>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-1">
                        <Star className={`w-2.5 h-2.5 fill-current ${isGlass ? "text-amber-400" : "text-brutal-yellow"}`} />
                        <span className={`text-[9px] font-bold ${isGlass ? "text-amber-400" : "font-mono text-brutal-yellow"}`}>
                          {movie.vote_average.toFixed(1)}
                        </span>
                      </div>
                      <span className={`text-[8px] ${isGlass ? "text-slate-400" : "font-mono text-brutal-dim"}`}>
                        {movie.release_date?.split("-")[0]}
                      </span>
                    </div>
                  </div>

                  {/* Rating badge */}
                  <div
                    className={`absolute top-1 right-1 px-1 ${isGlass ? "rounded" : "border border-brutal-border bg-black"}`}
                    style={isGlass ? { background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.15)" } : undefined}
                  >
                    <span className={`text-[8px] font-bold ${isGlass ? "text-amber-400" : "font-mono text-brutal-yellow"}`}>
                      {movie.vote_average.toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              className={`text-center py-12 text-xs uppercase tracking-widest ${
                isGlass ? "rounded-2xl text-slate-500" : "text-brutal-dim font-mono border-2 border-dashed border-brutal-border"
              }`}
              style={isGlass ? { border: "1px dashed rgba(255,255,255,0.12)" } : undefined}
            >
              No films found
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className={`absolute top-4 right-4 flex items-center justify-center transition-all ${
            isGlass
              ? "w-8 h-8 rounded-xl hover:bg-white/10"
              : "p-2 bg-surface border-3 border-brutal-border shadow-brutal-sm hover:bg-brutal-violet hover:text-white active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          }`}
          style={isGlass ? { border: "1px solid rgba(255,255,255,0.12)", color: "rgba(148,163,184,0.8)" } : undefined}
          aria-label="Close modal"
        >
          <X className={isGlass ? "w-4 h-4" : "w-5 h-5"} strokeWidth={isGlass ? 2 : 3} />
        </button>
      </div>
    </div>
  );
}
