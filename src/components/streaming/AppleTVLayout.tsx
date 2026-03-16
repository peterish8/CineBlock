"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Platform } from "@/app/streaming/page";
import { TMDBMovie } from "@/lib/types";
import { posterUrl, backdropUrl } from "@/lib/constants";
import MovieModal from "@/components/MovieModal";
import { Play, Plus } from "lucide-react";

interface Props { platform: Platform; country: string; onBack: () => void; }

const APPLE_ROWS = [
  { label: "Up Next", sort: "popularity.desc", genre: "" },
  { label: "Apple TV+ Originals", sort: "vote_average.desc", genre: "18" },
  { label: "Critically Acclaimed Comedy", sort: "popularity.desc", genre: "35" },
];

function useProviderMovies(providerId: string, region: string, sort: string, genre: string) {
  const [movies, setMovies] = useState<TMDBMovie[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams({ action: "stream-discover", provider_id: providerId, region, sort });
    if (genre) params.set("genre", genre);
    fetch(`/api/movies?${params}`).then(r => r.json()).then(d => {
      if (!cancelled) { setMovies(d.results || []); setLoading(false); }
    }).catch(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [providerId, region, sort, genre]);
  return { movies, loading };
}

function AppleCard({ movie, onClick }: { movie: TMDBMovie; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  
  // 2026 Liquid Glass Solarium UI
  return (
    <div
      className="relative flex-shrink-0 cursor-pointer group/card"
      style={{
        width: 320,
        height: 180,
        transition: "transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)",
        transform: hov ? "scale(1.03) translateY(-4px)" : "scale(1)",
        zIndex: hov ? 10 : 1
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
    >
      <div 
         className="relative w-full h-full rounded-[12px] overflow-hidden" 
         style={{ 
            boxShadow: hov ? "0 22px 40px rgba(0,0,0,0.6)" : "0 8px 20px rgba(0,0,0,0.4)",
            border: hov ? "2px solid rgba(255,255,255,0.7)" : "2px solid transparent",
            transition: "all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)"
         }}
      >
        {movie.backdrop_path ? (
          <Image src={backdropUrl(movie.backdrop_path)} alt={movie.title} fill className="object-cover transition-transform duration-700 ease-out" 
            style={{ transform: hov ? "scale(1.05)" : "scale(1)" }} sizes="320px" />
        ) : movie.poster_path ? (
          <Image src={posterUrl(movie.poster_path)} alt={movie.title} fill className="object-cover" sizes="320px" />
        ) : (
          <div className="w-full h-full bg-[#1c1c1e] flex items-center justify-center p-4">
             <span className="text-white/30 text-xs font-medium text-center">{movie.title}</span>
          </div>
        )}

        {/* Clean darkened overlay with solid white play button */}
        <div className={`absolute inset-0 bg-black/40 transition-opacity duration-300 flex items-center justify-center ${hov ? 'opacity-100' : 'opacity-0'}`}>
           <div className="w-[52px] h-[52px] rounded-full bg-white text-black flex items-center justify-center shadow-lg transform transition-transform duration-300">
             <Play className="w-5 h-5 fill-black ml-0.5 text-black" />
           </div>
        </div>
      </div>
      
      {/* Title sits OUTSIDE the card in Apple UI */}
      <div className={`pt-3 px-1 transition-opacity duration-300 ${hov ? 'opacity-100' : 'opacity-80'}`}>
        <h4 className="text-white font-semibold text-[15px] leading-tight truncate">{movie.title}</h4>
        <p className="text-[#98989d] text-[13px] font-medium mt-0.5 tracking-tight truncate">
          {movie.release_date?.split("-")[0]} <span className="mx-1">•</span> Comedy <span className="mx-1">•</span> ★ {movie.vote_average?.toFixed(1)}
        </p>
      </div>
    </div>
  );
}

function AppleRow({ label, providerId, region, sort, genre, onMovieClick }: {
  label: string; providerId: string; region: string; sort: string; genre: string;
  onMovieClick: (m: TMDBMovie) => void;
}) {
  const { movies, loading } = useProviderMovies(providerId, region, sort, genre);
  const ref = useRef<HTMLDivElement>(null);

  if (loading) return (
    <div className="mb-14 px-12 md:px-20">
      <div className="h-6 w-32 bg-white/10 rounded mb-4 animate-pulse" />
      <div className="flex gap-6">
        {[...Array(4)].map((_, i) => <div key={i} className="w-[320px] h-[180px] rounded-[14px] bg-white/10 animate-pulse flex-shrink-0" />)}
      </div>
    </div>
  );
  if (movies.length === 0) return null;

  return (
    <div className="mb-14 px-12 md:px-20 relative">
      <h3 className="text-white text-[22px] font-bold tracking-tight mb-4">{label}</h3>
      <div ref={ref} className="flex gap-6 overflow-x-auto pb-4 pr-12 hide-scrollbar" style={{ scrollbarWidth: "none" }}>
         {movies.slice(0, 15).map(m => <AppleCard key={m.id} movie={m} onClick={() => onMovieClick(m)} />)}
      </div>
    </div>
  );
}

export default function AppleTVLayout({ platform, country, onBack }: Props) {
  const [selectedMovie, setSelectedMovie] = useState<TMDBMovie | null>(null);
  const { movies: heroMovies } = useProviderMovies(platform.tmdbId, country, "vote_average.desc", "");
  const hero = heroMovies[0] || heroMovies[1];
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden font-[system-ui,-apple-system,BlinkMacSystemFont,'SF_Pro_Text','Segoe_UI',Roboto,sans-serif]" style={{ background: "#000", color: "#f5f5f7" }}>
      
      {/* 2026 Liquid Glass Top Nav */}
      <nav className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-12 py-4 transition-all duration-500 ease-out border-b tracking-tight ${scrolled ? 'bg-[rgba(28,28,30,0.85)] border-white/10 shadow-lg backdrop-blur-[40px]' : 'bg-transparent border-transparent'}`}>
        <div className="flex items-center gap-8">
           <button onClick={onBack} className="text-white font-bold text-xl hover:opacity-80 transition-opacity flex items-center gap-1.5 shrink-0">
             <span className="text-2xl mt-[-2px]"></span> tv+
           </button>
           <div className="hidden md:flex gap-1 bg-white/10 rounded-full p-1 backdrop-blur-md">
             {["Watch Now", "Apple TV+", "Store", "Library"].map((item, i) => (
               <button key={item} className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors ${i === 1 ? 'bg-white text-black shadow-sm' : 'text-white hover:bg-white/20'}`}>
                 {item}
               </button>
             ))}
           </div>
        </div>
        <div className="flex items-center gap-4">
           <button className="text-white hover:text-white/70 font-medium text-sm transition-colors">Search</button>
           <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 shadow-inner" />
        </div>
      </nav>

      {/* 2026 Solarium Hero Edge to Edge */}
      <div className="relative w-full h-[75vh] min-h-[600px] mb-12">
        {hero?.backdrop_path ? (
          <Image src={backdropUrl(hero.backdrop_path)} alt={hero.title} fill className="object-cover" priority sizes="100vw" />
        ) : (
          <div className="w-full h-full bg-[#1c1c1e] animate-pulse" />
        )}
        
        {/* Soft elegant gradient, leaving mostly image */}
        <div className="absolute inset-0" style={{ background: "radial-gradient(circle at center 20%, transparent 60%, #000 100%), linear-gradient(to top, #000 0%, transparent 40%)" }} />
        
        <div className="absolute bottom-[10%] left-12 md:left-20 max-w-2xl z-20 flex flex-col items-center md:items-start text-center md:text-left w-[calc(100%-6rem)]">
          <p className="text-white/60 font-semibold uppercase tracking-[0.2em] text-[11px] mb-3">A New Apple Original</p>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.1]">{hero?.title}</h1>
          
          <div className="flex flex-col md:flex-row items-center gap-3">
             <button onClick={() => setSelectedMovie(hero)} className="bg-[#f5f5f7] hover:bg-white text-black rounded-full px-8 py-3.5 font-semibold text-[15px] transition-transform hover:scale-105 active:scale-95 flex items-center gap-2 justify-center w-full md:w-auto">
               <Play className="w-4 h-4 fill-black text-black" /> Play Episode 1
             </button>
             <button onClick={() => setSelectedMovie(hero)} className="bg-[rgba(255,255,255,0.15)] hover:bg-[rgba(255,255,255,0.25)] text-white rounded-full px-6 py-3.5 font-semibold text-[15px] transition-colors backdrop-blur-[20px] flex items-center gap-2 justify-center w-full md:w-auto">
               <Plus className="w-5 h-5 text-white" /> Up Next
             </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="relative z-20">
         {APPLE_ROWS.map(row => (
            <AppleRow key={row.label} label={row.label} providerId={platform.tmdbId} region={country}
               sort={row.sort} genre={row.genre} onMovieClick={setSelectedMovie} />
         ))}
      </div>

      <div className="h-20" />
      <MovieModal movie={selectedMovie} onClose={() => setSelectedMovie(null)} />
    </div>
  );
}
