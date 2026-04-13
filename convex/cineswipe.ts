import { mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// ─── Constants ────────────────────────────────────────────────────────────────

const DAILY_SWIPE_LIMIT = 250;
const SWIPE_MIN_INTERVAL_MS = 400; // rate-limit between swipes

// ─── Rate-limit helper (reuses same pattern as cineblocks.ts) ─────────────────

async function enforceSwipeRateLimit(
  ctx: any,
  userId: any,
  action: string,
  minIntervalMs: number
) {
  const now = Date.now();
  const row = await ctx.db
    .query("mutation_throttles")
    .withIndex("by_userId_action", (q: any) =>
      q.eq("userId", userId).eq("action", action)
    )
    .first();

  if (row && now - row.lastAt < minIntervalMs) {
    throw new ConvexError("You're swiping too fast. Slow down a moment.");
  }

  if (row) {
    await ctx.db.patch(row._id, { lastAt: now });
  } else {
    await ctx.db.insert("mutation_throttles", { userId, action, lastAt: now });
  }
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Returns today's swipe count and all previously swiped movie IDs for
 * the current user. The frontend uses swipedMovieIds as a Set to filter
 * out already-seen movies from TMDB batches.
 */
export const getSwipeState = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { todayCount: 0, swipedMovieIds: [], limit: DAILY_SWIPE_LIMIT };

    const today = new Date().toISOString().split("T")[0];

    // Get today's counter
    const dailyRow = await ctx.db
      .query("swipe_daily")
      .withIndex("by_userId_date", (q) =>
        q.eq("userId", userId).eq("date", today)
      )
      .first();

    // Get all swiped movie IDs to prevent duplicates
    const swipeHistory = await ctx.db
      .query("swipe_history")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    return {
      todayCount: dailyRow?.count ?? 0,
      swipedMovieIds: swipeHistory.map((s) => s.movieId),
      limit: DAILY_SWIPE_LIMIT,
    };
  },
});

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Records a swipe action. This is called in addition to the list-specific
 * mutations (addToLiked, addToWatchlist, etc.) — it handles:
 * 1. Daily limit enforcement (server-side, cannot be bypassed)
 * 2. Swipe history tracking (prevents showing the same movie again)
 * 3. Rate limiting (prevents spam-swiping)
 */
