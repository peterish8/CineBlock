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
