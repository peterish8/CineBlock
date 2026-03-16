"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Platform } from "@/app/streaming/page";
import { TMDBMovie } from "@/lib/types";
import { posterUrl, backdropUrl } from "@/lib/constants";
import MovieModal from "@/components/MovieModal";
import { ChevronLeft, ChevronRight, Play, Plus, Tv, Film, Activity, Search, Home, Check, VolumeX, ChevronDown, User } from "lucide-react";

interface Props { platform: Platform; country: string; onBack: () => void; }

const JIOSTAR_ROWS = [
  { label: "Continue Watching for User", sort: "popularity.desc", genre: "" },
  { label: "New on JioHotstar", sort: "vote_average.desc", genre: "18" },
  { label: "Watchlist", sort: "revenue.desc", genre: "35" },
  { label: "Bollywood Blockbusters", sort: "popularity.desc", genre: "28" },
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

// Map generic movie data to Hotstar-like metadata
function getMetadataStr(movie: TMDBMovie) {
  const year = movie.release_date?.split("-")[0] || "2026";
  const rating = (movie.vote_average || 0) > 7 ? "U/A 16+" : "U/A 13+";
  const duration = "2h 4m";
  const languages = "7 Languages";
  return `${year} • ${rating} • ${duration} • ${languages}`;
}

function JioStarCard({ movie, onClick, isContinueWatching = false }: { movie: TMDBMovie; onClick: () => void, isContinueWatching?: boolean }) {
  const [hov, setHov] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();

  const handleEnter = () => {
    if (isContinueWatching) { setHov(true); return; } // No complex expansion for continue watching
    timerRef.current = setTimeout(() => {
      setHov(true);
      setTimeout(() => setIsExpanding(true), 50);
    }, 400); 
  };
  
  const handleLeave = () => { 
    if (isContinueWatching) { setHov(false); return; }
    clearTimeout(timerRef.current); 
    setIsExpanding(false);
    setTimeout(() => setHov(false), 300);
  };

  if (isContinueWatching) {
    // 16:9 Landscape Card with Progress Bar
    return (
      <div 
        className="relative flex-shrink-0 cursor-pointer overflow-hidden rounded-md group"
        style={{ width: 280, margin: "0 6px" }}
        onMouseEnter={handleEnter} onMouseLeave={handleLeave} onClick={onClick}
      >
        <div className="relative w-full aspect-video rounded-md overflow-hidden bg-[#16181f]">
          {movie.backdrop_path ? (
             <Image src={backdropUrl(movie.backdrop_path)} alt={movie.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="320px" />
          ) : (
             <div className="w-full h-full bg-[#1c1e26] flex items-center justify-center p-2 text-center text-xs text-zinc-500">{movie.title}</div>
          )}
          
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300" />
          
          {/* Play Icon floating bot-left */}
          <div className="absolute bottom-3 left-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/50 flex items-center justify-center opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
            <Play className="w-4 h-4 fill-white text-white ml-0.5" />
          </div>
        </div>
        <div className="mt-3 px-1">
          <h4 className="text-white text-[15px] font-bold truncate leading-tight mb-1">{movie.title}</h4>
        </div>
      </div>
    );
  }

  // Vertical Poster Card with Complex Hover Expansion
  return (
    <div
      className="relative flex-shrink-0 origin-center"
      style={{ width: 175, height: 260, margin: "0 6px", zIndex: hov ? 40 : 1 }}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {/* Base Vertical Poster */}
      <div
        onClick={onClick}
        className={`relative w-full h-full rounded-md cursor-pointer overflow-hidden bg-[#16181f] transition-opacity duration-300 ${isExpanding ? 'opacity-0' : 'opacity-100'}`}
      >
        {movie.poster_path ? (
          <Image src={posterUrl(movie.poster_path, "medium")} alt={movie.title} fill className="object-cover" sizes="175px" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center border border-zinc-800">
            <span className="text-zinc-500 font-bold text-xs">{movie.title}</span>
          </div>
        )}
      </div>

      {/* Expanded Hover Overlay Card */}
      {hov && (
        <div 
          className={`absolute top-0 left-0 bg-[#0f1115] rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden transition-all duration-300 ease-out border border-white/10`}
          style={{ 
             zIndex: 50, 
             width: isExpanding ? 340 : 175,
             height: isExpanding ? 440 : 260,
             transform: isExpanding ? "translate(-82px, -90px)" : "translate(0px, 0px)",
             opacity: isExpanding ? 1 : 0
          }}
          onClick={onClick}
          onMouseLeave={handleLeave}
        >
          {/* Top Artwork Half */}
          <div className="relative w-full transition-all duration-300 bg-zinc-900" style={{ height: isExpanding ? 220 : 260 }}>
            {movie.backdrop_path ? (
               <Image src={backdropUrl(movie.backdrop_path)} alt="preview" fill className="object-cover" />
            ) : movie.poster_path ? (
               <Image src={posterUrl(movie.poster_path, "medium")} alt="preview" fill className="object-cover object-top" />
            ) : null}
            
            {/* Dark gradient fade into bottom section */}
            <div className={`absolute inset-0 bg-gradient-to-t from-[#0f1115] via-[#0f1115]/20 to-transparent h-full w-full transition-opacity duration-300 ${isExpanding ? 'opacity-100' : 'opacity-0'}`} />
            <div className={`absolute inset-0 bg-black/10 transition-opacity duration-300 ${isExpanding ? 'opacity-100' : 'opacity-0'}`} />
            
            {/* Top Left Language Selector */}
            {isExpanding && (
               <div className="absolute top-4 left-4 flex items-center gap-1 text-white font-semibold text-[13px] drop-shadow-md z-20">
                 English <ChevronDown className="w-4 h-4" />
               </div>
            )}
            
            {/* Floating Title Logo */}
            {isExpanding && (
              <h4 className="absolute bottom-2 left-5 right-5 text-white font-black text-3xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] truncate text-center">
                {movie.title.toUpperCase()}
              </h4>
            )}
          </div>

          {/* Bottom Solid Half (Controls and Info) */}
          <div className={`p-4 transition-opacity duration-300 flex flex-col ${isExpanding ? 'opacity-100' : 'opacity-0'}`} style={{ height: 220 }}>
            
             {/* Action Buttons */}
             <div className="flex gap-2 mb-4 mt-2">
                <button className="flex-1 rounded bg-[#e8e9eb] hover:bg-white text-black font-bold text-[15px] py-2.5 flex items-center justify-center gap-2 transition-colors">
                  <Play className="w-5 h-5 fill-black" /> Watch Now
                </button>
                <button className="w-12 h-11 rounded bg-[#252833] hover:bg-[#343846] flex items-center justify-center transition-colors">
                  <Check className="w-6 h-6 text-white" />
                </button>
             </div>

             {/* Metadata */}
             <div className="flex items-center gap-2 text-[13px] font-bold text-white mb-2.5">
               <span>{movie.release_date?.split("-")[0] || "2026"}</span>
               <span className="text-zinc-500">•</span>
               <span>U/A 13+</span>
               <span className="text-zinc-500">•</span>
               <span>1h 54m</span>
               <span className="text-zinc-500">•</span>
               <span>4 Languages</span>
             </div>

             {/* Description Paragraph */}
             <p className="text-[#8f98b0] text-[13px] leading-relaxed line-clamp-3 overflow-hidden font-medium">
                {movie.overview || "An exciting new adventure unfolds in this epic blockbuster. Watch now exclusively on JioHotstar."}
             </p>
          </div>
        </div>
      )}
    </div>
  );
}

function JioStarRow({ label, providerId, region, sort, genre, onMovieClick }: {
  label: string; providerId: string; region: string; sort: string; genre: string;
  onMovieClick: (m: TMDBMovie) => void;
}) {
  const { movies, loading } = useProviderMovies(providerId, region, sort, genre);
  const [scrollIndex, setScrollIndex] = useState(0);
  const isContinueWatching = label.includes("Continue Watching");
  
  const handleScroll = (direction: number) => {
    const visibleCount = isContinueWatching ? 4 : 6;
    const maxIndex = Math.max(0, movies.length - visibleCount);
    setScrollIndex(prev => Math.max(0, Math.min(prev + direction * (visibleCount - 1), maxIndex)));
  };

  if (loading) return (
    <div className="mb-10 pl-10 pr-6 lg:pl-[110px] overflow-hidden">
       <div className="h-6 w-48 bg-zinc-800 rounded animate-pulse mb-4" />
       <div className="flex gap-3 relative z-10">
         {[...Array(6)].map((_, i) => <div key={i} className={`flex-shrink-0 bg-zinc-800 rounded-md animate-pulse ${isContinueWatching ? 'w-[280px] h-[157px]' : 'w-[175px] h-[260px]'}`} />)}
       </div>
    </div>
  );

  if (movies.length === 0) return null;

  const cardWidth = isContinueWatching ? 292 : 187; // width + gap

  return (
    <div className="mb-10 pl-10 pr-6 lg:pl-[110px] relative group/row overflow-visible">
      <div className="flex justify-between items-end mb-4 pr-12">
        <h3 className="text-white text-[20px] font-bold tracking-tight cursor-pointer hover:text-zinc-300 transition-colors">{label}</h3>
        {!isContinueWatching && <span className="text-[#8f98b0] text-sm font-semibold hover:text-white cursor-pointer opacity-0 group-hover/row:opacity-100 transition-opacity">View All &gt;</span>}
      </div>
      
      <div className="relative group/slider overflow-visible">
        {scrollIndex > 0 && (
          <button onClick={() => handleScroll(-1)} className="absolute left-[-40px] top-0 bottom-0 w-12 z-50 hidden lg:flex items-center justify-center opacity-0 group-hover/slider:opacity-100 bg-gradient-to-r from-[#0f1115] via-[#0f1115]/80 to-transparent">
            <ChevronLeft className="w-8 h-8 text-white scale-y-125" />
          </button>
        )}
        
        <div className="relative z-10 w-full" style={{ overflow: 'visible' }}>
          <div className="flex transition-transform duration-700 ease-in-out" style={{ transform: `translate3d(-${scrollIndex * cardWidth}px, 0, 0)` }}>
            {movies.map(m => <JioStarCard key={m.id} movie={m} isContinueWatching={isContinueWatching} onClick={() => onMovieClick(m)} />)}
          </div>
        </div>

        {scrollIndex < movies.length - (isContinueWatching ? 4 : 6) && (
          <button onClick={() => handleScroll(1)} className="absolute right-0 top-0 bottom-0 w-16 z-50 hidden lg:flex items-center justify-center opacity-0 group-hover/slider:opacity-100 bg-gradient-to-l from-[#0f1115] via-[#0f1115]/80 to-transparent">
            <ChevronRight className="w-8 h-8 text-white scale-y-125" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function HotstarLayout({ platform, country, onBack }: Props) {
  const [selectedMovie, setSelectedMovie] = useState<TMDBMovie | null>(null);
  const { movies: heroMovies } = useProviderMovies(platform.tmdbId, country, "popularity.desc", "");
  const hero = heroMovies[0] || heroMovies[1];

  return (
    <div className="min-h-screen font-sans overflow-x-hidden" style={{ background: "#0f1115", color: "#fff" }}>
      
      {/* 2026 JioHotstar Exact Sidebar */}
      <nav className="fixed left-0 top-0 bottom-0 z-50 w-[70px] lg:w-[90px] flex flex-col items-center pt-8 pb-8 bg-gradient-to-r from-black/80 to-transparent border-r border-transparent hover:bg-black transition-all group">
         
         {/* Top Star Logo & Subscribe */}
         <div className="flex flex-col items-center mb-10 w-full gap-3 cursor-pointer" onClick={onBack}>
           {/* Abstract Star Icon SVG replacing literal text */}
           <svg className="w-8 h-8 text-white/90 drop-shadow-md" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z"/>
           </svg>
           <button className="bg-[#cca152] text-black text-[9px] font-bold px-2 py-0.5 rounded shadow-lg hover:bg-[#e0b462] flex items-center whitespace-nowrap opacity-100 lg:opacity-70 group-hover:opacity-100 transition-opacity">
              Subscribe &gt;
           </button>
         </div>

         <div className="flex flex-col gap-7 w-full">
           {[ 
             { icon: Home, label: "Home", active: true },
             { icon: Search, label: "Search" }, 
             { icon: Tv, label: "TV" }, 
             { icon: Film, label: "Movies" }, 
             { icon: Activity, label: "Sports" }
           ].map((item, i) => (
             <button key={item.label} className={`flex flex-col items-center gap-1.5 focus:outline-none transition-colors relative group/navbtn ${item.active ? 'text-white' : 'text-[#8f98b0] hover:text-white'}`}>
               <item.icon className={`w-[22px] h-[22px] ${item.active ? 'fill-white' : ''} group-hover/navbtn:scale-110 transition-transform`} strokeWidth={item.active ? 2.5 : 2} />
               <span className="text-[10px] font-bold tracking-wider opacity-0 lg:opacity-0 group-hover:opacity-100 font-medium absolute -right-16 bg-black/80 px-2 py-1 rounded drop-shadow pointer-events-none translate-x-[-10px] group-hover:translate-x-0 transition-all">{item.label}</span>
             </button>
           ))}
         </div>

         <div className="mt-auto flex flex-col items-center cursor-pointer opacity-80 hover:opacity-100 transition-opacity">
           <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4a3bcc] to-[#8a3bcc] border border-white/20 flex items-center justify-center overflow-hidden">
              <User className="w-5 h-5 text-white/80" />
           </div>
         </div>
      </nav>

      {/* 2026 Exact Cinematic Hero Banner */}
      {hero ? (
        <div className="relative w-full aspect-[4/5] md:aspect-[21/9] max-h-[85vh] min-h-[500px] mb-[-60px]">
          {hero.backdrop_path ? (
             <Image src={backdropUrl(hero.backdrop_path)} alt={hero.title} fill className="object-cover" priority sizes="100vw" />
          ) : (
             <div className="w-full h-full bg-[#1c1e26] animate-pulse" />
          )}

          {/* Left specific gradient matches the dark fade across half the screen */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f1115] via-[#0f1115]/80 to-transparent w-full md:w-[60%]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f1115] via-transparent to-transparent h-full" />
          
          <div className="absolute bottom-[20%] left-10 lg:left-[110px] max-w-xl z-10 w-[80%] pr-4">
             {/* Text "hotstar specials" */}
             <div className="flex items-center gap-1.5 mb-2 drop-shadow-md">
                <span className="text-blue-500 font-bold text-xs tracking-wide">hotstar</span>
                <span className="text-green-400 font-bold text-xs tracking-wide">specials</span>
             </div>
             
             <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-none mb-3 drop-shadow-xl" style={{ textShadow: "0 4px 12px rgba(0,0,0,0.8)" }}>{hero.title.toUpperCase()}</h1>
             
             <p className="text-[#4b9eff] font-bold text-sm mb-4 drop-shadow">New Episodes Thu</p>
             
             <div className="flex items-center gap-2 text-[14px] font-bold text-white mb-3">
               <span>{getMetadataStr(hero)}</span>
             </div>
             
             <p className="text-white text-sm md:text-[15px] mb-4 line-clamp-2 md:line-clamp-3 leading-relaxed max-w-md drop-shadow font-medium">
               {hero.overview || "An unforgettable journey begins now. Stream the latest blockbuster on JioHotstar with Dolby Vision and Atmos."}
             </p>

             <div className="flex flex-wrap items-center gap-2 mb-6 font-bold text-[13px] text-white/80">
                <span className="hover:text-white cursor-pointer transition-colors">Sports</span> <span className="text-zinc-600">|</span> 
                <span className="hover:text-white cursor-pointer transition-colors">Drama</span> <span className="text-zinc-600">|</span> 
                <span className="hover:text-white cursor-pointer transition-colors">Comedy</span> <span className="text-zinc-600">|</span> 
                <span className="hover:text-white cursor-pointer transition-colors">Romance</span>
             </div>
             
             <div className="flex items-center gap-3">
               <button onClick={() => setSelectedMovie(hero)} className="bg-gradient-to-r from-[#0063e5] to-[#cc0272] text-white font-bold text-[16px] px-8 py-3.5 rounded-md hover:scale-105 transition-transform flex items-center justify-center gap-2 min-w-[200px] shadow-lg shadow-blue-900/40">
                 <Play className="w-5 h-5 fill-current ml-0.5" /> Watch Now
               </button>
               <button onClick={() => setSelectedMovie(hero)} className="bg-[#242630] text-[#8f98b0] hover:text-white w-12 h-12 rounded-md hover:bg-[#343846] transition-colors flex items-center justify-center">
                 <Plus className="w-6 h-6" />
               </button>
             </div>
          </div>

          {/* Bottom Right thumbnails placeholder to match the screenshot entirely */}
          <div className="absolute right-10 bottom-24 hidden xl:flex items-center gap-2 z-20">
             <div className="absolute -top-10 right-0 w-8 h-8 rounded-full border border-white/40 bg-black/40 flex items-center justify-center cursor-pointer hover:bg-white hover:text-black transition-colors">
                <VolumeX className="w-4 h-4" />
             </div>
             {[...Array(5)].map((_, i) => (
                <div key={i} className={`w-[80px] h-[45px] rounded border ${i === 4 ? 'border-white' : 'border-transparent'} bg-zinc-800 relative overflow-hidden cursor-pointer hover:border-white transition-colors flex items-center justify-center`}>
                   {i === 4 ? <ChevronRight className="w-5 h-5 text-white/80 z-10" /> : null}
                   <div className="absolute inset-0 bg-black/40" />
                </div>
             ))}
          </div>
        </div>
      ) : (
        <div className="w-full h-[60vh] bg-[#1c1e26] animate-pulse" />
      )}

      {/* Rows Container */}
      <div className="relative z-20 pb-16">
        {JIOSTAR_ROWS.map(row => (
          <JioStarRow key={row.label} label={row.label} providerId={platform.tmdbId} region={country}
            sort={row.sort} genre={row.genre} onMovieClick={setSelectedMovie} />
        ))}
      </div>

      <MovieModal movie={selectedMovie} onClose={() => setSelectedMovie(null)} />
    </div>
  );
}
