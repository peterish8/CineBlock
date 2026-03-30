import { TMDBGenre } from "./types";

export const TMDB_BASE_URL = "https://api.themoviedb.org/3";
export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export const POSTER_SIZES = {
  small: "w342",
  medium: "w500",
  large: "w780",
  original: "original",
} as const;

export const BACKDROP_SIZES = {
  small: "w780",
  large: "w1280",
  original: "original",
} as const;

export function posterUrl(path: string | null, size: keyof typeof POSTER_SIZES = "medium"): string {
  if (!path) return "";
  return `${TMDB_IMAGE_BASE}/${POSTER_SIZES[size]}${path}`;
}

export function backdropUrl(path: string | null, size: keyof typeof BACKDROP_SIZES = "large"): string {
  if (!path) return "";
  return `${TMDB_IMAGE_BASE}/${BACKDROP_SIZES[size]}${path}`;
}

export const LOGO_SIZES = {
  small: "w300",
  medium: "w500",
  large: "w780",
  original: "original",
} as const;

export function logoUrl(path: string | null, size: keyof typeof LOGO_SIZES = "medium"): string {
  if (!path) return "";
  return `${TMDB_IMAGE_BASE}/${LOGO_SIZES[size]}${path}`;
}

export const GENRES: TMDBGenre[] = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 14, name: "Fantasy" },
  { id: 36, name: "History" },
  { id: 27, name: "Horror" },
  { id: 10402, name: "Music" },
  { id: 9648, name: "Mystery" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Science Fiction" },
  { id: 10770, name: "TV Movie" },
  { id: 53, name: "Thriller" },
  { id: 10752, name: "War" },
  { id: 37, name: "Western" },
  // Custom Virtual Genres for UI
  { id: 9901, name: "K-Drama" },
  { id: 9902, name: "C-Drama" },
  { id: 9903, name: "Anime" },
];

export const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "ko", name: "Korean" },
  { code: "ja", name: "Japanese" },
  { code: "fr", name: "French" },
  { code: "es", name: "Spanish" },
  { code: "de", name: "German" },
  { code: "hi", name: "Hindi" },
  { code: "zh", name: "Chinese" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "ta", name: "Tamil" },
  { code: "te", name: "Telugu" },
  { code: "th", name: "Thai" },
  { code: "tr", name: "Turkish" },
  { code: "ar", name: "Arabic" },
  { code: "ml", name: "Malayalam" },
  { code: "sv", name: "Swedish" },
  { code: "da", name: "Danish" },
  { code: "pl", name: "Polish" },
];

export const SORT_OPTIONS = [
  { value: "popularity.desc", label: "Most Popular" },
  { value: "vote_average.desc", label: "Highest Rated" },
  { value: "primary_release_date.desc", label: "Newest First" },
  { value: "primary_release_date.asc", label: "Oldest First" },
  { value: "revenue.desc", label: "Highest Revenue" },
];

export function generateYearRange(): string[] {
  const currentYear = new Date().getFullYear();
  const years: string[] = [];
  for (let y = currentYear; y >= 1950; y--) {
    years.push(y.toString());
  }
  return years;
}
