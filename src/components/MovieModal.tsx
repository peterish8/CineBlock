"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { X, Star, Calendar, Clock, Users, Bookmark, Play, Tv, ExternalLink, Link as LinkIcon, Film, Heart, CheckCircle, ArrowLeft, MoreVertical } from "lucide-react";
import { TMDBMovie, TMDBMovieDetail, TMDBVideo, TMDBWatchProvider } from "@/lib/types";
import { backdropUrl, posterUrl } from "@/lib/constants";
import { useMovieLists } from "@/hooks/useMovieLists";

interface MovieModalProps {
  movie: TMDBMovie | null;
  onClose: () => void;
  onBack?: () => void;
  onActorClick?: (actorId: number) => void;
}

export default function MovieModal({ movie: rootMovie, onClose, onBack, onActorClick }: MovieModalProps) {
  const [history, setHistory] = useState<TMDBMovie[]>([]);
  const [showActions, setShowActions] = useState(false);
  const [cinemaRevealed, setCinemaRevealed] = useState(false);

  const movie = history[history.length - 1] || null;

  useEffect(() => {
    if (rootMovie) {
      setHistory([rootMovie]);
      setShowActions(false);
    } else {
      setHistory([]);
      setShowActions(false);
    }
  }, [rootMovie]);

  useEffect(() => {
    if (movie) {
      setCinemaRevealed(false);
      const timer = setTimeout(() => setCinemaRevealed(true), 950);
      return () => clearTimeout(timer);
    }
  }, [movie?.id]);

  const [details, setDetails] = useState<TMDBMovieDetail | null>(null);
  const [watchProviders, setWatchProviders] = useState<{ [countryCode: string]: any } | null>(null);
  const [region, setRegion] = useState("US");
  const [loading, setLoading] = useState(false);
  const [playingTrailer, setPlayingTrailer] = useState(false);
  const [copied, setCopied] = useState(false);
  const [similar, setSimilar] = useState<TMDBMovie[]>([]);
  const { isLiked, toggleLiked, isInWatchlist, toggleWatchlist, isWatched, toggleWatched } = useMovieLists();

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!movie) return;
    const type = movie.media_type === "tv" ? "tv" : "movie";
    const url = `${window.location.origin}/?${type}=${movie.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchDetails = useCallback(async (id: number, type: "movie" | "tv") => {
    setLoading(true);
    setPlayingTrailer(false);
    setSimilar([]);
    try {
      const detailAction = type === "tv" ? "tv-details" : "details";
      const similarAction = type === "tv" ? "similar-tv" : "similar";
      const [detailRes, wpRes, simRes] = await Promise.all([
        fetch(`/api/movies?action=${detailAction}&id=${id}`),
        fetch(`/api/movies?action=watch-providers&id=${id}`),
        fetch(`/api/movies?action=${similarAction}&id=${id}`),
      ]);

      if (detailRes.ok) {
        const data = await detailRes.json();
        setDetails(data);
      }

      if (wpRes.ok) {
        const wpData = await wpRes.json();
        setWatchProviders(wpData.results || null);
        if (wpData.results && !wpData.results["US"] && Object.keys(wpData.results).length > 0) {
          setRegion(Object.keys(wpData.results)[0]);
        } else {
          setRegion("US");
        }
      }
      
      if (simRes.ok) {
        const simData = await simRes.json();
        setSimilar(simData.results?.slice(0, 10).map((m: any) => ({
          ...m,
          media_type: type
        })) || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (movie) {
      fetchDetails(movie.id, movie.media_type || "movie");
      document.body.style.overflow = "hidden";
    } else {
      setDetails(null);
      setWatchProviders(null);
      setPlayingTrailer(false);
      setTimeout(() => {
        if (!document.querySelector('[role="dialog"]')) document.body.style.overflow = "";
      }, 10);
    }
    return () => { 
      setTimeout(() => {
        if (!document.querySelector('[role="dialog"]')) document.body.style.overflow = "";
      }, 10);
    };
  }, [movie, fetchDetails]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!movie) return null;

  const year = movie.release_date?.split("-")[0] || "—";
  const rating = movie.vote_average?.toFixed(1) || "N/A";
  const cast = details?.credits?.cast?.slice(0, 10) || [];
  const seasons = details?.seasons || [];
  const runtime = details?.runtime;
  const genres = details?.genres || [];
  const liked = isLiked(movie.id);
  const inWl = isInWatchlist(movie.id);
  const watched = isWatched(movie.id);

  // Find trailer
  const trailer = details?.videos?.results?.find(
    (v: TMDBVideo) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser")
  ) || details?.videos?.results?.find((v: TMDBVideo) => v.site === "YouTube");

  const currentProviders = watchProviders?.[region] || null;
  const allStreamProviders = [
    ...(currentProviders?.flatrate || []),
    ...(currentProviders?.rent || []),
    ...(currentProviders?.buy || []),
  ];
  const seenProviderIds = new Set<number>();
  const uniqueProviders = allStreamProviders.filter((p) => {
    if (seenProviderIds.has(p.provider_id)) return false;
    seenProviderIds.add(p.provider_id);
    return true;
  }).slice(0, 8);

  return (
    <div
      className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />

      <div
        className="relative w-full sm:max-w-3xl sm:mx-4 max-h-[92svh] sm:max-h-[85vh] overflow-y-auto overscroll-contain bg-bg border-3 border-brutal-border shadow-brutal-lg animate-slide-up rounded-t-xl sm:rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Controls Area (Absolute Layer for UI overlays) */}
        <div className="absolute top-0 left-0 right-0 z-50 h-32 pointer-events-none p-3 flex justify-between items-start">
          {/* Left Side: Back */}
          <div className="flex flex-col gap-2 pointer-events-auto">
            {(history.length > 1 || onBack) && (
              <button 
                onClick={(e) => { e.stopPropagation(); if (history.length > 1) { setHistory(prev => prev.slice(0, -1)); } else { onBack?.(); } }} 
                className="brutal-btn p-2.5 bg-black/50 text-white hover:bg-brutal-white hover:text-black transition-all"
              >
                <ArrowLeft className="w-4 h-4" strokeWidth={3} />
              </button>
            )}
          </div>

          {/* Right Side: Actions and Close Button — hidden while trailer plays, reveal on corner hover */}
          <div className={`group/ctrl pointer-events-auto ${playingTrailer ? "p-6" : ""}`}>
          <div className={`flex items-start gap-2 transition-opacity duration-150 ${playingTrailer ? "opacity-0 group-hover/ctrl:opacity-100" : ""}`}>
            {/* Horizontal actions revealed to the left */}
            {showActions && (
              <div className="flex flex-row-reverse gap-0.5 animate-slide-up-faint">
                <button
                  onClick={(e) => { e.stopPropagation(); toggleLiked(movie); }}
                  className={`brutal-btn border-none p-2.5 transition-all ${liked ? "text-brutal-pink" : "text-white"}`}
                  title="Like"
                >
                  <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} strokeWidth={2.5} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleWatchlist(movie); }}
                  className={`brutal-btn border-none p-2.5 transition-all ${inWl ? "text-brutal-lime" : "text-white"}`}
                  title="Watchlist"
                >
                  <Bookmark className={`w-4 h-4 ${inWl ? "fill-current" : ""}`} strokeWidth={2.5} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleWatched(movie); }}
                  className={`brutal-btn border-none p-2.5 transition-all ${watched ? "text-brutal-cyan" : "text-white"}`}
                  title="Watched"
                >
                  <CheckCircle className={`w-4 h-4 ${watched ? "fill-current" : ""}`} strokeWidth={2.5} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleShare(e); }}
                  className={`brutal-btn border-none p-2.5 transition-all text-white hover:text-brutal-yellow ${copied ? "text-brutal-yellow" : ""}`}
                  title="Share"
                >
                  <LinkIcon className="w-4 h-4" strokeWidth={2.5} />
                </button>
              </div>
            )}
            <button 
              onClick={(e) => { e.stopPropagation(); setShowActions(!showActions); }} 
              className={`brutal-btn p-2.5 transition-all ${showActions ? "bg-brutal-white text-black" : "bg-black/50 text-white hover:bg-black/70"}`}
            >
              <MoreVertical className="w-4 h-4" strokeWidth={3} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onClose(); }} 
              className="brutal-btn p-2.5 bg-black/50 text-white hover:bg-red-500 hover:text-white transition-all"
            >
              <X className="w-5 h-5" strokeWidth={3} />
            </button>
          </div>
          </div>
        </div>

        {/* Hero Section: Image or Trailer */}
        <div className="relative w-full aspect-video overflow-hidden border-b-3 border-brutal-border bg-black">
          {playingTrailer && trailer ? (
            <iframe
              src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1&rel=0&modestbranding=1&showinfo=0`}
              title={trailer.name}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <>
              {movie.backdrop_path ? (
                <Image
                  src={backdropUrl(movie.backdrop_path, "small")}
                  alt={movie.title}
                  fill
                  className="object-cover opacity-80"
                  sizes="(max-width: 768px) 100vw, 768px"
                  priority
                />
              ) : (
                <div className="w-full h-full bg-surface-2 flex items-center justify-center font-mono text-brutal-dim">NO BACKDROP</div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent" />
              
              {/* Play Trailer Button on Hero */}
              {trailer && (
                <button
                  onClick={() => setPlayingTrailer(true)}
                  className="absolute bottom-5 right-5 z-40 group brutal-btn p-3 bg-brutal-yellow text-black hover:!text-black hover:scale-110 active:scale-95 transition-all"
                >
                  {/* Tooltip */}
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[9px] font-mono font-black uppercase px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-brutal-border">
                    TRAILER
                  </span>
                  <Play className="w-5 h-5 fill-current" />
                </button>
              )}
            </>
          )}

          {/* Title on Backdrop Overlay */}
          <div className="absolute bottom-4 left-6 z-10 pr-24">
            <h2 className="text-2xl sm:text-4xl font-display font-black text-brutal-white uppercase tracking-tight leading-none drop-shadow-lg">
              {movie.title}
            </h2>
            {details?.tagline && (
              <p className="text-brutal-yellow text-[10px] font-mono font-bold uppercase mt-1 tracking-widest">{details.tagline}</p>
            )}
          </div>
        </div>

        {/* Everything below hero — smooth grid-row reveal (Apple-style) */}
        <div
          style={{
            display: "grid",
            gridTemplateRows: cinemaRevealed ? "1fr" : "0fr",
            transition: "grid-template-rows 0.5s cubic-bezier(0.3, 1.25, 0.4, 1)",
            willChange: "grid-template-rows",
          }}
        >
          <div style={{ overflow: "hidden" }}>
            {/* Fade + slide inner wrapper */}
            <div
              style={{
                opacity: cinemaRevealed ? 1 : 0,
                transform: cinemaRevealed ? "translateY(0)" : "translateY(15px)",
                transition: "opacity 0.4s cubic-bezier(0.3, 1.25, 0.4, 1), transform 0.4s cubic-bezier(0.3, 1.25, 0.4, 1)",
                transitionDelay: cinemaRevealed ? "0.05s" : "0s",
                willChange: "opacity, transform",
              }}
            >
          {/* Info Grid / Meta Bar */}
          <div className="flex flex-wrap items-center gap-4 px-6 py-4 border-b-3 border-brutal-border bg-surface-2">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-black border border-brutal-border">
            <Star className="w-3.5 h-3.5 text-brutal-yellow fill-current" />
            <span className="text-xs font-mono font-black text-brutal-yellow">{rating}</span>
          </div>
          <div className="text-xs font-mono font-bold text-brutal-muted uppercase">{year}</div>
          {runtime && (
            <div className="text-xs font-mono font-bold text-brutal-muted uppercase">
              {Math.floor(runtime / 60)}H {runtime % 60}M
            </div>
          )}
          {movie.media_type === "tv" && (
            <div className="brutal-chip bg-brutal-cyan text-black px-2 py-0.5 text-[10px] uppercase font-black">TV SERIES</div>
          )}
        </div>

        {/* Collection Banner */}
        {details?.belongs_to_collection && (
          <a
            href={`/collections?id=${details.belongs_to_collection.id}`}
            className={`flex items-center justify-between px-6 py-3 bg-brutal-violet text-black border-b-3 border-brutal-border hover:bg-brutal-violet/90 transition-all group ${
              cinemaRevealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
            style={{ transition: "opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s" }}
          >
            <div className="flex items-center gap-3">
              <Film className="w-5 h-5" />
              <div className="flex flex-col">
                <span className="text-[10px] font-mono font-black uppercase tracking-widest opacity-70">PART OF THE COLLECTION</span>
                <span className="text-sm font-display font-black uppercase tracking-tight">{details.belongs_to_collection.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 font-mono font-black text-xs group-hover:translate-x-1 transition-transform">
              FRANCHISE VAULT <ArrowLeft className="w-4 h-4 rotate-180" strokeWidth={3} />
            </div>
          </a>
        )}

        {/* Content Section — Bento Grid */}
        <div
          className={`px-6 pb-10 bg-bg transition-all duration-700 ease-out ${
            cinemaRevealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
          }`}
          style={{ transitionDelay: cinemaRevealed ? "0.15s" : "0s" }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-4 pt-6">
            
            {/* LEFT: Info + Synopsis + Cast */}
            <div className="flex flex-col gap-5 min-w-0">
              
              {/* Genres */}
              {genres.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {genres.map((g) => (
                    <span key={g.id} className="brutal-chip bg-transparent border-2 border-brutal-border text-brutal-white font-mono font-bold text-[10px] uppercase px-2 py-0.5">
                      {g.name}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Synopsis */}
              {movie.overview && (
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-[9px] font-mono font-black text-brutal-dim uppercase tracking-widest">SYNOPSIS</h3>
                  <p className="text-brutal-white text-[13px] leading-relaxed opacity-90">{movie.overview}</p>
                </div>
              )}

              {/* Cast */}
              {cast.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-brutal-violet" />
                    <h3 className="text-[9px] font-mono font-black text-brutal-dim uppercase tracking-widest">CAST</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {cast.slice(0, 6).map((member) => (
                      <button
                        key={member.id}
                        onClick={() => onActorClick?.(member.id)}
                        className="flex items-center gap-2 border-2 border-brutal-border bg-surface p-2 hover:border-brutal-violet hover:shadow-brutal-sm transition-all text-left"
                      >
                        <div className="w-8 h-8 bg-surface-2 overflow-hidden border border-brutal-border flex-shrink-0">
                          {member.profile_path ? (
                            <Image src={`https://image.tmdb.org/t/p/w185${member.profile_path}`} alt={member.name} width={32} height={32} className="object-cover w-full h-full" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-black text-xs">{member.name[0]}</div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase text-brutal-white truncate">{member.name}</p>
                          <p className="text-[9px] font-mono font-bold text-brutal-dim truncate">{member.character}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: More Like This bento panel */}
            {similar.length > 0 && (
              <div className="flex flex-col gap-2 border-l-2 border-brutal-border pl-4">
                <h3 className="text-[9px] font-mono font-black text-brutal-dim uppercase tracking-widest pb-1">MORE LIKE THIS</h3>
                <div className="grid grid-cols-2 gap-2">
                  {similar.slice(0, 6).map((sim) => (
                    <div
                      key={sim.id}
                      onClick={() => setHistory(prev => [...prev, sim])}
                      className="group border-2 border-brutal-border bg-black aspect-[2/3] relative cursor-pointer hover:border-brutal-yellow transition-all overflow-hidden"
                    >
                      {sim.poster_path ? (
                        <Image src={posterUrl(sim.poster_path)} alt={sim.title ?? sim.name ?? ""} fill className="object-cover transition-transform group-hover:scale-110" sizes="120px" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-1 text-center text-[9px] font-black uppercase">{sim.title ?? sim.name}</div>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5">
                        <p className="text-[9px] font-black uppercase text-white line-clamp-2">{sim.title ?? sim.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>{/* end content section */}
            </div>{/* end fade+slide inner wrapper */}
          </div>{/* end overflow:hidden inner */}
        </div>{/* end grid-row collapsible wrapper */}
      </div>
    </div>
  );
}
