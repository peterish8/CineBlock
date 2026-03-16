"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Platform } from "@/app/streaming/page";
import { TMDBMovie } from "@/lib/types";
import { posterUrl, backdropUrl } from "@/lib/constants";
import MovieModal from "@/components/MovieModal";
import { ChevronLeft, ChevronRight, Play, Check, ShoppingBag, Plus } from "lucide-react";

interface Props { platform: Platform; country: string; onBack: () => void; }

const PRIME_ROWS = [
  { label: "Prime Original Series", sort: "popularity.desc", genre: "" },
  { label: "Recommended Movies", sort: "vote_average.desc", genre: "28" },
  { label: "Recently Added", sort: "primary_release_date.desc", genre: "" },
  { label: "Popular Comedies", sort: "popularity.desc", genre: "35" },
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

function PrimeCard({ movie, onClick, isOversized = false }: { movie: TMDBMovie; onClick: () => void; isOversized?: boolean }) {
  const [hov, setHov] = useState(false);
  
  // Fake buy/rent vs prime logic for visual authenticity based on rating
  const isPrimeIncluded = (movie.vote_average || 0) > 6.0;

  const w = isOversized ? 360 : 260; // Huge 16:9 cards per 2026 Prime rules
  const h = isOversized ? 202 : 146;

  return (
    <div
      className="relative flex-shrink-0 rounded-lg overflow-hidden cursor-pointer"
      style={{
        width: w,
        height: h,
        transition: "transform 0.3s ease, border-color 0.3s ease",
        transform: hov ? "scale(1.05)" : "scale(1)",
        border: hov ? "3px solid white" : "3px solid transparent",
        zIndex: hov ? 20 : 1,
        backgroundColor: "#1A242F"
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
    >
      {/* 2026 Prime Badging: Top Left Overlay */}
      <div className="absolute top-2 left-2 z-20 shadow-md">
        {isPrimeIncluded ? (
           <div className="bg-[#00A8E1] p-1.5 rounded-sm flex items-center justify-center">
             <Check className="w-3.5 h-3.5 text-white stroke-[4]" />
           </div>
        ) : (
           <div className="bg-[#FCA311] p-1.5 rounded-sm flex items-center justify-center">
             <ShoppingBag className="w-3.5 h-3.5 text-black stroke-[3]" />
           </div>
        )}
      </div>

      {movie.backdrop_path ? (
        <Image src={backdropUrl(movie.backdrop_path)} alt={movie.title} fill className="object-cover" sizes={`${w}px`} />
      ) : movie.poster_path ? (
        // Fallback to poster if no backdrop, center it
        <Image src={posterUrl(movie.poster_path)} alt={movie.title} fill className="object-cover object-top opacity-50 blur-sm" sizes={`${w}px`} />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-white/40 text-sm font-bold text-center px-4">{movie.title}</span>
        </div>
      )}

      {/* Hover Info Overlay */}
      {hov && (
        <div className="absolute inset-0 bg-gradient-to-t from-[#050810] via-[#050810]/70 to-transparent flex flex-col justify-end p-4">
          <p className="text-white font-bold text-sm truncate mb-1">{movie.title}</p>
          <div className="flex items-center gap-2">
            <button className="bg-[#00A8E1] rounded-full p-2 hover:bg-[#008ab8] transition-colors">
              <Play className="w-4 h-4 fill-white text-white ml-0.5" />
            </button>
            <button className="bg-white/10 rounded-full p-2 border border-white/20 hover:bg-white/20 transition-colors hidden sm:block">
              <Plus className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PrimeRow({ label, providerId, region, sort, genre, isOversized = false, onMovieClick }: {
  label: string; providerId: string; region: string; sort: string; genre: string; isOversized?: boolean;
  onMovieClick: (m: TMDBMovie) => void;
}) {
  const { movies, loading } = useProviderMovies(providerId, region, sort, genre);
  const ref = useRef<HTMLDivElement>(null);
  
  const scroll = (direction: number) => {
    if (ref.current) {
      ref.current.scrollBy({ left: direction * 600, behavior: "smooth" });
    }
  };

  if (loading) return (
    <div className="mb-10 pl-16">
      <div className="h-5 w-56 bg-white/5 rounded animate-pulse mb-4" />
      <div className="flex gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className={`flex-shrink-0 bg-white/5 rounded-lg animate-pulse ${isOversized ? 'w-[360px] h-[202px]' : 'w-[260px] h-[146px]'}`} />)}
      </div>
    </div>
  );
  if (movies.length === 0) return null;

  return (
    <div className="mb-10 group/row relative">
      <div className="flex items-baseline gap-4 mb-4 pl-16">
        <h3 className="text-white text-xl font-bold tracking-tight">{label}</h3>
        <button className="text-[#00A8E1] text-sm font-bold opacity-0 group-hover/row:opacity-100 transition-opacity">See more</button>
      </div>
      <div className="relative">
        <button onClick={() => scroll(-1)} className="absolute left-0 top-0 bottom-0 z-20 h-full w-14 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-all hover:bg-black/60 bg-gradient-to-r from-[#050810] to-transparent">
          <ChevronLeft className="w-8 h-8 text-white" />
        </button>
        <div ref={ref} className="flex gap-4 overflow-x-auto pb-6 pl-16 pr-16" style={{ scrollbarWidth: "none" }}>
          {movies.slice(0, 15).map(m => <PrimeCard key={m.id} movie={m} isOversized={isOversized} onClick={() => onMovieClick(m)} />)}
        </div>
        <button onClick={() => scroll(1)} className="absolute right-0 top-0 bottom-0 z-20 h-full w-14 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-all hover:bg-black/60 bg-gradient-to-l from-[#050810] to-transparent">
          <ChevronRight className="w-8 h-8 text-white" />
        </button>
      </div>
    </div>
  );
}

export default function PrimeVideoLayout({ platform, country, onBack }: Props) {
  const [selectedMovie, setSelectedMovie] = useState<TMDBMovie | null>(null);
  const { movies: heroMovies } = useProviderMovies(platform.tmdbId, country, "popularity.desc", "");
  const hero = heroMovies[1] || heroMovies[0]; // Avoid the same hero as Netflix if possible

  return (
    <div className="min-h-screen overflow-y-auto" style={{ background: "#050810", fontFamily: "'Amazon Ember', Arial, sans-serif", color: "#fff" }}>
      
      {/* 2026 Navbar - Content Forward with Hubs */}
      <nav className="sticky top-0 z-50 flex items-center px-10 py-5 bg-[#050810]/95 backdrop-blur-md border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <button onClick={onBack} className="text-[#00A8E1] font-bold text-2xl mr-12 tracking-tight flex items-center gap-1">
          prime video
        </button>
        <div className="flex gap-6 items-center">
           {["Home", "Movies", "TV Shows", "Sports", "Live TV"].map((tab, i) => (
             <button key={tab} className={`font-semibold text-[15px] hidden md:block transition-colors pb-1 border-b-2 tracking-tight ${i === 0 ? 'text-white border-[#white]' : 'text-zinc-400 border-transparent hover:text-white'}`}>
               {tab}
             </button>
           ))}
           <div className="w-px h-6 bg-zinc-700 mx-2 hidden lg:block" />
           {["Subscriptions", "Rent or Buy"].map((tab) => (
             <button key={tab} className="font-semibold text-zinc-400 text-[15px] hover:text-white hidden lg:block transition-colors pb-1 border-b-2 border-transparent">
               {tab}
             </button>
           ))}
        </div>
      </nav>

      {/* Hero Rotator (Cinematic Edge to Edge almost) */}
      {hero && (
        <div className="relative w-full overflow-hidden" style={{ height: "65vh", minHeight: 500 }}>
          {hero.backdrop_path ? (
            <Image src={backdropUrl(hero.backdrop_path)} alt={hero.title} fill className="object-cover" sizes="100vw" priority />
          ) : (
            <div className="w-full h-full bg-[#1A242F]" />
          )}
          {/* Gradients */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, #050810 0%, rgba(5,8,16,0.8) 25%, transparent 60%)" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(0deg, #050810 0%, transparent 35%)" }} />
          
          <div className="absolute bottom-1/4 left-16 max-w-xl z-10">
            {/* Prime tag */}
            <div className="flex items-center gap-2 mb-4 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded w-fit">
              <Check className="w-4 h-4 text-[#00A8E1] stroke-[3]" />
              <span className="text-white text-xs font-bold tracking-wider">INCLUDED WITH PRIME</span>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-black text-white mb-4 leading-tight">{hero.title}</h1>
            
            <p className="text-white/80 text-sm md:text-base leading-relaxed mb-8 line-clamp-3">
              {hero.overview}
            </p>
            
            <div className="flex items-center gap-4">
              <button onClick={() => setSelectedMovie(hero)} className="flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-[15px] bg-[#00A8E1] hover:bg-[#008ab8] text-white transition-colors">
                <Play className="w-5 h-5 fill-white" /> Resume
              </button>
              <button className="w-[50px] h-[50px] rounded-full bg-white/10 border border-white/20 hover:bg-white/20 flex items-center justify-center transition-colors">
                <Plus className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
          
          {/* Rotator dots fake UI */}
          <div className="absolute bottom-8 right-16 flex gap-2">
            <div className="w-6 h-2 rounded-full bg-white" />
            <div className="w-2 h-2 rounded-full bg-white/30" />
            <div className="w-2 h-2 rounded-full bg-white/30" />
            <div className="w-2 h-2 rounded-full bg-white/30" />
          </div>
        </div>
      )}

      {/* Oversized Tile Row (2026 Core Feature) */}
      <div className="pt-2">
        <PrimeRow label="Amazon Originals and Exclusives" providerId={platform.tmdbId} region={country} sort="popularity.desc" genre="" isOversized={true} onMovieClick={setSelectedMovie} />
      </div>

      <div className="h-px bg-zinc-800 mx-16 mb-10" />

      <div>
        {PRIME_ROWS.map(row => (
           <PrimeRow key={row.label} label={row.label} providerId={platform.tmdbId} region={country} sort={row.sort} genre={row.genre} onMovieClick={setSelectedMovie} />
        ))}
      </div>

      <div className="h-20" />
      <MovieModal movie={selectedMovie} onClose={() => setSelectedMovie(null)} />
    </div>
  );
}
