export const MAX_BLOCKS_PER_USER = 15;
export const MAX_MOVIES_PER_BLOCK = 35;
export const MAX_BLOCK_TITLE_LENGTH = 60;
export const MAX_BLOCK_DESCRIPTION_LENGTH = 280;
export const STAMP_REVIEW_MAX = 1000;
export const MAX_TITLE_LENGTH = 200;
export const MAX_POSTER_PATH_LENGTH = 2048;

/** Trims a title's identity fields, or returns null when they break a limit. */
export function normalizeTitleIdentity(item: { movieId: number; movieTitle: string; posterPath?: string }) {
  const movieTitle = item.movieTitle.trim();
  const posterPath = (item.posterPath ?? "").trim();
  if (!Number.isSafeInteger(item.movieId) || item.movieId <= 0) return null;
  if (!movieTitle || movieTitle.length > MAX_TITLE_LENGTH) return null;
  if (posterPath.length > MAX_POSTER_PATH_LENGTH) return null;
  return { movieId: item.movieId, movieTitle, posterPath };
}
