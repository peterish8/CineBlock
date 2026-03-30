// TMDB API TypeScript interfaces

export interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  logo_path?: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  original_language: string;
  popularity: number;
  adult: boolean;
  media_type?: "movie" | "tv";
  name?: string;
  first_air_date?: string;
  custom_era?: string;
}

export interface TMDBDiscoverResponse {
  page: number;
  results: TMDBMovie[];
  total_pages: number;
  total_results: number;
}

export interface TMDBVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  size: number;
  type: string;
  official: boolean;
}

export interface TMDBMovieDetail {
  id: number;
  title: string;
  original_title: string;
  tagline: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  runtime: number;
  genres: { id: number; name: string }[];
  production_countries: { iso_3166_1: string; name: string }[];
  spoken_languages: { iso_639_1: string; name: string; english_name: string }[];
  budget: number;
  revenue: number;
  status: string;
  credits?: {
    cast: TMDBCastMember[];
  };
  videos?: {
    results: TMDBVideo[];
  };
  seasons?: {
    id: number;
    name: string;
    episode_count: number;
    season_number: number;
    air_date: string | null;
    poster_path: string | null;
  }[];
  belongs_to_collection?: TMDBCollection | null;
}

export interface TMDBCastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBWatchProvider {
  logo_path: string;
  provider_id: number;
  provider_name: string;
  display_priority: number;
}

export interface TMDBWatchProviderResponse {
  id: number;
  results: {
    [countryCode: string]: {
      link: string;
      flatrate?: TMDBWatchProvider[];
      rent?: TMDBWatchProvider[];
      buy?: TMDBWatchProvider[];
    };
  };
}

export interface TMDBPerson {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
  known_for_department: string;
  movie_credits?: {
    cast: TMDBPersonMovieCredit[];
  };
}

export interface TMDBPersonMovieCredit {
  id: number;
  title: string;
  character: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  overview: string;
  genre_ids: number[];
  popularity: number;
  original_language: string;
  adult: boolean;
}

export interface TMDBCollection {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  collage?: string[]; // Array of 4 poster paths for the collage view
  themeColor?: string;
}

export interface TMDBCollectionDetail {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  parts: TMDBMovie[];
}

// TV Show types
export interface TMDBTVShow {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  original_language: string;
  popularity: number;
  media_type?: string;
}

export interface TMDBTVDiscoverResponse {
  page: number;
  results: TMDBTVShow[];
  total_pages: number;
  total_results: number;
}

export interface FilterState {
  query: string;
  genre: string;
  year: string;
  language: string;
  sort: string;
  page: number;
}
