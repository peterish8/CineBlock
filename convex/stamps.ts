import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";

// Publish a stamp. If a draft exists for this movie, it becomes the published stamp.
// Stamp date (createdAt) is set at publish time, not draft time.
export const createStamp = mutation({
  args: {
    movieId: v.number(),
    movieTitle: v.string(),
    posterPath: v.string(),
    reviewText: v.string(),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    const trimmed = args.reviewText.trim();
    if (trimmed.length === 0) throw new ConvexError("Review text cannot be empty");
    if (trimmed.length > 280) throw new ConvexError("Review text exceeds 280 characters");

    const existing = await ctx.db
      .query("stamps")
      .withIndex("by_userId_movieId", (q) =>
        q.eq("userId", userId).eq("movieId", args.movieId)
      )
      .first();

    if (existing) {
      if (!existing.isDraft) throw new ConvexError("You already stamped this film");
      // Draft → publish: set stamp date now
      await ctx.db.patch(existing._id, {
        reviewText: trimmed,
        isPublic: args.isPublic,
        isDraft: false,
        createdAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("stamps", {
      userId,
      movieId: args.movieId,
      movieTitle: args.movieTitle,
      posterPath: args.posterPath,
      reviewText: trimmed,
      isPublic: args.isPublic,
      isDraft: false,
      createdAt: Date.now(),
    });
  },
});

// Save or update a draft. Drafts are always private.
export const saveDraft = mutation({
  args: {
    movieId: v.number(),
    movieTitle: v.string(),
    posterPath: v.string(),
    reviewText: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    const trimmed = args.reviewText.trim();
    if (trimmed.length > 280) throw new ConvexError("Review text exceeds 280 characters");

    const existing = await ctx.db
      .query("stamps")
      .withIndex("by_userId_movieId", (q) =>
        q.eq("userId", userId).eq("movieId", args.movieId)
      )
      .first();

    if (existing) {
      if (!existing.isDraft) throw new ConvexError("Already published — delete and re-stamp to change");
      await ctx.db.patch(existing._id, { reviewText: trimmed });
      return existing._id;
    }

    return await ctx.db.insert("stamps", {
      userId,
      movieId: args.movieId,
      movieTitle: args.movieTitle,
      posterPath: args.posterPath,
      reviewText: trimmed,
      isPublic: false,
      isDraft: true,
      createdAt: Date.now(),
    });
  },
});

export const deleteStamp = mutation({
  args: { stampId: v.id("stamps") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    const stamp = await ctx.db.get(args.stampId);
    if (!stamp) throw new ConvexError("Stamp not found");
    if (stamp.userId !== userId) throw new ConvexError("Not authorized");

    await ctx.db.delete(args.stampId);
  },
});

export const setStampVisibility = mutation({
  args: { stampId: v.id("stamps"), isPublic: v.boolean() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    const stamp = await ctx.db.get(args.stampId);
    if (!stamp) throw new ConvexError("Stamp not found");
    if (stamp.userId !== userId) throw new ConvexError("Not authorized");
    if (stamp.isDraft) throw new ConvexError("Cannot change visibility of a draft");

    await ctx.db.patch(args.stampId, { isPublic: args.isPublic });
  },
});

export const getMyStamps = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("stamps")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const getPublicStampsByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // by_userId_isPublic index: isPublic=true means published (drafts are always isPublic=false)
    return await ctx.db
      .query("stamps")
      .withIndex("by_userId_isPublic", (q) =>
        q.eq("userId", args.userId).eq("isPublic", true)
      )
      .order("desc")
      .collect();
  },
});

export const getCreatorStampsForBlock = query({
  args: {
    creatorUserId: v.id("users"),
    movieIds: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.movieIds.length === 0) return [];

    const movieIdSet = new Set(args.movieIds);

    const allPublicStamps = await ctx.db
      .query("stamps")
      .withIndex("by_userId_isPublic", (q) =>
        q.eq("userId", args.creatorUserId).eq("isPublic", true)
      )
      .collect();

    return allPublicStamps
      .filter((s) => movieIdSet.has(s.movieId))
      .map((s) => ({ movieId: s.movieId, reviewText: s.reviewText }));
  },
});

export const getMyStampForMovie = query({
  args: { movieId: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    return await ctx.db
      .query("stamps")
      .withIndex("by_userId_movieId", (q) =>
        q.eq("userId", userId).eq("movieId", args.movieId)
      )
      .first();
  },
});
