import { NextResponse, NextRequest } from "next/server";
import { buildTMDBParams, WizardState } from "@/lib/tmdbQueryBuilder";

type PersonalizationInput = {
  likedIds?: number[];
  watchlistIds?: number[];
  watchedIds?: number[];
  preferredLanguages?: string[];
};

type RequestBody = WizardState & {
  excludeIds?: number[];
  personalization?: PersonalizationInput;
};

const TARGET_RESULTS = 5;

function toUniqueNumberArray(input: unknown, max = 200) {
  if (!Array.isArray(input)) return [];
  const unique = new Set<number>();
  for (const raw of input) {
    const value = Number(raw);
    if (Number.isFinite(value) && value > 0) unique.add(value);
    if (unique.size >= max) break;
  }
  return [...unique];
}

function sanitizeLanguages(input: unknown) {
  if (!Array.isArray(input) || input.length === 0) return ["any"];
  const unique = new Set(
    input
      .map((lang) => String(lang || "").toLowerCase().trim())
      .filter(Boolean)
  );
  const normalized = [...unique].slice(0, 5);
  return normalized.length > 0 ? normalized : ["any"];
}

function sanitizeYear(input: unknown): number {
  const currentYear = new Date().getFullYear();
  let value = Number(input);
  if (!Number.isFinite(value)) value = currentYear;
  return Math.min(currentYear, Math.max(1950, Math.floor(value)));
}

function randomPage(max = 10) {
  return Math.max(1, Math.floor(Math.random() * max) + 1);
}

function getRelaxedYears(yearFrom: number, yearTo: number, level: number) {
  const currentYear = new Date().getFullYear();
  const from = Math.min(yearFrom, yearTo);
  const to = Math.max(yearFrom, yearTo);
  // Each level expands ±1 year on both sides (e.g. 2016-2017 → 2015-2018 → 2014-2019 …)
  const expand = level;
  return {
    yearFrom: Math.max(1950, from - expand),
    yearTo: Math.min(currentYear, to + expand),
  };
}

