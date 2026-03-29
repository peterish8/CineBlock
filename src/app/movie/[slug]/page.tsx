import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { extractIdFromSlug } from "@/lib/slugify";
import { TMDBMovie } from "@/lib/types";
import MovieDetailClient from "./MovieDetailClient";

const TMDB_BASE = "https://api.themoviedb.org/3";

async function fetchMovie(id: number): Promise<TMDBMovie | null> {
  const res = await fetch(
    `${TMDB_BASE}/movie/${id}?language=en-US`,
    {
      headers: {
        Authorization: `Bearer ${process.env.TMDB_API_KEY || ""}`,
        "Content-Type": "application/json;charset=utf-8",
      },
      next: { revalidate: 3600 },
    }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return { ...data, media_type: "movie" } as TMDBMovie;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const id = extractIdFromSlug(slug);
  if (!id) return {};
  const movie = await fetchMovie(id);
  if (!movie) return {};
  return {
    title: `${movie.title} | CineBlock`,
    description: movie.overview,
    openGraph: {
      title: `${movie.title} | CineBlock`,
      description: movie.overview || undefined,
      images: movie.backdrop_path
        ? [`https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`]
        : [],
    },
  };
}

export default async function MovieDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const id = extractIdFromSlug(slug);
  if (!id) notFound();

  const movie = await fetchMovie(id);
  if (!movie) notFound();

  return <MovieDetailClient movie={movie} />;
}
