"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { franchiseBadge, type FranchiseMetadata } from "@/lib/franchises";

const BADGE_WINDOW_DAYS = 60;

/**
 * movieId → franchise ribbon for recent/upcoming franchise films, straight from the
 * Convex catalog. Returns an empty map while loading, so ribbons just appear.
 */
export function useFranchiseBadges(): ReadonlyMap<number, FranchiseMetadata> {
  // Computed once per mount and day-granular, so the Convex subscription stays stable
  const [since] = useState(() =>
    new Date(Date.now() - BADGE_WINDOW_DAYS * 86_400_000).toISOString().slice(0, 10)
  );
  const films = useQuery(api.franchises.upcomingFranchiseFilms, { since });

  return useMemo(() => {
    const badges = new Map<number, FranchiseMetadata>();
    const priorityOf = new Map<number, number>();
    // A film in two franchises (MCU + Avengers) takes the one shown first in the Vault
    for (const film of films ?? []) {
      const current = priorityOf.get(film.movieId);
      if (current === undefined || film.priority < current) {
        badges.set(film.movieId, franchiseBadge(film));
        priorityOf.set(film.movieId, film.priority);
      }
    }
    return badges;
  }, [films]);
}
