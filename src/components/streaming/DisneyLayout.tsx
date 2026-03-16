"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Platform } from "@/app/streaming/page";
import { TMDBMovie } from "@/lib/types";
import { posterUrl, backdropUrl } from "@/lib/constants";
import MovieModal from "@/components/MovieModal";
import { Search, Play, Plus, Home, Tv, Film, Zap, User } from "lucide-react";

interface Props { platform: Platform; country: string; onBack: () => void; }

// Using genres for variety instead of pure random pages
const DISNEY_ROWS = [
  { label: "New to Disney+", sort: "primary_release_date.desc", genre: "" },
  { label: "Trending on Hulu", sort: "popularity.desc", genre: "18" }, // Simulating Hulu integration
  { label: "Marvel Cinematic Universe", sort: "revenue.desc", genre: "28" },
  { label: "Pixar Animation Studios", sort: "vote_average.desc", genre: "16" },
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

// 2026 Disney+ shifted to Vertical Content Rectangles for row cards
function DisneyCard({ movie, onClick }: { movie: TMDBMovie; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  const w = 180;
  const h = 270;

  return (
    <div
      className="relative flex-shrink-0 cursor-pointer rounded-lg overflow-hidden group/card"
      style={{
        width: w,
        height: h,
        transition: "transform 0.3s cubic-bezier(0.25,0.46,0.45,0.94), box-shadow 0.3s",
        transform: hov ? "scale(1.08)" : "scale(1)",
        boxShadow: hov ? "0 0 20px rgba(0,255,200,0.3)" : "none",
        zIndex: hov ? 20 : 1,
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-[#0A101C]" />
      {movie.poster_path ? (
        <Image src={posterUrl(movie.poster_path, "medium")} alt={movie.title} fill className="object-cover transition-opacity duration-300 group-hover/card:opacity-90" sizes={`${w}px`} />
      ) : (
        <div className="w-full h-full flex items-center justify-center p-4">
          <span className="text-white/40 text-sm font-bold text-center">{movie.title}</span>
        </div>
      )}
      
      {/* 2026 Disney Badging */}
      {movie.vote_average && movie.vote_average > 7.5 && (
        <div className="absolute top-2 right-2 bg-gradient-to-r from-teal-500 to-blue-500 text-[9px] font-black text-white px-1.5 py-0.5 rounded shadow-lg uppercase tracking-wider backdrop-blur-sm">
          Critically Acclaimed
        </div>
      )}

      {/* Persistent floating title on hover to replace the old bulky overlays */}
      <div className={`absolute bottom-0 left-0 right-0 p-3 pt-12 bg-gradient-to-t from-[#020D1A] to-transparent transition-opacity duration-300 ${hov ? 'opacity-100' : 'opacity-0'}`}>
        <p className="text-white font-bold text-sm line-clamp-2 drop-shadow-md">{movie.title}</p>
        <div className="flex items-center gap-1.5 mt-2">
          <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-black">
            <Play className="w-3 h-3 fill-current ml-0.5" />
          </div>
          <div className="w-6 h-6 rounded-full border border-white/50 flex items-center justify-center text-white backdrop-blur-sm">
            <Plus className="w-3 h-3" />
          </div>
        </div>
      </div>
    </div>
  );
}

function DisneyRow({ label, providerId, region, sort, genre, onMovieClick }: {
  label: string; providerId: string; region: string; sort: string; genre: string;
  onMovieClick: (m: TMDBMovie) => void;
}) {
  const { movies, loading } = useProviderMovies(providerId, region, sort, genre);
  const ref = useRef<HTMLDivElement>(null);

  if (loading) return (
    <div className="mb-10 lg:pl-28 pl-20">
      <div className="h-5 w-48 bg-white/5 rounded animate-pulse mb-4" />
      <div className="flex gap-4">
        {[...Array(5)].map((_, i) => <div key={i} className="flex-shrink-0 w-[180px] h-[270px] rounded-lg bg-white/5 animate-pulse" />)}
      </div>
    </div>
  );
  if (movies.length === 0) return null;

  return (
    <div className="mb-10 lg:pl-28 pl-20 relative z-10 w-full overflow-hidden">
      <h3 className="text-white/90 text-[17px] font-bold mb-3 tracking-tight">{label}</h3>
      <div className="flex overflow-x-auto gap-4 pb-6 custom-scrollbar pr-12" ref={ref} style={{ scrollbarWidth: "none" }}>
         {movies.slice(0, 16).map(m => <DisneyCard key={m.id} movie={m} onClick={() => onMovieClick(m)} />)}
      </div>
    </div>
  );
}

// 2026 Disney Sidebar
function Sidebar({ onBack }: { onBack: () => void }) {
   const [hov, setHov] = useState(false);
   
   return (
     <div 
       className="fixed top-0 left-0 bottom-0 z-50 flex flex-col pt-8 pb-8 transition-all duration-300 ease-in-out bg-[#020D1A]/95 backdrop-blur-xl border-r border-white/5"
       style={{ width: hov ? 260 : 80 }}
       onMouseEnter={() => setHov(true)}
       onMouseLeave={() => setHov(false)}
     >
       <button onClick={onBack} className="text-center mb-12 flex justify-center w-[80px] shrink-0">
          <Image src="/favicon.ico" alt="Disney+" width={32} height={32} className="opacity-90 hover:scale-110 transition-transform hidden" />
          <span className="text-xl font-bold tracking-tighter bg-gradient-to-r from-blue-400 to-teal-300 bg-clip-text text-transparent decoration-none">D+</span>
       </button>
       
       <div className="flex flex-col gap-8 w-full overflow-hidden">
         {[
           { icon: User, label: "My Profile" },
           { icon: Search, label: "Search" },
           { icon: Home, label: "Home" },
           { icon: Tv, label: "Series" },
           { icon: Film, label: "Movies" },
           { icon: Zap, label: "Live & Sports" }, // 2026 "Live" Lightning bolt integration
         ].map(item => (
           <button key={item.label} className="flex items-center text-white/60 hover:text-white transition-colors pl-8 w-[260px] group/nav">
             <div className="w-6 flex justify-center shrink-0">
               <item.icon className="w-5 h-5 transition-transform group-hover/nav:scale-110" />
             </div>
             <span className={`font-semibold ml-6 whitespace-nowrap transition-opacity duration-300 ${hov ? 'opacity-100' : 'opacity-0'}`}>
               {item.label}
             </span>
           </button>
         ))}
       </div>
     </div>
   );
}

export default function DisneyLayout({ platform, country, onBack }: Props) {
  const [selectedMovie, setSelectedMovie] = useState<TMDBMovie | null>(null);
  const { movies: heroMovies } = useProviderMovies(platform.tmdbId, country, "vote_average.desc", "");
  const hero = heroMovies[0] || heroMovies[1];

  return (
    <div className="min-h-screen overflow-x-hidden font-sans" style={{ background: "linear-gradient(to bottom, #07172A, #020A16)", color: "#fff" }}>
      <Sidebar onBack={onBack} />

      {/* Hero */}
      <div className="relative w-full aspect-[16/9] lg:aspect-[21/9] max-h-[85vh] min-h-[500px] mb-8">
        {hero?.backdrop_path ? (
          <Image src={backdropUrl(hero.backdrop_path)} alt={hero?.title || ""} fill className="object-cover" priority sizes="100vw" />
        ) : (
          <div className="w-full h-full bg-[#07172A] animate-pulse" />
        )}
        
        {/* 2026 Aurora Gradient Blend over hero */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#07172A] via-[#07172A]/70 to-transparent w-full md:w-3/4" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#020A16] via-transparent to-transparent h-full" />
        
        <div className="absolute bottom-[20%] lg:left-28 left-24 max-w-xl z-10 drop-shadow-2xl">
           <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Disney%2B_logo.svg/200px-Disney%2B_logo.svg.png" 
             className="w-16 opacity-80 mb-4 mix-blend-screen grayscale brightness-200" alt="brand" />
           <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] leading-tight">{hero?.title}</h1>
           <p className="text-white/80 text-sm md:text-base leading-relaxed mb-8 line-clamp-3 md:line-clamp-4 max-w-lg">
             {hero?.overview}
           </p>
           <div className="flex items-center gap-3">
             <button onClick={() => hero && setSelectedMovie(hero)} className="bg-white text-black px-8 py-3.5 rounded font-bold text-sm tracking-wide hover:bg-zinc-200 transition-colors flex items-center gap-2 uppercase">
               <Play className="w-4 h-4 fill-current" /> Watch Now
             </button>
             <button onClick={() => hero && setSelectedMovie(hero)} className="bg-white/10 text-white border border-white/20 px-6 py-3.5 rounded font-bold text-sm tracking-wide hover:bg-white/20 transition-colors backdrop-blur-md">
               <Plus className="w-4 h-4" />
             </button>
           </div>
        </div>
      </div>

      {/* 2026 Brand Row (Disney, Pixar, Marvel, Star Wars, NatGeo, Hulu) */}
      <div className="lg:pl-28 pl-20 pr-12 mb-12 z-20 relative flex gap-4 overflow-x-auto hide-scrollbar">
        {["Disney", "Pixar", "Marvel", "Star Wars", "NatGeo", "Hulu"].map((brand) => (
          <div key={brand} className="relative h-20 md:h-24 w-full min-w-[120px] rounded-lg bg-gradient-to-b from-white/10 to-white/5 border border-white/10 flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105 hover:border-white/40 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] group/brand overflow-hidden">
             <span className="font-bold tracking-widest text-white/70 group-hover/brand:text-white transition-colors">{brand}</span>
             {/* Fake animated background on hover */}
             <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover/brand:opacity-100 transition-opacity blur-xl" />
          </div>
        ))}
      </div>

      <div className="relative z-20 pb-16">
        {DISNEY_ROWS.map(row => (
          <DisneyRow key={row.label} label={row.label} providerId={platform.tmdbId} region={country}
            sort={row.sort} genre={row.genre} onMovieClick={setSelectedMovie} />
        ))}
      </div>

      <MovieModal movie={selectedMovie} onClose={() => setSelectedMovie(null)} />
    </div>
  );
}