export const recordSwipe = mutation({
  args: {
    movieId: v.number(),
    action: v.union(
      v.literal("liked"),
      v.literal("watchlist"),
      v.literal("watched"),
      v.literal("block"),
      v.literal("skip")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    // Rate limit
    await enforceSwipeRateLimit(ctx, userId, "cineswipe", SWIPE_MIN_INTERVAL_MS);

    const today = new Date().toISOString().split("T")[0];

    // 1. Check daily limit
    const dailyRow = await ctx.db
      .query("swipe_daily")
      .withIndex("by_userId_date", (q) =>
        q.eq("userId", userId).eq("date", today)
      )
      .first();

    const currentCount = dailyRow?.count ?? 0;
    if (currentCount >= DAILY_SWIPE_LIMIT) {
      throw new ConvexError("Daily swipe limit reached. Come back tomorrow! 🍿");
    }

    // 2. Idempotency check — don't record the same movie twice
    const existing = await ctx.db
      .query("swipe_history")
      .withIndex("by_userId_movieId", (q) =>
        q.eq("userId", userId).eq("movieId", args.movieId)
      )
      .first();

    if (existing) return { todayCount: currentCount };

    // 3. Record the swipe
    await ctx.db.insert("swipe_history", {
      userId,
      movieId: args.movieId,
      action: args.action,
      swipedAt: Date.now(),
    });

    // 4. Upsert daily counter
    if (dailyRow) {
      await ctx.db.patch(dailyRow._id, { count: currentCount + 1 });
    } else {
      await ctx.db.insert("swipe_daily", {
        userId,
        date: today,
        count: 1,
      });
    }

    return { todayCount: currentCount + 1 };
  },
});

export const recordSwipeBatch = mutation({
  args: {
    swipes: v.array(
      v.object({
        movieId: v.number(),
        movieTitle: v.string(),
        posterPath: v.string(),
        genreIds: v.optional(v.array(v.number())),
        action: v.union(
          v.literal("liked"),
          v.literal("watchlist"),
          v.literal("watched"),
          v.literal("block"),
          v.literal("skip")
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    const today = new Date().toISOString().split("T")[0];

    // 1. Check daily limit loosely
    const dailyRow = await ctx.db
      .query("swipe_daily")
      .withIndex("by_userId_date", (q) =>
        q.eq("userId", userId).eq("date", today)
      )
      .first();

    const currentCount = dailyRow?.count ?? 0;
    const processableCount = Math.min(args.swipes.length, DAILY_SWIPE_LIMIT - currentCount);
    
    if (processableCount <= 0) {
      throw new ConvexError("Daily swipe limit reached. Come back tomorrow! 🍿");
    }

    const swipesToProcess = args.swipes.slice(0, processableCount);

    let addedLiked = 0;
    let addedWatched = 0;
    let addedWatchlist = 0;

    for (const swipe of swipesToProcess) {
      const existingHistory = await ctx.db
        .query("swipe_history")
        .withIndex("by_userId_movieId", (q) =>
          q.eq("userId", userId).eq("movieId", swipe.movieId)
        )
        .first();

      if (existingHistory) continue;

      await ctx.db.insert("swipe_history", {
        userId,
        movieId: swipe.movieId,
        action: swipe.action,
        swipedAt: Date.now(),
      });

      if (swipe.action === "liked") {
        const existingLiked = await ctx.db.query("liked").withIndex("by_userId_movieId", q => q.eq("userId", userId).eq("movieId", swipe.movieId)).first();
        if (!existingLiked) {
          await ctx.db.insert("liked", { userId, movieId: swipe.movieId, movieTitle: swipe.movieTitle, posterPath: swipe.posterPath, genreIds: swipe.genreIds, likedAt: Date.now() });
          addedLiked++;
          
          const existingWatched = await ctx.db.query("watched").withIndex("by_userId_movieId", q => q.eq("userId", userId).eq("movieId", swipe.movieId)).first();
          if (!existingWatched) {
             await ctx.db.insert("watched", { userId, movieId: swipe.movieId, movieTitle: swipe.movieTitle, posterPath: swipe.posterPath, genreIds: swipe.genreIds, watchedAt: Date.now() });
             addedWatched++;
          }
        }
      } else if (swipe.action === "watchlist") {
        const existingWatchlist = await ctx.db.query("watchlist").withIndex("by_userId_movieId", q => q.eq("userId", userId).eq("movieId", swipe.movieId)).first();
        if (!existingWatchlist) {
          await ctx.db.insert("watchlist", { userId, movieId: swipe.movieId, movieTitle: swipe.movieTitle, posterPath: swipe.posterPath, genreIds: swipe.genreIds, addedAt: Date.now() });
          addedWatchlist++;
        }
      } else if (swipe.action === "watched") {
        const existingWatched = await ctx.db.query("watched").withIndex("by_userId_movieId", q => q.eq("userId", userId).eq("movieId", swipe.movieId)).first();
        if (!existingWatched) {
          await ctx.db.insert("watched", { userId, movieId: swipe.movieId, movieTitle: swipe.movieTitle, posterPath: swipe.posterPath, genreIds: swipe.genreIds, watchedAt: Date.now() });
          addedWatched++;
        }
      }
    }

    if (dailyRow) {
      await ctx.db.patch(dailyRow._id, { count: currentCount + swipesToProcess.length });
    } else {
      await ctx.db.insert("swipe_daily", {
        userId,
        date: today,
        count: swipesToProcess.length,
      });
    }

    // Sync counters
    const user = await ctx.db.get(userId);
    if (user && (addedLiked > 0 || addedWatched > 0 || addedWatchlist > 0)) {
      // Basic initialization if missing
      const baseLiked = user.likedCount !== undefined ? user.likedCount : (await ctx.db.query("liked").withIndex("by_userId", q => q.eq("userId", userId)).collect()).length - addedLiked;
      const baseWatched = user.watchedCount !== undefined ? user.watchedCount : (await ctx.db.query("watched").withIndex("by_userId", q => q.eq("userId", userId)).collect()).length - addedWatched;
      const baseWatchlist = user.watchlistCount !== undefined ? user.watchlistCount : (await ctx.db.query("watchlist").withIndex("by_userId", q => q.eq("userId", userId)).collect()).length - addedWatchlist;

      await ctx.db.patch(userId, {
        likedCount: baseLiked + addedLiked,
        watchedCount: baseWatched + addedWatched,
        watchlistCount: baseWatchlist + addedWatchlist,
      });
    }

    return { todayCount: currentCount + swipesToProcess.length };
  },
});
