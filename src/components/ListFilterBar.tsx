"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { TMDBMovie } from "@/lib/types";
import { GENRES } from "@/lib/constants";
import { enrichMovieList } from "@/lib/movieMetaCache";
import { Search, X, ChevronRight, Loader2, Filter } from "lucide-react";

type FilterTab = "title" | "genre" | "year" | "director" | "actor";

interface PersonResult {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string;
  known_for: string[];
}

interface ListFilterBarProps {
  movies: TMDBMovie[];
  onFiltered: (filtered: TMDBMovie[]) => void;
}

export default function ListFilterBar({ movies, onFiltered }: ListFilterBarProps) {
  const [activeTab, setActiveTab] = useState<FilterTab | null>(null);

  // Enrich the movie list with cached metadata (genre_ids, release_date, etc.)
  // This is instant — reads from localStorage — no API call needed.
  const enrichedMovies = useMemo(() => enrichMovieList(movies), [movies]);

  // Title
  const [titleQuery, setTitleQuery] = useState("");

  // Genre
  const [selectedGenreId, setSelectedGenreId] = useState<number | null>(null);

  // Year & Director Cache
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [yearMap, setYearMap] = useState<Map<number, string>>(new Map());
  const [directorMap, setDirectorMap] = useState<Map<number, { id: number; name: string }>>(new Map());
  const [fetchingMeta, setFetchingMeta] = useState(false);
  const metaFetched = useRef(false);

  // Actor
  const [personQuery, setPersonQuery] = useState("");
  const [personResults, setPersonResults] = useState<PersonResult[]>([]);
  const [searchingPerson, setSearchingPerson] = useState(false);
  const [selectedPersons, setSelectedPersons] = useState<{ id: number; name: string; role: "crew" | "cast" }[]>([]);
  const [personMovieIds, setPersonMovieIds] = useState<Set<number> | null>(null);
  const [fetchingPersonMovies, setFetchingPersonMovies] = useState(false);

  // Build year & director maps: first from enrichedMovies (instant), then API for any gaps
  useEffect(() => {
    if ((activeTab !== "year" && activeTab !== "director") || metaFetched.current || enrichedMovies.length === 0) return;
    metaFetched.current = true;

    // Pass 1: fill from cache (instant)
    const yMap = new Map<number, string>();
    const dMap = new Map<number, { id: number; name: string }>();
    const uncached: TMDBMovie[] = [];
    
    for (const m of enrichedMovies as any[]) {
      let isFullyCached = true;
      const y = (m.release_date || "").split("-")[0];
      if (y) yMap.set(m.id, y);
      else isFullyCached = false;
      
      if (m.director) dMap.set(m.id, m.director);
      else isFullyCached = false;
      
      if (!isFullyCached) uncached.push(m);
    }
    
    setYearMap(new Map(yMap));
    setDirectorMap(new Map(dMap));

    // Pass 2: fetch remaining from API (only for movies missing year/director)
    if (uncached.length === 0) return;
    setFetchingMeta(true);

    const CHUNK = 5;
    const chunks: TMDBMovie[][] = [];
    for (let i = 0; i < uncached.length; i += CHUNK) {
      chunks.push(uncached.slice(i, i + CHUNK));
    }

    (async () => {
      const { saveMovieMeta } = await import("@/lib/movieMetaCache");
      for (const chunk of chunks) {
        await Promise.all(
          chunk.map(async (m) => {
            try {
              const r = await fetch(`/api/movies?action=details&id=${m.id}`);
              if (r.ok) {
                const d = await r.json();
                const y = (d.release_date || d.first_air_date || "").split("-")[0];
                if (y) yMap.set(m.id, y);
                
                let dirObj = null;
                const dCrew = d.credits?.crew?.filter((c: any) => c.job === "Director");
                if (dCrew && dCrew.length > 0) {
                  dirObj = { id: dCrew[0].id, name: dCrew[0].name };
                  dMap.set(m.id, dirObj);
                }
                
                saveMovieMeta(
                  { ...m, release_date: d.release_date || d.first_air_date, genre_ids: d.genres?.map((g: any) => g.id) || m.genre_ids },
                  dirObj
                );
              }
            } catch {}
          })
        );
        await new Promise((res) => setTimeout(res, 80));
      }
      setYearMap(new Map(yMap));
      setDirectorMap(new Map(dMap));
      setFetchingMeta(false);
    })();
  }, [activeTab, enrichedMovies]);

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    for (const y of yearMap.values()) if (y) years.add(y);
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [yearMap]);

  const availableDirectors = useMemo(() => {
    const dirs = new Map<number, { id: number; name: string }>();
    for (const d of directorMap.values()) {
      if (d && !dirs.has(d.id)) dirs.set(d.id, d);
    }
    return Array.from(dirs.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [directorMap]);

  // Debounced person search
  useEffect(() => {
    if (!personQuery.trim() || personQuery.length < 2) {
      setPersonResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearchingPerson(true);
      try {
        const r = await fetch(`/api/movies?action=search-person&query=${encodeURIComponent(personQuery)}`);
        if (r.ok) {
          const d = await r.json();
          setPersonResults((d.results ?? []).slice(0, 6));
        }
      } catch {}
      setSearchingPerson(false);
    }, 400);
    return () => clearTimeout(t);
  }, [personQuery]);

  // Fetch movie IDs for selected actors (API-driven)
  useEffect(() => {
    const castPersons = selectedPersons.filter(p => p.role === "cast");
    if (castPersons.length === 0) {
      setPersonMovieIds(null);
      return;
    }
    setFetchingPersonMovies(true);
    Promise.all(
      castPersons.map((p) =>
        fetch(`/api/movies?action=discover-by-person&person_id=${p.id}&role=${p.role}`).then((r) =>
          r.json()
        )
      )
    )
      .then((responses) => {
        // Union of all movies by selected people
        const ids = new Set<number>();
        for (const d of responses) {
          for (const m of d.results ?? []) {
            ids.add(m.id);
          }
        }
        setPersonMovieIds(ids);
      })
      .catch(() => {})
      .finally(() => setFetchingPersonMovies(false));
  }, [selectedPersons]);

  // Apply all filters (against enriched movie list)
  const filtered = useMemo(() => {
    let result = enrichedMovies;
    if (titleQuery.trim()) {
      const q = titleQuery.toLowerCase();
      result = result.filter((m) => (m.title || "").toLowerCase().includes(q));
    }
    if (selectedGenreId) {
      result = result.filter((m) => m.genre_ids?.includes(selectedGenreId));
    }
    if (selectedYear && yearMap.size > 0) {
      result = result.filter((m) => yearMap.get(m.id) === selectedYear);
    }

    const selectedCast = selectedPersons.filter((p) => p.role === "cast");
    const selectedCrew = selectedPersons.filter((p) => p.role === "crew");

    if (selectedCrew.length > 0 && directorMap.size > 0) {
      const crewSet = new Set(selectedCrew.map(c => c.id));
      result = result.filter((m) => {
        const d = directorMap.get(m.id);
        return d && crewSet.has(d.id);
      });
    }

    if (selectedCast.length > 0 && personMovieIds) {
      result = result.filter((m) => personMovieIds.has(m.id));
    }
    return result;
  }, [enrichedMovies, titleQuery, selectedGenreId, selectedYear, yearMap, selectedPersons, personMovieIds, directorMap]);

  const stableOnFiltered = useCallback(onFiltered, []); // eslint-disable-line
  useEffect(() => {
    stableOnFiltered(filtered);
  }, [filtered, stableOnFiltered]);

  const hasFilters = !!(titleQuery || selectedGenreId || selectedYear || selectedPersons.length > 0);

  const clearAll = useCallback(() => {
    setTitleQuery("");
    setSelectedGenreId(null);
    setSelectedYear(null);
    setSelectedPersons([]);
    setPersonMovieIds(null);
    setPersonQuery("");
    setPersonResults([]);
    setActiveTab(null);
    metaFetched.current = false;
    setYearMap(new Map());
    setDirectorMap(new Map());
  }, []);

  const handleTabClick = (tab: FilterTab) => {
    setActiveTab((prev) => (prev === tab ? null : tab));
    // Reset person state when switching tabs
    if (tab !== "director" && tab !== "actor") {
      setPersonQuery("");
      setPersonResults([]);
    }
  };

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "title", label: "TITLE" },
    { key: "genre", label: "GENRE" },
    { key: "year", label: "YEAR" },
    { key: "director", label: "DIRECTOR" },
    { key: "actor", label: "ACTOR" },
  ];

  const activeFilterCount = [titleQuery, selectedGenreId, selectedYear, ...(selectedPersons.length > 0 ? [true] : [])].filter(Boolean).length;

  return (
    <div className="border-b-2 border-brutal-border bg-bg/95 backdrop-blur-sm mb-4">
      {/* Tab row */}
      <div className="flex items-center gap-0 overflow-x-auto scrollbar-none px-4 sm:px-6 pt-3 pb-1">
        <Filter className="w-3.5 h-3.5 text-brutal-dim shrink-0 mr-2" strokeWidth={2.5} />
        {tabs.map(({ key, label }) => {
          const isActive = activeTab === key;
          const hasValue =
            (key === "title" && titleQuery) ||
            (key === "genre" && selectedGenreId) ||
            (key === "year" && selectedYear) ||
            (key === "director" && selectedPersons.some(p => p.role === "crew")) ||
            (key === "actor" && selectedPersons.some(p => p.role === "cast"));
          return (
            <button
              key={key}
              onClick={() => handleTabClick(key)}
              className={`brutal-btn px-3 py-1.5 text-[9px] font-mono font-black shrink-0 mr-1 transition-colors ${
                isActive
                  ? "!bg-brutal-yellow !text-black !border-brutal-yellow"
                  : hasValue
                  ? "!border-brutal-lime text-brutal-lime"
                  : "text-brutal-dim"
              }`}
            >
              {label}
              {hasValue && !isActive && <span className="ml-1 text-brutal-lime">•</span>}
            </button>
          );
        })}
        {hasFilters && (
          <button
            onClick={clearAll}
            className="brutal-btn px-2 py-1.5 text-[9px] font-mono font-black text-brutal-red border-brutal-red ml-auto shrink-0 flex items-center gap-1"
          >
            <X className="w-2.5 h-2.5" />
            CLEAR
          </button>
        )}
      </div>

      {/* Active filter chips */}
      {hasFilters && (
        <div className="flex flex-wrap gap-1.5 px-4 sm:px-6 pt-1 pb-2">
          {titleQuery && (
            <span className="brutal-chip text-[9px] text-brutal-yellow border-brutal-yellow flex items-center gap-1">
              TITLE: {titleQuery.toUpperCase()}
              <button onClick={() => setTitleQuery("")}><X className="w-2.5 h-2.5" /></button>
            </span>
          )}
          {selectedGenreId && (
            <span className="brutal-chip text-[9px] text-brutal-lime border-brutal-lime flex items-center gap-1">
              {GENRES.find((g) => g.id === selectedGenreId)?.name?.toUpperCase()}
              <button onClick={() => setSelectedGenreId(null)}><X className="w-2.5 h-2.5" /></button>
            </span>
          )}
          {selectedYear && (
            <span className="brutal-chip text-[9px] text-brutal-cyan border-brutal-cyan flex items-center gap-1">
              {selectedYear}
              <button onClick={() => setSelectedYear(null)}><X className="w-2.5 h-2.5" /></button>
            </span>
          )}
          {selectedPersons.map((p) => (
            <span key={p.id} className="brutal-chip text-[9px] text-brutal-violet border-brutal-violet flex items-center gap-1">
              {p.name.toUpperCase()}
              {fetchingPersonMovies && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
              <button
                onClick={() => {
                  const next = selectedPersons.filter((sp) => sp.id !== p.id);
                  setSelectedPersons(next);
                  if (next.length === 0) setPersonMovieIds(null);
                }}
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Active tab panel */}
      {activeTab && (
        <div className="px-4 sm:px-6 pb-3 pt-1">
          {activeTab === "title" && (
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brutal-dim pointer-events-none" />
              <input
                autoFocus
                type="text"
                value={titleQuery}
                onChange={(e) => setTitleQuery(e.target.value)}
                placeholder="Search by title..."
                className="w-full bg-surface-2 border-2 border-brutal-border pl-9 pr-4 py-2 text-[11px] font-mono text-brutal-white placeholder:text-brutal-dim focus:border-brutal-yellow outline-none"
              />
            </div>
          )}

          {activeTab === "genre" && (
            <div className="flex flex-wrap gap-1.5">
              {GENRES.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGenreId(selectedGenreId === g.id ? null : g.id)}
                  className={`brutal-btn px-2.5 py-1 text-[9px] font-mono font-bold transition-colors ${
                    selectedGenreId === g.id
                      ? "!bg-brutal-lime !text-black !border-brutal-lime"
                      : "text-brutal-dim"
                  }`}
                >
                  {g.name.toUpperCase()}
                </button>
              ))}
            </div>
          )}

          {activeTab === "year" && (
            <div>
              {fetchingMeta ? (
                <div className="flex items-center gap-2 text-brutal-dim text-[10px] font-mono">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  FETCHING RELEASE YEARS...
                </div>
              ) : availableYears.length === 0 ? (
                <p className="text-brutal-dim text-[10px] font-mono">NO YEAR DATA YET</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {availableYears.map((y) => (
                    <button
                      key={y}
                      onClick={() => setSelectedYear(selectedYear === y ? null : y)}
                      className={`brutal-btn px-2.5 py-1 text-[9px] font-mono font-bold transition-colors ${
                        selectedYear === y
                          ? "!bg-brutal-cyan !text-black !border-brutal-cyan"
                          : "text-brutal-dim"
                      }`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "director" && (
            <div>
              {fetchingMeta ? (
                <div className="flex items-center gap-2 text-brutal-dim text-[10px] font-mono">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  FETCHING DIRECTORS...
                </div>
              ) : availableDirectors.length === 0 ? (
                <p className="text-brutal-dim text-[10px] font-mono">NO DIRECTORS YET</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {availableDirectors.map((d) => {
                    const isSelected = selectedPersons.some(p => p.id === d.id && p.role === "crew");
                    return (
                      <button
                        key={d.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedPersons(selectedPersons.filter(p => !(p.id === d.id && p.role === "crew")));
                          } else {
                            setSelectedPersons([...selectedPersons, { ...d, role: "crew" }]);
                          }
                        }}
                        className={`brutal-btn px-2.5 py-1 text-[9px] font-mono font-bold transition-colors ${
                          isSelected
                            ? "!bg-brutal-violet !text-black !border-brutal-violet"
                            : "text-brutal-dim"
                        }`}
                      >
                        {d.name.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "actor" && (
            <div>
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brutal-dim pointer-events-none" />
                <input
                  autoFocus
                  type="text"
                  value={personQuery}
                  onChange={(e) => setPersonQuery(e.target.value)}
                  placeholder="Search actor name..."
                  className="w-full bg-surface-2 border-2 border-brutal-border pl-9 pr-4 py-2 text-[11px] font-mono text-brutal-white placeholder:text-brutal-dim focus:border-brutal-yellow outline-none"
                />
                {searchingPerson && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-brutal-dim" />
                )}
              </div>

              {/* Person results */}
              {personResults.length > 0 && (
                <div className="mt-2 border-2 border-brutal-border bg-surface divide-y-2 divide-brutal-border max-w-sm">
                  {personResults.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        // Prevent duplicates
                        if (!selectedPersons.some((sp) => sp.id === p.id)) {
                          setSelectedPersons([
                            ...selectedPersons,
                            { id: p.id, name: p.name, role: "cast" },
                          ]);
                        }
                        setPersonResults([]);
                        setPersonQuery("");
                        setActiveTab(null);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-surface-2 transition-colors text-left group"
                    >
                      <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-brutal-border shrink-0 bg-surface-2">
                        {p.profile_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w45${p.profile_path}`}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-surface-2" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-mono font-black text-brutal-white uppercase truncate group-hover:text-brutal-yellow">
                          {p.name}
                        </p>
                        <p className="text-[9px] font-mono text-brutal-dim truncate">
                          {p.known_for.join(", ")}
                        </p>
                      </div>
                      <ChevronRight className="w-3 h-3 text-brutal-dim shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Results count when filtering */}
      {hasFilters && (
        <div className="px-4 sm:px-6 pb-2">
          <span className="text-[9px] font-mono text-brutal-dim uppercase tracking-wider">
            {filtered.length} OF {movies.length} RESULTS
          </span>
        </div>
      )}
    </div>
  );
}
