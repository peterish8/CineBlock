import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

async function ensureUserCounts(ctx: any, userId: any) {
  const user = await ctx.db.get(userId);
  const likedCount = user?.likedCount;
  const watchedCount = user?.watchedCount;
  const watchlistCount = user?.watchlistCount;

  if (
    likedCount !== undefined &&
    watchedCount !== undefined &&
    watchlistCount !== undefined
  ) {
    return { likedCount, watchedCount, watchlistCount };
  }

  const [liked, watched, watchlist] = await Promise.all([
    ctx.db.query("liked").withIndex("by_userId", (q: any) => q.eq("userId", userId)).collect(),
    ctx.db.query("watched").withIndex("by_userId", (q: any) => q.eq("userId", userId)).collect(),
    ctx.db.query("watchlist").withIndex("by_userId", (q: any) => q.eq("userId", userId)).collect(),
  ]);

  const counts = {
    likedCount: liked.length,
    watchedCount: watched.length,
    watchlistCount: watchlist.length,
  };

  await ctx.db.patch(userId, counts);
  return counts;
}

// WATCHLIST

export const addToWatchlist = mutation({
  args: {
    movieId: v.number(),
    movieTitle: v.string(),
    posterPath: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const existing = await ctx.db
      .query("watchlist")
      .withIndex("by_userId_movieId", (q) =>
        q.eq("userId", userId).eq("movieId", args.movieId)
      )
      .first();
    if (existing) return;
    await ctx.db.insert("watchlist", {
      userId,
      movieId: args.movieId,
      movieTitle: args.movieTitle,
      posterPath: args.posterPath,
      addedAt: Date.now(),
    });
    const counts = await ensureUserCounts(ctx, userId);
    await ctx.db.patch(userId, {
      watchlistCount: counts.watchlistCount + 1,
    });
  },
});

export const removeFromWatchlist = mutation({
  args: { movieId: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const existing = await ctx.db
      .query("watchlist")
      .withIndex("by_userId_movieId", (q) =>
        q.eq("userId", userId).eq("movieId", args.movieId)
      )
      .first();
    if (existing) {
      await ctx.db.delete(existing._id);
      const counts = await ensureUserCounts(ctx, userId);
      await ctx.db.patch(userId, {
        watchlistCount: Math.max(0, counts.watchlistCount - 1),
      });
    }
  },
});

export const getWatchlist = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const items = await ctx.db
      .query("watchlist")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    return items.sort((a, b) => b.addedAt - a.addedAt);
  },
});

export const isInWatchlist = query({
  args: { movieId: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;
    const existing = await ctx.db
      .query("watchlist")
      .withIndex("by_userId_movieId", (q) =>
        q.eq("userId", userId).eq("movieId", args.movieId)
      )
      .first();
    return !!existing;
  },
});

// WATCHED

export const addToWatched = mutation({
  args: {
    movieId: v.number(),
    movieTitle: v.string(),
    posterPath: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const existing = await ctx.db
      .query("watched")
      .withIndex("by_userId_movieId", (q) =>
        q.eq("userId", userId).eq("movieId", args.movieId)
      )
      .first();
    if (existing) return;
    await ctx.db.insert("watched", {
      userId,
      movieId: args.movieId,
      movieTitle: args.movieTitle,
      posterPath: args.posterPath,
      watchedAt: Date.now(),
    });
    const counts = await ensureUserCounts(ctx, userId);
    await ctx.db.patch(userId, {
      watchedCount: counts.watchedCount + 1,
    });
  },
});

export const removeFromWatched = mutation({
  args: { movieId: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const existing = await ctx.db
      .query("watched")
      .withIndex("by_userId_movieId", (q) =>
        q.eq("userId", userId).eq("movieId", args.movieId)
      )
      .first();
    if (existing) {
      await ctx.db.delete(existing._id);
      const counts = await ensureUserCounts(ctx, userId);
      await ctx.db.patch(userId, {
        watchedCount: Math.max(0, counts.watchedCount - 1),
      });
    }
  },
});

export const getWatched = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const items = await ctx.db
      .query("watched")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    return items.sort((a, b) => b.watchedAt - a.watchedAt);
  },
});

export const isWatched = query({
  args: { movieId: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;
    const existing = await ctx.db
      .query("watched")
      .withIndex("by_userId_movieId", (q) =>
        q.eq("userId", userId).eq("movieId", args.movieId)
      )
      .first();
    return !!existing;
  },
});

// LIKED

export const addToLiked = mutation({
  args: {
    movieId: v.number(),
    movieTitle: v.string(),
    posterPath: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const existing = await ctx.db
      .query("liked")
      .withIndex("by_userId_movieId", (q) =>
        q.eq("userId", userId).eq("movieId", args.movieId)
      )
      .first();
    if (existing) return;
    await ctx.db.insert("liked", {
      userId,
      movieId: args.movieId,
      movieTitle: args.movieTitle,
      posterPath: args.posterPath,
      likedAt: Date.now(),
    });
    const counts = await ensureUserCounts(ctx, userId);
    let watchedCount = counts.watchedCount;
    // Auto-add to watched when liking
    const alreadyWatched = await ctx.db
      .query("watched")
      .withIndex("by_userId_movieId", (q) =>
        q.eq("userId", userId).eq("movieId", args.movieId)
      )
      .first();
    if (!alreadyWatched) {
      await ctx.db.insert("watched", {
        userId,
        movieId: args.movieId,
        movieTitle: args.movieTitle,
        posterPath: args.posterPath,
        watchedAt: Date.now(),
      });
      watchedCount += 1;
    }
    await ctx.db.patch(userId, {
      likedCount: counts.likedCount + 1,
      watchedCount,
    });
  },
});

export const removeFromLiked = mutation({
  args: { movieId: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const existing = await ctx.db
      .query("liked")
      .withIndex("by_userId_movieId", (q) =>
        q.eq("userId", userId).eq("movieId", args.movieId)
      )
      .first();
    if (existing) {
      await ctx.db.delete(existing._id);
      const counts = await ensureUserCounts(ctx, userId);
      await ctx.db.patch(userId, {
        likedCount: Math.max(0, counts.likedCount - 1),
      });
    }
  },
});

export const getLiked = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const items = await ctx.db
      .query("liked")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    return items.sort((a, b) => b.likedAt - a.likedAt);
  },
});

export const isLiked = query({
  args: { movieId: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;
    const existing = await ctx.db
      .query("liked")
      .withIndex("by_userId_movieId", (q) =>
        q.eq("userId", userId).eq("movieId", args.movieId)
      )
      .first();
    return !!existing;
  },
});