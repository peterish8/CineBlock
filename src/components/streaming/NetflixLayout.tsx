"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Platform } from "@/app/streaming/page";
import { TMDBMovie } from "@/lib/types";
import { posterUrl, backdropUrl } from "@/lib/constants";
import NetflixMovieModal from "@/components/streaming/NetflixMovieModal";
import {
  Search, ChevronDown, Play, Plus, Info,
  ChevronLeft, ChevronRight, Check, ThumbsUp, VolumeX, Volume2, Menu, X as XIcon,
} from "lucide-react";

// Detect touch device
const isTouchDevice = () => typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);

interface Props { platform: Platform; country: string; onBack: () => void; }

const NETFLIX_ROWS = [
  { label: "Trending Now",             sort: "popularity.desc",   genre: "",      featured: true  },
  { label: "Top Picks For You",        sort: "vote_average.desc", genre: "",      featured: false },
  { label: "Gritty Action Movies",     sort: "popularity.desc",   genre: "28",    featured: false },
  { label: "Dark Sci-Fi & Fantasy",    sort: "popularity.desc",   genre: "878",   featured: false },
  { label: "Award-Winning Dramas",     sort: "vote_average.desc", genre: "18",    featured: false },
  { label: "Feel-Good Comedies",       sort: "popularity.desc",   genre: "35",    featured: false },
  { label: "Spine-Chilling Thrillers", sort: "popularity.desc",   genre: "53",    featured: false },
  { label: "Romantic Watches",         sort: "popularity.desc",   genre: "10749", featured: false },
];

const GENRE_MAP: Record<number, string> = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
  99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History",
  27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Sci-Fi",
  10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western",
};

/* ─── Watch-progress helpers (localStorage) ─── */
const PROGRESS_KEY = "nfx_progress";

function getProgress(): Record<number, number> {
  try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}"); } catch { return {}; }
}
function setProgress(id: number, pct: number) {
  const data = getProgress();
  data[id] = pct;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
}

