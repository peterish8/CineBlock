"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useConvexAuth } from "convex/react";
import { useBlocks } from "@/hooks/useBlocks";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import MovieModal from "@/components/MovieModal";
import StampIndicator from "@/components/StampIndicator";
import { posterUrl } from "@/lib/constants";
import { GENRES, LANGUAGES } from "@/lib/constants";
import {
  ArrowLeft, Share2, BookMarked, BookmarkPlus, LayoutGrid,
  CheckCircle2, Film, Settings2, Globe, Lock, Search, X,
  Plus, Loader2, Star, ChevronRight, User,
} from "lucide-react";
import type { Id } from "../../../../convex/_generated/dataModel";

// ─── Types ────────────────────────────────────────────────────────────────────
type MovieResult = {
  id: number;
  title: string;
  poster_path: string | null;
  release_date?: string;
  vote_average?: number;
};

type PersonResult = {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string;
  known_for: string[];
};

type SearchTab = "title" | "director" | "actor" | "genre" | "year" | "language";

const TABS: { id: SearchTab; label: string }[] = [
  { id: "title",    label: "Title" },
  { id: "director", label: "Director" },
  { id: "actor",    label: "Actor" },
  { id: "genre",    label: "Genre" },
  { id: "year",     label: "Year" },
  { id: "language", label: "Language" },
];

const YEAR_OPTIONS = Array.from({ length: new Date().getFullYear() - 1924 }, (_, i) => new Date().getFullYear() - i);

