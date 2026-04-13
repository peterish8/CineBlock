"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X, Star, Users, Bookmark, Play, ExternalLink, Link as LinkIcon, Film, Heart, CheckCircle, ArrowLeft, MoreVertical, Plus, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TMDBMovie, TMDBMovieDetail, TMDBVideo, TMDBWatchProvider, TMDBPerson } from "@/lib/types";
import { toMovieSlug } from "@/lib/slugify";
import { backdropUrl, posterUrl, logoUrl } from "@/lib/constants";
import { useMovieLists } from "@/hooks/useMovieLists";
import { useRegion } from "@/hooks/useRegion";
import { useBlockModal } from "@/components/BlockModalProvider";
import { useConvexAuth } from "convex/react";
import { useThemeMode } from "@/hooks/useThemeMode";

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

  // Reset actor panel and active category when movie changes
  useEffect(() => { 
    setSelectedActorId(null); 
    setActorPerson(null); 
    setActiveCategory(null);
  }, [movie?.id]);

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
  const [activeCategory, setActiveCategory] = useState<"flatrate" | "rent" | "buy" | null>(null);
  const { isLiked, toggleLiked, isInWatchlist, toggleWatchlist, isWatched, toggleWatched } = useMovieLists();
  const { openBlockModal } = useBlockModal();
  const [regionDropOpen, setRegionDropOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const regionBtnRef = useRef<HTMLButtonElement>(null);
  const regionDropRef = useRef<HTMLDivElement>(null);
  const [dropPos, setDropPos] = useState({ top: 0, right: 0 });
  const theme = useThemeMode();
  const isGlass = theme === "glass";
  const isNetflix = theme === "netflix";

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close region dropdown on outside click/tap
  useEffect(() => {
    if (!regionDropOpen) return;
    const close = (e: PointerEvent) => {
      if (regionDropRef.current?.contains(e.target as Node)) return;
      if (regionBtnRef.current?.contains(e.target as Node)) return;
      setRegionDropOpen(false);
    };
    document.addEventListener("pointerdown", close, { capture: true });
    return () => document.removeEventListener("pointerdown", close, { capture: true });
  }, [regionDropOpen]);

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
        
        // Auto-select first available category for mobile switcher ONLY if not already set
        const res = results[region] || {};
        setActiveCategory(prev => {
          if (prev) return prev; // Keep current if user already interacted
          if (res.flatrate?.length) return "flatrate";
          if (res.rent?.length) return "rent";
          if (res.buy?.length) return "buy";
          return null;
        });

        // Keep user's detected region if available, else fallback
        if (!results[region]) {
          if (results["US"] && region !== "US") {
            setRegion("US");
          } else if (Object.keys(results).length > 0) {
            const fallback = Object.keys(results)[0];
            if (region !== fallback) setRegion(fallback);
          }
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
  }, [region, setRegion]);

  // 4. Handle Scroll Lock & Details Fetching
  useEffect(() => {
    if (movie) {
      fetchDetails(movie.id, movie.media_type || "movie");
      document.body.style.overflow = "hidden";
    } else {
      setDetails(null);
      setWatchProviders(null);
      setPlayingTrailer(false);
      // Clean up overflow only if no other modals explicitly exist
      const activeDialogs = document.querySelectorAll('[role="dialog"]').length;
      if (activeDialogs <= 1) {
        document.body.style.overflow = "";
      }
    }
    
    return () => {
      // Unmount cleanup (handles Back Button navigation)
      const activeDialogs = document.querySelectorAll('[role="dialog"]').length;
      if (activeDialogs <= 1) {
        document.body.style.overflow = "";
      }
    };
  }, [movie, fetchDetails]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Helper for category swiping on mobile
  const categories = (["flatrate", "rent", "buy"] as const).filter(c => watchProviders?.[region]?.[c]?.length > 0);
  
  const handleNextCategory = () => {
    if (!activeCategory) return;
    const idx = categories.indexOf(activeCategory);
    if (idx < categories.length - 1) setActiveCategory(categories[idx + 1]);
  };
  const handlePrevCategory = () => {
    if (!activeCategory) return;
    const idx = categories.indexOf(activeCategory);
    if (idx > 0) setActiveCategory(categories[idx - 1]);
  };

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
  const glassWatchedActionClass = watched
    ? "p-2 rounded-full transition-all text-emerald-300 shadow-[0_10px_28px_rgba(5,150,105,0.18)]"
    : "p-2 rounded-full transition-all text-white hover:bg-white/10";
  const glassWatchedActionStyle = watched
    ? {
        background: "linear-gradient(135deg, rgba(16,185,129,0.28), rgba(5,150,105,0.14))",
        border: "1px solid rgba(52,211,153,0.45)",
        backdropFilter: "blur(16px)",
      }
    : {
        background: "rgba(255,255,255,0.10)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(12px)",
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
      {/* Overlay — glass gets stronger blur */}
      <div className={`absolute inset-0 animate-fade-in ${
        isGlass
          ? "bg-[rgba(2,8,23,0.75)] backdrop-blur-[10px]"
          : isNetflix
          ? "bg-[rgba(0,0,0,0.78)]"
          : "bg-black/60 backdrop-blur-sm"
      }`} />

      <div
        className={`relative w-[calc(100%-1.5rem)] sm:w-full mx-auto sm:max-w-6xl sm:mx-4 max-h-[92svh] sm:max-h-[85vh] overflow-y-auto overflow-x-hidden overscroll-contain no-scrollbar ${
          isGlass
            ? "animate-glass-enter-bottom bg-[rgba(4,12,36,0.70)] backdrop-blur-[48px] saturate-[1.6] border border-white/[0.10] rounded-t-[28px] sm:rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.10)]"
            : isNetflix
            ? "animate-slide-up bg-[#181818] border border-white/[0.08] rounded-t-[24px] sm:rounded-md shadow-[0_28px_90px_rgba(0,0,0,0.75)]"
            : "animate-slide-up bg-bg border-3 border-brutal-border shadow-brutal-lg rounded-2xl sm:rounded-none"
        }`}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: dragY > 0 ? `translateY(${dragY * 0.4}px)` : undefined,
          transition: dragY === 0 ? "transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)" : "none",
          opacity: dragY > 0 ? Math.max(0.6, 1 - dragY / 300) : 1,
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {/* Swipe handle — mobile only (Overlay) */}
        <div className="absolute top-2.5 left-0 right-0 z-[60] flex justify-center sm:hidden pointer-events-none">
          <div className="w-10 h-1 bg-white/30 rounded-full" />
        </div>

        {/* Top Header Controls Area */}
        <div className="absolute top-0 left-0 right-0 z-50 h-32 pointer-events-none p-3 flex justify-between items-start">
          <div className="flex flex-col gap-2 pointer-events-auto">
            {(history.length > 1 || onBack) && (
              <button 
                onClick={(e) => { e.stopPropagation(); if (history.length > 1) { setHistory(prev => prev.slice(0, -1)); } else { onBack?.(); } }} 
                className={isGlass ? "p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all backdrop-blur-md border border-white/5 shadow-sm" : isNetflix ? "p-2 rounded-full bg-[rgba(42,42,42,0.92)] text-white border border-white/20 hover:border-white transition-all" : "brutal-btn p-2 bg-black/50 text-white hover:bg-brutal-white hover:text-black transition-all"}
              >
                <ArrowLeft className="w-4 h-4" strokeWidth={3} />
              </button>
            )}
          </div>

          <div className={`group/ctrl pointer-events-auto ${playingTrailer ? "p-6" : ""}`}>
            <div className={`flex items-start gap-2 transition-opacity duration-150 ${playingTrailer ? "opacity-0 group-hover/ctrl:opacity-100" : ""}`}>
              {showActions && (
                <div className="flex flex-row-reverse gap-0.5 animate-slide-up-faint">
                  <button onClick={(e) => { e.stopPropagation(); if (!allowAction()) return; toggleLiked(movie); }} className={isGlass ? `p-2 rounded-full transition-all hover:bg-white/10 ${liked ? "text-rose-400" : "text-white"}` : isNetflix ? `p-2 rounded-full transition-all border border-white/20 bg-[rgba(42,42,42,0.92)] ${liked ? "text-[#E50914] border-[#E50914]/60" : "text-white hover:border-white"}` : `brutal-btn border-none p-2 transition-all ${liked ? "text-brutal-pink" : "text-white"}`} title="Like">
                    <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} strokeWidth={2.5} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); if (!allowAction()) return; toggleWatchlist(movie); }} className={isGlass ? `p-2 rounded-full transition-all hover:bg-white/10 ${inWl ? "text-blue-400" : "text-white"}` : isNetflix ? `p-2 rounded-full transition-all border border-white/20 bg-[rgba(42,42,42,0.92)] ${inWl ? "text-white border-white/70" : "text-white hover:border-white"}` : `brutal-btn border-none p-2 transition-all ${inWl ? "text-brutal-lime" : "text-white"}`} title="Watchlist">
                    <Bookmark className={`w-4 h-4 ${inWl ? "fill-current" : ""}`} strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); if (!allowAction()) return; toggleWatched(movie); }}
                    className={isGlass ? glassWatchedActionClass : isNetflix ? `p-2 rounded-full transition-all border border-white/20 bg-[rgba(42,42,42,0.92)] ${watched ? "text-[#46D369] border-[#46D369]/60" : "text-white hover:border-white"}` : `brutal-btn border-none p-2 transition-all ${watched ? "text-brutal-cyan" : "text-white"}`}
                    style={isGlass ? glassWatchedActionStyle : undefined}
                    title="Watched"
                  >
                    <CheckCircle className={`w-4 h-4 ${watched ? "fill-current" : ""}`} strokeWidth={2.5} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleShare(e); }} className={isGlass ? `p-2 rounded-full transition-all hover:bg-white/10 ${copied ? "text-orange-400" : "text-white"}` : isNetflix ? `p-2 rounded-full transition-all border border-white/20 bg-[rgba(42,42,42,0.92)] ${copied ? "text-[#E50914] border-[#E50914]/60" : "text-white hover:border-white"}` : `brutal-btn border-none p-2 transition-all text-white hover:text-brutal-yellow ${copied ? "text-brutal-yellow" : ""}`} title="Share">
                    <LinkIcon className="w-4 h-4" strokeWidth={2.5} />
                  </button>
                </div>
              )}
              <button 
                onClick={(e) => { e.stopPropagation(); setShowActions(!showActions); }} 
                className={isGlass ? `p-2 rounded-full transition-all backdrop-blur-md border border-white/5 shadow-sm ${showActions ? "bg-white/20 text-white" : "bg-white/10 text-white hover:bg-white/20"}` : isNetflix ? `p-2 rounded-full transition-all border border-white/20 bg-[rgba(42,42,42,0.92)] ${showActions ? "text-white border-white" : "text-white hover:border-white"}` : `brutal-btn p-2 transition-all ${showActions ? "bg-brutal-white text-black" : "bg-black/50 text-white hover:bg-black/70"}`}
              >
                <MoreVertical className="w-4 h-4" strokeWidth={3} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); onClose(); }} className={isGlass ? "p-2 rounded-full transition-all backdrop-blur-md bg-white/10 text-white hover:bg-rose-500/80 hover:text-white border border-white/5 shadow-sm" : isNetflix ? "p-2 rounded-full border border-white/20 bg-[rgba(42,42,42,0.92)] text-white hover:border-white transition-all" : "brutal-btn p-2 bg-black/50 text-white hover:bg-red-500 hover:text-white transition-all"}>
                <X className="w-4.5 h-4.5" strokeWidth={3} />
              </button>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className={`relative w-full aspect-video overflow-hidden ${isGlass ? "bg-[rgba(4,12,36,1)]" : isNetflix ? "bg-black border-b border-white/10" : "bg-black border-b-3 border-brutal-border"}`}>
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
              {(movie.backdrop_path || details?.backdrop_path) ? (
                <Image
                  src={backdropUrl(movie.backdrop_path || details?.backdrop_path || "", "large")}
                  alt={movie.title}
                  fill
                  className={`object-cover ${isGlass ? "animate-backdrop-reveal" : isNetflix ? "animate-fade-in" : "opacity-80 animate-fade-in"}`}
                  sizes="(max-width: 1280px) 100vw, 1280px"
                  priority
                />
              ) : movie.poster_path ? (
                <Image src={posterUrl(movie.poster_path, "large")} alt={movie.title} fill className="object-cover opacity-60 blur-xl scale-110" sizes="(max-width: 1280px) 100vw, 1280px" />
              ) : (
                <div className={`w-full h-full bg-surface-2 flex items-center justify-center ${isGlass ? "font-sans text-white/40 font-medium" : "font-mono text-brutal-dim"}`}>NO BACKDROP</div>
              )}
              <div className={isGlass
                ? "absolute bottom-0 left-0 right-0 h-3/5 bg-gradient-to-t from-[rgba(4,12,36,1)] to-transparent"
                : isNetflix
                ? "absolute inset-0 bg-gradient-to-t from-[#181818] via-transparent to-transparent"
                : "absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent"
              } />
              
              {/* Metadata & Action Container (Right Side) */}
              <div className="absolute bottom-4 right-6 z-10 flex flex-col items-end gap-1.5 transition-opacity duration-700 ease-in-out">
                {trailer && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setPlayingTrailer(true); }}
                    className={isGlass ? "group p-2.5 sm:p-4 rounded-full bg-orange-500/80 hover:bg-orange-400 text-white backdrop-blur-md border border-white/20 transition-all hover:scale-110 active:scale-95 shadow-[0_0_20px_rgba(249,115,22,0.4)]" : isNetflix ? "group rounded-full bg-white text-black hover:bg-white/85 transition-all hover:scale-110 active:scale-95 p-2.5 sm:p-4" : "group brutal-btn p-2.5 sm:p-5 bg-brutal-yellow text-black hover:!text-black hover:scale-110 active:scale-95 transition-all shadow-brutal-sm sm:shadow-brutal"}
                  >
                    <Play className="w-4 h-4 sm:w-7 sm:h-7 fill-current" />
                  </button>
                )}
                <div className={`flex items-center gap-1.5 px-2.5 py-1 ${isGlass ? "bg-white/10 backdrop-blur-xl border border-white/10 rounded-full" : isNetflix ? "bg-black/55 border border-white/15 rounded-full backdrop-blur-sm" : "bg-black/60 border border-brutal-border backdrop-blur-sm"}`}>
                  <Star className={`w-3.5 h-3.5 fill-current ${isGlass ? "text-orange-400" : isNetflix ? "text-white" : "text-brutal-yellow"}`} />
                  <span className={isGlass ? "text-xs font-semibold text-white tracking-wide" : isNetflix ? "text-xs font-semibold text-white" : "text-sm font-mono font-black text-brutal-yellow"}>{rating}</span>
                </div>
                <div className={`flex items-center gap-2 px-2.5 py-1 ${isGlass ? "bg-white/10 backdrop-blur-xl border border-white/10 rounded-full" : isNetflix ? "bg-black/55 border border-white/15 rounded-full backdrop-blur-sm" : "bg-black/60 border border-brutal-border backdrop-blur-sm"}`}>
                  <span className={isGlass ? "text-xs font-medium text-white/90" : isNetflix ? "text-xs font-semibold text-white/90" : "text-xs font-mono font-bold text-brutal-white"}>{year}</span>
                  {runtime && <span className={isGlass ? "text-xs font-medium text-white/60" : isNetflix ? "text-xs font-medium text-white/60" : "text-xs font-mono font-bold text-brutal-muted"}>{Math.floor(runtime / 60)}H {runtime % 60}M</span>}
                </div>
              </div>
            </>
          )}

          {/* Title & Tagline Container (Left Side) */}
          <div className={`group/title absolute bottom-4 left-6 z-10 ${playingTrailer ? "pointer-events-none" : ""}`} style={{ maxWidth: "60%" }}>
            <div className={`transition-opacity duration-700 ease-in-out ${playingTrailer ? "opacity-0" : "opacity-100"}`}>
              {movie.logo_path ? (
                <Image src={logoUrl(movie.logo_path, "original")} alt={movie.title} width={800} height={320} className="object-contain object-left drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]" style={{ width: "100%", height: "auto", maxHeight: "130px" }} />
              ) : (
                <h2 className={isGlass ? "text-3xl sm:text-5xl font-display font-bold text-white tracking-tight leading-none drop-shadow-2xl" : isNetflix ? "text-2xl sm:text-4xl font-display font-black text-white tracking-tight leading-none drop-shadow-lg" : "text-2xl sm:text-4xl font-display font-black text-brutal-white uppercase tracking-tight leading-none drop-shadow-lg"}>{movie.title}</h2>
              )}
              {details?.tagline && <p className={isGlass ? "text-orange-300 text-xs font-medium mt-2 tracking-wide drop-shadow-md" : isNetflix ? "text-white/72 text-xs font-medium mt-2 tracking-wide" : "text-brutal-yellow text-[10px] font-mono font-bold uppercase mt-1 tracking-widest"}>{details.tagline}</p>}
            </div>
          </div>
        </div>
        {/* Below Hero Container */}
        <div style={{ overflow: "hidden", maxHeight: cinemaRevealed ? "9999px" : "0px", transition: cinemaRevealed ? "max-height 0.6s cubic-bezier(0.3, 1.25, 0.4, 1)" : "max-height 0.3s ease" }}>
          <div style={{
            opacity: cinemaRevealed ? 1 : 0,
            transform: cinemaRevealed ? "translateY(0)" : isGlass ? "translateY(20px)" : "translateY(15px)",
            filter: isGlass && !cinemaRevealed ? "blur(6px)" : "none",
            transition: isGlass
              ? "opacity 0.55s cubic-bezier(0.22,1,0.36,1), transform 0.55s cubic-bezier(0.22,1,0.36,1), filter 0.45s ease"
              : "opacity 0.4s easeOut, transform 0.4s easeOut",
          }}>
            
            {movie.media_type === "tv" && (
              <div className="flex items-center gap-4 px-6 py-3 border-b-3 border-brutal-border bg-surface-2">
                <div className="brutal-chip bg-brutal-cyan text-black px-2 py-0.5 text-[10px] uppercase font-black">TV SERIES</div>
              </div>
            )}

            {/* TWO-COLUMN GRID FOR LAPTOP VIEW */}
            <div className={isGlass ? "grid grid-cols-1 md:grid-cols-[1.2fr,1fr] border-b border-white/10 divide-y md:divide-y-0 md:divide-x divide-white/10" : "grid grid-cols-1 md:grid-cols-[1.2fr,1fr] border-b-3 border-brutal-border divide-y-3 md:divide-y-0 md:divide-x-3 divide-brutal-border"}>
              {/* Left Column: Where to Watch */}
              <div className="px-6 py-4 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex flex-col gap-0.5">
                    <h3 className={isGlass ? "text-[10px] font-sans font-medium text-slate-400 tracking-wider uppercase" : "text-[9px] font-mono font-black text-brutal-dim uppercase tracking-widest"}>WHERE TO WATCH</h3>
                    <div className={isGlass ? "flex sm:hidden gap-1.5 mt-1 bg-white/5 p-1 rounded-full items-center" : "flex sm:hidden gap-1.5 mt-1"}>
                      {currentProviders?.flatrate?.length > 0 && (
                        <button onClick={() => setActiveCategory("flatrate")} className={isGlass ? `px-3 py-1 text-[10px] font-medium transition-all rounded-full ${activeCategory === 'flatrate' ? "bg-white/20 shadow-md text-white" : "text-white/50"}` : `text-[8px] font-mono font-black border px-1.5 py-0.5 rounded-full transition-all uppercase ${activeCategory === 'flatrate' ? "bg-brutal-lime text-black border-brutal-lime" : "text-brutal-lime border-brutal-lime/30"}`}>STREAM</button>
                      )}
                      {currentProviders?.rent?.length > 0 && (
                        <button onClick={() => setActiveCategory("rent")} className={isGlass ? `px-3 py-1 text-[10px] font-medium transition-all rounded-full ${activeCategory === 'rent' ? "bg-white/20 shadow-md text-white" : "text-white/50"}` : `text-[8px] font-mono font-black border px-1.5 py-0.5 rounded-full transition-all uppercase ${activeCategory === 'rent' ? "bg-brutal-yellow text-black border-brutal-yellow" : "text-brutal-yellow border-brutal-yellow/30"}`}>RENT</button>
                      )}
                      {currentProviders?.buy?.length > 0 && (
                        <button onClick={() => setActiveCategory("buy")} className={isGlass ? `px-3 py-1 text-[10px] font-medium transition-all rounded-full ${activeCategory === 'buy' ? "bg-white/20 shadow-md text-white" : "text-white/50"}` : `text-[8px] font-mono font-black border px-1.5 py-0.5 rounded-full transition-all uppercase ${activeCategory === 'buy' ? "bg-brutal-cyan text-black border-brutal-cyan" : "text-brutal-cyan border-brutal-cyan/30"}`}>BUY</button>
                      )}
                    </div>
                  </div>
                  {isGlass ? (
                    <div className="relative">
                      <button
                        ref={regionBtnRef}
                        onClick={() => {
                          const rect = regionBtnRef.current?.getBoundingClientRect();
                          if (rect) setDropPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
                          setRegionDropOpen(o => !o);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/10 text-white/90 border border-white/15 backdrop-blur-md hover:bg-white/15 transition-all"
                      >
                        {REGIONS.find(r => r.code === region)?.label ?? region}
                        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${regionDropOpen ? "rotate-180" : ""}`} />
                      </button>
                      {/* Portal dropdown so it's never clipped by overflow-hidden */}
                      {mounted && regionDropOpen && createPortal(
                        <AnimatePresence>
                          {/* Outer: styled shell with border-radius + overflow:hidden to clip scrollbar inside */}
                          <motion.div
                            key="region-drop"
                            ref={regionDropRef}
                            initial={{ opacity: 0, y: -4, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.97 }}
                            transition={{ duration: 0.15 }}
                            style={{
                              position: "fixed",
                              top: dropPos.top,
                              right: dropPos.right,
                              zIndex: 9999,
                              background: "rgba(8,14,38,0.92)",
                              backdropFilter: "blur(28px)",
                              WebkitBackdropFilter: "blur(28px)",
                              border: "1px solid rgba(255,255,255,0.12)",
                              borderRadius: 16,
                              boxShadow: "0 16px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(96,165,250,0.12)",
                              width: 130,
                              overflow: "hidden",
                            }}
                          >
                            {/* Inner: scrollable — padded right so scrollbar has room for curved caps */}
                            <div
                              className="glass-region-drop"
                              style={{
                                maxHeight: 220,
                                overflowY: "auto",
                                paddingRight: 4,
                                scrollbarWidth: "thin",
                                scrollbarColor: "rgba(96,165,250,1) transparent",
                              }}
                            >
                              {REGIONS.map((r) => (
                                <button
                                  key={r.code}
                                  onClick={() => { setRegion(r.code); setRegionDropOpen(false); }}
                                  className={`w-full text-left px-4 py-2.5 text-xs font-medium transition-colors ${
                                    r.code === region
                                      ? "bg-blue-500/20 text-blue-200"
                                      : "text-white/70 hover:bg-white/8 hover:text-white"
                                  }`}
                                >
                                  {r.label}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        </AnimatePresence>,
                        document.body
                      )}
                    </div>
                  ) : (
                    <select value={region} onChange={(e) => setRegion(e.target.value)} className="brutal-input px-2 py-0.5 text-[9px] font-mono font-bold bg-surface text-brutal-white border-brutal-border focus:border-brutal-yellow outline-none cursor-pointer h-fit">
                      {REGIONS.map((r) => <option key={r.code} value={r.code}>{r.label}</option>)}
                    </select>
                  )}
                </div>

                <div className="relative">
                  {/* Desktop Container */}
                  <div className="hidden sm:flex flex-col gap-4">
                    {currentProviders?.flatrate?.length > 0 && (
                      <div className="flex-none">
                        <p className={isGlass ? "text-[10px] font-sans font-medium text-slate-400 tracking-wider mb-2" : "text-[9px] font-mono font-bold text-brutal-lime uppercase tracking-widest mb-2.5 px-0.5"}>STREAM</p>
                        <div className="flex flex-wrap gap-2">
                          {currentProviders.flatrate.map((p: TMDBWatchProvider) => <ProviderItem key={p.provider_id} provider={p} category="flatrate" movie={movie} releaseYear={releaseYear} region={region} isGlass={isGlass} />)}
                        </div>
                      </div>
                    )}
                    {currentProviders?.rent?.length > 0 && (
                      <div className="flex-none">
                        <p className={isGlass ? "text-[10px] font-sans font-medium text-slate-400 tracking-wider mb-2 mt-4" : "text-[9px] font-mono font-bold text-brutal-yellow uppercase tracking-widest mb-2.5 px-0.5"}>RENT</p>
                        <div className="flex flex-wrap gap-2">
                          {currentProviders.rent.map((p: TMDBWatchProvider) => <ProviderItem key={p.provider_id} provider={p} category="rent" movie={movie} releaseYear={releaseYear} region={region} isGlass={isGlass} />)}
                        </div>
                      </div>
                    )}
                    {currentProviders?.buy?.length > 0 && (
                      <div className="flex-none">
                        <p className={isGlass ? "text-[10px] font-sans font-medium text-slate-400 tracking-wider mb-2 mt-4" : "text-[9px] font-mono font-bold text-brutal-cyan uppercase tracking-widest mb-2.5 px-0.5"}>BUY</p>
                        <div className="flex flex-wrap gap-2">
                          {currentProviders.buy.map((p: TMDBWatchProvider) => <ProviderItem key={p.provider_id} provider={p} category="buy" movie={movie} releaseYear={releaseYear} region={region} isGlass={isGlass} />)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mobile Carousel */}
                  <div className="sm:hidden relative touch-pan-y overflow-visible">
                    <motion.div
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.2}
                      onDragEnd={(_, info) => {
                        const threshold = 50;
                        if (info.offset.x < -threshold) handleNextCategory();
                        else if (info.offset.x > threshold) handlePrevCategory();
                      }}
                      className="w-full cursor-grab active:cursor-grabbing"
                    >
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={activeCategory}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="w-full"
                        >
                          {activeCategory && currentProviders?.[activeCategory]?.length > 0 && (
                            <div className="flex flex-wrap gap-2 pb-1.5 min-h-[44px]">
                              {currentProviders[activeCategory].map((p: TMDBWatchProvider) => (
                                <ProviderItem key={p.provider_id} provider={p} category={activeCategory} movie={movie} releaseYear={releaseYear} region={region} isMobile isGlass={isGlass} />
                              ))}
                            </div>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </motion.div>
                  </div>
                </div>
                {!currentProviders && <p className="text-[11px] font-mono text-brutal-dim italic">Not available for streaming in {region}</p>}
              </div>

              {/* Right Column (Laptop View Only): Genres & Synopsis */}
              <div className={isGlass ? "hidden md:flex flex-col gap-5 px-6 py-6 bg-transparent" : "hidden md:flex flex-col gap-5 px-6 py-6 bg-black/20"}>
                {genres.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {genres.map((g) => <span key={g.id} className={isGlass ? "bg-white/5 border border-white/10 text-white/80 font-medium text-[10px] rounded-full px-2.5 py-1 backdrop-blur-md shadow-sm" : "brutal-chip bg-transparent border-2 border-brutal-border text-brutal-white font-mono font-bold text-[10px] uppercase px-2 py-0.5"}>{g.name}</span>)}
                  </div>
                )}
                {movie.overview && (
                  <div className="flex flex-col gap-1.5">
                    <h3 className={isGlass ? "text-[10px] font-sans font-medium text-slate-400 tracking-wider mb-1 uppercase" : "text-[9px] font-mono font-black text-brutal-dim uppercase tracking-widest"}>SYNOPSIS</h3>
                    <p className={isGlass ? "text-white/80 text-[13px] leading-relaxed font-medium" : "text-brutal-white text-[12px] leading-relaxed opacity-90"}>{movie.overview}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Collection Banner */}
            {details?.belongs_to_collection && (
              <a href={`/collections?id=${details.belongs_to_collection.id}`} className={isGlass ? "flex items-center justify-between px-6 py-4 bg-gradient-to-r from-orange-500/20 to-rose-500/10 border-b border-t border-white/5 hover:bg-orange-500/30 transition-all group backdrop-blur-md" : "flex items-center justify-between px-6 py-2.5 sm:py-3 bg-brutal-violet text-black border-b-3 border-brutal-border hover:bg-brutal-violet/90 transition-all group"}>
                <div className="flex items-center gap-3">
                  <Film className={isGlass ? "w-5 h-5 flex-shrink-0 text-orange-400" : "w-5 h-5 flex-shrink-0"} />
                  <div className="flex flex-col leading-tight">
                    <span className={isGlass ? "hidden sm:block text-[10px] font-semibold text-white/50 tracking-wider uppercase" : "hidden sm:block text-[10px] font-mono font-black uppercase tracking-widest opacity-70"}>PART OF THE COLLECTION</span>
                    <span className={isGlass ? "text-xs sm:text-sm font-bold text-white tracking-wide line-clamp-1" : "text-xs sm:text-sm font-display font-black uppercase tracking-tight line-clamp-1"}>{details.belongs_to_collection.name}</span>
                  </div>
                </div>
                <div className={isGlass ? "flex items-center gap-1.5 sm:gap-2 font-semibold text-[10px] sm:text-xs text-orange-200 group-hover:translate-x-1 transition-transform whitespace-nowrap" : "flex items-center gap-1.5 sm:gap-2 font-mono font-black text-[10px] sm:text-xs group-hover:translate-x-1 transition-transform whitespace-nowrap"}>
                  <span className="hidden sm:inline">FRANCHISE VAULT</span> <ArrowLeft className="w-3.5 h-3.5 rotate-180" strokeWidth={3} />
                </div>
              </a>
            )}

            <div className={isGlass ? "px-6 pb-6 bg-transparent flex flex-col gap-6 pt-6" : "px-6 pb-6 bg-bg flex flex-col gap-6 pt-6"}>
              {/* MOBILE ONLY: Genres & Synopsis */}
              <div className="flex flex-col gap-5 min-w-0 md:hidden">
                {genres.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {genres.map((g) => <span key={g.id} className={isGlass ? "bg-white/5 border border-white/10 text-white/80 font-medium text-[10px] rounded-full px-2.5 py-1 backdrop-blur-md shadow-sm" : "brutal-chip bg-transparent border-2 border-brutal-border text-brutal-white font-mono font-bold text-[10px] uppercase px-2 py-0.5"}>{g.name}</span>)}
                  </div>
                )}
                {movie.overview && (
                  <div className="flex flex-col gap-1.5">
                    <h3 className={isGlass ? "text-[10px] font-sans font-medium text-slate-400 tracking-wider mb-1 uppercase" : "text-[9px] font-mono font-black text-brutal-dim uppercase tracking-widest"}>SYNOPSIS</h3>
                    <p className={isGlass ? "text-white/80 text-[13px] leading-relaxed font-medium" : "text-brutal-white text-[13px] leading-relaxed opacity-90"}>{movie.overview}</p>
                  </div>
                )}
              </div>

              {cast.length > 0 && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-1.5">
                    <Users className={`w-3.5 h-3.5 ${isGlass ? "text-blue-400/70" : "text-brutal-violet"}`} />
                    <h3 className={isGlass ? "text-[10px] font-sans font-medium text-slate-400 tracking-wider uppercase" : "text-[9px] font-mono font-black text-brutal-dim uppercase tracking-widest"}>CAST</h3>
                  </div>
                  {/* Mobile: horizontal scroll pill cards — Desktop: grid */}
                  <div className="md:hidden flex gap-2.5 overflow-x-auto pb-1 snap-x overscroll-x-contain no-scrollbar">
                    {cast.slice(0, 10).map((member) => (
                      <button
                        key={member.id}
                        onClick={() => setSelectedActorId(member.id)}
                        className={`glass-actor-card flex-none snap-start flex flex-col items-center gap-1.5 p-2.5 w-[72px] transition-all text-center ${
                          isGlass
                            ? "bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20"
                            : "bg-surface border-2 border-brutal-border rounded-xl hover:border-brutal-violet"
                        }`}
                      >
                        <div className={`w-11 h-11 rounded-full overflow-hidden flex-shrink-0 ${isGlass ? "border border-white/15" : "border border-brutal-border"}`}>
                          {member.profile_path
                            ? <Image src={`https://image.tmdb.org/t/p/w185${member.profile_path}`} alt={member.name} width={44} height={44} className="object-cover w-full h-full" />
                            : <div className={`w-full h-full flex items-center justify-center font-black text-sm ${isGlass ? "bg-white/10 text-white/60" : "bg-surface-2 text-brutal-dim"}`}>{member.name[0]}</div>
                          }
                        </div>
                        <div className="w-full">
                          <p className={`text-[9px] font-semibold leading-tight truncate ${isGlass ? "text-white/90" : "text-brutal-white uppercase"}`}>{member.name}</p>
                          <p className={`text-[8px] leading-tight truncate mt-0.5 ${isGlass ? "text-slate-400" : "text-brutal-dim"}`}>{member.character}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                  {/* Desktop: grid */}
                  <div className="hidden md:grid grid-cols-5 gap-2">
                    {cast.slice(0, 5).map((member) => (
                      <button key={member.id} onClick={() => setSelectedActorId(member.id)} className={isGlass ? "glass-actor-card flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-2 hover:bg-white/10 hover:border-white/20 transition-all text-left shadow-sm" : "glass-actor-card flex items-center gap-2 border-2 border-brutal-border bg-surface p-2 hover:border-brutal-violet hover:shadow-brutal-sm transition-all text-left"}>
                        <div className={isGlass ? "w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-white/10 shadow-inner" : "w-8 h-8 bg-surface-2 overflow-hidden border border-brutal-border flex-shrink-0"}>
                          {member.profile_path ? <Image src={`https://image.tmdb.org/t/p/w185${member.profile_path}`} alt={member.name} width={40} height={40} className="object-cover w-full h-full" /> : <div className="w-full h-full flex items-center justify-center font-black text-xs">{member.name[0]}</div>}
                        </div>
                        <div className="min-w-0">
                          <p className={isGlass ? "text-xs font-semibold text-white/90 truncate" : "text-[10px] font-black uppercase text-brutal-white truncate"}>{member.name}</p>
                          <p className={isGlass ? "text-[10px] font-medium text-slate-400 truncate" : "text-[9px] font-mono font-bold text-brutal-dim truncate"}>{member.character}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {similar.length > 0 && (
                <div className={isGlass ? "flex flex-col gap-3 pt-6 border-t border-white/10" : "flex flex-col gap-3 pt-6 border-t-2 border-brutal-border"}>
                  <h3 className={isGlass ? "text-[10px] font-sans font-medium text-slate-400 tracking-wider uppercase mb-1" : "text-[9px] font-mono font-black text-brutal-dim uppercase tracking-widest"}>MORE LIKE THIS</h3>
                  <div className="flex gap-4 overflow-x-auto pb-4 snap-x overscroll-x-contain hide-scrollbar">
                    {similar.map((sim) => (
                      <div key={sim.id} onClick={() => setHistory(prev => [...prev, sim])} className={isGlass ? "flex-none w-[120px] sm:w-[140px] snap-start group bg-white/5 rounded-xl aspect-[2/3] relative cursor-pointer hover:shadow-orange-500/30 transition-transform duration-300 transform hover:scale-105 overflow-hidden" : "flex-none w-[120px] sm:w-[140px] snap-start group border-2 border-brutal-border bg-black aspect-[2/3] relative cursor-pointer hover:border-brutal-yellow transition-all overflow-hidden"}>
                        <button onClick={(e) => { e.stopPropagation(); if (!allowAction()) return; openBlockModal({ id: sim.id, title: sim.title || sim.name || "Untitled", posterPath: sim.poster_path || "" }); }} className={isGlass ? "absolute top-2 left-2 z-20 bg-black/40 backdrop-blur-md rounded-full p-1.5 text-white/70 hover:bg-white/20 hover:text-white border border-white/10 transition-all opacity-0 group-hover:opacity-100" : "absolute top-0 left-0 z-20 border-b-2 border-r-2 border-brutal-border bg-black/80 p-1.5 text-brutal-dim transition-colors hover:bg-brutal-violet hover:text-brutal-white"}>
                          <Plus className="h-3.5 w-3.5" strokeWidth={3} />
                        </button>
                        {sim.poster_path ? <Image src={posterUrl(sim.poster_path)} alt={sim.title ?? sim.name ?? ""} fill className="object-cover transition-transform group-hover:scale-110" sizes="140px" /> : <div className={isGlass ? "w-full h-full flex items-center justify-center p-1 text-center text-[10px] font-bold text-white/50" : "w-full h-full flex items-center justify-center p-1 text-center text-[9px] font-black uppercase"}>{sim.title ?? sim.name}</div>}
                        <div className={isGlass ? "absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3" : "absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2"}>
                          <p className={isGlass ? "text-xs font-bold text-white line-clamp-2" : "text-[10px] font-black uppercase text-white line-clamp-2"}>{sim.title ?? sim.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actor panel */}
      <div 
        className={isGlass ? "glass-actor-panel relative z-10 flex-none overflow-y-auto overflow-x-hidden backdrop-blur-3xl bg-[rgba(4,12,36,0.65)] saturate-150 h-[92svh] sm:h-[85vh] sm:rounded-r-3xl no-scrollbar" : "glass-actor-panel relative z-10 flex-none overflow-y-auto overflow-x-hidden bg-bg h-[92svh] sm:h-[85vh] border-brutal-border no-scrollbar"} 
        style={{ 
          width: selectedActorId ? "22rem" : "0px", 
          overflowY: selectedActorId ? "auto" : "hidden", 
          overflowX: "hidden", 
          borderWidth: selectedActorId && !isGlass ? "3px" : "0px", 
          borderLeftWidth: selectedActorId && !isGlass ? "3px" : isGlass && selectedActorId ? "1px" : "0px", 
          borderTopWidth: selectedActorId && !isGlass ? "3px" : "0px",
          borderLeftColor: "rgba(255,255,255,0.1)"
        }}  
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-[22rem]">
          <div className={isGlass ? "sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-transparent border-b border-white/10" : "sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-bg border-b-3 border-brutal-border"}>
            <button onClick={() => setSelectedActorId(null)} className={isGlass ? "p-2 flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-all rounded-full border border-white/5 shadow-sm backdrop-blur-md" : "brutal-btn p-2 flex items-center gap-2"}>
              <ArrowLeft className={isGlass ? "w-4 h-4 text-white" : "w-4 h-4"} strokeWidth={3} />
              <span className={isGlass ? "text-xs font-semibold text-white tracking-wide pr-1" : "text-xs font-mono font-bold"}>BACK</span>
            </button>
          </div>
          {actorLoading ? <div className="p-4 flex flex-col gap-3"><div className="w-full h-32 brutal-shimmer" /><div className="grid grid-cols-3 gap-2">{[...Array(6)].map((_, i) => <div key={i} className="aspect-[2/3] brutal-shimmer" />)}</div></div> : actorPerson ? (
            <div>
              <div className={isGlass ? "flex gap-4 p-4 border-b border-white/10 bg-black/20" : "flex gap-4 p-4 border-b-3 border-brutal-border bg-surface-2"}>
                <div className={isGlass ? "flex-shrink-0 w-20 h-20 rounded-full border-2 border-white/20 shadow-lg overflow-hidden" : "flex-shrink-0 w-16 h-24 border-3 border-brutal-border overflow-hidden"}>
                  {actorPerson.profile_path ? <Image src={`https://image.tmdb.org/t/p/w185${actorPerson.profile_path}`} alt={actorPerson.name} width={64} height={88} className="object-cover w-full h-full" /> : <div className="w-full h-full flex items-center justify-center bg-surface font-black">{actorPerson.name[0]}</div>}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <h2 className={isGlass ? "text-xl font-bold text-white tracking-tight leading-tight" : "text-sm font-display font-black text-brutal-white uppercase tracking-tight mb-1 leading-tight"}>{actorPerson.name}</h2>
                  {actorPerson.known_for_department && <span className={isGlass ? "text-[10px] font-medium text-orange-300 mt-0.5 tracking-wider uppercase inline-block" : "brutal-chip bg-brutal-violet text-white px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase inline-block w-fit mb-1"}>{actorPerson.known_for_department}</span>}
                  {actorPerson.biography && <p className={isGlass ? "mt-2 text-white/70 text-xs leading-relaxed line-clamp-3 font-medium" : "mt-2 text-brutal-white text-[11px] leading-relaxed line-clamp-3 opacity-80"}>{actorPerson.biography}</p>}
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Film className={isGlass ? "w-4 h-4 text-orange-400" : "w-3 h-3 text-brutal-violet"} strokeWidth={2.5} />
                  <h3 className={isGlass ? "text-[10px] font-sans font-medium text-slate-400 tracking-wider uppercase" : "text-[9px] font-mono font-black text-brutal-dim uppercase tracking-widest"}>FILMOGRAPHY</h3>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(actorPerson.movie_credits?.cast || []).filter((m) => m.poster_path).sort((a, b) => b.popularity - a.popularity).slice(0, 12).map((m) => (
                    <div key={m.id} className={isGlass ? "glass-actor-movie group relative aspect-[2/3] rounded-xl bg-white/5 cursor-pointer shadow-md overflow-hidden transition-transform duration-300 transform hover:scale-105 hover:shadow-orange-500/30" : "glass-actor-movie group relative aspect-[2/3] border-2 border-brutal-border bg-surface cursor-pointer hover:border-brutal-violet transition-all overflow-hidden"} onClick={() => { setHistory((prev) => [...prev, { ...m, original_title: m.title, genre_ids: [], adult: false, popularity: m.popularity } as TMDBMovie]); setSelectedActorId(null); }}>
                      <Image src={posterUrl(m.poster_path, "small")} alt={m.title} fill className="object-cover transition-transform group-hover:scale-105" sizes="100px" />
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

const OTT_URL_MAP: Record<string, (title: string) => string> = {
  "Netflix": (t) => `https://www.netflix.com/search?q=${t}`,
  "Amazon Prime Video": (t) => `https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${t}`,
  "JioHotstar": (t) => `https://www.jiohotstar.com/search?q=${t}`,
  "Sony LIV": (t) => `https://www.sonyliv.com/search/${t}`,
  "ZEE5": (t) => `https://www.zee5.com/search?q=${t}`,
  "MX Player": (t) => `https://www.mxplayer.in/search?q=${t}`,
  "Aha": (t) => `https://www.aha.video/search?q=${t}`,
  "Sun NXT": (t) => `https://www.sunnxt.com/search?q=${t}`,
  "Mubi": (t) => `https://mubi.com/search/${t}`,
  "Apple TV": (t) => `https://tv.apple.com/search?term=${t}`,
  "Apple TV+": (t) => `https://tv.apple.com/search?term=${t}`,
};

function getOttUrl(providerName: string, title: string): string {
  const q = encodeURIComponent(title);
  const builder = OTT_URL_MAP[providerName];
  if (builder) return builder(q);
  return `https://www.google.com/search?q=${q}+watch+on+${encodeURIComponent(providerName)}`;
}

function ProviderItem({ provider, category, movie, releaseYear, region, isMobile = false, isGlass = false }: { provider: TMDBWatchProvider, category: "flatrate" | "rent" | "buy", movie: TMDBMovie, releaseYear: string, region: string, isMobile?: boolean, isGlass?: boolean }) {
  const title = movie.title ?? movie.name ?? "";
  const url = getOttUrl(provider.provider_name, title);
  const colorClass = category === 'flatrate' ? "hover:border-brutal-lime" : category === 'rent' ? "hover:border-brutal-yellow" : "hover:border-brutal-cyan";
  const textColor = category === 'flatrate' ? "group-hover:text-brutal-lime" : category === 'rent' ? "group-hover:text-brutal-yellow" : "group-hover:text-brutal-cyan";

  if (isGlass) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" title={provider.provider_name} className="flex items-center justify-center p-1.5 sm:px-3 sm:py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-[0_4px_16px_rgba(255,255,255,0.05)] group snap-start flex-none w-fit">
        {provider.logo_path && <Image src={`https://image.tmdb.org/t/p/original${provider.logo_path}`} alt={provider.provider_name} width={20} height={20} className="rounded-md w-[20px] h-[20px] object-cover shadow-sm" />}
        {!isMobile && (
          <div className="flex items-center ml-2.5">
            <span className="hidden sm:inline text-xs font-semibold text-white/80 transition-colors whitespace-nowrap">{provider.provider_name}</span>
            <ExternalLink className="hidden sm:inline w-3 h-3 text-white/30 group-hover:text-white/60 transition-colors ml-1.5" strokeWidth={2.5} />
          </div>
        )}
      </a>
    );
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" title={provider.provider_name} className={`flex items-center justify-center h-8 px-2 sm:px-3 bg-surface border-2 border-brutal-border hover:shadow-brutal-sm transition-all group snap-start flex-none w-fit ${colorClass}`}>
      {provider.logo_path && <Image src={`https://image.tmdb.org/t/p/original${provider.logo_path}`} alt={provider.provider_name} width={18} height={18} className="rounded-sm w-[18px] h-[18px] sm:w-[16px] sm:h-[16px] object-cover" />}
      {!isMobile && (
        <div className="flex items-center ml-2">
          <span className="hidden sm:inline text-[9px] font-mono font-bold text-brutal-white transition-colors whitespace-nowrap">{provider.provider_name}</span>
          <ExternalLink className={`hidden sm:inline w-2 h-2 text-brutal-dim transition-colors ml-1 ${textColor}`} strokeWidth={3} />
        </div>
      )}
    </a>
  );
}
