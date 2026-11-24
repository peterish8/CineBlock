"use client";

import { useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { Film } from "lucide-react";
import { RadarMovie } from "@/lib/types";
import { posterUrl } from "@/lib/constants";
import { useFranchiseBadges } from "@/hooks/useFranchiseBadges";
import FranchiseRibbon from "@/components/FranchiseRibbon";

interface ReleaseTimelineProps {
  movies: RadarMovie[];
  onMovieClick: (movie: RadarMovie) => void;
}

const DAY_MS = 86_400_000;

// TMDB dates are plain calendar days; reading them as UTC would show them a day early west of UTC.
function parseDay(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function countdown(release: Date, today: Date) {
  const days = Math.round((release.getTime() - today.getTime()) / DAY_MS);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days > 1 && days <= 14) return `In ${days} days`;
  return null;
}

export default function ReleaseTimeline({ movies, onMovieClick }: ReleaseTimelineProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const draggedRef = useRef(false);
  const franchiseBadges = useFranchiseBadges();

  const groups = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const map = new Map<string, { key: string; month: string; year: number; items: { movie: RadarMovie; date: Date; soon: string | null }[] }>();
    for (const movie of movies) {
      const date = parseDay(movie.release_date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (!map.has(key)) map.set(key, { key, month: date.toLocaleString(undefined, { month: "long" }), year: date.getFullYear(), items: [] });
      map.get(key)!.items.push({ movie, date, soon: countdown(date, today) });
    }
    return [...map.values()]
      .sort((a, b) => a.items[0].date.getTime() - b.items[0].date.getTime())
      .map((group) => ({ ...group, items: group.items.sort((a, b) => a.date.getTime() - b.date.getTime()) }));
  }, [movies]);

  // Drag to scroll on desktop. A drag past a few pixels swallows the click that ends it.
  useEffect(() => {
    const slider = scrollerRef.current;
    if (!slider) return;
    let down = false;
    let startX = 0;
    let startScroll = 0;

    const onDown = (e: MouseEvent) => {
      down = true;
      draggedRef.current = false;
      startX = e.pageX;
      startScroll = slider.scrollLeft;
    };
    const onUp = () => { down = false; };
    const onMove = (e: MouseEvent) => {
      if (!down) return;
      const dx = e.pageX - startX;
      if (Math.abs(dx) > 5) draggedRef.current = true;
      if (draggedRef.current) {
        e.preventDefault();
        slider.scrollLeft = startScroll - dx;
      }
    };

    slider.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    slider.addEventListener("mousemove", onMove);
    return () => {
      slider.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      slider.removeEventListener("mousemove", onMove);
    };
  }, []);

  const swallowDragClick = (e: React.MouseEvent) => {
    if (!draggedRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    draggedRef.current = false;
  };

  return (
    <div className="w-full">
      {/* Desktop: one horizontal calendar row per month */}
      <div
        ref={scrollerRef}
        onClickCapture={swallowDragClick}
        className="no-scrollbar hidden cursor-grab select-none overflow-x-auto pb-12 pt-4 active:cursor-grabbing md:block"
      >
        <div className="flex w-max gap-14 px-6 lg:px-10">
          {groups.map((group) => (
            <section key={group.key} aria-label={`${group.month} ${group.year}`} className="flex flex-col">
              <h3 className="mb-4 font-display !text-2xl font-semibold tracking-tight text-white">
                {group.month} <span className="text-slate-500">{group.year}</span>
              </h3>
              <ol className="flex gap-5 border-t border-white/10 pt-4">
                {group.items.map(({ movie, date, soon }) => (
                  <li key={movie.id} className="relative w-[180px]">
                    <span aria-hidden="true" className="absolute -top-[21px] left-0 h-2.5 w-2.5 rounded-full border-2 border-[#020817] bg-blue-400" />
                    <p className="mb-2 flex items-baseline justify-between gap-2 text-sm">
                      <span className="tabular-nums text-slate-300">
                        {date.toLocaleString(undefined, { weekday: "short" })} {date.getDate()}
                      </span>
                      {soon && <span className="text-xs font-medium text-orange-300">{soon}</span>}
                    </p>
                    <button type="button" onClick={() => onMovieClick(movie)} className="group block w-full text-left">
                      <span className="relative block aspect-[2/3] overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] transition-colors duration-150 group-hover:border-white/30 group-focus-visible:border-blue-400/60">
                        {movie.poster_path ? (
                          <Image src={posterUrl(movie.poster_path, "medium")} alt="" fill className="object-cover" sizes="180px" draggable={false} />
                        ) : (
                          <span className="absolute inset-0 flex items-center justify-center"><Film className="h-8 w-8 text-slate-600" strokeWidth={1.5} /></span>
                        )}
                        <FranchiseRibbon badge={franchiseBadges.get(movie.id)} variant="corner-large" />
                      </span>
                      <span className="mt-2 line-clamp-2 block text-sm font-medium leading-snug text-white transition-colors duration-150 group-hover:text-blue-300">
                        {movie.title}
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </div>

      {/* Mobile: a vertical list per month */}
      <div className="flex flex-col gap-8 px-4 pb-20 md:hidden">
        {groups.map((group) => (
          <section key={group.key} aria-label={`${group.month} ${group.year}`}>
            <h3 className="mb-3 font-display !text-lg font-semibold text-white">
              {group.month} <span className="text-slate-500">{group.year}</span>
            </h3>
            <ol className="flex flex-col gap-3">
              {group.items.map(({ movie, date, soon }) => (
                <li key={movie.id}>
                  <button
                    type="button"
                    onClick={() => onMovieClick(movie)}
                    className="flex w-full items-stretch gap-3 overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] text-left transition-transform duration-150 active:scale-[0.98]"
                  >
                    <span className="relative block aspect-[2/3] w-20 shrink-0">
                      {movie.poster_path ? (
                        <Image src={posterUrl(movie.poster_path, "small")} alt="" fill className="object-cover" sizes="80px" />
                      ) : (
                        <span className="absolute inset-0 flex items-center justify-center"><Film className="h-6 w-6 text-slate-600" strokeWidth={1.5} /></span>
                      )}
                      <FranchiseRibbon badge={franchiseBadges.get(movie.id)} variant="tag" />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col justify-center py-3 pr-3">
                      <span className="text-xs tabular-nums text-slate-400">
                        {date.toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short" })}
                        {soon && <span className="ml-2 font-medium text-orange-300">{soon}</span>}
                      </span>
                      <span className="mt-0.5 font-medium leading-snug text-white">{movie.title}</span>
                      {movie.overview && <span className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-400">{movie.overview}</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
