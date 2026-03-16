import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// ─── WATCHLIST ───

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
    if (existing) await ctx.db.delete(existing._id);
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

// ─── WATCHED ───

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
    if (existing) await ctx.db.delete(existing._id);
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

// ─── LIKED ───

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
    }
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
    if (existing) await ctx.db.delete(existing._id);
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
