import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { extractIdFromSlug } from "@/lib/slugify";
import { TMDBMovie } from "@/lib/types";
import TVDetailClient from "./MovieDetailClient";

const TMDB_BASE = "https://api.themoviedb.org/3";

async function fetchTV(id: number): Promise<TMDBMovie | null> {
  const res = await fetch(
    `${TMDB_BASE}/tv/${id}?language=en-US`,
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
  return {
    id: data.id,
    title: data.name,
    original_title: data.original_name,
    overview: data.overview,
    poster_path: data.poster_path,
    backdrop_path: data.backdrop_path,
    release_date: data.first_air_date,
    vote_average: data.vote_average,
    vote_count: data.vote_count,
    genre_ids: data.genres?.map((g: { id: number }) => g.id) || [],
    original_language: data.original_language,
    popularity: data.popularity,
    adult: false,
    media_type: "tv",
  } as TMDBMovie;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const id = extractIdFromSlug(slug);
  if (!id) return {};
  const show = await fetchTV(id);
  if (!show) return {};
  return {
    title: `${show.title} | CineBlock`,
    description: show.overview,
    openGraph: {
      title: `${show.title} | CineBlock`,
      description: show.overview || undefined,
      images: show.backdrop_path
        ? [`https://image.tmdb.org/t/p/w1280${show.backdrop_path}`]
        : [],
    },
  };
}

export default async function TVDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const id = extractIdFromSlug(slug);
  if (!id) notFound();

  const show = await fetchTV(id);
  if (!show) notFound();

  return <TVDetailClient movie={show} />;
}
