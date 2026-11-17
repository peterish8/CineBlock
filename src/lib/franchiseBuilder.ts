/**
 * Builds Franchise Vault data straight from TMDB — plain rules, no AI. Used by the
 * Convex crons (`convex/franchises.ts`) and the `/api/movies?action=collection` live
 * fallback. A franchise's definition (its `source`) comes from the `franchises` table
 * in Convex, never from code. Uses only `fetch` and type imports, so the Convex
 * bundler can include it.
 */

const TMDB_BASE = "https://api.themoviedb.org/3";
const DAY = 86_400_000;

/** One film in a franchise, in the subset of TMDB's movie shape the Vault renders. */
export interface FranchisePart {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  original_language: string;
  popularity: number;
  adult: boolean;
  custom_era?: string;
}

/** A franchise's full, ordered film list plus its artwork, keyed by catalog key. */
export interface FranchiseSnapshot {
  collectionId: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  parts: FranchisePart[];
}

/** Mirrors `franchiseSourceValidator` in convex/schema.ts. */
export type FranchiseSource =
  | { type: "collection"; tmdbCollectionId: number }
  | {
      type: "keyword";
      keywordId: number;
      companyId?: number;
      excludeGenreIds: number[];
      excludeIds: number[];
      pinnedOrder: number[];
      minRuntime: number;
    }
  | { type: "merge"; eras: { tmdbCollectionId: number; era: string }[] };

/** Everything needed to build one franchise; read from the Convex catalog. */
export interface FranchiseDefinition {
  key: number;
  name: string;
  overview?: string;
  featuredMovieId?: number;
  source: FranchiseSource;
}

/** Output of {@link buildFranchise}. */
export interface BuildResult {
  snapshot: FranchiseSnapshot;
  /** Set when TMDB had moved a collection and we found it again by name. */
  healedSource?: FranchiseSource;
  notes: string[];
}

/** TMDB says the franchise doesn't exist and it couldn't be found by name either. */
export class FranchiseNotFoundError extends Error {}

type Raw = Record<string, unknown>;

