"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import {
  X, Play, Plus, Check, ThumbsUp, ThumbsDown, ChevronDown,
  Volume2, VolumeX
} from "lucide-react";
import { TMDBMovie, TMDBMovieDetail, TMDBVideo } from "@/lib/types";
import { backdropUrl, posterUrl } from "@/lib/constants";

interface Props {
  movie: TMDBMovie | null;
  onClose: () => void;
}

type TabKey = "moreLikeThis" | "details";

export default function NetflixMovieModal({ movie, onClose }: Props) {
  const [details, setDetails] = useState<TMDBMovieDetail | null>(null);
  const [similar, setSimilar] = useState<TMDBMovie[]>([]);
  const [loading, setLoading] = useState(false);
  const [muted, setMuted] = useState(true);
  const [videoReady, setVideoReady] = useState(false);
  const [tab, setTab] = useState<TabKey>("moreLikeThis");
  const [nestedMovie, setNestedMovie] = useState<TMDBMovie | null>(null);
  const [inMyList, setInMyList] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const activeMov = nestedMovie || movie;

  const fetchDetails = useCallback(async (id: number, type: "movie" | "tv") => {
    setLoading(true);
    setDetails(null);
    setSimilar([]);
    setVideoReady(false);
    try {
      const detailAction = type === "tv" ? "tv-details" : "details";
      const simAction = type === "tv" ? "similar-tv" : "similar";
      const [dRes, sRes] = await Promise.all([
        fetch(`/api/movies?action=${detailAction}&id=${id}`),
        fetch(`/api/movies?action=${simAction}&id=${id}`),
      ]);
      if (dRes.ok) setDetails(await dRes.json());
      if (sRes.ok) {
        const sd = await sRes.json();
        setSimilar((sd.results || []).slice(0, 12).map((m: TMDBMovie) => ({ ...m, media_type: type })));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeMov) {
      fetchDetails(activeMov.id, activeMov.media_type || "movie");
      document.body.style.overflow = "hidden";
    }
    return () => { document.body.style.overflow = ""; };
  }, [activeMov, fetchDetails]);

  useEffect(() => {
    const timer = setTimeout(() => setVideoReady(true), 2500);
    return () => clearTimeout(timer);
  }, [activeMov]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleClose]);

  const handleClose = useCallback(() => {
    setNestedMovie(null);
    document.body.style.overflow = "";
    onClose();
  }, [onClose]);

  if (!activeMov) return null;

  // Compute trailer
  const trailer = details?.videos?.results?.find(
    (v: TMDBVideo) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser")
  ) || details?.videos?.results?.find((v: TMDBVideo) => v.site === "YouTube");

  const cast = details?.credits?.cast?.slice(0, 5) || [];
  const genres = details?.genres || [];
  const runtime = details?.runtime;
  const year = (activeMov.release_date || activeMov.first_air_date || "").split("-")[0];
  const matchScore = Math.max(62, Math.min(99, Math.round((activeMov.vote_average || 7) * 10)));
  const isTv = activeMov.media_type === "tv" || !!activeMov.first_air_date;
  const seasons = details?.seasons?.filter(s => s.season_number > 0) || [];

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      onClick={(e) => e.target === overlayRef.current && handleClose()}
    >
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.75)" }}
        onClick={handleClose}
      />

      {/* Modal Container */}
      <div
        className="relative w-full max-w-[850px] mx-4 rounded-md overflow-y-auto"
        style={{
          maxHeight: "90vh",
          background: "#181818",
          boxShadow: "0 0 60px rgba(0,0,0,0.9)",
          animation: "nfxSlideUp 0.3s cubic-bezier(0.25,0.46,0.45,0.94)"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Hero area ── */}
        <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
          {/* Static backdrop (always shown, video fades over it) */}
          {activeMov.backdrop_path ? (
            <Image
              src={backdropUrl(activeMov.backdrop_path)}
              alt={activeMov.title || activeMov.name || ""}
              fill
              className="object-cover"
              priority
              sizes="850px"
            />
          ) : (
            <div className="w-full h-full bg-zinc-900" />
          )}

          {/* Autoplaying trailer (fades in after brief delay) */}
          {trailer && videoReady && (
            <iframe
              key={trailer.key}
              src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=${muted ? 1 : 0}&controls=0&rel=0&modestbranding=1&loop=1&playlist=${trailer.key}&enablejsapi=1`}
              title={trailer.name}
              className="absolute inset-0 w-full h-full"
              style={{ border: "none", opacity: videoReady ? 1 : 0, transition: "opacity 0.8s ease-in" }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          )}

          {/* Bottom gradient to card body */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(to top, #181818 0%, transparent 40%)" }}
          />

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-30 w-9 h-9 rounded-full flex items-center justify-center transition-colors"
            style={{ background: "#181818" }}
          >
            <X className="w-5 h-5 text-white" strokeWidth={2} />
          </button>

          {/* Mute toggle */}
          {trailer && videoReady && (
            <button
              onClick={() => setMuted(m => !m)}
              className="absolute bottom-16 right-5 z-30 w-9 h-9 rounded-full border border-white/50 flex items-center justify-center hover:border-white transition-colors"
              style={{ background: "rgba(42,42,42,0.6)" }}
            >
              {muted
                ? <VolumeX className="w-4 h-4 text-white" />
                : <Volume2 className="w-4 h-4 text-white" />
              }
            </button>
          )}

          {/* Content overlay at bottom */}
          <div className="absolute bottom-4 left-6 right-20 z-20">
            <h2 className="text-white font-black text-3xl md:text-4xl mb-4 drop-shadow-2xl leading-none">
              {activeMov.title || activeMov.name}
            </h2>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded font-bold text-base hover:bg-white/80 transition-colors">
                <Play className="w-5 h-5 fill-black" /> Play
              </button>
              <button
                onClick={() => setInMyList(v => !v)}
                className="w-10 h-10 rounded-full border-2 border-white/60 flex items-center justify-center hover:border-white transition-colors"
                style={{ background: "rgba(42,42,42,0.6)" }}
                title={inMyList ? "Remove from My List" : "Add to My List"}
              >
                {inMyList ? <Check className="w-5 h-5 text-white" /> : <Plus className="w-5 h-5 text-white" />}
              </button>
              <button
                className="w-10 h-10 rounded-full border-2 border-white/60 flex items-center justify-center hover:border-white transition-colors"
                style={{ background: "rgba(42,42,42,0.6)" }}
                title="I like this"
              >
                <ThumbsUp className="w-4 h-4 text-white" />
              </button>
              <button
                className="w-10 h-10 rounded-full border-2 border-white/60 flex items-center justify-center hover:border-white transition-colors"
                style={{ background: "rgba(42,42,42,0.6)" }}
                title="Not for me"
              >
                <ThumbsDown className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="px-6 pb-8">
          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-3 py-4 text-sm font-semibold">
            <span style={{ color: "#46d369" }}>{matchScore}% Match</span>
            <span className="border border-white/40 px-1.5 py-0.5 text-white/70 text-xs rounded-sm">
              {isTv ? "TV-MA" : "A"}
            </span>
            {year && <span className="text-white/70">{year}</span>}
            {runtime && (
              <span className="text-white/70">
                {Math.floor(runtime / 60)}h {runtime % 60}m
              </span>
            )}
            {isTv && seasons.length > 0 && (
              <span className="text-white/70">{seasons.length} Season{seasons.length > 1 ? "s" : ""}</span>
            )}
            <span className="border border-white/40 px-1 py-0.5 text-white/50 text-[10px] rounded-sm font-bold">HD</span>
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="md:col-span-2">
              {loading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-4 rounded animate-pulse" style={{ background: "#333", width: `${90 - i * 15}%` }} />
                  ))}
                </div>
              ) : (
                <p className="text-white/90 text-sm leading-relaxed">
                  {activeMov.overview || "No description available."}
                </p>
              )}
            </div>
            <div className="text-xs text-white/50 space-y-2">
              {cast.length > 0 && (
                <p>
                  <span className="text-white/30">Cast: </span>
                  {cast.map(c => c.name).join(", ")}
                </p>
              )}
              {genres.length > 0 && (
                <p>
                  <span className="text-white/30">Genres: </span>
                  {genres.map(g => g.name).join(", ")}
                </p>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-white/10 mb-6">
            <div className="flex gap-6">
              {(["moreLikeThis", "details"] as TabKey[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="pb-3 text-sm font-semibold transition-colors relative"
                  style={{ color: tab === t ? "#fff" : "rgba(255,255,255,0.4)" }}
                >
                  {t === "moreLikeThis" ? "More Like This" : "Details"}
                  {tab === t && (
                    <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#E50914] rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {tab === "moreLikeThis" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {loading
                ? [...Array(6)].map((_, i) => (
                    <div key={i} className="rounded-md overflow-hidden animate-pulse" style={{ background: "#2b2b2b" }}>
                      <div className="aspect-video" />
                      <div className="p-3 space-y-2">
                        <div className="h-3 rounded" style={{ background: "#333" }} />
                        <div className="h-3 rounded w-3/4" style={{ background: "#333" }} />
                      </div>
                    </div>
                  ))
                : similar.length > 0
                ? similar.map(sim => (
                    <SimilarCard
                      key={sim.id}
                      movie={sim}
                      onClick={() => { setNestedMovie(sim); setTab("moreLikeThis"); }}
                    />
                  ))
                : (
                  <p className="col-span-3 text-white/30 text-sm text-center py-8">No similar titles found.</p>
                )
              }
            </div>
          )}

          {tab === "details" && (
            <div className="text-sm text-white/70 space-y-4">
              {details?.tagline && (
                <p className="text-xl text-white/50 italic">&ldquo;{details.tagline}&rdquo;</p>
              )}
              {genres.length > 0 && (
                <div>
                  <span className="text-white/30 text-xs uppercase tracking-wider">Genres: </span>
                  <span>{genres.map(g => g.name).join(", ")}</span>
                </div>
              )}
              {cast.length > 0 && (
                <div>
                  <span className="text-white/30 text-xs uppercase tracking-wider">Cast: </span>
                  <span>{details?.credits?.cast?.slice(0, 10).map(c => c.name).join(", ")}</span>
                </div>
              )}
              {runtime && (
                <div>
                  <span className="text-white/30 text-xs uppercase tracking-wider">Runtime: </span>
                  <span>{Math.floor(runtime / 60)}h {runtime % 60}m</span>
                </div>
              )}
              {details?.status && (
                <div>
                  <span className="text-white/30 text-xs uppercase tracking-wider">Status: </span>
                  <span>{details.status}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Animation */}
      <style>{`
        @keyframes nfxSlideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

function SimilarCard({ movie, onClick }: { movie: TMDBMovie; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  const matchScore = Math.max(62, Math.min(99, Math.round((movie.vote_average || 7) * 10)));
  const year = (movie.release_date || movie.first_air_date || "").split("-")[0];

  return (
    <div
      className="rounded-md overflow-hidden cursor-pointer transition-transform duration-200"
      style={{ background: "#2b2b2b", transform: hov ? "scale(1.02)" : "scale(1)" }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
    >
      {/* Backdrop */}
      <div className="relative aspect-video bg-zinc-800">
        {movie.backdrop_path ? (
          <Image src={backdropUrl(movie.backdrop_path)} alt={movie.title || ""} fill className="object-cover" sizes="300px" />
        ) : movie.poster_path ? (
          <Image src={posterUrl(movie.poster_path, "medium")} alt={movie.title || ""} fill className="object-cover object-top" sizes="300px" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/20 text-xs px-2 text-center">
            {movie.title || movie.name}
          </div>
        )}
        {/* Hover play overlay */}
        {hov && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.3)" }}>
            <div className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center">
              <Play className="w-5 h-5 text-white fill-white ml-0.5" />
            </div>
          </div>
        )}
      </div>
      {/* Info */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <span style={{ color: "#46d369" }} className="text-xs font-bold">{matchScore}% Match</span>
          <div className="flex items-center gap-2 text-white/40 text-[11px]">
            <span>{year}</span>
            <button className="w-6 h-6 rounded-full border border-white/30 flex items-center justify-center hover:border-white transition-colors">
              <ChevronDown className="w-3 h-3 text-white/60" />
            </button>
          </div>
        </div>
        <p className="text-white text-xs font-semibold line-clamp-2 leading-snug">{movie.title || movie.name}</p>
        <p className="text-white/40 text-xs mt-1 line-clamp-2 leading-snug">{movie.overview}</p>
      </div>
    </div>
  );
}
