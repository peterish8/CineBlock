import { TMDB_BASE_URL } from "./constants";
import { TMDBDiscoverResponse, TMDBMovieDetail } from "./types";

const API_KEY = process.env.TMDB_API_KEY || "";

const headers: HeadersInit = {
  Authorization: `Bearer ${API_KEY}`,
  "Content-Type": "application/json;charset=utf-8",
};

export async function discoverMovies(params: {
  genre?: string;
  year?: string;
  language?: string;
  sort?: string;
  page?: number;
}): Promise<TMDBDiscoverResponse> {
  const searchParams = new URLSearchParams({
    language: "en-US",
    include_adult: "false",
    include_video: "false",
    sort_by: params.sort || "popularity.desc",
    page: (params.page || 1).toString(),
  });

  if (params.genre) searchParams.set("with_genres", params.genre);
  if (params.year) searchParams.set("primary_release_year", params.year);
  if (params.language) searchParams.set("with_original_language", params.language);

  const res = await fetch(`${TMDB_BASE_URL}/discover/movie?${searchParams.toString()}`, {
    headers,
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`TMDB API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function searchMovies(params: {
  query: string;
  page?: number;
}): Promise<TMDBDiscoverResponse> {
  const searchParams = new URLSearchParams({
    query: params.query,
    language: "en-US",
    include_adult: "false",
    page: (params.page || 1).toString(),
  });

  const res = await fetch(`${TMDB_BASE_URL}/search/movie?${searchParams.toString()}`, {
    headers,
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`TMDB API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function getMovieDetails(movieId: number): Promise<TMDBMovieDetail> {
  const res = await fetch(
    `${TMDB_BASE_URL}/movie/${movieId}?append_to_response=credits&language=en-US`,
    {
      headers,
      next: { revalidate: 3600 },
    }
  );

  if (!res.ok) {
    throw new Error(`TMDB API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function getUpcomingMovies(page: number = 1, language?: string): Promise<TMDBDiscoverResponse> {
  const today = new Date().toISOString().split("T")[0];
  const sixMonthsFromNow = new Date();
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
  const sixMonthsStr = sixMonthsFromNow.toISOString().split("T")[0];

  const searchParams = new URLSearchParams({
    language: "en-US",
    region: "IN",
    include_adult: "false",
    "primary_release_date.gte": today,
    "primary_release_date.lte": sixMonthsStr,
    sort_by: "popularity.desc",
    page: page.toString(),
  });

  if (language) {
    searchParams.set("with_original_language", language.replace(/,/g, "|"));
  }

  const res = await fetch(`${TMDB_BASE_URL}/discover/movie?${searchParams.toString()}`, {
    headers,
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`TMDB API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function getMoviesByGenreUpcoming(genreIds: number[], language?: string): Promise<TMDBDiscoverResponse> {
  const today = new Date().toISOString().split("T")[0];
  const sixMonthsFromNow = new Date();
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
  const sixMonthsStr = sixMonthsFromNow.toISOString().split("T")[0];

  const searchParams = new URLSearchParams({
    language: "en-US",
    region: "IN",
    include_adult: "false",
    "primary_release_date.gte": today,
    "primary_release_date.lte": sixMonthsStr,
    with_genres: genreIds.join(","),
    sort_by: "popularity.desc",
    "vote_count.gte": "10",
    page: "1",
  });

  if (language) {
    searchParams.set("with_original_language", language.replace(/,/g, "|"));
  }

  const res = await fetch(`${TMDB_BASE_URL}/discover/movie?${searchParams.toString()}`, {
    headers,
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`TMDB API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function getUpcomingTV(page: number = 1, language?: string): Promise<TMDBDiscoverResponse> {
  const today = new Date().toISOString().split("T")[0];
  const sixMonthsFromNow = new Date();
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
  const sixMonthsStr = sixMonthsFromNow.toISOString().split("T")[0];

  const searchParams = new URLSearchParams({
    language: "en-US",
    include_adult: "false",
    "first_air_date.gte": today,
    "first_air_date.lte": sixMonthsStr,
    sort_by: "popularity.desc",
    page: page.toString(),
  });

  if (language) {
    searchParams.set("with_original_language", language.replace(/,/g, "|"));
  }

  const res = await fetch(`${TMDB_BASE_URL}/discover/tv?${searchParams.toString()}`, {
    headers,
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`TMDB API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function getTVByGenreUpcoming(genreIds: number[], language?: string): Promise<TMDBDiscoverResponse> {
  const today = new Date().toISOString().split("T")[0];
  const sixMonthsFromNow = new Date();
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
  const sixMonthsStr = sixMonthsFromNow.toISOString().split("T")[0];

  const searchParams = new URLSearchParams({
    language: "en-US",
    include_adult: "false",
    "first_air_date.gte": today,
    "first_air_date.lte": sixMonthsStr,
    with_genres: genreIds.join(","),
    sort_by: "popularity.desc",
    page: "1",
  });

  if (language) {
    searchParams.set("with_original_language", language.replace(/,/g, "|"));
  }

  const res = await fetch(`${TMDB_BASE_URL}/discover/tv?${searchParams.toString()}`, {
    headers,
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`TMDB API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}