function isRecord(value: unknown): value is Raw {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** The objects inside an unknown JSON array; anything else is dropped. */
function records(value: unknown): Raw[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function tmdb(path: string, apiKey: string): Promise<Raw | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${TMDB_BASE}${path}`, {
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json;charset=utf-8" },
      });
      if (res.ok) {
        const body: unknown = await res.json();
        return isRecord(body) ? body : null;
      }
      if (res.status === 404) {
        return null;
      }
      if (res.status !== 429 && res.status < 500) {
        throw new Error(`TMDB ${res.status} for ${path.split("?")[0]}`);
      }
    } catch (err) {
      if (attempt === 2) {
        throw err;
      }
    }
    await sleep(400 * (attempt + 1));
  }
  throw new Error(`TMDB unavailable for ${path.split("?")[0]}`);
}

const str = (v: unknown) => (typeof v === "string" ? v : "");
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const imgPath = (v: unknown) => (typeof v === "string" && v.startsWith("/") ? v : null);
const isoDay = (t: number) => new Date(t).toISOString().slice(0, 10);

function toPart(raw: Raw, era?: string): FranchisePart | null {
  const id = num(raw.id);
  const title = str(raw.title);
  if (!id || !title) {
    return null;
  }
  return {
    id,
    title,
    original_title: str(raw.original_title) || title,
    overview: str(raw.overview),
    poster_path: imgPath(raw.poster_path),
    backdrop_path: imgPath(raw.backdrop_path),
    release_date: str(raw.release_date),
    vote_average: num(raw.vote_average),
    vote_count: num(raw.vote_count),
    genre_ids: Array.isArray(raw.genre_ids)
      ? raw.genre_ids.filter((g): g is number => typeof g === "number")
      : records(raw.genres).map((g) => num(g.id)).filter(Boolean),
    original_language: str(raw.original_language),
    popularity: num(raw.popularity),
    adult: raw.adult === true,
    ...(era ? { custom_era: era } : {}),
  };
}

const UPCOMING_HORIZON_DAYS = 365;

/**
 * Released films always count. Unreleased ones only count once they're real and
 * near: a poster, a genre, a named title, and a date within a year — so "Untitled
 * X-Men Film (2028)" placeholders don't inflate completion. They join on their own.
 */
function isTrackable(p: FranchisePart, today: string): boolean {
  if (p.adult) {
    return false;
  }
  if (p.release_date && p.release_date <= today) {
    return true;
  }
  if (!p.release_date || !p.poster_path || p.genre_ids.length === 0) {
    return false;
  }
  if (/^untitled\b/i.test(p.title)) {
    return false;
  }
  return p.release_date <= isoDay(Date.parse(today) + UPCOMING_HORIZON_DAYS * DAY);
}

const byRelease = (a: FranchisePart, b: FranchisePart) =>
  (a.release_date || "9999").localeCompare(b.release_date || "9999");

const todayIso = () => isoDay(Date.now());

// ─── Name healing ─────────────────────────────────────────────────────────────

/** "The Dark Knight Trilogy" / "Batman Collection" → "dark knight trilogy" / "batman" */
export function normalizeFranchiseName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\b(collection|the|saga|series)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * TMDB sometimes merges or renumbers collections, turning a stored id into a 404.
 * Look the franchise up by name and accept only an exact (normalized) match — never
 * a "closest guess", so a heal can't silently swap in the wrong franchise.
 */
async function findCollectionIdByName(name: string, apiKey: string): Promise<number | null> {
  const query = new URLSearchParams({
    query: name.replace(/\s+collection$/i, ""),
    include_adult: "false",
    language: "en-US",
  });
  const data = await tmdb(`/search/collection?${query.toString()}`, apiKey);
  const results = records(data?.results);
  const wanted = normalizeFranchiseName(name);
  const match = results.find((r) => normalizeFranchiseName(str(r.name)) === wanted);
  return match ? num(match.id) || null : null;
}

/** Fetch a TMDB collection; on 404 try to find it again by name. */
async function fetchCollection(
  tmdbCollectionId: number,
  name: string,
  apiKey: string
): Promise<{ data: Raw; resolvedId: number }> {
  const data = await tmdb(`/collection/${tmdbCollectionId}?language=en-US`, apiKey);
  if (data) {
    return { data, resolvedId: tmdbCollectionId };
  }
  const healedId = name ? await findCollectionIdByName(name, apiKey) : null;
  if (healedId && healedId !== tmdbCollectionId) {
    const healed = await tmdb(`/collection/${healedId}?language=en-US`, apiKey);
    if (healed) {
      return { data: healed, resolvedId: healedId };
    }
  }
  throw new FranchiseNotFoundError(`TMDB collection ${tmdbCollectionId} (${name || "unnamed"}) not found, and no exact name match`);
}

function collectionParts(data: Raw, today: string, era?: string): FranchisePart[] {
  return records(data.parts)
    .map((p) => toPart(p, era))
    .filter((p): p is FranchisePart => p !== null && isTrackable(p, today))
    .sort(byRelease);
}

// ─── Builders per source type ─────────────────────────────────────────────────

async function discoverInto(
  found: Map<number, FranchisePart>,
  source: Extract<FranchiseSource, { type: "keyword" }>,
  filters: Record<string, string>,
  apiKey: string
) {
  const query = new URLSearchParams({
    with_keywords: String(source.keywordId),
    without_genres: source.excludeGenreIds.join(","),
    include_adult: "false",
    language: "en-US",
    sort_by: "primary_release_date.asc",
    ...(source.companyId ? { with_companies: String(source.companyId) } : {}),
    ...filters,
  });
  for (let page = 1; page <= 5; page++) {
    query.set("page", String(page));
    const data = await tmdb(`/discover/movie?${query.toString()}`, apiKey);
    if (!data) {
      break;
    }
    for (const raw of records(data.results)) {
      const part = toPart(raw);
      if (part) {
        found.set(part.id, part);
      }
    }
    if (page >= num(data.total_pages)) {
      break;
    }
  }
}

async function buildKeyword(
  def: FranchiseDefinition,
  source: Extract<FranchiseSource, { type: "keyword" }>,
  apiKey: string
): Promise<BuildResult> {
  const found = new Map<number, FranchisePart>();
  const today = todayIso();
  const tomorrow = isoDay(Date.parse(today) + DAY);
  // Released: feature-length only. Upcoming: TMDB has no runtime yet, `isTrackable` vets them.
  await discoverInto(found, source, { "primary_release_date.lte": today, "with_runtime.gte": String(source.minRuntime) }, apiKey);
  await discoverInto(found, source, { "primary_release_date.gte": tomorrow }, apiKey);

  // Pinned films the keyword missed are fetched directly, so an upstream tagging
  // change can never silently drop a film from the timeline.
  const notes: string[] = [];
  for (const id of source.pinnedOrder.filter((id) => !found.has(id))) {
    const raw = await tmdb(`/movie/${id}?language=en-US`, apiKey);
    const part = raw ? toPart(raw) : null;
    if (part) {
      found.set(part.id, part);
    } else {
      notes.push(`Pinned film ${id} no longer exists on TMDB`);
    }
  }

  const excluded = new Set(source.excludeIds);
  const pinned = new Map(source.pinnedOrder.map((id, i) => [id, i]));
  const all = [...found.values()].filter((p) => !excluded.has(p.id) && isTrackable(p, today));
  const parts = [
    ...all.filter((p) => pinned.has(p.id)).sort((a, b) => (pinned.get(a.id) ?? 0) - (pinned.get(b.id) ?? 0)),
    ...all.filter((p) => !pinned.has(p.id)).sort(byRelease),
  ];
  return { snapshot: withArtwork(def, parts, def.overview ?? "", null, null), notes };
}

async function buildMerge(
  def: FranchiseDefinition,
  source: Extract<FranchiseSource, { type: "merge" }>,
  apiKey: string
): Promise<BuildResult> {
  const today = todayIso();
  const parts: FranchisePart[] = [];
  const seen = new Set<number>();
  const notes: string[] = [];
  let healed = false;
  const eras: { tmdbCollectionId: number; era: string }[] = [];
  for (const era of source.eras) {
    // Era collections carry no reliable name to search by, so a vanished one fails
    // loudly (and shows in the health report) instead of being guessed
    const { data, resolvedId } = await fetchCollection(era.tmdbCollectionId, "", apiKey);
    if (resolvedId !== era.tmdbCollectionId) {
      healed = true;
    }
    eras.push({ ...era, tmdbCollectionId: resolvedId });
    for (const p of collectionParts(data, today, era.era)) {
      if (seen.has(p.id)) {
        continue;
      }
      seen.add(p.id);
      parts.push(p);
    }
  }
  return {
    snapshot: withArtwork(def, parts, def.overview ?? "", null, null),
    healedSource: healed ? { type: "merge", eras } : undefined,
    notes,
  };
}

async function buildPlainCollection(
  def: FranchiseDefinition,
  source: Extract<FranchiseSource, { type: "collection" }>,
  apiKey: string
): Promise<BuildResult> {
  const { data, resolvedId } = await fetchCollection(source.tmdbCollectionId, def.name, apiKey);
  const parts = collectionParts(data, todayIso());
  const notes =
    resolvedId !== source.tmdbCollectionId
      ? [`TMDB moved this collection from ${source.tmdbCollectionId} to ${resolvedId}; updated automatically`]
      : [];
  return {
    snapshot: withArtwork(def, parts, str(data.overview), imgPath(data.poster_path), imgPath(data.backdrop_path), str(data.name)),
    healedSource: resolvedId !== source.tmdbCollectionId ? { type: "collection", tmdbCollectionId: resolvedId } : undefined,
    notes,
  };
}

/** Artwork comes from the films themselves, so no image path is ever hardcoded. */
function withArtwork(
  def: FranchiseDefinition,
  parts: FranchisePart[],
  overview: string,
  poster: string | null,
  backdrop: string | null,
  tmdbName?: string
): FranchiseSnapshot {
  const featured = def.featuredMovieId ? parts.find((p) => p.id === def.featuredMovieId) : undefined;
  return {
    collectionId: def.key,
    name: def.source.type === "collection" ? tmdbName || def.name : def.name,
    overview,
    poster_path: featured?.poster_path ?? poster ?? parts.find((p) => p.poster_path)?.poster_path ?? null,
    backdrop_path: featured?.backdrop_path ?? backdrop ?? parts.find((p) => p.backdrop_path)?.backdrop_path ?? null,
    parts,
  };
}

/** Fetch one franchise from TMDB. Throws on failure so callers keep the last good snapshot. */
export function buildFranchise(def: FranchiseDefinition, apiKey: string): Promise<BuildResult> {
  switch (def.source.type) {
    case "keyword":
      return buildKeyword(def, def.source, apiKey);
    case "merge":
      return buildMerge(def, def.source, apiKey);
    default:
      return buildPlainCollection(def, def.source, apiKey);
  }
}

// ─── Health ──────────────────────────────────────────────────────────────────

/** Plain-language problems a franchise has right now (empty = healthy). */
export function auditSnapshot(snapshot: FranchiseSnapshot, notes: string[] = []): string[] {
  const issues = [...notes];
  const today = todayIso();
  const released = snapshot.parts.filter((p) => p.release_date && p.release_date <= today).length;
  if (snapshot.parts.length === 0) {
    issues.push("No trackable films on TMDB");
  } else if (released === 0) {
    issues.push("Nothing released yet");
  }
  const noPoster = snapshot.parts.filter((p) => !p.poster_path).length;
  if (noPoster) {
    issues.push(`${noPoster} ${noPoster === 1 ? "film is" : "films are"} missing a poster`);
  }
  if (!snapshot.poster_path) {
    issues.push("No franchise artwork");
  }
  return issues;
}

/**
 * How long until this franchise is checked again — plain date rules:
 *  - a film released in the last 60 days or coming in the next 120 → daily
 *  - anything else still upcoming → every 3 days
 *  - fully released → weekly (doubles as the weekly health check)
 * A per-franchise offset spreads dormant ones across the week.
 */
export function nextRefreshDelay(parts: Pick<FranchisePart, "release_date">[], key: number, now = Date.now()): number {
  const dates = parts.map((p) => Date.parse(p.release_date)).filter((t) => Number.isFinite(t));
  if (dates.some((t) => t >= now - 60 * DAY && t <= now + 120 * DAY)) {
    return DAY;
  }
  if (dates.some((t) => t > now)) {
    return 3 * DAY;
  }
  return 7 * DAY + (key % 48) * 60 * 60 * 1000;
}

// ─── Discovery ───────────────────────────────────────────────────────────────

/** A TMDB collection the discovery scan found that the vault doesn't have yet. */
export interface DiscoveredFranchise {
  tmdbCollectionId: number;
  name: string;
  popularity: number;
}

/**
 * Finds franchises the vault doesn't have yet: walk what's trending, popular,
 * upcoming and in cinemas, collect the TMDB collections those films belong to,
 * and keep the ones that are real sagas — at least two released films, artwork,
 * nothing adult.
 */
export async function discoverFranchises(
  apiKey: string,
  knownCollectionIds: Set<number>,
  limit: number
): Promise<DiscoveredFranchise[]> {
  const lists = [
    "/trending/movie/week?page=1", "/trending/movie/week?page=2", "/trending/movie/week?page=3",
    "/movie/popular?page=1", "/movie/popular?page=2", "/movie/popular?page=3",
    "/movie/upcoming?page=1", "/movie/upcoming?page=2",
    "/movie/now_playing?page=1",
  ];
  const movieIds = new Set<number>();
  for (const list of lists) {
    const data = await tmdb(`${list}&language=en-US`, apiKey);
    for (const m of records(data?.results)) {
      if (num(m.id) && m.adult !== true) {
        movieIds.add(num(m.id));
      }
    }
  }

  const candidates = new Map<number, string>();
  for (const id of movieIds) {
    const movie = await tmdb(`/movie/${id}?language=en-US`, apiKey);
    const owner = movie?.belongs_to_collection;
    if (!isRecord(owner)) {
      continue;
    }
    const cid = num(owner.id);
    if (cid && !knownCollectionIds.has(cid)) {
      candidates.set(cid, str(owner.name));
    }
  }

  const today = todayIso();
  const found: DiscoveredFranchise[] = [];
  for (const [cid, name] of candidates) {
    if (found.length >= limit) {
      break;
    }
    const data = await tmdb(`/collection/${cid}?language=en-US`, apiKey);
    if (!data) {
      continue;
    }
    const parts = collectionParts(data, today);
    const released = parts.filter((p) => p.release_date && p.release_date <= today);
    if (released.length < 2 || !imgPath(data.poster_path)) {
      continue;
    }
    found.push({
      tmdbCollectionId: cid,
      name: str(data.name) || name,
      popularity: parts.reduce((sum, p) => sum + p.popularity, 0),
    });
  }
  return found;
}