async function tmdbFetch(path: string, apiKey: string) {
  return fetch(`https://api.themoviedb.org/3${path}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });
}

async function fetchDiscoverBatch(
  state: WizardState,
  apiKey: string,
  opts: {
    includeKeyword: boolean;
    yearLevel: number;
    languageMode: "strict" | "any";
    sortBy: "vote_average.desc" | "popularity.desc";
    pageAttempts: number;
    minVoteAverage?: string;
  },
  excludeSet: Set<number>
) {
  const collected: any[] = [];
  const seen = new Set<number>();

  for (let i = 0; i < opts.pageAttempts; i++) {
    const relaxedYears = getRelaxedYears(state.yearFrom, state.yearTo, opts.yearLevel);
    const params = buildTMDBParams(state, {
      includeKeyword: opts.includeKeyword,
      yearFrom: relaxedYears.yearFrom,
      yearTo: relaxedYears.yearTo,
      languageMode: opts.languageMode,
      sortBy: opts.sortBy,
      page: randomPage(opts.sortBy === "popularity.desc" ? 12 : 8),
      minVoteAverage: opts.minVoteAverage,
    });

    const searchParams = new URLSearchParams(params);
    const res = await tmdbFetch(`/discover/movie?${searchParams.toString()}`, apiKey);
    if (!res.ok) continue;

    const data = await res.json();
    const results: any[] = data.results || [];
    for (const movie of results) {
      if (!movie || typeof movie.id !== "number") continue;
      if (excludeSet.has(movie.id) || seen.has(movie.id)) continue;
      seen.add(movie.id);
      collected.push(movie);
    }
  }

  return collected;
}

async function fetchPersonalizedPool(
  state: WizardState,
  personalization: PersonalizationInput,
  apiKey: string,
  excludeSet: Set<number>
) {
  const preferredLanguages = new Set(
    sanitizeLanguages(personalization.preferredLanguages || []).filter((l) => l !== "any")
  );
  const activeLanguages = new Set(state.languages.filter((l) => l !== "any"));

  const seedIds = [
    ...toUniqueNumberArray(personalization.likedIds, 8),
    ...toUniqueNumberArray(personalization.watchlistIds, 6),
    ...toUniqueNumberArray(personalization.watchedIds, 6),
  ];

  const uniqueSeedIds: number[] = [];
  const seenSeeds = new Set<number>();
  for (const id of seedIds) {
    if (seenSeeds.has(id)) continue;
    seenSeeds.add(id);
    uniqueSeedIds.push(id);
    if (uniqueSeedIds.length >= 10) break;
  }

  const pool: any[] = [];
  const seenMovies = new Set<number>();

  for (const seedId of uniqueSeedIds) {
    const recRes = await tmdbFetch(`/movie/${seedId}/recommendations?page=${randomPage(4)}`, apiKey);
    if (!recRes.ok) continue;

    const recData = await recRes.json();
    const recs: any[] = recData.results || [];

    for (const movie of recs) {
      if (!movie || typeof movie.id !== "number") continue;
      if (excludeSet.has(movie.id) || seenMovies.has(movie.id)) continue;

      if (activeLanguages.size > 0 && !activeLanguages.has(String(movie.original_language || "").toLowerCase())) {
        continue;
      }

      const year = Number(String(movie.release_date || "").split("-")[0]);
      if (Number.isFinite(year) && (year < state.yearFrom || year > state.yearTo)) {
        continue;
      }

      seenMovies.add(movie.id);

      let score = 0;
      const lang = String(movie.original_language || "").toLowerCase();
      if (preferredLanguages.has(lang)) score += 2;
      score += Math.min(2, Math.max(0, Number(movie.vote_average || 0) / 5));
      score += Math.min(1, Math.max(0, Number(movie.popularity || 0) / 100));

      pool.push({ movie, score });
    }

    if (pool.length >= 20) break;
  }

  return pool.sort((a, b) => b.score - a.score).map((item) => item.movie);
}

function dedupeAndLimit(movies: any[], excludeSet: Set<number>, limit: number) {
  const out: any[] = [];
  const seen = new Set<number>();

  for (const movie of movies) {
    if (!movie || typeof movie.id !== "number") continue;
    if (excludeSet.has(movie.id) || seen.has(movie.id)) continue;
    seen.add(movie.id);
    out.push(movie);
    if (out.length >= limit) break;
  }

  return out;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<RequestBody>;
    const apiKey = process.env.TMDB_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "TMDB API key not configured" }, { status: 500 });
    }

    const state: WizardState = {
      keywordId: typeof body.keywordId === "number" ? body.keywordId : null,
      languages: sanitizeLanguages(body.languages),
      yearFrom: sanitizeYear((body as any).yearFrom),
      yearTo: sanitizeYear((body as any).yearTo),
    };
    if (state.yearFrom > state.yearTo) {
      const tmp = state.yearFrom;
      state.yearFrom = state.yearTo;
      state.yearTo = tmp;
    }

    const excludeSet = new Set<number>(toUniqueNumberArray(body.excludeIds, 500));
    const hasKeyword = Boolean(state.keywordId);

    // Each yearLevel expands ±N years around the user's chosen range.
    // Level 0 = exact range, level 1 = ±1 yr (e.g. 2016-2017 → 2015-2018), etc.
    const stages = hasKeyword
      ? [
          { includeKeyword: true,  yearLevel: 0, languageMode: "strict" as const, sortBy: "vote_average.desc" as const, pageAttempts: 3, minVoteAverage: "7.0" },
          { includeKeyword: true,  yearLevel: 1, languageMode: "strict" as const, sortBy: "vote_average.desc" as const, pageAttempts: 3, minVoteAverage: "6.9" },
          { includeKeyword: true,  yearLevel: 2, languageMode: "strict" as const, sortBy: "popularity.desc" as const, pageAttempts: 4, minVoteAverage: "6.7" },
          { includeKeyword: true,  yearLevel: 3, languageMode: "strict" as const, sortBy: "popularity.desc" as const, pageAttempts: 4, minVoteAverage: "6.5" },
          { includeKeyword: true,  yearLevel: 4, languageMode: "any"    as const, sortBy: "popularity.desc" as const, pageAttempts: 5, minVoteAverage: "6.3" },
        ]
      : [
          { includeKeyword: false, yearLevel: 0, languageMode: "strict" as const, sortBy: "vote_average.desc" as const, pageAttempts: 3, minVoteAverage: "7.0" },
          { includeKeyword: false, yearLevel: 1, languageMode: "strict" as const, sortBy: "vote_average.desc" as const, pageAttempts: 3, minVoteAverage: "6.9" },
          { includeKeyword: false, yearLevel: 2, languageMode: "strict" as const, sortBy: "popularity.desc" as const, pageAttempts: 4, minVoteAverage: "6.7" },
          { includeKeyword: false, yearLevel: 3, languageMode: "strict" as const, sortBy: "popularity.desc" as const, pageAttempts: 4, minVoteAverage: "6.5" },
          { includeKeyword: false, yearLevel: 4, languageMode: "any"    as const, sortBy: "popularity.desc" as const, pageAttempts: 5, minVoteAverage: "6.3" },
        ];

    const strictPool: any[] = [];
    const strictSeen = new Set<number>();

    for (const stage of stages) {
      if (strictPool.length >= 20) break;
      const batch = await fetchDiscoverBatch(state, apiKey, stage, excludeSet);
      for (const movie of batch) {
        if (strictSeen.has(movie.id)) continue;
        strictSeen.add(movie.id);
        strictPool.push(movie);
      }
    }

    const strictTop = dedupeAndLimit(strictPool, excludeSet, 20);

    const personalization = body.personalization || {};
    const personalizedPool = hasKeyword
      ? []
      : await fetchPersonalizedPool(state, personalization, apiKey, excludeSet);

    const final: any[] = [];
    const used = new Set<number>();

    const strictCount = strictTop.length;
    let personalTarget = 0;
    if (personalizedPool.length > 0 && strictCount >= 4) personalTarget = 1;
    if (personalizedPool.length >= 2 && strictCount >= 3) personalTarget = 2;

    const strictTarget = TARGET_RESULTS - personalTarget;

    for (const movie of strictTop) {
      if (used.has(movie.id)) continue;
      final.push(movie);
      used.add(movie.id);
      if (final.length >= strictTarget) break;
    }

    for (const movie of personalizedPool) {
      if (used.has(movie.id) || excludeSet.has(movie.id)) continue;
      final.push(movie);
      used.add(movie.id);
      if (final.length >= TARGET_RESULTS) break;
    }

    for (const movie of strictTop) {
      if (used.has(movie.id)) continue;
      final.push(movie);
      used.add(movie.id);
      if (final.length >= TARGET_RESULTS) break;
    }

    // Last-resort: completely open pool, any year/language
    if (final.length < TARGET_RESULTS) {
      const fallbackBatch = await fetchDiscoverBatch(
        { ...state, keywordId: null, languages: ["any"], yearFrom: 1950, yearTo: new Date().getFullYear() },
        apiKey,
        {
          includeKeyword: false,
          yearLevel: 0,
          languageMode: "any",
          sortBy: "popularity.desc",
          pageAttempts: 4,
          minVoteAverage: "6.2",
        },
        excludeSet
      );

      for (const movie of fallbackBatch) {
        if (used.has(movie.id) || excludeSet.has(movie.id)) continue;
        final.push(movie);
        used.add(movie.id);
        if (final.length >= TARGET_RESULTS) break;
      }
    }

    return NextResponse.json({ movies: final.slice(0, TARGET_RESULTS) });
  } catch (err) {
    console.error("Find movie error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
