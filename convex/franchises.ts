import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery, query, type MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { franchisePartValidator, franchiseSourceValidator } from "./schema";
import { FRANCHISE_SEED } from "../src/lib/franchiseSeed";
import {
  auditSnapshot,
  buildFranchise,
  discoverFranchises,
  FranchiseNotFoundError,
  nextRefreshDelay,
  normalizeFranchiseName,
  type FranchiseDefinition,
  type FranchisePart,
  type FranchiseSource,
} from "../src/lib/franchiseBuilder";

/**
 * Franchise Vault — fully database-driven.
 *
 *  franchises            catalog + schedule + health, one small row per franchise
 *  franchise_snapshots   the full film list per franchise (what the modal shows)
 *
 * Crons (convex/crons.ts):
 *  - hourly  `syncDue`        seeds an empty catalog once, then re-checks every franchise
 *                             that's due. Each check is also a health check: issues are
 *                             recorded, moved TMDB collections are found again by exact
 *                             name and fixed in place, and franchises that stay missing
 *                             are marked broken (hidden) and retried weekly.
 *  - weekly  `discoverNew`    adds franchises behind what's trending/popular/upcoming.
 *
 * Manual runs:  pnpm exec convex run franchises:syncDue
 *               pnpm exec convex run franchises:discoverNew
 *               pnpm exec convex run franchises:healthReport
 */

const BATCH_SIZE = 25; // franchises checked per action run; leftovers chain 30s later
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const RECENT_WINDOW_DAYS = 60; // Radar badges stay this long after release
const BROKEN_AFTER = 2; // consecutive "not found" checks before a franchise is hidden
const DISCOVERY_LIMIT = 20; // new franchises per weekly run
const NEW_BADGE_DAYS = 21;

const snapshotValidator = v.object({
  collectionId: v.number(),
  name: v.string(),
  overview: v.string(),
  poster_path: v.union(v.string(), v.null()),
  backdrop_path: v.union(v.string(), v.null()),
  parts: v.array(franchisePartValidator),
});

function tmdbCollectionIds(source: FranchiseSource): number[] {
  if (source.type === "collection") {
    return [source.tmdbCollectionId];
  }
  if (source.type === "merge") {
    return source.eras.map((e) => e.tmdbCollectionId);
  }
  return [];
}

/** Curated rows first in their curated order, then discovered ones by popularity. */
function byDisplayOrder(a: Doc<"franchises">, b: Doc<"franchises">) {
  if (a.rank !== undefined && b.rank !== undefined) {
    return a.rank - b.rank;
  }
  if (a.rank !== undefined) {
    return -1;
  }
  if (b.rank !== undefined) {
    return 1;
  }
  return b.popularity - a.popularity;
}

// ─── Public reads ───────────────────────────────────────────────────────────

/** Everything the Vault grid needs, straight from the catalog — no TMDB calls. */
export const listCatalog = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("franchises").collect();
    const now = Date.now();
    return rows
      .filter((r) => r.status === "active" && (r.filmCount > 0 || r.syncedAt === undefined))
      .sort(byDisplayOrder)
      .map((r) => ({
        key: r.key,
        name: r.name,
        posterPath: r.posterPath ?? null,
        filmCount: r.filmCount,
        partIds: r.partIds,
        syncing: r.syncedAt === undefined,
        isNew: r.origin === "discovered" && now - r.addedAt < NEW_BADGE_DAYS * DAY,
      }));
  },
});

/** Full film list for the Vault modal, shaped like TMDB's collection payload. */
export const getSnapshot = query({
  args: { collectionId: v.number() },
  handler: async (ctx, { collectionId }) => {
    const snap = await ctx.db
      .query("franchise_snapshots")
      .withIndex("by_collectionId", (q) => q.eq("collectionId", collectionId))
      .first();
    if (!snap) {
      return null;
    }
    return {
      id: snap.collectionId,
      name: snap.name,
      overview: snap.overview,
      poster_path: snap.poster_path,
      backdrop_path: snap.backdrop_path,
      parts: snap.parts,
      changedAt: snap.changedAt,
    };
  },
});

