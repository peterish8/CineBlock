"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { X, Star, Calendar, Clock, Users, Bookmark, Play, Tv, ExternalLink, Link as LinkIcon, Film, Heart, CheckCircle, ArrowLeft, MoreVertical } from "lucide-react";
import { TMDBMovie, TMDBMovieDetail, TMDBVideo, TMDBWatchProvider } from "@/lib/types";
import { toMovieSlug } from "@/lib/slugify";
import { backdropUrl, posterUrl } from "@/lib/constants";
import { useMovieLists } from "@/hooks/useMovieLists";
import { useRegion } from "@/hooks/useRegion";

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

  const [details, setDetails] = useState<TMDBMovieDetail | null>(null);
  const [watchProviders, setWatchProviders] = useState<{ [countryCode: string]: any } | null>(null);
  const { region, setRegion } = useRegion();
  const [loading, setLoading] = useState(false);
  const [playingTrailer, setPlayingTrailer] = useState(false);
  const [copied, setCopied] = useState(false);
  const [similar, setSimilar] = useState<TMDBMovie[]>([]);
  const { isLiked, toggleLiked, isInWatchlist, toggleWatchlist, isWatched, toggleWatched } = useMovieLists();

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
  const jwLink = currentProviders?.link || null;

  // Search-based OTT deep links — takes user directly to movie search on each platform
  const getProviderUrl = (providerId: number, title: string): string => {
    const q = encodeURIComponent(title);
    const urls: Record<number, string> = {
      8:   `https://www.netflix.com/search?q=${q}`,
      9:   `https://www.primevideo.com/search/ref=atv_sr_sug_1?phrase=${q}&ie=UTF8`,
      15:  `https://www.hulu.com/search?q=${q}`,
      337: `https://www.disneyplus.com/search/${q}`,
      350: `https://tv.apple.com/search?term=${q}`,
      384: `https://www.max.com/search?q=${q}`,
      386: `https://www.peacocktv.com/search?query=${q}`,
      531: `https://www.paramountplus.com/search/${q}/`,
      283: `https://www.crunchyroll.com/search?q=${q}`,
      11:  `https://mubi.com/search?q=${q}`,
      122: `https://www.hotstar.com/in/search?q=${q}`,
      220: `https://www.jiocinema.com/search/${q}`,
      232: `https://www.zee5.com/search?q=${q}`,
      237: `https://www.sonyliv.com/search?q=${q}`,
      315: `https://www.sonyliv.com/search?q=${q}`,
      190: `https://erosnow.com/search?query=${q}`,
      218: `https://www.altbalaji.com/search?q=${q}`,
      121: `https://www.mxplayer.in/search?q=${q}`,
      191: `https://www.sunnxt.com/search?query=${q}`,
      633: `https://www.aha.video/search?q=${q}`,
      226: `https://www.discoveryplus.com/search/${q}`,
      257: `https://www.fubo.tv/search/${q}`,
      43:  `https://www.starz.com/us/en/search?q=${q}`,
    };
    return urls[providerId] ?? jwLink ?? "#";
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
        className="relative w-full sm:max-w-3xl sm:mx-4 max-h-[92svh] sm:max-h-[85vh] overflow-y-auto overscroll-contain bg-bg border-3 border-brutal-border shadow-brutal-lg animate-slide-up rounded-t-xl sm:rounded-none"
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
                    const url = getProviderUrl(p.provider_id, movie.title ?? movie.name ?? "");
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
                    const url = getProviderUrl(p.provider_id, movie.title ?? movie.name ?? "");
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
                    const url = getProviderUrl(p.provider_id, movie.title ?? movie.name ?? "");
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

            {jwLink && (
              <a href={jwLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-3 text-[9px] font-mono font-bold text-brutal-dim hover:text-brutal-yellow transition-colors uppercase tracking-widest">
                <ExternalLink className="w-2.5 h-2.5" strokeWidth={2.5} />
                View all options on JustWatch
              </a>
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
          </div>
        </div>{/* end max-height reveal wrapper */}
      </div>
    </div>
  );
}
