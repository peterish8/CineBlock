import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { RadarMovie } from "@/lib/types";

const SYNC_THROTTLE = 24 * 60 * 60 * 1000; // 24 hours

// Detect region from browser timezone — same signal TMDB uses
function getRegion(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz.startsWith("Asia/Kolkata") || tz.startsWith("Asia/Calcutta")) return "IN";
    if (tz.startsWith("Asia/Seoul")) return "KR";
    if (tz.startsWith("Asia/Tokyo")) return "JP";
    if (tz.startsWith("Asia/Shanghai") || tz.startsWith("Asia/Hong_Kong")) return "CN";
    if (tz.startsWith("Asia/Singapore") || tz.startsWith("Asia/Kuala_Lumpur")) return "SG";
    if (tz.startsWith("Australia/")) return "AU";
    if (tz.startsWith("America/")) return "US";
    if (tz.startsWith("Europe/London")) return "GB";
    if (tz.startsWith("Europe/")) return "DE";
  } catch {}
  return "US";
}

export function useRadar() {
  const [guestMovies, setGuestMovies] = useState<RadarMovie[]>([]);
  const [loadingGuest, setLoadingGuest] = useState(false);
  const [guestError, setGuestError] = useState<string | null>(null);

  const user = useQuery(api.users.currentUser);
  const dbRadar = useQuery(api.radar.getUserRadar);
  const syncRadar = useAction(api.radar.syncRadar);
  const clearRadar = useMutation(api.radar.clearUserRadar);
  const isSyncing = useRef(false);
  const syncFailed = useRef(false);
  const lastAttemptedRegion = useRef<string | null>(null);
  const hasFetched = useRef(false);
  const fetchedRegion = useRef<string | null>(null);

  const region = useMemo(() => getRegion(), []);

  // 1. Get genre interests for personalized secondary layer
  const genreData = useQuery(api.lists.getUserGenres);
  const topGenreIds = useMemo(() => {
    if (!genreData) return [];
    return genreData.slice(0, 5).map(g => g.genreId);
  }, [genreData]);

  // 2. Sync logic — region-based, throttled
  useEffect(() => {
    if (user && genreData !== undefined && !isSyncing.current) {
      const now = Date.now();
      const lastSync = user.lastRadarSync || 0;
      const lastSyncRegion = user.lastRadarSyncLanguage || ""; // reusing this field for region

      const regionChanged = region !== lastSyncRegion;
      const timeExpired = now - lastSync > SYNC_THROTTLE;
      const neverSynced = !user.lastRadarSync;
      const radarIsEmpty = dbRadar && dbRadar.length === 0;

      // Don't retry the same region after failure
      if (syncFailed.current && lastAttemptedRegion.current === region) return;
      if (syncFailed.current) syncFailed.current = false;

      if (timeExpired || regionChanged || neverSynced || radarIsEmpty) {
        isSyncing.current = true;
        lastAttemptedRegion.current = region;

        const runSync = async () => {
          if (regionChanged) await clearRadar();
          await syncRadar({ genreIds: topGenreIds, region });
        };

        runSync()
          .then(() => { syncFailed.current = false; })
          .catch(() => { syncFailed.current = true; })
          .finally(() => { isSyncing.current = false; });
      }
    }
  }, [user, genreData, topGenreIds, region, syncRadar, clearRadar, dbRadar]);

  // 3. Guest mode — pass region, server detects from IP or falls back to query param
  useEffect(() => {
    if (user === null && (!hasFetched.current || fetchedRegion.current !== region)) {
      setLoadingGuest((prev) => (prev ? prev : true));
      hasFetched.current = true;
      fetchedRegion.current = region;
      const params = new URLSearchParams({ region });

      fetch(`/api/radar?${params.toString()}`)
        .then(res => res.json())
        .then(data => {
          setGuestMovies(data.movies || []);
          setGuestError(null);
        })
        .catch(err => setGuestError(err.message))
        .finally(() => setLoadingGuest(false));
    }
  }, [user, region]);

  // 4. Consolidate
  const movies = useMemo(() => {
    if (user !== null && dbRadar) {
      return dbRadar.map(m => ({
        id: m.tmdbId,
        title: m.title,
        release_date: m.releaseDate,
        poster_path: m.posterPath,
        backdrop_path: "",
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