/** A franchise's definition, so the API route can build it live before its first sync. */
export const getDefinition = query({
  args: { key: v.number() },
  handler: async (ctx, { key }) => {
    const row = await ctx.db.query("franchises").withIndex("by_key", (q) => q.eq("key", key)).first();
    if (!row) {
      return null;
    }
    return { key: row.key, name: row.name, overview: row.overview, featuredMovieId: row.featuredMovieId, source: row.source };
  },
});

/** One recent/upcoming film and the franchise ribbon it should wear. */
interface FranchiseFilmBadge {
  movieId: number;
  key: number;
  name: string;
  label?: string;
  tone?: string;
  /** Lower wins when a film belongs to two franchises. */
  priority: number;
}

/** Recent/upcoming franchise films (released on/after `since`) for Radar ribbons. */
export const upcomingFranchiseFilms = query({
  args: { since: v.string() },
  handler: async (ctx, { since }) => {
    const rows = (await ctx.db.query("franchises").collect())
      .filter((r) => r.status === "active")
      .sort(byDisplayOrder);
    const out: FranchiseFilmBadge[] = [];
    rows.forEach((r, priority) => {
      for (const film of r.recent) {
        if (film.releaseDate >= since) {
          out.push({ movieId: film.movieId, key: r.key, name: r.name, label: r.badge?.label, tone: r.badge?.tone, priority });
        }
      }
    });
    return out;
  },
});

// ─── Health report ──────────────────────────────────────────────────────────

export const healthReport = internalQuery({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("franchises").collect();
    const now = Date.now();
    const withIssues = rows
      .filter((r) => r.status === "broken" || (r.health && !r.health.ok))
      .map((r) => ({
        key: r.key,
        name: r.name,
        status: r.status,
        failures: r.failures,
        issues: r.health?.issues ?? [],
        checkedHoursAgo: r.health ? Math.round((now - r.health.checkedAt) / HOUR) : null,
      }));
    return {
      total: rows.length,
      active: rows.filter((r) => r.status === "active").length,
      broken: rows.filter((r) => r.status === "broken").length,
      neverSynced: rows.filter((r) => r.syncedAt === undefined).length,
      discovered: rows.filter((r) => r.origin === "discovered").length,
      overdue: rows.filter((r) => r.nextSyncAt < now - 2 * HOUR).length,
      withIssues,
    };
  },
});

// ─── Internal plumbing ──────────────────────────────────────────────────────

/** First run on a fresh deployment: fill the empty catalog from the seed, once. */
export const seedIfEmpty = internalMutation({
  args: {},
  handler: async (ctx) => {
    if (await ctx.db.query("franchises").first()) {
      return 0;
    }
    const now = Date.now();
    for (const seed of FRANCHISE_SEED) {
      await ctx.db.insert("franchises", {
        key: seed.key,
        name: seed.name,
        overview: seed.overview,
        source: seed.source,
        featuredMovieId: seed.featuredMovieId,
        themeColor: seed.themeColor,
        badge: seed.badge,
        rank: seed.rank,
        origin: "seed",
        status: "active",
        addedAt: now,
        filmCount: 0,
        partIds: [],
        recent: [],
        popularity: 0,
        nextSyncAt: 0,
        failures: 0,
      });
    }
    return FRANCHISE_SEED.length;
  },
});

export const dueFranchises = internalQuery({
  args: { now: v.number(), limit: v.number() },
  handler: async (ctx, { now, limit }) => {
    const due = await ctx.db
      .query("franchises")
      .withIndex("by_nextSyncAt", (q) => q.lte("nextSyncAt", now))
      .take(limit + 1);
    return {
      more: due.length > limit,
      items: due.slice(0, limit).map((r) => ({
        key: r.key,
        name: r.name,
        overview: r.overview,
        featuredMovieId: r.featuredMovieId,
        source: r.source,
      })),
    };
  },
});

export const knownCollectionIds = internalQuery({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("franchises").collect();
    return {
      ids: rows.flatMap((r) => tmdbCollectionIds(r.source)),
      names: rows.map((r) => normalizeFranchiseName(r.name)),
    };
  },
});

