"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bookmark, Film, Tv } from "lucide-react";
import CommandHub from "@/components/CommandHub";
import PosterGrid from "@/components/PosterGrid";
import TVGrid from "@/components/TVGrid";
import TrendingHero from "@/components/TrendingHero";
// Lazy-load modals — not needed on initial paint, improves FCP
const MovieModal = dynamic(() => import("@/components/MovieModal"), { ssr: false });
const WatchlistPanel = dynamic(() => import("@/components/WatchlistPanel"), { ssr: false });
import { useMovieLists } from "@/hooks/useMovieLists";
import { usePreferredLanguage } from "@/hooks/usePreferredLanguage";
import { useRegion, REGION_TO_LANGUAGE } from "@/hooks/useRegion";
import { usePersonalizedRecs } from "@/hooks/usePersonalizedRecs";
import { TMDBMovie, TMDBTVShow } from "@/lib/types";
import { toMovieSlug } from "@/lib/slugify";
import Attribution from "@/components/Attribution";
import { useToast } from "@/components/ToastProvider";

const TV_FIRST_GENRES = new Set(["9901", "9902", "9903"]); // K-Drama, C-Drama, Anime

const MEDIA_TABS = [
  { id: "movies", label: "Movies", Icon: Film },
  { id: "tv", label: "TV shows", Icon: Tv },
] as const;

const FAB_CLASS = "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-white/90 transition-colors duration-200 hover:bg-white/15";
const FAB_STYLE = { background: "rgba(255,255,255,0.05)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.18)", boxShadow: "0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.12)" };