/* ─── Data-fetching hook ─── */
function useProviderMovies(providerId: string, region: string, sort: string, genre: string) {
  const [movies, setMovies] = useState<TMDBMovie[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams({ action: "stream-discover", provider_id: providerId, region, sort });
    if (genre) params.set("genre", genre);
    fetch(`/api/movies?${params}`)
      .then(r => r.json())
      .then(d => { if (!cancelled) { setMovies(d.results || []); setLoading(false); } })
      .catch(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [providerId, region, sort, genre]);
  return { movies, loading };
}

/* ─── Netflix Card ─── */
function NetflixCard({
  movie, onClick, featured = false, progressPct = 0
}: {
  movie: TMDBMovie;
  onClick: () => void;
  featured?: boolean;
  progressPct?: number;
}) {
  const [hov, setHov] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [inMyList, setInMyList] = useState(false);
  const [clicking, setClicking] = useState(false);
  const isTouch = useRef(isTouchDevice());

  const expandTimer = useRef<NodeJS.Timeout>();
  const videoTimer = useRef<NodeJS.Timeout>();
  const collapseTimer = useRef<NodeJS.Timeout>();
  const hasFetched = useRef(false);

  // Featured (first card in Trending row) is wider
  const cardW = featured ? 320 : 240;
  const cardH = featured ? 180 : 135;

  const fetchTrailer = useCallback(async () => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    try {
      const action = (movie.media_type === "tv" || !!movie.first_air_date) ? "tv-details" : "details";
      const res = await fetch(`/api/movies?action=${action}&id=${movie.id}`);
      if (!res.ok) return;
      const data = await res.json();
      const vid = data.videos?.results?.find(
        (v: any) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser")
      ) || data.videos?.results?.find((v: any) => v.site === "YouTube");
      if (vid) setTrailerKey(vid.key);
    } catch { /* silent */ }
  }, [movie.id, movie.media_type, movie.first_air_date]);

  const handleEnter = () => {
    // No hover expansion on touch devices
    if (isTouch.current) return;
    if (collapseTimer.current) clearTimeout(collapseTimer.current);
    expandTimer.current = setTimeout(() => {
      setHov(true);
      fetchTrailer();
      requestAnimationFrame(() => requestAnimationFrame(() => setExpanded(true)));
      videoTimer.current = setTimeout(() => setShowVideo(true), 1400);
    }, 450);
  };

  const handleLeave = () => {
    if (isTouch.current) return;
    if (expandTimer.current) clearTimeout(expandTimer.current);
    if (videoTimer.current) clearTimeout(videoTimer.current);
    setExpanded(false);
    setShowVideo(false);
    collapseTimer.current = setTimeout(() => setHov(false), 350);
  };

  // On touch: open modal directly. On desktop: drift & grow animation.
  const handleClick = () => {
    if (isTouch.current) {
      onClick();
      return;
    }
    setClicking(true);
    setTimeout(() => {
      setClicking(false);
      onClick();
    }, 220);
  };

  const matchScore = Math.max(62, Math.min(99, Math.round((movie.vote_average || 7) * 10)));

  return (
    <div
      className="relative flex-shrink-0"
      style={{ width: cardW, height: cardH, margin: "0 3px", zIndex: hov ? 50 : 1 }}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {/* Base thumbnail */}
      <div
        className="relative w-full h-full rounded-sm cursor-pointer overflow-hidden bg-zinc-900"
        style={{
          opacity: expanded ? 0 : 1,
          transform: clicking ? "scale(1.06)" : "scale(1)",
          transition: "opacity 0.2s ease, transform 0.22s cubic-bezier(0.34,1.56,0.64,1)",
        }}
        onClick={handleClick}
      >
        {movie.backdrop_path ? (
          <Image src={backdropUrl(movie.backdrop_path)} alt={movie.title || ""} fill className="object-cover" sizes={`${cardW}px`} />
        ) : movie.poster_path ? (
          <Image src={posterUrl(movie.poster_path, "medium")} alt={movie.title || ""} fill className="object-cover object-top" sizes={`${cardW}px`} />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-2 text-center text-white/30 text-xs font-semibold">
            {movie.title}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Featured badge */}
        {featured && (
          <div className="absolute top-2 left-2 flex items-center gap-1">
            <span className="text-[#E50914] font-black text-base italic leading-none">N</span>
            <span className="text-white/80 font-bold tracking-widest text-[9px]">FEATURED</span>
          </div>
        )}

        {/* Red watch-progress bar */}
        {progressPct > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: "#333" }}>
            <div
              className="h-full"
              style={{ width: `${progressPct}%`, background: "#E50914", borderRadius: "0 2px 2px 0" }}
            />
          </div>
        )}

        <span className="absolute bottom-2 left-2 text-white text-xs font-bold line-clamp-1 drop-shadow">
          {movie.title || movie.name}
        </span>
      </div>

      {/* ── Expanded hover card ── */}
      {hov && (
        <div
          className="absolute rounded-md overflow-hidden"
          style={{
            zIndex: 60,
            width: expanded ? 360 : cardW,
            top: expanded ? -100 : 0,
            left: expanded ? -60 : 0,
            background: "#181818",
            boxShadow: expanded ? "0 20px 60px rgba(0,0,0,0.95), 0 0 0 1px rgba(255,255,255,0.05)" : "none",
            transition: "width 0.3s cubic-bezier(0.25,0.46,0.45,0.94), top 0.3s cubic-bezier(0.25,0.46,0.45,0.94), left 0.3s, box-shadow 0.3s ease",
            opacity: expanded ? 1 : 0,
          }}
          onMouseLeave={handleLeave}
          onMouseEnter={() => { if (collapseTimer.current) clearTimeout(collapseTimer.current); }}
        >
          {/* Backdrop / micro-preview */}
          <div className="relative overflow-hidden" style={{ height: 202, background: "#000" }}>
            {movie.backdrop_path && (
              <Image src={backdropUrl(movie.backdrop_path)} alt={movie.title || ""} fill className="object-cover" sizes="360px" />
            )}
            {showVideo && trailerKey && (
              <iframe
                key={trailerKey}
                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&rel=0&modestbranding=1&loop=1&playlist=${trailerKey}`}
                title="preview"
                className="absolute inset-0 w-full h-full"
                style={{ border: "none" }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-transparent to-transparent pointer-events-none" />
            <h4 className="absolute bottom-3 left-4 right-4 text-white font-black text-lg drop-shadow-lg line-clamp-1">
              {movie.title || movie.name}
            </h4>
          </div>

          {/* Watch-progress replay bar (inside hover card too) */}
          {progressPct > 0 && (
            <div className="px-4 pt-2">
              <div className="w-full h-[3px] rounded-full" style={{ background: "#444" }}>
                <div className="h-full rounded-full" style={{ width: `${progressPct}%`, background: "#E50914" }} />
              </div>
            </div>
          )}

          {/* Controls — all rounded-full for interactive-grouping consistency */}
          <div className="px-4 pt-3 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Play */}
              <button
                onClick={handleClick}
                className="w-9 h-9 rounded-full bg-white flex items-center justify-center hover:bg-white/80 transition-colors"
                title="Play"
              >
                <Play className="w-4 h-4 fill-black text-black ml-0.5" />
              </button>
              {/* Add / Check */}
              <button
                onClick={(e) => { e.stopPropagation(); setInMyList(v => !v); }}
                className="w-9 h-9 rounded-full border-2 flex items-center justify-center transition-colors"
                style={{
                  borderColor: inMyList ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.4)",
                  background: "rgba(42,42,42,0.8)"
                }}
                title={inMyList ? "Remove from list" : "Add to my list"}
              >
                {inMyList ? <Check className="w-4 h-4 text-white" /> : <Plus className="w-4 h-4 text-white" />}
              </button>
              {/* Like */}
              <button
                className="w-9 h-9 rounded-full border-2 border-white/40 flex items-center justify-center hover:border-white transition-colors"
                style={{ background: "rgba(42,42,42,0.8)" }}
                onClick={(e) => e.stopPropagation()}
                title="I like this"
              >
                <ThumbsUp className="w-4 h-4 text-white" />
              </button>
            </div>
            {/* More info */}
            <button
              className="w-9 h-9 rounded-full border-2 border-white/40 flex items-center justify-center hover:border-white transition-colors"
              style={{ background: "rgba(42,42,42,0.8)" }}
              onClick={(e) => { e.stopPropagation(); handleClick(); }}
              title="More info"
            >
              <ChevronDown className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Meta */}
          <div className="px-4 pb-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold flex-wrap">
              <span style={{ color: "#46d369" }}>{matchScore}% Match</span>
              <span className="border border-white/30 px-1 py-0.5 text-white/60 rounded-sm text-[10px]">A</span>
              <span className="text-white/60">
                {(movie.first_air_date || movie.release_date || "").split("-")[0]}
              </span>
              <span className="border border-white/30 px-1 py-0.5 text-white/50 rounded-sm text-[9px] font-bold">HD</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(movie.genre_ids || []).slice(0, 3).map((id, idx, arr) => (
                <span key={id} className="text-white/60 text-[11px] flex items-center gap-1.5">
                  {GENRE_MAP[id] || "Drama"}
                  {idx < arr.length - 1 && <span className="text-white/20 text-[6px]">●</span>}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Row ─── */
function NetflixRow({
  label, providerId, region, sort, genre, featured, onMovieClick
}: {
  label: string; providerId: string; region: string; sort: string; genre: string;
  featured: boolean; onMovieClick: (m: TMDBMovie) => void;
}) {
  const { movies, loading } = useProviderMovies(providerId, region, sort, genre);
  const [scrollPos, setScrollPos] = useState(0);
  const [progress] = useState<Record<number, number>>(getProgress());

  const PAGE = 6;
  const CARD_W = 240 + 6;

  const maxScroll = Math.max(0, (movies.length - PAGE) * CARD_W);
  const canLeft = scrollPos > 0;
  const canRight = scrollPos < maxScroll;

  const scroll = (dir: number) => {
    setScrollPos(prev => Math.max(0, Math.min(prev + dir * PAGE * CARD_W, maxScroll)));
  };

  if (loading) return (
    <div className="mb-8 pl-12 pr-4">
      <div className="h-5 w-44 rounded animate-pulse mb-3" style={{ background: "#333" }} />
      <div className="flex gap-1.5">
        {[...Array(6)].map((_, i) => <div key={i} className="flex-shrink-0 w-[240px] h-[135px] rounded animate-pulse" style={{ background: "#242424" }} />)}
      </div>
    </div>
  );
  if (movies.length === 0) return null;

  return (
    <div className="mb-8 relative group/row">
      <h3
        className="text-[#e5e5e5] text-lg font-bold mb-3 pl-12 pr-4 flex items-center gap-2 cursor-pointer w-fit"
        style={{ letterSpacing: "0.02em" }}
      >
        {label}
        <span className="text-[11px] text-[#54b3d6] font-semibold flex items-center gap-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity duration-200">
          Explore All <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </h3>

      <div className="relative">
        {canLeft && (
          <button
            onClick={() => scroll(-1)}
            className="absolute left-0 top-0 bottom-0 w-12 z-40 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity"
            style={{ background: "linear-gradient(to right, rgba(20,20,20,0.95), transparent)" }}
          >
            <ChevronLeft className="w-7 h-7 text-white" strokeWidth={2.5} />
          </button>
        )}

        <div className="px-12 overflow-hidden">
          <div
            className="flex"
            style={{
              transform: `translateX(-${scrollPos}px)`,
              transition: "transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94)",
              overflow: "visible",
            }}
          >
            {movies.map((m, idx) => (
              <NetflixCard
                key={m.id}
                movie={m}
                onClick={() => onMovieClick(m)}
                featured={featured && idx === 0}
                progressPct={progress[m.id] || 0}
              />
            ))}
          </div>
        </div>

        {canRight && movies.length > PAGE && (
          <button
            onClick={() => scroll(1)}
            className="absolute right-0 top-0 bottom-0 w-12 z-40 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity"
            style={{ background: "linear-gradient(to left, rgba(20,20,20,0.95), transparent)" }}
          >
            <ChevronRight className="w-7 h-7 text-white" strokeWidth={2.5} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Continue Watching Row ─── */
function ContinueWatchingRow({ onMovieClick }: { onMovieClick: (m: TMDBMovie) => void }) {
  const [items, setItems] = useState<Array<{ movie: TMDBMovie; pct: number }>>([]);

  useEffect(() => {
    const progress = getProgress();
    const ids = Object.keys(progress).filter(k => progress[+k] > 0 && progress[+k] < 95);
    if (ids.length === 0) return;
    Promise.all(ids.map(id =>
      fetch(`/api/movies?action=details&id=${id}`).then(r => r.json()).catch(() => null)
    )).then(results => {
      const valid = results
        .filter(Boolean)
        .map((m, i) => ({ movie: m as TMDBMovie, pct: progress[+ids[i]] }));
      setItems(valid);
    });
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="mb-8 relative">
      <h3 className="text-[#e5e5e5] text-lg font-bold mb-3 pl-12 pr-4" style={{ letterSpacing: "0.02em" }}>
        Continue Watching
      </h3>
      <div className="px-12 flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {items.map(({ movie, pct }) => (
          <NetflixCard key={movie.id} movie={movie} onClick={() => onMovieClick(movie)} progressPct={pct} />
        ))}
      </div>
    </div>
  );
}

/* ─── Main Layout ─── */
export default function NetflixLayout({ platform, country, onBack }: Props) {
  const [selectedMovie, setSelectedMovie] = useState<TMDBMovie | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [heroVideoReady, setHeroVideoReady] = useState(false);
  const [heroMuted, setHeroMuted] = useState(true);
  const [heroTrailerKey, setHeroTrailerKey] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const NAV_ITEMS = ["Home", "TV Shows", "Movies", "New & Popular", "My Netflix"];

  const { movies: heroMovies } = useProviderMovies(platform.tmdbId, country, "popularity.desc", "");
  const hero = heroMovies[0];

  // Simulate random watch progress for demo purposes (only on first mount)
  useEffect(() => {
    const existing = getProgress();
    if (Object.keys(existing).length > 0) return; // already have data
    // Seed 4 fake in-progress movies using ID placeholders — will be updated when real movies load
  }, []);

  // Seed demo progress when heroMovies loads (only if nothing tracked yet)
  useEffect(() => {
    if (heroMovies.length < 3) return;
    const existing = getProgress();
    if (Object.keys(existing).length > 0) return;
    // Seed movies 2–4 from trending as partially watched
    const pcts = [38, 62, 81];
    heroMovies.slice(1, 4).forEach((m, i) => setProgress(m.id, pcts[i]));
  }, [heroMovies]);

  // Fetch hero trailer
  useEffect(() => {
    if (!hero) return;
    let cancelled = false;
    setHeroTrailerKey(null);
    setHeroVideoReady(false);
    const action = hero.first_air_date ? "tv-details" : "details";
    fetch(`/api/movies?action=${action}&id=${hero.id}`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        const vid = data.videos?.results?.find(
          (v: any) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser")
        ) || data.videos?.results?.find((v: any) => v.site === "YouTube");
        if (vid) setHeroTrailerKey(vid.key);
      })
      .catch(() => {});
    const t = setTimeout(() => !cancelled && setHeroVideoReady(true), 2200);
    return () => { cancelled = true; clearTimeout(t); };
  }, [hero?.id]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const matchScore = hero ? Math.max(62, Math.min(99, Math.round((hero.vote_average || 7) * 10))) : 98;

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "#141414", color: "#fff" }}>

      {/* ── Navbar ── */}
      <nav
        className="fixed top-0 w-full z-50 flex items-center justify-between transition-all duration-500"
        style={{
          padding: "0 4%",
          height: 68,
          background: scrolled ? "#141414" : "linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, transparent 100%)",
        }}
      >
        <div className="flex items-center gap-4 lg:gap-8">
          {/* Hamburger — mobile only */}
          <button
            className="lg:hidden flex flex-col gap-1.5 p-1"
            onClick={() => setMobileMenuOpen(v => !v)}
            aria-label="Menu"
          >
            {mobileMenuOpen
              ? <XIcon className="w-6 h-6 text-white" />
              : <Menu className="w-6 h-6 text-white" />
            }
          </button>

          <button
            onClick={onBack}
            className="text-[#E50914] font-black text-4xl tracking-tighter hover:opacity-75 transition-opacity"
            style={{ fontStyle: "italic", lineHeight: 1 }}
          >
            N
          </button>

          {/* Desktop nav links */}
          <div className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item, i) => (
              <button
                key={item}
                className="px-3 py-1.5 text-sm rounded transition-colors"
                style={{ color: i === 0 ? "#fff" : "rgba(255,255,255,0.75)", fontWeight: i === 0 ? 700 : 400 }}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Search className="w-5 h-5 text-white cursor-pointer hover:text-white/70 transition-colors" />
          <span className="text-white text-sm cursor-pointer hidden md:block hover:text-white/70 transition-colors">KIDS</span>
          <div className="flex items-center gap-1.5 cursor-pointer group">
            <div className="w-8 h-8 rounded" style={{ background: "linear-gradient(135deg, #42C8BB, #6B4FA2)" }} />
            <ChevronDown className="w-4 h-4 text-white group-hover:rotate-180 transition-transform duration-200" />
          </div>
        </div>
      </nav>

      {/* ── Mobile Slide-in Menu Drawer ── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-[90]"
          onClick={() => setMobileMenuOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.6)" }} />
          {/* Drawer panel */}
          <div
            className="absolute top-0 left-0 h-full flex flex-col pt-20 pb-8"
            style={{
              width: "75vw",
              maxWidth: 320,
              background: "#141414",
              boxShadow: "4px 0 30px rgba(0,0,0,0.8)",
              animation: "nfxSlideInLeft 0.28s cubic-bezier(0.25,0.46,0.45,0.94)",
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* N logo at top */}
            <div className="px-6 mb-6 flex items-center gap-3">
              <span className="text-[#E50914] font-black text-3xl" style={{ fontStyle: "italic" }}>N</span>
              <span className="text-white/50 text-sm font-semibold tracking-widest">MENU</span>
            </div>

            <nav className="flex flex-col">
              {NAV_ITEMS.map((item, i) => (
                <button
                  key={item}
                  className="text-left px-6 py-4 text-white font-semibold text-base border-b border-white/5 hover:bg-white/5 transition-colors flex items-center justify-between"
                  style={{ opacity: i === 0 ? 1 : 0.7 }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item}
                  {i === 0 && <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#E50914" }} />}
                </button>
              ))}
            </nav>

            <div className="mt-auto px-6">
              <button
                onClick={() => { setMobileMenuOpen(false); onBack(); }}
                className="w-full text-center py-3 rounded border border-white/20 text-white/60 text-sm hover:border-white/40 transition-colors"
              >
                ← Back to CineBlock
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes nfxSlideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}</style>

      {/* ── Hero Billboard ── */}
      {hero ? (
        <div className="relative w-full" style={{ height: "85vh", minHeight: 500, maxHeight: 850 }}>
          {hero.backdrop_path && (
            <Image src={backdropUrl(hero.backdrop_path)} alt={hero.title || ""} fill className="object-cover" priority sizes="100vw" />
          )}

          {/* Autoplaying trailer */}
          {heroTrailerKey && heroVideoReady && (
            <div className="absolute inset-0 overflow-hidden">
              <iframe
                key={heroTrailerKey}
                src={`https://www.youtube.com/embed/${heroTrailerKey}?autoplay=1&mute=${heroMuted ? 1 : 0}&controls=0&rel=0&modestbranding=1&loop=1&playlist=${heroTrailerKey}&start=5`}
                title="hero preview"
                className="absolute"
                style={{
                  border: "none",
                  width: "100%", height: "100%",
                  top: "50%", left: "50%",
                  transform: "translate(-50%,-50%) scale(1.08)",
                }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          )}

          {/* Gradients */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: "linear-gradient(to right, rgba(20,20,20,0.9) 0%, rgba(20,20,20,0.4) 40%, transparent 70%)"
          }} />
          <div className="absolute inset-0 pointer-events-none" style={{
            background: "linear-gradient(to top, #141414 0%, transparent 35%)"
          }} />

          {/* Hero content */}
          <div className="absolute bottom-[22%] z-10" style={{ left: "4%", maxWidth: 580 }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[#E50914] font-black text-xl" style={{ fontStyle: "italic" }}>N</span>
              <span className="text-white/80 font-bold tracking-[0.3em] text-xs">
                {hero.first_air_date ? "SERIES" : "FILM"}
              </span>
            </div>

            <h1 className="font-black mb-4 leading-tight" style={{
              fontSize: "clamp(2rem,5vw,4rem)",
              textShadow: "2px 2px 8px rgba(0,0,0,0.7)"
            }}>
              {hero.title || hero.name}
            </h1>

            <div className="flex items-center gap-3 mb-4 text-sm font-semibold flex-wrap">
              <span style={{ color: "#46d369" }}>{matchScore}% Match</span>
              <span className="text-white/70">{(hero.release_date || hero.first_air_date || "").split("-")[0]}</span>
              <span className="border border-white/40 px-1.5 py-0.5 rounded-sm text-white/70 text-xs">TV-MA</span>
              <span className="text-white/70">{hero.first_air_date ? "Multiple Seasons" : "1h 55m"}</span>
            </div>

            <p className="text-white/90 mb-6 leading-relaxed line-clamp-3" style={{ fontSize: "clamp(0.85rem,1.5vw,1rem)" }}>
              {hero.overview}
            </p>

            {/* Action buttons — grouped together with consistent rounded style */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setSelectedMovie(hero)}
                className="flex items-center gap-2 px-7 py-2.5 rounded font-bold text-black transition-all hover:bg-white/75 hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: "#fff", fontSize: "1.05rem" }}
              >
                <Play className="w-5 h-5 fill-black" /> Play
              </button>
              <button
                onClick={() => setSelectedMovie(hero)}
                className="flex items-center gap-2 px-7 py-2.5 rounded font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: "rgba(109,109,110,0.7)", fontSize: "1.05rem" }}
              >
                <Info className="w-5 h-5" /> More Info
              </button>
            </div>
          </div>

          {/* Volume + maturity rating — grouped on right */}
          <div className="absolute z-20 flex items-center gap-3" style={{ right: "4%", bottom: "28%" }}>
            {heroTrailerKey && heroVideoReady && (
              <button
                onClick={() => setHeroMuted(m => !m)}
                className="w-10 h-10 rounded-full border border-white/50 flex items-center justify-center hover:border-white transition-colors"
                style={{ background: "rgba(42,42,42,0.6)" }}
              >
                {heroMuted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
              </button>
            )}
            <div className="border-l-4 border-white/50 pl-3 pr-4 py-1.5">
              <span className="text-white/70 text-sm font-semibold">TV-MA</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-pulse" style={{ height: "85vh", background: "#242424" }} />
      )}

      {/* ── Content rows ── */}
      <div className="relative z-20 pb-20" style={{ marginTop: -120 }}>
        {/* Continue Watching first */}
        <ContinueWatchingRow onMovieClick={setSelectedMovie} />

        {NETFLIX_ROWS.map(row => (
          <NetflixRow
            key={row.label}
            label={row.label}
            providerId={platform.tmdbId}
            region={country}
            sort={row.sort}
            genre={row.genre}
            featured={row.featured}
            onMovieClick={setSelectedMovie}
          />
        ))}
      </div>

      <div className="text-center pb-8 text-white/20 text-xs">
        Questions? Call <span className="font-semibold">000-800-919-1694</span>
      </div>

      {/* ── Modal ── */}
      <NetflixMovieModal movie={selectedMovie} onClose={() => setSelectedMovie(null)} />
    </div>
  );
}
