import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";

const STAMP_REVIEW_MAX = 1000;
const STAMP_TITLE_MAX = 200;
const STAMP_POSTER_PATH_MAX = 2048;

function validateStampIdentity(movieId: number, movieTitle: string, posterPath: string) {
  if (!Number.isSafeInteger(movieId) || movieId <= 0) throw new ConvexError("Invalid movie ID");
  if (!movieTitle.trim() || movieTitle.trim().length > STAMP_TITLE_MAX) throw new ConvexError("Movie title must be between 1 and 200 characters");
  if (posterPath.length > STAMP_POSTER_PATH_MAX) throw new ConvexError("Poster path is too long");
}

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

    validateStampIdentity(args.movieId, args.movieTitle, args.posterPath);
    const trimmed = args.reviewText.trim();
    if (trimmed.length === 0) throw new ConvexError("Review text cannot be empty");
    if (trimmed.length > STAMP_REVIEW_MAX) throw new ConvexError(`Review text exceeds ${STAMP_REVIEW_MAX} characters`);

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

    validateStampIdentity(args.movieId, args.movieTitle, args.posterPath);
    const trimmed = args.reviewText.trim();
    if (trimmed.length > STAMP_REVIEW_MAX) throw new ConvexError(`Review text exceeds ${STAMP_REVIEW_MAX} characters`);

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

// Restore a stamp during the short undo window after deletion.
export const restoreStamp = mutation({
  args: {
    movieId: v.number(),
    mediaType: v.optional(v.union(v.literal("movie"), v.literal("tv"))),
    movieTitle: v.string(),
    posterPath: v.string(),
    reviewText: v.string(),
    isPublic: v.boolean(),
    isDraft: v.optional(v.boolean()),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    validateStampIdentity(args.movieId, args.movieTitle, args.posterPath);
    const now = Date.now();
    if (!Number.isSafeInteger(args.createdAt) || args.createdAt <= 0 || args.createdAt > now) {
      throw new ConvexError("Invalid stamp timestamp");
    }
    const trimmed = args.reviewText.trim();
    if (trimmed.length > STAMP_REVIEW_MAX) throw new ConvexError(`Review text exceeds ${STAMP_REVIEW_MAX} characters`);
    if (args.isDraft !== true && trimmed.length === 0) throw new ConvexError("Review text cannot be empty");

    const existing = await ctx.db
      .query("stamps")
      .withIndex("by_userId_movieId", (q) => q.eq("userId", userId).eq("movieId", args.movieId))
      .first();
    if (existing) return existing._id;

    return await ctx.db.insert("stamps", {
      userId,
      movieId: args.movieId,
      mediaType: args.mediaType,
      movieTitle: args.movieTitle,
      posterPath: args.posterPath,
      reviewText: trimmed,
      isPublic: args.isDraft === true ? false : args.isPublic,
      isDraft: args.isDraft,
      createdAt: args.createdAt,
    });
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
