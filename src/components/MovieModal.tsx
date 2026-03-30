"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { X, Star, Users, Bookmark, Play, ExternalLink, Link as LinkIcon, Film, Heart, CheckCircle, ArrowLeft, MoreVertical, Plus } from "lucide-react";
import { TMDBMovie, TMDBMovieDetail, TMDBVideo, TMDBWatchProvider, TMDBPerson } from "@/lib/types";
import { toMovieSlug } from "@/lib/slugify";
import { backdropUrl, posterUrl, logoUrl } from "@/lib/constants";
import { useMovieLists } from "@/hooks/useMovieLists";
import { useRegion } from "@/hooks/useRegion";
import { useBlockModal } from "@/components/BlockModalProvider";
import { useConvexAuth } from "convex/react";

interface MovieModalProps {
  movie: TMDBMovie | null;
  onClose: () => void;
  onBack?: () => void;
  requireAuthForActions?: boolean;
  onRequireAuth?: () => void;
}

export default function MovieModal({
  movie: rootMovie,
  onClose,
  onBack,
  requireAuthForActions = false,
  onRequireAuth,
}: MovieModalProps) {
  const { isAuthenticated } = useConvexAuth();
  const [history, setHistory] = useState<TMDBMovie[]>([]);
  const [showActions, setShowActions] = useState(false);
  const [cinemaRevealed, setCinemaRevealed] = useState(false);
  const [selectedActorId, setSelectedActorId] = useState<number | null>(null);
  const [actorPerson, setActorPerson] = useState<TMDBPerson | null>(null);
  const [actorLoading, setActorLoading] = useState(false);
  const [dragY, setDragY] = useState(0);
  const touchStartY = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    const delta = Math.max(0, e.touches[0].clientY - touchStartY.current);
    setDragY(delta);
  };
  const handleTouchEnd = () => {
    if (dragY > 90) { onClose(); }
    setDragY(0);
  };

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

  // Reset actor panel when movie changes
  useEffect(() => { setSelectedActorId(null); setActorPerson(null); }, [movie?.id]);

  useEffect(() => {
    if (!selectedActorId) { setActorPerson(null); return; }
    setActorLoading(true);
    fetch(`/api/movies?action=person&id=${selectedActorId}`)
      .then((r) => r.json())
      .then(setActorPerson)
      .catch(console.error)
      .finally(() => setActorLoading(false));
  }, [selectedActorId]);

  const [details, setDetails] = useState<TMDBMovieDetail | null>(null);
  const [watchProviders, setWatchProviders] = useState<{ [countryCode: string]: any } | null>(null);
  const { region, setRegion } = useRegion();
  const [playingTrailer, setPlayingTrailer] = useState(false);
  const [copied, setCopied] = useState(false);
  const [similar, setSimilar] = useState<TMDBMovie[]>([]);
  const { isLiked, toggleLiked, isInWatchlist, toggleWatchlist, isWatched, toggleWatched } = useMovieLists();
  const { openBlockModal } = useBlockModal();

  const allowAction = useCallback(() => {
    if (requireAuthForActions && !isAuthenticated) {
      onRequireAuth?.();
      return false;
    }
    return true;
  }, [requireAuthForActions, isAuthenticated, onRequireAuth]);

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!movie) return;
    const type = movie.media_type === "tv" ? "tv" : "movie";
    const slug = toMovieSlug(movie.title || "", movie.id);
    const url = `${window.location.origin}/${type}/${slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchDetails = useCallback(async (id: number, type: "movie" | "tv") => {
    setPlayingTrailer(false);
    setSimilar([]);
    try {
      const detailAction = type === "tv" ? "tv-details" : "details";
      const similarAction = type === "tv" ? "recommendations-tv" : "recommendations";
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
        const results = wpData.results || {};
        setWatchProviders(results);
        // Keep user's detected region if available, else fallback
        if (!results[region]) {
          if (results["US"]) setRegion("US");
          else if (Object.keys(results).length > 0) setRegion(Object.keys(results)[0]);
        }
      }
      
      if (simRes.ok) {
        const simData = await simRes.json();
        setSimilar(simData.results?.slice(0, 15).map((m: any) => ({
          ...m,
          media_type: type
        })) || []);
      }
    } catch (err) {
      console.error(err);
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
  const releaseYear = movie.release_date?.split("-")[0] || movie.first_air_date?.split("-")[0] || "";

  // All provider links go to JustWatch search — reliable, works for every platform
  const getProviderUrl = (_provider: TMDBWatchProvider, title: string, _year?: string): string => {
    const q = encodeURIComponent(title);
    return `https://www.justwatch.com/us/search?q=${q}`;
  };

  const REGIONS = [
    { code: "IN", label: "India" },
    { code: "US", label: "USA" },
    { code: "GB", label: "UK" },
    { code: "CA", label: "Canada" },
    { code: "AU", label: "Australia" },
    { code: "DE", label: "Germany" },
    { code: "FR", label: "France" },
    { code: "JP", label: "Japan" },
    { code: "KR", label: "Korea" },
    { code: "BR", label: "Brazil" },
    { code: "MX", label: "Mexico" },
    { code: "SG", label: "Singapore" },
  ];

  return (
    <div
      className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />

      <div
        className="relative w-full sm:max-w-6xl sm:mx-4 max-h-[92svh] sm:max-h-[85vh] overflow-y-auto overflow-x-hidden overscroll-contain bg-bg border-3 border-brutal-border shadow-brutal-lg animate-slide-up rounded-t-xl sm:rounded-none"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: dragY > 0 ? `translateY(${dragY * 0.4}px)` : undefined,
          transition: dragY === 0 ? "transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)" : "none",
          opacity: dragY > 0 ? Math.max(0.6, 1 - dragY / 300) : 1,
        }}
      >
        {/* Swipe handle — mobile only */}
        <div className="flex justify-center pt-2.5 pb-1 sm:hidden sticky top-0 z-50 pointer-events-none">
          <div className="w-10 h-1 bg-brutal-dim rounded-full opacity-60" />
        </div>

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
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!allowAction()) return;
                    toggleLiked(movie);
                  }}
                  className={`brutal-btn border-none p-2.5 transition-all ${liked ? "text-brutal-pink" : "text-white"}`}
                  title="Like"
                >
                  <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} strokeWidth={2.5} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!allowAction()) return;
                    toggleWatchlist(movie);
                  }}
                  className={`brutal-btn border-none p-2.5 transition-all ${inWl ? "text-brutal-lime" : "text-white"}`}
                  title="Watchlist"
                >
                  <Bookmark className={`w-4 h-4 ${inWl ? "fill-current" : ""}`} strokeWidth={2.5} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!allowAction()) return;
                    toggleWatched(movie);
                  }}
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
                  src={backdropUrl(movie.backdrop_path, "large")}
                  alt={movie.title}
                  fill
                  className="object-cover opacity-80"
                  sizes="(max-width: 1280px) 100vw, 1280px"
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
                  className="absolute bottom-[5.5rem] right-6 z-40 group brutal-btn p-5 bg-brutal-yellow text-black hover:!text-black hover:scale-110 active:scale-95 transition-all"
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

          {/* Title/logo hides while trailer plays and reappears only when hovering this area */}
          <div
            className={`group/title absolute bottom-4 left-6 z-10 ${playingTrailer ? "pointer-events-auto" : ""}`}
            style={{ maxWidth: "60%" }}
          >
            <div className={`transition-opacity duration-700 ease-in-out ${playingTrailer ? "opacity-0 group-hover/title:opacity-100" : "opacity-100"}`}>
            {movie.logo_path ? (
              <Image
                src={logoUrl(movie.logo_path, "original")}
                alt={movie.title}
                width={800}
                height={320}
                className="object-contain object-left drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]"
                style={{ width: "100%", height: "auto", maxHeight: "120px" }}
              />
            ) : (
              <h2 className="text-2xl sm:text-4xl font-display font-black text-brutal-white uppercase tracking-tight leading-none drop-shadow-lg">
                {movie.title}
              </h2>
            )}
            {details?.tagline && (
              <p className="text-brutal-yellow text-[10px] font-mono font-bold uppercase mt-1 tracking-widest">{details.tagline}</p>
            )}
            </div>
          </div>

          {/* Meta — bottom right of backdrop */}
          <div className="absolute bottom-4 right-6 z-10 flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-1.5 bg-black/60 border border-brutal-border px-2.5 py-1 backdrop-blur-sm">
              <Star className="w-3.5 h-3.5 text-brutal-yellow fill-current" />
              <span className="text-sm font-mono font-black text-brutal-yellow">{rating}</span>
            </div>
            <div className="flex items-center gap-2 bg-black/60 border border-brutal-border px-2.5 py-1 backdrop-blur-sm">
              <span className="text-xs font-mono font-bold text-brutal-white">{year}</span>
              {runtime && (
                <span className="text-xs font-mono font-bold text-brutal-muted">{Math.floor(runtime / 60)}H {runtime % 60}M</span>
              )}
            </div>
          </div>
        </div>

        {/* Everything below hero — GPU-composited reveal (opacity + transform only, no layout triggers) */}
        <div
          style={{
            overflow: "hidden",
            maxHeight: cinemaRevealed ? "9999px" : "0px",
            transition: cinemaRevealed ? "max-height 0.6s cubic-bezier(0.3, 1.25, 0.4, 1)" : "max-height 0.3s ease",
          }}
        >
          <div>
            {/* Fade + slide — GPU composited (opacity + transform only) */}
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
          {movie.media_type === "tv" && (
            <div className="flex items-center gap-4 px-6 py-3 border-b-3 border-brutal-border bg-surface-2">
              <div className="brutal-chip bg-brutal-cyan text-black px-2 py-0.5 text-[10px] uppercase font-black">TV SERIES</div>
            </div>
          )}

        {/* WHERE TO WATCH */}
        {watchProviders !== null && (
          <div className="px-6 py-4 border-b-3 border-brutal-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[9px] font-mono font-black text-brutal-dim uppercase tracking-widest">WHERE TO WATCH</h3>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="brutal-input px-2 py-0.5 text-[9px] font-mono font-bold bg-surface text-brutal-white border-brutal-border focus:border-brutal-yellow outline-none cursor-pointer"
              >
                {REGIONS.map((r) => (
                  <option key={r.code} value={r.code}>{r.label}</option>
                ))}
              </select>
            </div>

            {currentProviders?.flatrate?.length > 0 && (
              <div className="mb-3">
                <p className="text-[9px] font-mono font-bold text-brutal-lime uppercase tracking-widest mb-2">STREAM</p>
                <div className="flex flex-wrap gap-2">
                  {currentProviders.flatrate.map((p: TMDBWatchProvider) => {
                    const url = getProviderUrl(p, movie.title ?? movie.name ?? "", releaseYear);
                    return (
                      <a
                        key={p.provider_id}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={p.provider_name}
                        className="flex items-center gap-2 px-2.5 py-1.5 bg-surface border-2 border-brutal-border hover:border-brutal-lime hover:shadow-brutal-sm transition-all group"
                      >
                        {p.logo_path && (
                          <Image
                            src={`https://image.tmdb.org/t/p/original${p.logo_path}`}
                            alt={p.provider_name}
                            width={20}
                            height={20}
                            className="rounded-sm w-5 h-5 object-cover"
                          />
                        )}
                        <span className="text-[10px] font-mono font-bold text-brutal-white group-hover:text-brutal-lime transition-colors whitespace-nowrap">{p.provider_name}</span>
                        <ExternalLink className="w-2.5 h-2.5 text-brutal-dim group-hover:text-brutal-lime transition-colors" strokeWidth={2.5} />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {currentProviders?.rent?.length > 0 && (
              <div className="mb-3">
                <p className="text-[9px] font-mono font-bold text-brutal-yellow uppercase tracking-widest mb-2">RENT</p>
                <div className="flex flex-wrap gap-2">
                  {currentProviders.rent.map((p: TMDBWatchProvider) => {
                    const url = getProviderUrl(p, movie.title ?? movie.name ?? "", releaseYear);
                    return (
                      <a
                        key={p.provider_id}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={p.provider_name}
                        className="flex items-center gap-2 px-2.5 py-1.5 bg-surface border-2 border-brutal-border hover:border-brutal-yellow hover:shadow-brutal-sm transition-all group"
                      >
                        {p.logo_path && (
                          <Image
                            src={`https://image.tmdb.org/t/p/original${p.logo_path}`}
                            alt={p.provider_name}
                            width={20}
                            height={20}
                            className="rounded-sm w-5 h-5 object-cover"
                          />
                        )}
                        <span className="text-[10px] font-mono font-bold text-brutal-white group-hover:text-brutal-yellow transition-colors whitespace-nowrap">{p.provider_name}</span>
                        <ExternalLink className="w-2.5 h-2.5 text-brutal-dim group-hover:text-brutal-yellow transition-colors" strokeWidth={2.5} />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {currentProviders?.buy?.length > 0 && (
              <div className="mb-1">
                <p className="text-[9px] font-mono font-bold text-brutal-cyan uppercase tracking-widest mb-2">BUY</p>
                <div className="flex flex-wrap gap-2">
                  {currentProviders.buy.map((p: TMDBWatchProvider) => {
                    const url = getProviderUrl(p, movie.title ?? movie.name ?? "", releaseYear);
                    return (
                      <a
                        key={p.provider_id}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={p.provider_name}
                        className="flex items-center gap-2 px-2.5 py-1.5 bg-surface border-2 border-brutal-border hover:border-brutal-cyan hover:shadow-brutal-sm transition-all group"
                      >
                        {p.logo_path && (
                          <Image
                            src={`https://image.tmdb.org/t/p/original${p.logo_path}`}
                            alt={p.provider_name}
                            width={20}
                            height={20}
                            className="rounded-sm w-5 h-5 object-cover"
                          />
                        )}
                        <span className="text-[10px] font-mono font-bold text-brutal-white group-hover:text-brutal-cyan transition-colors whitespace-nowrap">{p.provider_name}</span>
                        <ExternalLink className="w-2.5 h-2.5 text-brutal-dim group-hover:text-brutal-cyan transition-colors" strokeWidth={2.5} />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {!currentProviders && (
              <p className="text-[11px] font-mono text-brutal-dim italic">Not available for streaming in {REGIONS.find(r => r.code === region)?.label ?? region}</p>
            )}

          </div>
        )}

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
          className={`px-6 pb-6 bg-bg transition-all duration-700 ease-out ${
            cinemaRevealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
          }`}
          style={{ transitionDelay: cinemaRevealed ? "0.15s" : "0s" }}
        >
          <div className="flex flex-col gap-6 pt-6">
            
            {/* TOP: Info + Synopsis + Cast */}
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
                        onClick={() => setSelectedActorId(member.id)}
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
            {/* BOTTOM: More Like This Horizontal Scroll */}
            {similar.length > 0 && (
              <div className="flex flex-col gap-3 pt-6 border-t-2 border-brutal-border">
                <h3 className="text-[9px] font-mono font-black text-brutal-dim uppercase tracking-widest">MORE LIKE THIS</h3>
                <div className="flex gap-4 overflow-x-auto pb-4 snap-x overscroll-x-contain hide-scrollbar">
                  {similar.map((sim) => (
                    <div
                      key={sim.id}
                      onClick={() => setHistory(prev => [...prev, sim])}
                      className="flex-none w-[120px] sm:w-[140px] snap-start group border-2 border-brutal-border bg-black aspect-[2/3] relative cursor-pointer hover:border-brutal-yellow transition-all overflow-hidden"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!allowAction()) return;
                          openBlockModal({
                            id: sim.id,
                            title: sim.title || sim.name || "Untitled",
                            posterPath: sim.poster_path || "",
                          });
                        }}
                        className="absolute top-0 left-0 z-20 border-b-2 border-r-2 border-brutal-border bg-black/80 p-1.5 text-brutal-dim transition-colors hover:bg-brutal-violet hover:text-brutal-white"
                        aria-label="Add to CineBlock"
                        title="Add to CineBlock"
                      >
                        <Plus className="h-3.5 w-3.5" strokeWidth={3} />
                      </button>
                      {sim.poster_path ? (
                        <Image src={posterUrl(sim.poster_path)} alt={sim.title ?? sim.name ?? ""} fill className="object-cover transition-transform group-hover:scale-110" sizes="140px" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-1 text-center text-[9px] font-black uppercase">{sim.title ?? sim.name}</div>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                        <p className="text-[10px] font-black uppercase text-white line-clamp-2">{sim.title ?? sim.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>{/* end content section */}
            </div>{/* end fade+slide inner wrapper */}
          </div>
        </div>{/* end max-height reveal wrapper */}

      </div>{/* end movie modal */}

      {/* Actor side panel — attached to right of movie modal */}
      <div
        className="relative z-10 flex-none overflow-y-auto overflow-x-hidden bg-bg h-[92svh] sm:h-[85vh] border-brutal-border"
        style={{
          width: selectedActorId ? "22rem" : "0px",
          overflowY: selectedActorId ? "auto" : "hidden",
          overflowX: "hidden",
          borderWidth: selectedActorId ? "3px" : "0px",
          borderLeftWidth: selectedActorId ? "3px" : "0px",
          borderTopWidth: selectedActorId ? "3px" : "0px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-[22rem]">
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-bg border-b-3 border-brutal-border">
            <button onClick={() => setSelectedActorId(null)} className="brutal-btn p-2 flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" strokeWidth={3} />
              <span className="text-xs font-mono font-bold">BACK</span>
            </button>
          </div>

          {actorLoading ? (
            <div className="p-4 flex flex-col gap-3">
              <div className="w-full h-32 brutal-shimmer" />
              <div className="grid grid-cols-3 gap-2">
                {[...Array(6)].map((_, i) => <div key={i} className="aspect-[2/3] brutal-shimmer" />)}
              </div>
            </div>
          ) : actorPerson ? (
            <div>
              {/* Bio */}
              <div className="flex gap-4 p-4 border-b-3 border-brutal-border bg-surface-2">
                <div className="flex-shrink-0 w-16 h-22 border-3 border-brutal-border overflow-hidden">
                  {actorPerson.profile_path ? (
                    <Image src={`https://image.tmdb.org/t/p/w185${actorPerson.profile_path}`} alt={actorPerson.name} width={64} height={88} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-surface font-black">{actorPerson.name[0]}</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-display font-black text-brutal-white uppercase tracking-tight mb-1 leading-tight">{actorPerson.name}</h2>
                  {actorPerson.known_for_department && (
                    <span className="brutal-chip bg-brutal-violet text-white px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase">{actorPerson.known_for_department}</span>
                  )}
                  {actorPerson.biography && (
                    <p className="mt-2 text-brutal-white text-[11px] leading-relaxed line-clamp-3 opacity-80">{actorPerson.biography}</p>
                  )}
                </div>
              </div>

              {/* Filmography */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Film className="w-3 h-3 text-brutal-violet" strokeWidth={2.5} />
                  <h3 className="text-[9px] font-mono font-black text-brutal-dim uppercase tracking-widest">FILMOGRAPHY</h3>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(actorPerson.movie_credits?.cast || [])
                    .filter((m) => m.poster_path)
                    .sort((a, b) => b.popularity - a.popularity)
                    .slice(0, 12)
                    .map((m) => (
                      <div
                        key={m.id}
                        className="group relative aspect-[2/3] border-2 border-brutal-border bg-surface cursor-pointer hover:border-brutal-violet transition-all overflow-hidden"
                        onClick={() => { setHistory((prev) => [...prev, { ...m, original_title: m.title, genre_ids: [], adult: false, popularity: m.popularity } as TMDBMovie]); setSelectedActorId(null); }}
                      >
                        <Image src={posterUrl(m.poster_path, "small")} alt={m.title} fill className="object-cover group-hover:scale-105 transition-transform" sizes="100px" />
                        <div className="absolute inset-x-0 bottom-0 p-1 bg-black/90 border-t border-brutal-border translate-y-full group-hover:translate-y-0 transition-transform">
                          <p className="text-[8px] font-black uppercase text-white truncate">{m.title}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Star className="w-2 h-2 text-brutal-yellow fill-current" />
                            <span className="text-[8px] font-mono text-brutal-yellow font-bold">{m.vote_average.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
