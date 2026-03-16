// Backwards-compatibility shim — all logic now lives in useMovieLists.
// Components that still import from @/hooks/useWatchlist will transparently
// get the new three-list context.
export {
  MovieListsProvider as WatchlistProvider,
  useMovieLists,
} from "./useMovieLists";

// Re-export useWatchlist pointing at liked-as-watchlist for old consumers
import { useMovieLists } from "./useMovieLists";
export function useWatchlist() {
  const lists = useMovieLists();
  return {
    // Old "watchlist" consumers (MovieModal, TrendingHero, TVGrid) used
    // watchlist for the bookmark icon. Map that to liked now.
    watchlist: lists.liked,
    isInWatchlist: lists.isLiked,
    toggleWatchlist: lists.toggleLiked,
    clearWatchlist: () => {},
    count: lists.liked.length,
  };
}
