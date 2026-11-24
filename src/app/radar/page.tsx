"use client";

import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { ArrowLeft, CalendarX2, Radio } from "lucide-react";
import ErrorState from "@/components/ErrorState";
import Link from "next/link";
import { useConvexAuth } from "convex/react";
import { useRadar } from "@/hooks/useRadar";
import ReleaseTimeline from "@/components/ReleaseTimeline";
import MovieModal from "@/components/MovieModal";
import { RadarMovie, TMDBMovie } from "@/lib/types";

function radarToTmdbMovie(item: RadarMovie): TMDBMovie {
  return {
    id: item.id,
    title: item.title,
    original_title: item.title,
    overview: item.overview,
    poster_path: item.poster_path,
    backdrop_path: item.backdrop_path,
    release_date: item.release_date,
    vote_average: item.vote_average,
    vote_count: 0,
    genre_ids: item.genre_ids,
    original_language: "",
    popularity: item.popularity,
    adult: false,
    media_type: item.media_type,
  };
}

function TimelineSkeleton() {
  return (
    <div className="flex gap-5 overflow-hidden px-6 pt-4 lg:px-10" role="status" aria-label="Loading upcoming releases">
      <div className="flex flex-col">
        <div className="mb-4 h-8 w-48 animate-pulse rounded-lg bg-white/[0.06]" />
        <div className="flex gap-5 border-t border-white/10 pt-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="w-[180px]">
              <div className="mb-2 h-5 w-16 animate-pulse rounded bg-white/[0.06]" />
              <div className="aspect-[2/3] animate-pulse rounded-xl bg-white/[0.05]" />
              <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-white/[0.06]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function RadarPage() {
  const { movies, loading, error, isPersonalized } = useRadar();
  const { isAuthenticated } = useConvexAuth();
  const [selectedMovie, setSelectedMovie] = useState<TMDBMovie | null>(null);

  const handleMovieClick = useCallback((item: RadarMovie) => {
    setSelectedMovie(radarToTmdbMovie(item));
  }, []);

  return (
    <main className="min-h-screen pb-20 pt-20 md:pt-24" style={{ background: "#020817" }}>
      <header className="mx-auto mb-8 max-w-[1400px] px-4 md:mb-12 lg:px-10">
        <Link
          href="/"
          aria-label="Back to home"
          className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-colors duration-150 hover:bg-white/10 hover:text-white"
          style={{ border: "1px solid rgba(255,255,255,0.12)" }}
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
        </Link>
        <h1 className="font-display !text-4xl font-semibold tracking-tight text-white md:!text-5xl">Release Radar</h1>
        <p className="mt-2 max-w-xl text-base text-slate-400">
          {isPersonalized ? "Upcoming films, picked from what you like." : "Upcoming films, in release order."}
        </p>
        {!isPersonalized && !loading && (
          <p className="mt-1 text-sm text-slate-500">
            {isAuthenticated ? (
              "Like a few films and this list will lean toward your taste."
            ) : (
              <>
                <Link href="/sign-in?returnTo=/radar" className="text-blue-300 underline-offset-4 hover:underline">Sign in</Link>
                {" "}and like a few films to tailor this list.
              </>
            )}
          </p>
        )}
      </header>

      {error ? (
        <ErrorState
          icon={Radio}
          title="Release Radar went quiet"
          message="The movie database didn't answer. Check your connection and try again."
          onRetry={() => window.location.reload()}
        />
      ) : loading ? (
        <TimelineSkeleton />
      ) : movies.length === 0 ? (
        <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-16 text-center">
          <CalendarX2 className="h-10 w-10 text-slate-500" strokeWidth={1.25} />
          <p className="text-sm text-slate-400">No upcoming releases to show right now.</p>
        </div>
      ) : (
        <ReleaseTimeline movies={movies} onMovieClick={handleMovieClick} />
      )}

      <AnimatePresence>
        {selectedMovie && <MovieModal movie={selectedMovie} onClose={() => setSelectedMovie(null)} />}
      </AnimatePresence>
    </main>
  );
}
