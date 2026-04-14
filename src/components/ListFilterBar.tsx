"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { TMDBMovie } from "@/lib/types";
import { GENRES } from "@/lib/constants";
import { enrichMovieList } from "@/lib/movieMetaCache";
import { Search, X, ChevronRight, Loader2, Filter } from "lucide-react";
import { useThemeMode } from "@/hooks/useThemeMode";

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
  const isGlass = useThemeMode() === "glass";

  const enrichedMovies = useMemo(() => enrichMovieList(movies), [movies]);

  const [titleQuery, setTitleQuery] = useState("");
  const [selectedGenreId, setSelectedGenreId] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [yearMap, setYearMap] = useState<Map<number, string>>(new Map());
  const [directorMap, setDirectorMap] = useState<Map<number, { id: number; name: string }>>(new Map());
  const [fetchingMeta, setFetchingMeta] = useState(false);
  const metaFetched = useRef(false);

  const [personQuery, setPersonQuery] = useState("");
  const [personResults, setPersonResults] = useState<PersonResult[]>([]);
  const [searchingPerson, setSearchingPerson] = useState(false);
  const [selectedPersons, setSelectedPersons] = useState<{ id: number; name: string; role: "crew" | "cast" }[]>([]);
  const [personMovieIds, setPersonMovieIds] = useState<Set<number> | null>(null);
  const [fetchingPersonMovies, setFetchingPersonMovies] = useState(false);

  useEffect(() => {
    if ((activeTab !== "year" && activeTab !== "director") || metaFetched.current || enrichedMovies.length === 0) return;
    metaFetched.current = true;

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

  useEffect(() => {
    const castPersons = selectedPersons.filter(p => p.role === "cast");
    if (castPersons.length === 0) {
      setPersonMovieIds(null);
      return;
    }
    setFetchingPersonMovies(true);
    Promise.all(
      castPersons.map((p) =>
        fetch(`/api/movies?action=discover-by-person&person_id=${p.id}&role=${p.role}`).then((r) => r.json())
      )
    )
      .then((responses) => {
        const ids = new Set<number>();
        for (const d of responses) {
          for (const m of d.results ?? []) ids.add(m.id);
        }
        setPersonMovieIds(ids);
      })
      .catch(() => {})
      .finally(() => setFetchingPersonMovies(false));
  }, [selectedPersons]);

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
    if (tab !== "director" && tab !== "actor") {
      setPersonQuery("");
      setPersonResults([]);
    }
  };

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "title", label: "Title" },
    { key: "genre", label: "Genre" },
    { key: "year", label: "Year" },
    { key: "director", label: "Director" },
    { key: "actor", label: "Actor" },
  ];

  // ── Glass style helpers ──────────────────────────────────────────────────────
  const glassInput = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#fff",
    outline: "none",
  };

  const tabActiveStyle = { background: "rgba(34,211,238,0.15)", border: "1px solid rgba(34,211,238,0.40)", color: "#67E8F9" };
  const tabHasValueStyle = { background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.30)", color: "#6EE7B7" };
  const tabIdleStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(148,163,184,0.7)" };

  const chipStyles: Record<string, React.CSSProperties> = {
    title:    { background: "rgba(251,191,36,0.12)",  border: "1px solid rgba(251,191,36,0.35)",  color: "#FCD34D" },
    genre:    { background: "rgba(52,211,153,0.12)",  border: "1px solid rgba(52,211,153,0.35)",  color: "#6EE7B7" },
    year:     { background: "rgba(34,211,238,0.12)",  border: "1px solid rgba(34,211,238,0.35)",  color: "#67E8F9" },
    person:   { background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.35)", color: "#C4B5FD" },
    clear:    { background: "rgba(239,68,68,0.12)",   border: "1px solid rgba(239,68,68,0.35)",   color: "#FCA5A5" },
  };

  const panelStyle: React.CSSProperties = {
    background: "rgba(8,15,40,0.72)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderTop: "1px solid rgba(255,255,255,0.08)",
  };

  const genreBtnActive = { background: "rgba(52,211,153,0.18)", border: "1px solid rgba(52,211,153,0.45)", color: "#6EE7B7" };
  const yearBtnActive  = { background: "rgba(34,211,238,0.18)", border: "1px solid rgba(34,211,238,0.45)", color: "#67E8F9" };
  const dirBtnActive   = { background: "rgba(167,139,250,0.18)", border: "1px solid rgba(167,139,250,0.45)", color: "#C4B5FD" };
  const chipIdleStyle  = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(148,163,184,0.7)" };

  const resultsDropdownStyle: React.CSSProperties = {
    background: "rgba(8,15,40,0.96)",
    backdropFilter: "blur(28px)",
    WebkitBackdropFilter: "blur(28px)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "12px",
    boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
  };
  // ──────────────────────────────────────────────────────────────────────────────

  return (
    <div
      className="mb-4"
      style={isGlass
        ? { borderBottom: "1px solid rgba(255,255,255,0.08)" }
        : { borderBottom: "2px solid var(--color-brutal-border)", background: "rgba(var(--color-bg-rgb,2,8,23),0.95)", backdropFilter: "blur(4px)" }
      }
    >
      {/* Tab row */}
      <div className="flex items-center gap-0 overflow-x-auto scrollbar-none px-4 sm:px-6 pt-3 pb-1">
        <Filter className={`w-3.5 h-3.5 shrink-0 mr-2 ${isGlass ? "text-slate-500" : "text-brutal-dim"}`} strokeWidth={2.5} />
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
              className={`px-3 py-1.5 text-[9px] font-bold shrink-0 mr-1 transition-colors ${
                isGlass
                  ? "rounded-lg"
                  : `brutal-btn font-mono font-black ${
                      isActive
                        ? "!bg-brutal-yellow !text-black !border-brutal-yellow"
                        : hasValue
                        ? "!border-brutal-lime text-brutal-lime"
                        : "text-brutal-dim"
                    }`
              }`}
              style={isGlass ? (isActive ? tabActiveStyle : hasValue ? tabHasValueStyle : tabIdleStyle) : undefined}
            >
              {isGlass ? label : label.toUpperCase()}
              {hasValue && !isActive && (
                <span className={`ml-1 ${isGlass ? "text-emerald-400" : "text-brutal-lime"}`}>•</span>
              )}
            </button>
          );
        })}
        {hasFilters && (
          <button
            onClick={clearAll}
            className={`px-2 py-1.5 text-[9px] font-bold ml-auto shrink-0 flex items-center gap-1 transition-colors ${
              isGlass ? "rounded-lg" : "brutal-btn font-mono font-black text-brutal-red border-brutal-red"
            }`}
            style={isGlass ? chipStyles.clear : undefined}
          >
            <X className="w-2.5 h-2.5" />
            {isGlass ? "Clear" : "CLEAR"}
          </button>
        )}
      </div>

      {/* Active filter chips */}
      {hasFilters && (
        <div className="flex flex-wrap gap-1.5 px-4 sm:px-6 pt-1 pb-2">
          {titleQuery && (
            <span
              className={`flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold ${isGlass ? "rounded-lg" : "brutal-chip text-brutal-yellow border-brutal-yellow"}`}
              style={isGlass ? chipStyles.title : undefined}
            >
              Title: {titleQuery}
              <button onClick={() => setTitleQuery("")}><X className="w-2.5 h-2.5" /></button>
            </span>
          )}
          {selectedGenreId && (
            <span
              className={`flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold ${isGlass ? "rounded-lg" : "brutal-chip text-brutal-lime border-brutal-lime"}`}
              style={isGlass ? chipStyles.genre : undefined}
            >
              {GENRES.find((g) => g.id === selectedGenreId)?.name}
              <button onClick={() => setSelectedGenreId(null)}><X className="w-2.5 h-2.5" /></button>
            </span>
          )}
          {selectedYear && (
            <span
              className={`flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold ${isGlass ? "rounded-lg" : "brutal-chip text-brutal-cyan border-brutal-cyan"}`}
              style={isGlass ? chipStyles.year : undefined}
            >
              {selectedYear}
              <button onClick={() => setSelectedYear(null)}><X className="w-2.5 h-2.5" /></button>
            </span>
          )}
          {selectedPersons.map((p) => (
            <span
              key={p.id}
              className={`flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold ${isGlass ? "rounded-lg" : "brutal-chip text-brutal-violet border-brutal-violet"}`}
              style={isGlass ? chipStyles.person : undefined}
            >
              {p.name}
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
        <div
          className="px-4 sm:px-6 pb-3 pt-2"
          style={isGlass ? panelStyle : undefined}
        >
          {activeTab === "title" && (
            <div className="relative max-w-sm">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none ${isGlass ? "text-slate-500" : "text-brutal-dim"}`} />
              <input
                autoFocus
                type="text"
                value={titleQuery}
                onChange={(e) => setTitleQuery(e.target.value)}
                placeholder="Search by title..."
                className={`w-full pl-9 pr-4 py-2 text-[11px] ${
                  isGlass
                    ? "rounded-xl placeholder:text-slate-500 text-white"
                    : "bg-surface-2 border-2 border-brutal-border font-mono text-brutal-white placeholder:text-brutal-dim focus:border-brutal-yellow outline-none"
                }`}
                style={isGlass ? { ...glassInput, borderRadius: "10px" } : undefined}
              />
            </div>
          )}

          {activeTab === "genre" && (
            <div className="flex flex-wrap gap-1.5">
              {GENRES.map((g) => {
                const isSel = selectedGenreId === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGenreId(isSel ? null : g.id)}
                    className={`px-2.5 py-1 text-[9px] font-bold transition-colors ${
                      isGlass
                        ? "rounded-lg"
                        : `brutal-btn font-mono ${isSel ? "!bg-brutal-lime !text-black !border-brutal-lime" : "text-brutal-dim"}`
                    }`}
                    style={isGlass ? (isSel ? genreBtnActive : chipIdleStyle) : undefined}
                  >
                    {g.name}
                  </button>
                );
              })}
            </div>
          )}

          {activeTab === "year" && (
            <div>
              {fetchingMeta ? (
                <div className={`flex items-center gap-2 text-[10px] ${isGlass ? "text-slate-400" : "text-brutal-dim font-mono"}`}>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {isGlass ? "Fetching years..." : "FETCHING RELEASE YEARS..."}
                </div>
              ) : availableYears.length === 0 ? (
                <p className={`text-[10px] ${isGlass ? "text-slate-500" : "text-brutal-dim font-mono"}`}>
                  {isGlass ? "No year data yet" : "NO YEAR DATA YET"}
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {availableYears.map((y) => {
                    const isSel = selectedYear === y;
                    return (
                      <button
                        key={y}
                        onClick={() => setSelectedYear(isSel ? null : y)}
                        className={`px-2.5 py-1 text-[9px] font-bold transition-colors ${
                          isGlass
                            ? "rounded-lg"
                            : `brutal-btn font-mono ${isSel ? "!bg-brutal-cyan !text-black !border-brutal-cyan" : "text-brutal-dim"}`
                        }`}
                        style={isGlass ? (isSel ? yearBtnActive : chipIdleStyle) : undefined}
                      >
                        {y}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "director" && (
            <div>
              {fetchingMeta ? (
                <div className={`flex items-center gap-2 text-[10px] ${isGlass ? "text-slate-400" : "text-brutal-dim font-mono"}`}>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {isGlass ? "Fetching directors..." : "FETCHING DIRECTORS..."}
                </div>
              ) : availableDirectors.length === 0 ? (
                <p className={`text-[10px] ${isGlass ? "text-slate-500" : "text-brutal-dim font-mono"}`}>
                  {isGlass ? "No directors found" : "NO DIRECTORS YET"}
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {availableDirectors.map((d) => {
                    const isSel = selectedPersons.some(p => p.id === d.id && p.role === "crew");
                    return (
                      <button
                        key={d.id}
                        onClick={() => {
                          if (isSel) {
                            setSelectedPersons(selectedPersons.filter(p => !(p.id === d.id && p.role === "crew")));
                          } else {
                            setSelectedPersons([...selectedPersons, { ...d, role: "crew" }]);
                          }
                        }}
                        className={`px-2.5 py-1 text-[9px] font-bold transition-colors ${
                          isGlass
                            ? "rounded-lg"
                            : `brutal-btn font-mono ${isSel ? "!bg-brutal-violet !text-black !border-brutal-violet" : "text-brutal-dim"}`
                        }`}
                        style={isGlass ? (isSel ? dirBtnActive : chipIdleStyle) : undefined}
                      >
                        {d.name}
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
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none ${isGlass ? "text-slate-500" : "text-brutal-dim"}`} />
                <input
                  autoFocus
                  type="text"
                  value={personQuery}
                  onChange={(e) => setPersonQuery(e.target.value)}
                  placeholder="Search actor name..."
                  className={`w-full pl-9 pr-4 py-2 text-[11px] ${
                    isGlass
                      ? "rounded-xl placeholder:text-slate-500 text-white"
                      : "bg-surface-2 border-2 border-brutal-border font-mono text-brutal-white placeholder:text-brutal-dim focus:border-brutal-yellow outline-none"
                  }`}
                  style={isGlass ? { ...glassInput, borderRadius: "10px" } : undefined}
                />
                {searchingPerson && (
                  <Loader2 className={`absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin ${isGlass ? "text-slate-500" : "text-brutal-dim"}`} />
                )}
              </div>

              {personResults.length > 0 && (
                <div
                  className={`mt-2 max-w-sm overflow-hidden ${
                    isGlass ? "" : "border-2 border-brutal-border bg-surface divide-y-2 divide-brutal-border"
                  }`}
                  style={isGlass ? resultsDropdownStyle : undefined}
                >
                  {personResults.map((p, i) => (
                    <button
                      key={p.id}
                      onClick={() => {
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
                      className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors text-left group ${
                        isGlass ? "hover:bg-white/5" : "hover:bg-surface-2"
                      }`}
                      style={isGlass && i < personResults.length - 1 ? { borderBottom: "1px solid rgba(255,255,255,0.07)" } : undefined}
                    >
                      <div
                        className={`w-7 h-7 rounded-full overflow-hidden shrink-0 ${
                          isGlass ? "" : "border-2 border-brutal-border bg-surface-2"
                        }`}
                        style={isGlass ? { border: "1px solid rgba(255,255,255,0.12)" } : undefined}
                      >
                        {p.profile_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w45${p.profile_path}`}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className={`w-full h-full ${isGlass ? "bg-white/5" : "bg-surface-2"}`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[10px] font-bold truncate ${
                          isGlass ? "text-white group-hover:text-cyan-300" : "font-mono font-black text-brutal-white uppercase group-hover:text-brutal-yellow"
                        }`}>
                          {p.name}
                        </p>
                        <p className={`text-[9px] truncate ${isGlass ? "text-slate-500" : "font-mono text-brutal-dim"}`}>
                          {p.known_for.join(", ")}
                        </p>
                      </div>
                      <ChevronRight className={`w-3 h-3 shrink-0 ${isGlass ? "text-slate-500" : "text-brutal-dim"}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Results count */}
      {hasFilters && (
        <div className="px-4 sm:px-6 pb-2">
          <span className={`text-[9px] uppercase tracking-wider ${isGlass ? "text-slate-500" : "font-mono text-brutal-dim"}`}>
            {filtered.length} of {movies.length} results
          </span>
        </div>
      )}
    </div>
  );
}