function HomeContent() {
  const [filters, setFilters] = useState({
    query: "",
    genre: "",
    year: "",
    language: "",
    sort: "popularity.desc",
    rating: "",
    runtime: "",
    keyword: "",
  });
  const [selectedMovie, setSelectedMovie] = useState<TMDBMovie | null>(null);
  const modalPushedState = useRef(false);
  const [watchlistOpen, setWatchlistOpen] = useState(false);
  const [mediaTab, setMediaTab] = useState<"movies" | "tv">("movies");
  const { liked, watchlist, watched } = useMovieLists();
  const { pushToast } = useToast();
  const reduceMotion = useReducedMotion();

  // Snapshot watched IDs once when the list first loads — cards only disappear after refresh.
  const [watchedIds, setWatchedIds] = useState<Set<number>>(() => new Set());
  const watchedSnapshotTaken = useRef(false);
  useEffect(() => {
    if (watchedSnapshotTaken.current || watched.length === 0) return;
    watchedSnapshotTaken.current = true;
    queueMicrotask(() => setWatchedIds(new Set(watched.map((m) => m.id))));
  }, [watched]);

  // Personalized recommendations — analyzed from watch history, max 2 API calls per session
  const { cards: personalizedCards } = usePersonalizedRecs({
    watched,
    liked,
    excludeIds: watchedIds,
    limit: 12,
    skip: watched.length + liked.length < 2,
  });
  const preferredLanguage = usePreferredLanguage();
  const { region } = useRegion();
  // Use explicit preference if set, else fall back to region-based language
  const activeLanguage = preferredLanguage || REGION_TO_LANGUAGE[region] || "";

  // Apply language preference as default when user hasn't manually set a language filter
  // useMemo prevents a new object reference on every render — without this, PosterGrid's
  // fetchMovies useCallback sees [filters] as changed, fires useEffect, clears movies and
  // re-fetches every time useMovieLists state updates (like/watchlist/watched toggles).
  const effectiveFilters = useMemo(() => ({
    ...filters,
    language: filters.language || activeLanguage,
  }), [filters, activeLanguage]);

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
            genre_ids: data.genres?.map((g: { id: number }) => g.id) || [],
            original_language: data.original_language,
            popularity: data.popularity,
            adult: false,
            media_type: "tv",
          } : { ...data, media_type: "movie" };
          setSelectedMovie(asMovie);
        }
      } catch (e) {
        console.error("Failed to load shared media", e);
        pushToast("error", "Couldn't load the shared title. Please try the link again.");
      }
    };

    if (movieId) {
      loadSharedMedia(movieId, "movie");
      window.history.replaceState({}, '', '/');
    } else if (tvId) {
      loadSharedMedia(tvId, "tv");
      window.history.replaceState({}, '', '/');
    }
  }, [pushToast]);

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
      // Auto-switch to TV tab for TV-first virtual genres
      if (newFilters.genre && TV_FIRST_GENRES.has(newFilters.genre)) {
        setMediaTab("tv");
      }
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


  const handleSurpriseMe = useCallback(async () => {
    try {
      // Pick a random page from top 50 popular pages
      const randomPage = Math.floor(Math.random() * 50) + 1;
      const res = await fetch(`/api/movies?action=discover&page=${randomPage}&sort=popularity.desc`);
      if (!res.ok) throw new Error(`Discover fetch failed with status ${res.status}`);
      const data = await res.json();
      const movies = data.results;
      if (movies?.length > 0) {
        const randomMovie = movies[Math.floor(Math.random() * movies.length)];
        openMovie(randomMovie);
      } else {
        pushToast("info", "No surprise found right now. Try again in a moment.");
      }
    } catch (e) {
      console.error("Surprise me failed", e);
      pushToast("error", "Couldn't fetch a surprise title. Please try again.");
    }
  }, [openMovie, pushToast]);

  return (
    <main suppressHydrationWarning className="min-h-screen flex flex-col bg-bg pb-16 lg:pb-0">
      {/* Trending Hero */}
      <TrendingHero onMovieClick={handleMovieClick} preferredLanguage={activeLanguage} />

      {/* Command Hub */}
      <CommandHub onFilterChange={handleFilterChange} onSurpriseMe={handleSurpriseMe} />

      {/* Bottom FABs */}
      <div className="fixed bottom-6 right-4 z-[80] hidden lg:flex">
        <button suppressHydrationWarning type="button" onClick={() => setWatchlistOpen(true)} className={`${FAB_CLASS} active:scale-95`} style={FAB_STYLE} id="watchlist-fab">
          <Bookmark className="w-4 h-4" fill={(watchlist.length + liked.length + watched.length) > 0 ? "currentColor" : "none"} strokeWidth={2} />
          My lists
          {(watchlist.length + liked.length) > 0 && (
            <span className="rounded-md px-1.5 text-[11px] tabular-nums text-blue-200" style={{ background: "rgba(96,165,250,0.16)" }}>
              {watchlist.length + liked.length}
            </span>
          )}
        </button>
      </div>

      {/* Media type tabs */}
      <div className="mx-auto flex w-full max-w-[1600px] items-center gap-4 px-3 pt-4 sm:px-4 lg:px-6">
        <span aria-hidden="true" className="h-px flex-1 bg-white/[0.08]" />
        <div
          role="tablist"
          aria-label="Media type"
          className="flex rounded-full p-1"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}
          onKeyDown={(event) => {
            if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
            event.preventDefault();
            const next = mediaTab === "movies" ? "tv" : "movies";
            setMediaTab(next);
            event.currentTarget.querySelector<HTMLElement>(`[data-tab="${next}"]`)?.focus();
          }}
        >
          {MEDIA_TABS.map(({ id, label, Icon }) => {
            const selected = mediaTab === id;
            return (
              <button
                key={id}
                data-tab={id}
                type="button"
                role="tab"
                aria-selected={selected}
                tabIndex={selected ? 0 : -1}
                onClick={() => setMediaTab(id)}
                className={`relative flex min-h-9 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors duration-150 ${selected ? "text-white" : "text-slate-400 hover:text-slate-200"}`}
              >
                {selected && (
                  <motion.span
                    layoutId="media-tab-thumb"
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full"
                    style={{ background: "rgba(96,165,250,0.18)", boxShadow: "inset 0 0 0 1px rgba(96,165,250,0.40)" }}
                    transition={reduceMotion ? { duration: 0 } : { type: "spring", duration: 0.35, bounce: 0 }}
                  />
                )}
                <Icon className="relative h-4 w-4" strokeWidth={2} />
                <span className="relative">{label}</span>
              </button>
            );
          })}
        </div>
        <span aria-hidden="true" className="h-px flex-1 bg-white/[0.08]" />
      </div>

      {/* Content Grid */}
      <div className="flex-1 max-w-[1600px] mx-auto w-full pt-4 pb-8">
        {mediaTab === "movies" ? (
          <PosterGrid
            filters={effectiveFilters}
            onMovieClick={handleMovieClick}
            hiddenIds={watchedIds}
            personalizedCards={personalizedCards}
          />
        ) : (
          <TVGrid
            filters={effectiveFilters}
            onShowClick={handleTVClick}
            watchedIds={watchedIds}
            watched={[]}
            onMovieClick={handleMovieClick}
          />
        )}
      </div>


      <Attribution />

      {/* Modals */}
      <AnimatePresence mode="wait">
        {selectedMovie && (
          <MovieModal
            key={selectedMovie.id}
            movie={selectedMovie}
            onClose={closeMovie}
          />
        )}
      </AnimatePresence>
      <WatchlistPanel
        isOpen={watchlistOpen}
        onClose={() => setWatchlistOpen(false)}
        onMovieClick={handleMovieClick}
      />
    </main>
  );
}

export default function Home() {
  return <HomeContent />;
}
