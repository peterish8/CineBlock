import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { MAX_BLOCKS_PER_USER, MAX_MOVIES_PER_BLOCK, MAX_BLOCK_TITLE_LENGTH, MAX_BLOCK_DESCRIPTION_LENGTH, STAMP_REVIEW_MAX, normalizeTitleIdentity } from "./limits";

// Export Query
export const exportUserData = query({
  args: {
    options: v.object({
      watched: v.boolean(),
      liked: v.boolean(),
      watchlist: v.boolean(),
      blocks: v.boolean(),
      stamps: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    const internalId = await getAuthUserId(ctx);
    if (!internalId) throw new Error("Unauthorized");

    const data: Record<string, unknown> = {
      version: 1,
      timestamp: Date.now(),
    };

    if (args.options.watched) {
      const w = await ctx.db.query("watched").withIndex("by_userId", q => q.eq("userId", internalId)).collect();
      data.watched = w.map(({ movieId, movieTitle, posterPath, genreIds, watchedAt }) => ({ movieId, movieTitle, posterPath, ...(genreIds !== undefined ? { genreIds } : {}), watchedAt }));
    }

    if (args.options.liked) {
      const l = await ctx.db.query("liked").withIndex("by_userId", q => q.eq("userId", internalId)).collect();
      data.liked = l.map(({ movieId, movieTitle, posterPath, genreIds, likedAt }) => ({ movieId, movieTitle, posterPath, ...(genreIds !== undefined ? { genreIds } : {}), likedAt }));
    }

    if (args.options.watchlist) {
      const w = await ctx.db.query("watchlist").withIndex("by_userId", q => q.eq("userId", internalId)).collect();
      data.watchlist = w.map(({ movieId, movieTitle, posterPath, genreIds, addedAt }) => ({ movieId, movieTitle, posterPath, ...(genreIds !== undefined ? { genreIds } : {}), addedAt }));
    }

    if (args.options.blocks) {
      const b = await ctx.db.query("blocks").withIndex("by_userId", q => q.eq("userId", internalId)).collect();
      data.blocks = b.map(({ title, description, isPublic, movieCount, movies, createdAt, updatedAt }) => ({ title, isPublic, createdAt, updatedAt, ...(description !== undefined ? { description } : {}), ...(movieCount !== undefined ? { movieCount } : {}), ...(movies !== undefined ? { movies } : {}) }));
    }

    if (args.options.stamps) {
      const s = await ctx.db.query("stamps").withIndex("by_userId", q => q.eq("userId", internalId)).collect();
      data.stamps = s.map(({ movieId, movieTitle, posterPath, reviewText, isPublic, isDraft, createdAt }) => ({ movieId, movieTitle, posterPath, reviewText, isPublic, createdAt, ...(isDraft !== undefined ? { isDraft } : {}) }));
    }

    return data;
  },
});

// Mirrors exportUserData above, so a CineBlock backup always round-trips.
const libraryItemValidator = v.object({
  movieId: v.number(),
  movieTitle: v.string(),
  posterPath: v.optional(v.string()),
  genreIds: v.optional(v.array(v.number())),
});

const watchedItemValidator = v.object({ ...libraryItemValidator.fields, watchedAt: v.optional(v.number()) });
const likedItemValidator = v.object({ ...libraryItemValidator.fields, likedAt: v.optional(v.number()) });
const watchlistItemValidator = v.object({ ...libraryItemValidator.fields, addedAt: v.optional(v.number()) });

const stampItemValidator = v.object({
  movieId: v.number(),
  movieTitle: v.string(),
  posterPath: v.optional(v.string()),
  reviewText: v.string(),
  isPublic: v.optional(v.boolean()),
  isDraft: v.optional(v.boolean()),
  createdAt: v.optional(v.number()),
});

const blockMovieItemValidator = v.object({
  movieId: v.number(),
  movieTitle: v.string(),
  posterPath: v.optional(v.string()),
  addedAt: v.optional(v.number()),
});

const blockItemValidator = v.object({
  title: v.string(),
  description: v.optional(v.string()),
  isPublic: v.optional(v.boolean()),
  movieCount: v.optional(v.number()),
  movies: v.optional(v.array(blockMovieItemValidator)),
  createdAt: v.optional(v.number()),
  updatedAt: v.optional(v.number()),
});

const importPayloadValidator = v.object({
  version: v.optional(v.number()),
  timestamp: v.optional(v.number()),
  watched: v.optional(v.array(watchedItemValidator)),
  liked: v.optional(v.array(likedItemValidator)),
  watchlist: v.optional(v.array(watchlistItemValidator)),
  stamps: v.optional(v.array(stampItemValidator)),
  blocks: v.optional(v.array(blockItemValidator)),
});

// Import Mutation
export const importUserData = mutation({
  args: {
    payload: importPayloadValidator,
  },
  handler: async (ctx, args) => {
    const internalId = await getAuthUserId(ctx);
    if (!internalId) throw new Error("Unauthorized");

    const p = args.payload;

    const stats = {
      watchedAdded: 0,
      likedAdded: 0,
      watchlistAdded: 0,
      blocksAdded: 0,
      stampsAdded: 0,
    };

    // 1. Watched Movies
    for (const item of p.watched ?? []) {
      const movie = normalizeTitleIdentity(item);
      if (!movie) continue;
      const existing = await ctx.db.query("watched")
        .withIndex("by_userId_movieId", q => q.eq("userId", internalId).eq("movieId", movie.movieId))
        .first();
      if (!existing) {
        await ctx.db.insert("watched", { userId: internalId, ...movie, genreIds: item.genreIds, watchedAt: item.watchedAt ?? Date.now() });
        stats.watchedAdded++;
      }
    }

    // 2. Liked Movies
    for (const item of p.liked ?? []) {
      const movie = normalizeTitleIdentity(item);
      if (!movie) continue;
      const existing = await ctx.db.query("liked")
        .withIndex("by_userId_movieId", q => q.eq("userId", internalId).eq("movieId", movie.movieId))
        .first();
      if (!existing) {
        await ctx.db.insert("liked", { userId: internalId, ...movie, genreIds: item.genreIds, likedAt: item.likedAt ?? Date.now() });
        stats.likedAdded++;
      }
    }

    // 3. Watchlist
    for (const item of p.watchlist ?? []) {
      const movie = normalizeTitleIdentity(item);
      if (!movie) continue;
      const existing = await ctx.db.query("watchlist")
        .withIndex("by_userId_movieId", q => q.eq("userId", internalId).eq("movieId", movie.movieId))
        .first();
      if (!existing) {
        await ctx.db.insert("watchlist", { userId: internalId, ...movie, genreIds: item.genreIds, addedAt: item.addedAt ?? Date.now() });
        stats.watchlistAdded++;
      }
    }

    // 4. Stamps
    for (const item of p.stamps ?? []) {
      const movie = normalizeTitleIdentity(item);
      const reviewText = item.reviewText.trim();
      if (!movie || !reviewText || reviewText.length > STAMP_REVIEW_MAX) continue;
      const existing = await ctx.db.query("stamps")
        .withIndex("by_userId_movieId", q => q.eq("userId", internalId).eq("movieId", movie.movieId))
        .first();
      if (!existing) {
        await ctx.db.insert("stamps", {
          userId: internalId,
          ...movie,
          reviewText,
          isPublic: !!item.isPublic,
          isDraft: !!item.isDraft,
          createdAt: item.createdAt ?? Date.now(),
        });
        stats.stampsAdded++;
      }
    }

    // 5. Blocks (Playlists)
    let blockCount = (await ctx.db.query("blocks").withIndex("by_userId", q => q.eq("userId", internalId)).collect()).length;
    for (const item of p.blocks ?? []) {
      if (blockCount >= MAX_BLOCKS_PER_USER) break;
      const title = item.title.trim();
      const description = item.description?.trim() || undefined;
      if (!title || title.length > MAX_BLOCK_TITLE_LENGTH) continue;
      if (description && description.length > MAX_BLOCK_DESCRIPTION_LENGTH) continue;

      const movies = (item.movies ?? []).flatMap((entry) => {
        const movie = normalizeTitleIdentity(entry);
        return movie ? [{ ...movie, addedAt: entry.addedAt ?? Date.now() }] : [];
      }).slice(0, MAX_MOVIES_PER_BLOCK);

      await ctx.db.insert("blocks", {
        userId: internalId,
        title,
        description,
        isPublic: !!item.isPublic,
        movieCount: movies.length,
        movies,
        createdAt: item.createdAt ?? Date.now(),
        updatedAt: item.updatedAt ?? Date.now(),
      });
      blockCount++;
      stats.blocksAdded++;
    }

    // Update User Counts using standard query length for consistency
    const totalLiked = (await ctx.db.query("liked").withIndex("by_userId", q => q.eq("userId", internalId)).collect()).length;
    const totalWatched = (await ctx.db.query("watched").withIndex("by_userId", q => q.eq("userId", internalId)).collect()).length;
    const totalWatchlist = (await ctx.db.query("watchlist").withIndex("by_userId", q => q.eq("userId", internalId)).collect()).length;

    await ctx.db.patch(internalId, {
      likedCount: totalLiked,
      watchedCount: totalWatched,
      watchlistCount: totalWatchlist,
    });

    return stats;
  },
});
