"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { Bookmark, Sparkles, Film, Tv } from "lucide-react";
import Link from "next/link";
import CommandHub from "@/components/CommandHub";
import PosterGrid from "@/components/PosterGrid";
import TVGrid from "@/components/TVGrid";
import TrendingHero from "@/components/TrendingHero";
import RecommendationsSection from "@/components/RecommendationsSection";
// Lazy-load modals — not needed on initial paint, improves FCP
const MovieModal = dynamic(() => import("@/components/MovieModal"), { ssr: false });
const ActorModal = dynamic(() => import("@/components/ActorModal"), { ssr: false });
const WatchlistPanel = dynamic(() => import("@/components/WatchlistPanel"), { ssr: false });
import { useMovieLists } from "@/hooks/useMovieLists";
import { usePreferredLanguage } from "@/hooks/usePreferredLanguage";
import { useRegion, REGION_TO_LANGUAGE } from "@/hooks/useRegion";
import { TMDBMovie, TMDBTVShow } from "@/lib/types";
import { toMovieSlug } from "@/lib/slugify";

function HomeContent() {
  const [filters, setFilters] = useState({
    query: "",
    genre: "",
    year: "",
    language: "",
    sort: "popularity.desc",
    rating: "",
    runtime: "",
  });
  const [selectedMovie, setSelectedMovie] = useState<TMDBMovie | null>(null);
  const [selectedActorId, setSelectedActorId] = useState<number | null>(null);
  const modalPushedState = useRef(false);
  const [watchlistOpen, setWatchlistOpen] = useState(false);
  const [mediaTab, setMediaTab] = useState<"movies" | "tv">("movies");
  const { liked, watchlist, watched } = useMovieLists();
  const likedCount = liked.length;
  const preferredLanguage = usePreferredLanguage();
  const { region } = useRegion();
  // Use explicit preference if set, else fall back to region-based language
  const activeLanguage = preferredLanguage || REGION_TO_LANGUAGE[region] || "";

  // Apply language preference as default when user hasn't manually set a language filter
  const effectiveFilters = {
    ...filters,
    language: filters.language || activeLanguage,
  };

  const isSearching = filters.query.trim().length > 0 || filters.genre !== "" || filters.year !== "" || filters.language !== "";

  useEffect(() => {
    const search = window.location.search;
    if (!search) return;
    
    const params = new URLSearchParams(search);
    const movieId = params.get("movie");
    const tvId = params.get("tv");

    const loadSharedMedia = async (id: string, type: "movie" | "tv") => {
      try {
        const action = type === "tv" ? "tv-details" : "details";
        const res = await fetch(`/api/movies?action=${action}&id=${id}`);
        if (res.ok) {
          const data = await res.json();
          const asMovie: TMDBMovie = type === "tv" ? {
            id: data.id,
            title: data.name,
            original_title: data.original_name,
            overview: data.overview,
            poster_path: data.poster_path,
            backdrop_path: data.backdrop_path,
            release_date: data.first_air_date,
            vote_average: data.vote_average,
            vote_count: data.vote_count,
            genre_ids: data.genres?.map((g: any) => g.id) || [],
            original_language: data.original_language,
            popularity: data.popularity,
            adult: false,
            media_type: "tv",
          } : { ...data, media_type: "movie" };
          setSelectedMovie(asMovie);
        }
      } catch (e) {
        console.error("Failed to load shared media", e);
      }
    };

    if (movieId) {
      loadSharedMedia(movieId, "movie");
      window.history.replaceState({}, '', '/');
    } else if (tvId) {
      loadSharedMedia(tvId, "tv");
      window.history.replaceState({}, '', '/');
    }
  }, []);

  // Push a URL-based slug when opening a movie modal so:
  // 1. The URL is shareable (e.g. cineblock.in/movie/the-dark-knight-155)
  // 2. Mobile back button closes the modal instead of leaving the site
  const openMovie = useCallback((movie: TMDBMovie) => {
    const type = movie.media_type === "tv" ? "tv" : "movie";
    const slug = toMovieSlug(movie.title || "", movie.id);
    window.history.pushState({ cineblockModal: true }, "", `/${type}/${slug}`);
    modalPushedState.current = true;
    setSelectedMovie(movie);
    setWatchlistOpen(false);
  }, []);

  const closeMovie = useCallback(() => {
    if (modalPushedState.current) {
      modalPushedState.current = false;
      window.history.replaceState({}, "", "/");
    }
    setSelectedMovie(null);
  }, []);

  // Close modal when user presses the browser/phone back button
  useEffect(() => {
    const handlePopState = () => {
      if (modalPushedState.current) {
        modalPushedState.current = false;
        setSelectedMovie(null);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleFilterChange = useCallback(
    (newFilters: typeof filters) => {
      setFilters(newFilters);
    },
    []
  );

  const handleMovieClick = useCallback((movie: TMDBMovie) => {
    openMovie(movie);
  }, [openMovie]);

  const handleTVClick = useCallback((show: TMDBTVShow) => {
    // Convert TV show to movie-like object for the modal
    const asMovie: TMDBMovie = {
      id: show.id,
      title: show.name,
      original_title: show.original_name,
      overview: show.overview,
      poster_path: show.poster_path,
      backdrop_path: show.backdrop_path,
      release_date: show.first_air_date,
      vote_average: show.vote_average,
      vote_count: show.vote_count,
      genre_ids: show.genre_ids,
      original_language: show.original_language,
      popularity: show.popularity,
      adult: false,
      media_type: "tv",
    };
    openMovie(asMovie);
  }, [openMovie]);

  const handleActorClick = useCallback((actorId: number) => {
    setSelectedActorId(actorId);
  }, []);

  const handleActorMovieClick = useCallback((movie: TMDBMovie) => {
    setSelectedActorId(null);
    openMovie(movie);
  }, [openMovie]);

  const handleSurpriseMe = useCallback(async () => {
    try {
      // Pick a random page from top 50 popular pages
      const randomPage = Math.floor(Math.random() * 50) + 1;
      const res = await fetch(`/api/movies?action=discover&page=${randomPage}&sort=popularity.desc`);
      if (res.ok) {
        const data = await res.json();
        const movies = data.results;
        if (movies?.length > 0) {
          const randomMovie = movies[Math.floor(Math.random() * movies.length)];
          openMovie(randomMovie);
        }
      }
    } catch (e) {
      console.error("Surprise me failed", e);
    }
  }, [openMovie]);

  return (
    <main className="min-h-screen flex flex-col bg-bg pb-16 lg:pb-0">
      {/* Trending Hero */}
      <TrendingHero onMovieClick={handleMovieClick} preferredLanguage={activeLanguage} />

      {/* Command Hub */}
      <CommandHub onFilterChange={handleFilterChange} onSurpriseMe={handleSurpriseMe} />

      {/* Bottom FABs */}
      <div className="fixed bottom-6 right-4 z-[80] hidden lg:flex flex-col sm:flex-row items-end sm:items-center gap-2">
        {likedCount > 0 && (
          <Link
            href="/recommendations"
            className="brutal-btn px-3 py-2.5 flex items-center gap-2 bg-surface hover:!bg-brutal-yellow hover:!text-black hover:!border-brutal-yellow"
          >
            <Sparkles className="w-4 h-4" strokeWidth={2.5} />
            <span className="font-mono font-bold text-xs">FOR YOU</span>
          </Link>
        )}
        <button
          onClick={() => setWatchlistOpen(true)}
          className="brutal-btn px-3 py-2.5 flex items-center gap-2 bg-surface hover:!bg-brutal-lime hover:!text-black hover:!border-brutal-lime"
          id="watchlist-fab"
        >
          <Bookmark className="w-4 h-4" fill={(watchlist.length + liked.length + watched.length) > 0 ? "currentColor" : "none"} strokeWidth={2.5} />
          <span className="font-mono font-bold text-xs">MY LISTS</span>
          {(watchlist.length + liked.length) > 0 && (
            <span className="brutal-chip text-brutal-lime border-brutal-lime text-[10px] px-1.5 py-0">
              {watchlist.length + liked.length}
            </span>
          )}
        </button>
      </div>


      {/* Media type tabs */}
      <div className="w-full">
        <div className="flex items-center">
          <div className="h-[3px] flex-1 bg-brutal-border" />
          <div className="flex items-center gap-0 mx-3">
            <button
              onClick={() => setMediaTab("movies")}
              className={`brutal-btn px-4 py-2 flex items-center gap-2 text-[10px] font-mono font-bold ${
                mediaTab === "movies"
                  ? "!bg-brutal-yellow !text-black !border-brutal-yellow"
                  : ""
              }`}
            >
              <Film className="w-3.5 h-3.5" strokeWidth={2.5} />
              MOVIES
            </button>
            <button
              onClick={() => setMediaTab("tv")}
              className={`brutal-btn px-4 py-2 flex items-center gap-2 text-[10px] font-mono font-bold ${
                mediaTab === "tv"
                  ? "!bg-brutal-cyan !text-black !border-brutal-cyan"
                  : ""
              }`}
            >
              <Tv className="w-3.5 h-3.5" strokeWidth={2.5} />
              TV SHOWS
            </button>
          </div>
          <div className="h-[3px] flex-1 bg-brutal-border" />
        </div>
      </div>

      {/* Content Grid */}
      <div className="flex-1 max-w-[1600px] mx-auto w-full pt-4 pb-8">
        {mediaTab === "movies" ? (
          <PosterGrid filters={effectiveFilters} onMovieClick={handleMovieClick} />
        ) : (
          <TVGrid filters={effectiveFilters} onShowClick={handleTVClick} />
        )}
      </div>


      {/* Modals */}
      <MovieModal
        movie={selectedMovie}
        onClose={closeMovie}
        onActorClick={handleActorClick}
      />
      <ActorModal
        actorId={selectedActorId}
        onClose={() => setSelectedActorId(null)}
        onMovieClick={handleActorMovieClick}
      />
      <WatchlistPanel
        isOpen={watchlistOpen}
        onClose={() => setWatchlistOpen(false)}
        onMovieClick={handleMovieClick}
      />
    </main>
  );
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "CineBlock",
  url: "https://cineblock.in",
  description: "Free cinema discovery app to find, track and match movies with friends.",
  applicationCategory: "EntertainmentApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "Movie discovery by genre, language and mood",
    "Personal watchlist and liked movies tracker",
    "Blocks to match movies with friends",
    "Box office charts and trending films",
    "Personalised movie recommendations",
    "Cinema news feed",
  ],
  keywords: "cineblock, cinema discovery, find movies, movie finder, cinema app, watch together, movie recommendations",
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeContent />
    </>
  );
}