// ─── Poster card for search results ──────────────────────────────────────────
function SearchPosterCard({
  movie, alreadyIn, isAdding, isFull, onAdd, onDragStart,
}: {
  movie: MovieResult;
  alreadyIn: boolean;
  isAdding: boolean;
  isFull: boolean;
  onAdd: () => void;
  onDragStart: (e: React.DragEvent) => void;
}) {
  const year = movie.release_date?.slice(0, 4);
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : null;
  const canAdd = !alreadyIn && !isFull && !isAdding;

  return (
    <div
      draggable={canAdd}
      onDragStart={canAdd ? onDragStart : undefined}
      className={`group relative aspect-[2/3] w-full brutal-poster select-none ${canAdd ? "cursor-grab active:cursor-grabbing" : "cursor-default"}`}
    >
      {movie.poster_path ? (
        <Image
          src={posterUrl(movie.poster_path, "medium")}
          alt={movie.title}
          fill
          className="object-cover pointer-events-none"
          sizes="160px"
          loading="lazy"
          draggable={false}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-surface-2 p-3">
          <span className="text-brutal-muted text-xs font-mono font-bold text-center uppercase leading-tight">{movie.title}</span>
        </div>
      )}

      {/* Gradient + title */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-100 pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 p-2">
          <p className="text-brutal-white text-[10px] font-display font-bold uppercase leading-tight line-clamp-2">{movie.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {rating && (
              <span className="flex items-center gap-0.5 text-brutal-yellow">
                <Star className="w-2.5 h-2.5 fill-current" strokeWidth={0} />
                <span className="text-[9px] font-mono font-bold">{rating}</span>
              </span>
            )}
            {year && <span className="text-[9px] font-mono text-brutal-dim">{year}</span>}
          </div>
        </div>
      </div>

      {/* Rating badge */}
      {rating && (
        <div className="absolute top-0 right-0 bg-black border-b-3 border-l-3 border-brutal-border px-1.5 py-0.5 flex items-center gap-0.5 pointer-events-none">
          <Star className="w-2.5 h-2.5 text-brutal-yellow fill-current" />
          <span className="text-[9px] font-mono font-bold text-brutal-yellow">{rating}</span>
        </div>
      )}

      {/* Add / status button */}
      <button
        onClick={canAdd ? onAdd : undefined}
        disabled={!canAdd}
        aria-label={alreadyIn ? "Already in block" : `Add ${movie.title}`}
        className={`absolute top-0 left-0 z-10 flex items-center justify-center w-8 h-8 border-b-3 border-r-3 border-brutal-border transition-colors ${
          alreadyIn
            ? "bg-brutal-cyan text-black cursor-default"
            : isFull
            ? "bg-black/80 text-brutal-dim cursor-not-allowed opacity-50"
            : "bg-black/80 text-brutal-dim hover:bg-brutal-violet hover:text-black cursor-pointer"
        }`}
      >
        {isAdding ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : alreadyIn ? <CheckCircle2 className="w-3.5 h-3.5" />
          : <Plus className="w-3.5 h-3.5" strokeWidth={3} />}
      </button>
    </div>
  );
}

// ─── Full search panel ────────────────────────────────────────────────────────
function SearchPanel({
  movies, blockMovieIds, isFull, addingMovieId, onAdd, onDragStart, inputRef,
}: {
  movies: any[];
  blockMovieIds: Set<number>;
  isFull: boolean;
  addingMovieId: number | null;
  onAdd: (r: MovieResult) => void;
  onDragStart: (e: React.DragEvent, r: MovieResult) => void;
  inputRef?: React.RefObject<HTMLInputElement>;
}) {
  const [tab, setTab] = useState<SearchTab>("title");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MovieResult[]>([]);
  const [personResults, setPersonResults] = useState<PersonResult[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<PersonResult | null>(null);
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedLang, setSelectedLang] = useState("");
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Reset state when tab changes
  useEffect(() => {
    setQuery("");
    setResults([]);
    setPersonResults([]);
    setSelectedPerson(null);
    setSelectedGenre("");
    setSelectedYear("");
    setSelectedLang("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, [tab]);

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const doSearch = (url: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setResults((data.results || []).slice(0, 20));
        }
      } finally {
        setSearching(false);
      }
    }, 350);
  };

  const doPersonSearch = (q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { setPersonResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/movies?action=search-person&query=${encodeURIComponent(q.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setPersonResults(data.results || []);
        }
      } finally {
        setSearching(false);
      }
    }, 350);
  };

  const handleTitleChange = (q: string) => {
    setQuery(q);
    if (!q.trim()) { setResults([]); return; }
    doSearch(`/api/movies?action=search&query=${encodeURIComponent(q.trim())}`);
  };

  const handlePersonQueryChange = (q: string) => {
    setQuery(q);
    setSelectedPerson(null);
    setResults([]);
    doPersonSearch(q);
  };

  const selectPerson = (p: PersonResult) => {
    setSelectedPerson(p);
    setPersonResults([]);
    setQuery(p.name);
    const role = tab === "director" ? "crew" : "cast";
    doSearch(`/api/movies?action=discover-by-person&person_id=${p.id}&role=${role}`);
  };

  const handleGenreChange = (g: string) => {
    setSelectedGenre(g);
    if (!g) { setResults([]); return; }
    doSearch(`/api/movies?action=discover&genre=${g}&sort=popularity.desc`);
  };

  const handleYearChange = (y: string) => {
    setSelectedYear(y);
    if (!y) { setResults([]); return; }
    doSearch(`/api/movies?action=discover&year=${y}&sort=popularity.desc`);
  };

  const handleLangChange = (l: string) => {
    setSelectedLang(l);
    if (!l) { setResults([]); return; }
    doSearch(`/api/movies?action=discover&lang=${l}&sort=popularity.desc`);
  };

  const showMovieGrid = results.length > 0 && !searching;
  const isPersonTab = tab === "director" || tab === "actor";

  return (
    <>
      {/* Tab bar */}
      <div className="flex border-b-3 border-brutal-border overflow-x-auto flex-shrink-0 bg-surface">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-shrink-0 px-3 py-2.5 text-[10px] font-mono font-bold uppercase tracking-wider transition-colors border-r border-brutal-border/40 last:border-r-0 ${
              tab === t.id
                ? "bg-brutal-violet text-black"
                : "text-brutal-dim hover:text-brutal-white hover:bg-surface-2"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 border-b-3 border-brutal-border bg-surface">
        {(tab === "title" || isPersonTab) && (
          <div className="flex items-center gap-2 px-3 py-2.5">
            <Search className="w-3.5 h-3.5 text-brutal-dim flex-shrink-0" strokeWidth={2.5} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => isPersonTab ? handlePersonQueryChange(e.target.value) : handleTitleChange(e.target.value)}
              placeholder={
                tab === "title" ? "Search by movie title..." :
                tab === "director" ? "Search director name..." :
                "Search actor name..."
              }
              className="flex-1 bg-transparent text-sm text-brutal-white placeholder:text-brutal-dim outline-none font-body"
              autoComplete="off"
            />
            {query && (
              <button onClick={() => { setQuery(""); setResults([]); setPersonResults([]); setSelectedPerson(null); }} className="text-brutal-dim hover:text-brutal-white">
                <X className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
            )}
          </div>
        )}

        {tab === "genre" && (
          <div className="p-3">
            <select
              value={selectedGenre}
              onChange={(e) => handleGenreChange(e.target.value)}
              className="w-full bg-bg border-2 border-brutal-border px-3 py-2 text-sm text-brutal-white font-mono focus:border-brutal-violet focus:outline-none"
            >
              <option value="">Pick a genre...</option>
              {GENRES.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
        )}

        {tab === "year" && (
          <div className="p-3">
            <select
              value={selectedYear}
              onChange={(e) => handleYearChange(e.target.value)}
              className="w-full bg-bg border-2 border-brutal-border px-3 py-2 text-sm text-brutal-white font-mono focus:border-brutal-violet focus:outline-none"
            >
              <option value="">Pick a year...</option>
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        )}

        {tab === "language" && (
          <div className="p-3">
            <select
              value={selectedLang}
              onChange={(e) => handleLangChange(e.target.value)}
              className="w-full bg-bg border-2 border-brutal-border px-3 py-2 text-sm text-brutal-white font-mono focus:border-brutal-violet focus:outline-none"
            >
              <option value="">Pick a language...</option>
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Capacity bar */}
      <div className="px-4 py-1.5 border-b border-brutal-border/40 bg-surface flex items-center gap-2 flex-shrink-0">
        <div className="flex-1 h-1 bg-surface-2 border border-brutal-border overflow-hidden">
          <div className="h-full bg-brutal-violet transition-all duration-300" style={{ width: `${(movies.length / 50) * 100}%` }} />
        </div>
        <span className="font-mono text-[9px] text-brutal-dim">{movies.length}/50</span>
        {isFull && <span className="font-mono text-[9px] text-red-400 font-bold">FULL</span>}
      </div>

      {/* Results area */}
      <div className="flex-1 overflow-y-auto p-3">

        {/* Person search results (before person is selected) */}
        {isPersonTab && !selectedPerson && personResults.length > 0 && (
          <div className="flex flex-col gap-1 mb-3">
            <p className="font-mono text-[9px] uppercase tracking-widest text-brutal-dim mb-1">Select a person</p>
            {personResults.map((p) => (
              <button
                key={p.id}
                onClick={() => selectPerson(p)}
                className="flex items-center gap-3 p-2 border border-brutal-border hover:border-brutal-violet hover:bg-brutal-violet/10 text-left transition-colors group"
              >
                <div className="relative w-8 h-8 rounded-full overflow-hidden border border-brutal-border flex-shrink-0 bg-surface-2">
                  {p.profile_path ? (
                    <Image src={`https://image.tmdb.org/t/p/w92${p.profile_path}`} alt={p.name} fill className="object-cover" sizes="32px" />
                  ) : (
                    <User className="w-4 h-4 text-brutal-dim absolute inset-0 m-auto" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-xs text-brutal-white uppercase truncate group-hover:text-brutal-violet transition-colors">{p.name}</p>
                  {p.known_for.length > 0 && (
                    <p className="font-mono text-[9px] text-brutal-dim truncate">{p.known_for.join(", ")}</p>
                  )}
                </div>
                <ChevronRight className="w-3 h-3 text-brutal-dim group-hover:text-brutal-violet flex-shrink-0" />
              </button>
            ))}
          </div>
        )}

        {/* Selected person chip */}
        {isPersonTab && selectedPerson && (
          <div className="flex items-center gap-2 mb-3 p-2 border-2 border-brutal-violet bg-brutal-violet/10">
            <div className="relative w-6 h-6 rounded-full overflow-hidden border border-brutal-violet flex-shrink-0 bg-surface-2">
              {selectedPerson.profile_path ? (
                <Image src={`https://image.tmdb.org/t/p/w92${selectedPerson.profile_path}`} alt={selectedPerson.name} fill className="object-cover" sizes="24px" />
              ) : (
                <User className="w-3 h-3 text-brutal-dim absolute inset-0 m-auto" />
              )}
            </div>
            <span className="font-display font-bold text-xs text-brutal-violet uppercase flex-1 truncate">{selectedPerson.name}</span>
            <button onClick={() => { setSelectedPerson(null); setResults([]); setQuery(""); }} className="text-brutal-dim hover:text-brutal-white">
              <X className="w-3 h-3" strokeWidth={2.5} />
            </button>
          </div>
        )}

        {/* Loading */}
        {searching && (
          <div className="flex items-center justify-center gap-2 py-10 text-brutal-dim">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="font-mono text-xs">Searching...</span>
          </div>
        )}

        {/* Empty state */}
        {!searching && !showMovieGrid && !(isPersonTab && personResults.length > 0) && (
          <p className="py-10 text-center font-mono text-xs text-brutal-dim px-2 leading-relaxed">
            {tab === "title" && (query ? `No results for "${query}"` : "Type a movie title above.")}
            {tab === "director" && (!query ? "Type a director's name." : !selectedPerson ? `No directors found for "${query}"` : "No movies found.")}
            {tab === "actor" && (!query ? "Type an actor's name." : !selectedPerson ? `No actors found for "${query}"` : "No movies found.")}
            {tab === "genre" && !selectedGenre && "Choose a genre above."}
            {tab === "year" && !selectedYear && "Choose a release year above."}
            {tab === "language" && !selectedLang && "Choose a language above."}
            {(tab === "genre" && selectedGenre && !searching) && `No results.`}
            {(tab === "year" && selectedYear && !searching) && `No results for ${selectedYear}.`}
            {(tab === "language" && selectedLang && !searching) && `No results.`}
          </p>
        )}

        {/* Movie grid */}
        {showMovieGrid && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            {results.map((r) => (
              <SearchPosterCard
                key={r.id}
                movie={r}
                alreadyIn={blockMovieIds.has(r.id)}
                isAdding={addingMovieId === r.id}
                isFull={isFull}
                onAdd={() => onAdd(r)}
                onDragStart={(e) => onDragStart(e, r)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CineBlockViewPage() {
  const params = useParams();
  const router = useRouter();
  const blockId = params.blockId as string;
  const { isAuthenticated } = useConvexAuth();
  const { toggleSaveBlock, updateBlock, removeMovieFromBlock, addMovieToBlock, importPublicBlock } = useBlocks();

  const blockDetails = useQuery(api.cineblocks.getBlockDetails, {
    blockId: blockId as Id<"blocks">,
  });

  // Fetch creator's public stamps for movies in this block (no auth required)
  const creatorStampsData = useQuery(
    api.stamps.getCreatorStampsForBlock,
    blockDetails
      ? { creatorUserId: blockDetails.block.userId, movieIds: blockDetails.movies.map((m) => m.movieId) }
      : "skip"
  );

  const [savingBlock, setSavingBlock] = useState(false);
  const [importingBlock, setImportingBlock] = useState(false);
  const [removingMovieId, setRemovingMovieId] = useState<number | null>(null);
  const [addingMovieId, setAddingMovieId] = useState<number | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [editingPublic, setEditingPublic] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const dragMovieRef = useRef<MovieResult | null>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  if (blockDetails === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="w-10 h-10 border-4 border-brutal-violet border-t-transparent animate-spin" />
      </div>
    );
  }

  if (blockDetails === null) {
    return (
      <main className="min-h-screen bg-bg flex flex-col items-center justify-center gap-6 p-6">
        <Film className="w-14 h-14 text-brutal-dim" strokeWidth={1} />
        <p className="font-display font-bold text-xl uppercase tracking-wider text-center">CineBlock not found</p>
        <Link href="/cineblocks" className="brutal-btn px-6 py-3 text-sm font-mono uppercase">
          <ArrowLeft className="w-4 h-4 inline mr-1" />My Blocks
        </Link>
      </main>
    );
  }

  const { block, movies, isOwner, isSaved, progress } = blockDetails;
  const blockMovieIds = new Set(movies.map((m) => m.movieId));
  const stampedMovieIds = new Set((creatorStampsData ?? []).map((s) => s.movieId));
  const stampReviewMap = new Map((creatorStampsData ?? []).map((s) => [s.movieId, s.reviewText]));
  const isFull = movies.length >= 50;
  const progressPct = Math.round(progress.percentage);

  const handleCopyLink = async () => {
    try {
      setActionError(null);
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setActionError("Could not copy the share link.");
    }
  };

  const handleToggleSave = async () => {
    if (!isAuthenticated) {
      setShowSignInPrompt(true);
      return;
    }
    setSavingBlock(true);
    setActionError(null);
    try {
      await toggleSaveBlock(blockId as Id<"blocks">);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not update save status.");
    } finally {
      setSavingBlock(false);
    }
  };

  const handleImportBlock = async () => {
    if (!isAuthenticated) {
      setShowSignInPrompt(true);
      return;
    }
    if (isOwner) return;

    setImportingBlock(true);
    setActionError(null);
    try {
      const newBlockId = await importPublicBlock(blockId as Id<"blocks">);
      router.push(`/cineblock/${newBlockId}`);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not import this CineBlock.");
    } finally {
      setImportingBlock(false);
    }
  };

  const handleMovieClick = async (movie: { movieId: number; movieTitle: string; posterPath: string }) => {
    setSelectedMovie({
      id: movie.movieId, title: movie.movieTitle,
      poster_path: movie.posterPath || null, backdrop_path: null,
      overview: "", release_date: "", vote_average: 0, vote_count: 0,
      genre_ids: [], original_language: "", original_title: movie.movieTitle,
      popularity: 0, adult: false,
    });
    try {
      const res = await fetch(`/api/movies?action=details&id=${movie.movieId}`);
      if (res.ok) setSelectedMovie(await res.json());
    } catch { /* keep stub */ }
  };

  const handleRemoveMovie = async (movieId: number) => {
    setRemovingMovieId(movieId);
    try {
      await removeMovieFromBlock(blockId as Id<"blocks">, movieId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to remove movie.");
    } finally {
      setRemovingMovieId(null);
    }
  };

  const handleAddFromSearch = async (result: MovieResult) => {
    if (addingMovieId || blockMovieIds.has(result.id) || isFull) return;
    setAddingMovieId(result.id);
    try {
      await addMovieToBlock(blockId as Id<"blocks">, result.id, result.title, result.poster_path || "");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to add movie.");
    } finally {
      setAddingMovieId(null);
    }
  };

  const handleDragStart = (e: React.DragEvent, result: MovieResult) => {
    dragMovieRef.current = result;
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDropOnBlock = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const movie = dragMovieRef.current;
    if (!movie) return;
    await handleAddFromSearch(movie);
    dragMovieRef.current = null;
  };

  const openSettings = () => {
    setEditingTitle(block.title);
    setEditingDescription(block.description || "");
    setEditingPublic(block.isPublic);
    setShowSettings(true);
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      await updateBlock(blockId as Id<"blocks">, {
        title: editingTitle, description: editingDescription, isPublic: editingPublic,
      });
      setShowSettings(false);
    } catch { /* toast by hook */ } finally {
      setSavingSettings(false);
    }
  };

  const searchPanelProps = {
    movies, blockMovieIds, isFull, addingMovieId,
    onAdd: handleAddFromSearch,
    onDragStart: handleDragStart,
  };

  return (
    <main className="min-h-screen bg-bg flex flex-col pb-20 lg:pb-0">

      {/* ── Header ── */}
      <div className="sticky top-0 z-50 bg-bg border-b-3 border-brutal-border">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <Link href="/cineblocks" className="brutal-btn p-2.5 flex-shrink-0">
            <ArrowLeft className="w-4 h-4" strokeWidth={3} />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-bold text-base sm:text-xl text-brutal-white uppercase tracking-tight truncate">{block.title}</h1>
            <p className="font-mono text-[10px] text-brutal-dim uppercase tracking-wider">by @{block.ownerName} · {movies.length} / 50 movies</p>
          </div>
          <div className="flex items-center gap-2">
            {isOwner && (
              <button
                onClick={() => { setShowMobileSearch(true); }}
                className="lg:hidden brutal-btn flex items-center gap-1.5 px-3 py-2 text-[10px] font-mono uppercase hover:!bg-brutal-violet hover:!text-black hover:!border-brutal-violet"
              >
                <Search className="w-3.5 h-3.5" />
                ADD
              </button>
            )}
            <button
              onClick={handleCopyLink}
              className={`brutal-btn hidden sm:flex items-center gap-2 px-3 py-2 text-[10px] font-mono uppercase transition-colors ${copied ? "!bg-brutal-lime !text-black !border-brutal-lime" : ""}`}
            >
              <Share2 className="w-3.5 h-3.5" />
              {copied ? "COPIED!" : "SHARE"}
            </button>
            {!isOwner && (
              <button
                onClick={handleToggleSave}
                disabled={isAuthenticated && savingBlock}
                className={`brutal-btn flex items-center gap-2 px-3 py-2 text-[10px] font-mono uppercase transition-colors ${isAuthenticated && isSaved ? "!bg-brutal-cyan !text-black !border-brutal-cyan" : "hover:!bg-brutal-cyan hover:!text-black hover:!border-brutal-cyan"}`}
              >
                {isAuthenticated && isSaved ? <BookMarked className="w-3.5 h-3.5" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{isAuthenticated && isSaved ? "SAVED" : "SAVE BLOCK"}</span>
              </button>
            )}
            {!isOwner && isAuthenticated && (
              <button
                onClick={handleImportBlock}
                disabled={importingBlock}
                className="brutal-btn flex items-center gap-2 px-3 py-2 text-[10px] font-mono uppercase hover:!bg-brutal-violet hover:!text-black hover:!border-brutal-violet disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={3} />
                <span className="hidden sm:inline">{importingBlock ? "IMPORTING..." : "IMPORT"}</span>
              </button>
            )}
            {isOwner && (
              <button
                onClick={openSettings}
                className="brutal-btn flex items-center gap-2 px-3 py-2 text-[10px] font-mono uppercase hover:!bg-brutal-violet hover:!text-black hover:!border-brutal-violet"
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">SETTINGS</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Split layout ── */}
      <div className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 py-6 flex gap-6 items-start">

        {/* Left: block content */}
        <div className="flex-1 min-w-0 flex flex-col gap-6">
          {actionError && (
            <div className="border-2 border-red-500 bg-red-500/10 px-4 py-3 font-mono text-sm text-red-300">{actionError}</div>
          )}

          {/* Progress */}
          {isAuthenticated && movies.length > 0 && (
            <div className="brutal-card p-5 flex flex-col gap-4 bg-surface">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brutal-cyan" strokeWidth={2.5} />
                  <span className="font-display font-bold text-sm uppercase tracking-wider">Your Progress</span>
                </div>
                <span className="font-mono font-bold text-sm text-brutal-cyan">{progress.watched} / {progress.total}</span>
              </div>
              <div className="relative h-6 border-3 border-brutal-border bg-bg overflow-hidden">
                <div className="h-full bg-brutal-cyan transition-all duration-700 ease-out" style={{ width: `${progressPct}%` }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-mono font-bold text-[11px] mix-blend-difference text-white">{progressPct}% WATCHED</span>
                </div>
              </div>
              {progress.watched === progress.total && progress.total > 0 && (
                <p className="font-display font-bold text-xs uppercase tracking-widest text-brutal-cyan text-center animate-fade-in">
                  🎬 BLOCK COMPLETE — YOU'VE SEEN THEM ALL!
                </p>
              )}
            </div>
          )}
          {!isAuthenticated && movies.length > 0 && (
            <div className="brutal-card p-5 flex flex-col gap-4 bg-surface border-dashed">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-brutal-yellow" strokeWidth={2.5} />
                  <span className="font-display font-bold text-sm uppercase tracking-wider">Track Your Progress</span>
                </div>
                <span className="font-mono font-bold text-xs text-brutal-dim">SIGN IN REQUIRED</span>
              </div>
              <p className="font-mono text-xs text-brutal-dim">
                View this shared playlist freely. Sign in to mark watched movies and sync your progress.
              </p>
              <button
                onClick={() => setShowSignInPrompt(true)}
                className="brutal-btn self-start px-4 py-2 text-[10px] font-mono uppercase !bg-brutal-yellow !text-black !border-brutal-yellow hover:!bg-white"
              >
                SIGN IN TO TRACK
              </button>
            </div>
          )}

          {/* Drop zone indicator */}
          {isOwner && dragOver && (
            <div className="border-3 border-dashed border-brutal-violet bg-brutal-violet/10 p-4 text-center font-display font-bold text-sm uppercase tracking-wider text-brutal-violet animate-pulse">
              Drop to add to block
            </div>
          )}

          {/* Movie grid — drop target */}
          <div
            onDragOver={isOwner ? (e) => { e.preventDefault(); setDragOver(true); } : undefined}
            onDragLeave={isOwner ? () => setDragOver(false) : undefined}
            onDrop={isOwner ? handleDropOnBlock : undefined}
            className={`transition-all duration-150 ${dragOver ? "ring-3 ring-brutal-violet ring-offset-2 ring-offset-bg" : ""}`}
          >
            {movies.length === 0 ? (
              <div className="brutal-card p-14 flex flex-col items-center gap-4 border-dashed">
                <LayoutGrid className="w-12 h-12 text-brutal-dim" strokeWidth={1} />
                <p className="font-display font-bold uppercase text-brutal-dim">No movies yet</p>
                {isOwner && (
                  <p className="font-mono text-xs text-brutal-dim text-center max-w-xs">
                    Search movies on the right and drag them here, or click <strong>+</strong>.
                  </p>
                )}
              </div>
            ) : (
              <>
                <p className="font-mono text-[10px] uppercase tracking-wider text-brutal-dim mb-3">
                  {movies.length} MOVIE{movies.length !== 1 ? "S" : ""} IN THIS BLOCK
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {movies.map((movie, i) => {
                    const isRemoving = removingMovieId === movie.movieId;
                    return (
                      <div
                        key={movie.movieId}
                        className="group brutal-poster relative aspect-[2/3] w-full animate-fade-in"
                        style={{ animationDelay: `${(i % 30) * 35}ms` }}
                      >
                        <button
                          onClick={() => void handleMovieClick(movie)}
                          className="absolute inset-0 focus:outline-none"
                          aria-label={`View ${movie.movieTitle}`}
                        >
                          {movie.posterPath ? (
                            <Image
                              src={posterUrl(movie.posterPath, "medium")}
                              alt={movie.movieTitle}
                              fill
                              sizes="(max-width:640px) 50vw, 20vw"
                              className="object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-surface-2 p-3">
                              <span className="text-brutal-muted text-xs font-mono font-bold text-center uppercase leading-tight">{movie.movieTitle}</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-100 opacity-100">
                            <div className="absolute bottom-0 left-0 right-0 p-3">
                              <p className="text-brutal-white text-xs font-display font-bold uppercase leading-tight line-clamp-2">{movie.movieTitle}</p>
                            </div>
                          </div>
                        </button>
                        <StampIndicator
                          hasStamp={stampedMovieIds.has(movie.movieId)}
                          reviewText={stampReviewMap.get(movie.movieId)}
                        />
                        {isOwner && (
                          <button
                            onClick={() => void handleRemoveMovie(movie.movieId)}
                            disabled={isRemoving}
                            aria-label={`Remove ${movie.movieTitle}`}
                            className="absolute top-0 right-0 z-10 flex items-center justify-center w-8 h-8 border-b-3 border-l-3 border-brutal-border bg-black/80 text-brutal-dim hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                          >
                            {isRemoving
                              ? <div className="w-3 h-3 border-2 border-white border-t-transparent animate-spin" />
                              : <X className="w-3 h-3" strokeWidth={3} />
                            }
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right: search panel — desktop, owner only */}
        {isOwner && (
          <div className="hidden lg:flex flex-col w-[min(36vw,28rem)] min-w-[22rem] xl:min-w-[24rem] flex-shrink-0 sticky top-[73px] border-3 border-brutal-border bg-bg overflow-hidden" style={{ height: "calc(100vh - 90px)" }}>
            <SearchPanel {...searchPanelProps} />
          </div>
        )}
      </div>

      {/* ── Mobile search sheet ── */}
      {isOwner && showMobileSearch && (
        <div className="fixed inset-0 z-[900] lg:hidden flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowMobileSearch(false)} />
          <div className="relative w-full bg-bg border-t-3 border-brutal-border flex flex-col animate-slide-up overflow-hidden" style={{ maxHeight: "90vh" }}>
            <div className="flex items-center justify-between px-4 py-2 border-b border-brutal-border/30 flex-shrink-0">
              <span className="font-mono text-[10px] uppercase tracking-widest text-brutal-dim">Add Movies</span>
              <button onClick={() => setShowMobileSearch(false)} className="p-1 text-brutal-dim hover:text-brutal-white">
                <X className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>
            <SearchPanel {...searchPanelProps} inputRef={mobileInputRef} />
          </div>
        </div>
      )}

      <MovieModal
        movie={selectedMovie}
        onClose={() => setSelectedMovie(null)}
        requireAuthForActions={!isAuthenticated}
        onRequireAuth={() => setShowSignInPrompt(true)}
      />

      {showSignInPrompt && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/70 p-4 animate-fade-in">
          <div className="w-full max-w-md border-4 border-brutal-border bg-bg brutal-shadow animate-slide-up">
            <div className="flex items-center justify-between border-b-4 border-brutal-border bg-brutal-yellow p-4">
              <h2 className="font-display text-lg font-bold uppercase tracking-wider text-black">Sign In Required</h2>
              <button
                onClick={() => setShowSignInPrompt(false)}
                className="p-1 text-black hover:bg-black/10"
                aria-label="Close sign in prompt"
              >
                <X className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </div>
            <div className="p-4 flex flex-col gap-4">
              <p className="font-mono text-xs text-brutal-dim leading-relaxed">
                You can view this shared CineBlock without signing in. To save it, mark watched, and track progress, please sign in.
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setShowSignInPrompt(false)}
                  className="brutal-btn px-4 py-2 text-[10px] font-mono uppercase"
                >
                  Not Now
                </button>
                <Link
                  href="/sign-in"
                  className="brutal-btn px-4 py-2 text-[10px] font-mono uppercase !bg-brutal-yellow !text-black !border-brutal-yellow"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Settings modal ── */}
      {showSettings && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/70 p-4 animate-fade-in">
          <div className="w-full max-w-lg border-4 border-brutal-border bg-bg brutal-shadow animate-slide-up">
            <div className="flex items-center justify-between border-b-4 border-brutal-border bg-brutal-violet p-4">
              <h2 className="font-display text-lg font-bold uppercase tracking-wider text-black">Block Settings</h2>
              <button onClick={() => setShowSettings(false)} className="p-1 text-black hover:bg-black/10" aria-label="Close settings">
                <X className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </div>
            <div className="flex flex-col gap-4 p-4">
              <label className="flex flex-col gap-1">
                <span className="font-mono text-[10px] uppercase tracking-wider text-brutal-dim">Title</span>
                <input value={editingTitle} onChange={(e) => setEditingTitle(e.target.value)} maxLength={60}
                  className="border-2 border-brutal-border bg-surface px-3 py-2 text-sm focus:border-brutal-violet focus:outline-none" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-mono text-[10px] uppercase tracking-wider text-brutal-dim">Description</span>
                <textarea value={editingDescription} onChange={(e) => setEditingDescription(e.target.value)} maxLength={280} rows={4}
                  className="border-2 border-brutal-border bg-surface px-3 py-2 text-sm focus:border-brutal-violet focus:outline-none" />
              </label>
              <div className="flex items-center justify-between border-2 border-brutal-border bg-surface p-3">
                <div className="flex items-center gap-2">
                  {editingPublic ? <Globe className="h-4 w-4 text-brutal-cyan" /> : <Lock className="h-4 w-4 text-brutal-orange" />}
                  <div className="flex flex-col">
                    <span className="font-display text-xs font-bold uppercase">{editingPublic ? "Public Block" : "Private Block"}</span>
                    <span className="font-mono text-[10px] text-brutal-dim">{editingPublic ? "Anyone with the link can view/save" : "Only you can access this block"}</span>
                  </div>
                </div>
                <button onClick={() => setEditingPublic((p) => !p)}
                  className={`brutal-btn px-3 py-1.5 text-[10px] font-mono uppercase ${editingPublic ? "!bg-brutal-cyan !text-black !border-brutal-cyan" : "hover:!bg-brutal-orange hover:!text-black hover:!border-brutal-orange"}`}>
                  {editingPublic ? "PUBLIC" : "PRIVATE"}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t-4 border-brutal-border p-4">
              <button onClick={() => setShowSettings(false)} className="brutal-btn px-4 py-2 text-[10px] font-mono uppercase">Cancel</button>
              <button onClick={saveSettings} disabled={savingSettings}
                className="brutal-btn px-4 py-2 text-[10px] font-mono uppercase !bg-brutal-violet !text-black !border-brutal-violet disabled:opacity-50">
                {savingSettings ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