async function getRow(ctx: MutationCtx, key: number) {
  return ctx.db.query("franchises").withIndex("by_key", (q) => q.eq("key", key)).first();
}

/** Stable string of everything the Vault renders, independent of stored key order. */
function fingerprint(s: {
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  parts: FranchisePart[];
}): string {
  return JSON.stringify([
    s.name,
    s.overview,
    s.poster_path,
    s.backdrop_path,
    s.parts.map((p) => [
      p.id, p.title, p.original_title, p.overview, p.poster_path, p.backdrop_path, p.release_date,
      p.vote_average, p.vote_count, p.genre_ids, p.original_language, p.popularity, p.adult, p.custom_era ?? null,
    ]),
  ]);
}

async function markFailure(ctx: MutationCtx, row: Doc<"franchises">, issue: string, notFound: boolean) {
  const failures = row.failures + 1;
  const broken = notFound && failures >= BROKEN_AFTER;
  // Transient errors: 6h, 12h, 24h, 48h, capped at 3 days. Missing: weekly.
  const backoff = notFound ? 7 * DAY : Math.min(6 * HOUR * 2 ** (failures - 1), 3 * DAY);
  await ctx.db.patch(row._id, {
    failures,
    status: broken ? "broken" : row.status,
    nextSyncAt: Date.now() + backoff,
    health: { ok: false, checkedAt: Date.now(), issues: [issue.slice(0, 300)] },
  });
}

export const saveSnapshot = internalMutation({
  args: {
    key: v.number(),
    snapshot: snapshotValidator,
    healedSource: v.optional(franchiseSourceValidator),
    issues: v.array(v.string()),
  },
  handler: async (ctx, { key, snapshot, healedSource, issues }): Promise<SaveResult> => {
    const row = await getRow(ctx, key);
    if (!row) {
      return { changed: false, rejected: "franchise no longer in catalog" };
    }
    const now = Date.now();
    const existing = await ctx.db
      .query("franchise_snapshots")
      .withIndex("by_collectionId", (q) => q.eq("collectionId", key))
      .first();

    // Sanity guard: a franchise doesn't lose half its films overnight — TMDB hiccuped.
    if (existing && existing.parts.length >= 4 && snapshot.parts.length < existing.parts.length / 2) {
      const rejected = `TMDB returned ${snapshot.parts.length} films (had ${existing.parts.length}); kept previous snapshot`;
      await markFailure(ctx, row, rejected, false);
      return { changed: false, rejected };
    }

    const changed = !existing || fingerprint(existing) !== fingerprint(snapshot);
    if (changed) {
      if (existing) {
        await ctx.db.patch(existing._id, { ...snapshot, changedAt: now });
      } else {
        await ctx.db.insert("franchise_snapshots", { ...snapshot, changedAt: now });
      }
    }

    const cutoff = new Date(now - RECENT_WINDOW_DAYS * DAY).toISOString().slice(0, 10);
    await ctx.db.patch(row._id, {
      ...(healedSource ? { source: healedSource } : {}),
      // Discovered franchises take TMDB's current name; curated ones keep their label
      ...(row.origin === "discovered" ? { name: snapshot.name } : {}),
      status: "active",
      posterPath: snapshot.poster_path,
      filmCount: snapshot.parts.length,
      partIds: snapshot.parts.map((p) => p.id),
      recent: snapshot.parts
        .filter((p) => p.release_date && p.release_date >= cutoff)
        .map((p) => ({ movieId: p.id, releaseDate: p.release_date })),
      popularity: Math.round(snapshot.parts.reduce((sum, p) => sum + p.popularity, 0)),
      nextSyncAt: now + nextRefreshDelay(snapshot.parts, key),
      syncedAt: now,
      failures: 0,
      health: { ok: issues.length === 0, checkedAt: now, issues },
    });
    return { changed };
  },
});

export const recordFailure = internalMutation({
  args: { key: v.number(), error: v.string(), notFound: v.boolean() },
  handler: async (ctx, { key, error, notFound }) => {
    const row = await getRow(ctx, key);
    if (row) {
      await markFailure(ctx, row, error, notFound);
    }
  },
});

