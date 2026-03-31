import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { RadarMovie } from "@/lib/types";
import { usePreferredLanguage } from "./usePreferredLanguage";

const SYNC_THROTTLE = 24 * 60 * 60 * 1000; // 24 hours

export function useRadar() {
  const [guestMovies, setGuestMovies] = useState<RadarMovie[]>([]);
  const [loadingGuest, setLoadingGuest] = useState(false);
  const [guestError, setGuestError] = useState<string | null>(null);
  
  const user = useQuery(api.users.currentUser);
  const dbRadar = useQuery(api.radar.getUserRadar);
  const syncRadar = useAction(api.radar.syncRadar);
  const clearRadar = useMutation(api.radar.clearUserRadar);
  const preferredLanguage = usePreferredLanguage();
  const hasSynced = useRef<string | null>(null);

  // 1. Get genre interests for sync action
  const genreData = useQuery(api.lists.getUserGenres);
  const topGenreIds = useMemo(() => {
    if (!genreData) return [];
    return genreData.slice(0, 5).map(g => g.genreId);
  }, [genreData]);

  // 2. Handle Sync Throttling & Language Changes
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (user && genreData !== undefined && !isSyncing) {
      const now = Date.now();
      const lastSync = user.lastRadarSync || 0;
      const lastSyncLang = user.lastRadarSyncLanguage || "";
      
      // Trigger sync if:
      // 1. More than 24h passed
      // 2. Language has changed from what's stored in DB
      // 3. Radar is currently empty (safety fallback)
      const languageMismatched = preferredLanguage !== lastSyncLang;
      const timeExpired = now - lastSync > SYNC_THROTTLE;
      const neverSynced = !user.lastRadarSync;
      const radarIsEmpty = dbRadar && dbRadar.length === 0;

      if (timeExpired || languageMismatched || neverSynced || radarIsEmpty) {
        console.log("Radar needs sync:", { timeExpired, languageMismatched, neverSynced, radarIsEmpty, preferredLanguage, lastSyncLang });
        
        // Prevent concurrent syncs
        setIsSyncing(true);

        const runSync = async () => {
          // If language changed, wipe the old data first to clear clutter
          if (languageMismatched) {
             console.log("Language changed - clearing old Radar entries first...");
             await clearRadar();
          }

          await syncRadar({ 
            genreIds: topGenreIds, 
            language: preferredLanguage 
          });
        };
        
        runSync()
          .then(() => console.log("Radar Sync Success"))
          .catch(err => console.error("Radar Sync Error:", err))
          .finally(() => setIsSyncing(false));
      }
    }
  }, [user, genreData, topGenreIds, preferredLanguage, syncRadar, clearRadar, isSyncing, dbRadar]);

  // 3. Handle Guest Mode (Stateless TMDB Fetch)
  useEffect(() => {
    if (user === null) {
      setLoadingGuest(true);
      const params = new URLSearchParams();
      if (preferredLanguage) params.set("lang", preferredLanguage);
      
      fetch(`/api/radar?${params.toString()}`)
        .then(res => res.json())
        .then(data => {
          setGuestMovies(data.movies || []);
          setGuestError(null);
        })
        .catch(err => setGuestError(err.message))
        .finally(() => setLoadingGuest(false));
    }
  }, [user, preferredLanguage]);

  // 4. Consolidate Data
  const movies = useMemo(() => {
    if (user !== null && dbRadar) {
      return dbRadar.map(m => ({
        id: m.tmdbId,
        title: m.title,
        release_date: m.releaseDate,
        poster_path: m.posterPath,
        backdrop_path: "", // Not stored for storage efficiency
        genre_ids: m.genreIds,
        overview: m.overview,
        vote_average: m.voteAverage,
        popularity: m.popularity,
        media_type: "movie" as const
      }));
    }
    return guestMovies;
  }, [user, dbRadar, guestMovies]);

  const isLoading = user === undefined || (user !== null && !dbRadar) || (user === null && loadingGuest);

  return {
    movies,
    loading: isLoading,
    error: guestError,
    isPersonalized: user !== null
  };
}
