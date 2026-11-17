"use client";

import { useState } from "react";
import Image from "next/image";
import { Film } from "lucide-react";
import { posterUrl } from "@/lib/constants";
import { useMovieLists } from "@/hooks/useMovieLists";

/** One row of `api.franchises.listCatalog` — everything a card needs, no TMDB call. */
export interface CatalogFranchise {
  key: number;
  name: string;
  posterPath: string | null;
  filmCount: number;
  partIds: number[];
  syncing: boolean;
  isNew: boolean;
}

interface CollectionCardProps {
  franchise: CatalogFranchise;
  onClick: () => void;
}

/** "Iron Man Collection" → "Iron Man"; "… (Chronological)" stays. */
export function franchiseTitle(name: string): string {
  return name.replace(/\s+collection$/i, "");
}

/** One franchise on the Vault shelf: its poster, its name, and how much of it you've seen. */
export default function CollectionCard({ franchise, onClick }: CollectionCardProps) {
  const { isWatched } = useMovieLists();
  const [posterBroken, setPosterBroken] = useState(false);
  const { name, posterPath, filmCount, partIds, syncing, isNew } = franchise;

  const watched = partIds.reduce((n, id) => n + (isWatched(id) ? 1 : 0), 0);
  const total = filmCount;
  const ratio = total ? watched / total : 0;
  const complete = total > 0 && watched === total;
  const title = franchiseTitle(name);

  let meta: string;
  if (syncing) {
    meta = "Syncing from TMDB…";
  } else if (complete) {
    meta = "Complete";
  } else if (watched) {
    meta = `${watched} of ${total} watched`;
  } else {
    meta = `${total} ${total === 1 ? "film" : "films"}`;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${title}${total ? `, ${watched} of ${total} watched` : ""}`}
      className="group flex w-full flex-col gap-3 rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA] focus-visible:ring-offset-4 focus-visible:ring-offset-[#020817]"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] transition-[border-color] duration-150 ease-out [@media(hover:hover)]:group-hover:border-white/25">
        {posterPath && !posterBroken ? (
          <Image
            src={posterUrl(posterPath, "medium")}
            alt=""
            fill
            sizes="(min-width: 1280px) 230px, (min-width: 1024px) 24vw, (min-width: 640px) 31vw, 46vw"
            className="object-cover transition-[filter] duration-150 ease-out [@media(hover:hover)]:group-hover:brightness-110"
            onError={() => setPosterBroken(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Film className="h-6 w-6 text-slate-600" strokeWidth={1.5} aria-hidden />
          </div>
        )}

        {/* Completion as light along the poster's foot — only once you've started */}
        {watched > 0 && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-black/50" aria-hidden>
            <div
              className={`h-full origin-left transition-transform duration-300 ease-[cubic-bezier(0.77,0,0.175,1)] motion-reduce:transition-none ${complete ? "bg-[#F97316]" : "bg-[#60A5FA]"}`}
              style={{ transform: `scaleX(${ratio})` }}
            />
          </div>
        )}
      </div>

      <div className="min-w-0 px-0.5">
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-slate-100">{title}</h3>
        <p className={`mt-1 text-[13px] tabular-nums ${complete ? "text-[#FDBA74]" : "text-slate-400"}`}>
          {meta}
          {isNew && <span className="text-[#60A5FA]"> · New</span>}
        </p>
      </div>
    </button>
  );
}