export const addDiscovered = internalMutation({
  args: { franchises: v.array(v.object({ tmdbCollectionId: v.number(), name: v.string(), popularity: v.number() })) },
  handler: async (ctx, { franchises }) => {
    const now = Date.now();
    let added = 0;
    for (const f of franchises) {
      if (await getRow(ctx, f.tmdbCollectionId)) continue; // already known
      await ctx.db.insert("franchises", {
        key: f.tmdbCollectionId,
        name: f.name,
        source: { type: "collection", tmdbCollectionId: f.tmdbCollectionId },
        origin: "discovered",
        status: "active",
        addedAt: now,
        filmCount: 0,
        partIds: [],
        recent: [],
        popularity: Math.round(f.popularity),
        nextSyncAt: 0, // picked up by the next hourly tick
        failures: 0,
      });
      added++;
    }
    return added;
  },
});

// ─── Cron entry points ──────────────────────────────────────────────────────

/** Every TMDB collection id and normalized name the catalog already covers. */
interface KnownFranchises {
  ids: number[];
  names: string[];
}

/** A page of franchises whose next check is due. */
interface DueBatch {
  items: FranchiseDefinition[];
  more: boolean;
}

/** Result of saving one snapshot. */
interface SaveResult {
  changed: boolean;
  rejected?: string;
}

export const syncDue = internalAction({
  args: {},
  handler: async (ctx): Promise<void> => {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
      console.error("franchise sync skipped: TMDB_API_KEY is not set on this Convex deployment");
      return;
    }

    const seeded: number = await ctx.runMutation(internal.franchises.seedIfEmpty, {});
    if (seeded) {
      console.log(`franchise catalog seeded with ${seeded} franchises`);
    }

    const { items, more }: DueBatch = await ctx.runQuery(internal.franchises.dueFranchises, { now: Date.now(), limit: BATCH_SIZE });

    let changed = 0;
    let failed = 0;
    let healed = 0;
    // Sequential on purpose: gentle on TMDB, and a cron has no deadline worth racing
    for (const def of items) {
      try {
        const { snapshot, healedSource, notes } = await buildFranchise(def, apiKey);
        if (healedSource) {
          healed++;
        }
        const result: SaveResult = await ctx.runMutation(internal.franchises.saveSnapshot, {
          key: def.key,
          snapshot,
          healedSource,
          issues: auditSnapshot(snapshot, notes),
        });
        if (result.changed) {
          changed++;
        }
        if (result.rejected) {
          failed++;
          console.warn(`franchise ${def.key} (${def.name}): ${result.rejected}`);
        }
      } catch (err) {
        failed++;
        await ctx.runMutation(internal.franchises.recordFailure, {
          key: def.key,
          error: err instanceof Error ? err.message : String(err),
          notFound: err instanceof FranchiseNotFoundError,
        });
      }
    }

    if (more) {
      await ctx.scheduler.runAfter(30_000, internal.franchises.syncDue, {});
    }
    if (items.length) {
      console.log(`franchise sync: checked ${items.length}, changed ${changed}, healed ${healed}, failed ${failed}${more ? ", more due" : ""}`);
    }
  },
});

export const discoverNew = internalAction({
  args: {},
  handler: async (ctx): Promise<void> => {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
      console.error("franchise discovery skipped: TMDB_API_KEY is not set on this Convex deployment");
      return;
    }
    const known: KnownFranchises = await ctx.runQuery(internal.franchises.knownCollectionIds, {});
    const knownNames = new Set(known.names);
    const found = (await discoverFranchises(apiKey, new Set(known.ids), DISCOVERY_LIMIT))
      // A renumbered TMDB collection must not come back as a duplicate franchise
      .filter((f) => !knownNames.has(normalizeFranchiseName(f.name)));
    const added: number = await ctx.runMutation(internal.franchises.addDiscovered, { franchises: found });
    console.log(`franchise discovery: ${found.length} candidates, ${added} added`);
    if (added) {
      await ctx.scheduler.runAfter(0, internal.franchises.syncDue, {});
    }
  },
});
