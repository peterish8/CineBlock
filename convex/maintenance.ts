import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

const NEWS_RETENTION_DAYS = 3;
const THROTTLE_RETENTION_DAYS = 1;
const BATCH_SIZE = 100;
const USER_BATCH_SIZE = 50;

export const purgeOldData = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const newsCutoff = now - NEWS_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    const throttleCutoff = now - THROTTLE_RETENTION_DAYS * 24 * 60 * 60 * 1000;

    // Only fetch expired news rows using the by_createdAt index
    const newsRows = await ctx.db
      .query("news_feed")
      .withIndex("by_createdAt", (q) => q.lt("createdAt", newsCutoff))
      .take(BATCH_SIZE);
    for (const row of newsRows) {
      await ctx.db.delete(row._id);
    }

    // Only fetch expired throttle rows using the by_lastAt index
    const throttles = await ctx.db
      .query("mutation_throttles")
      .withIndex("by_lastAt", (q) => q.lt("lastAt", throttleCutoff))
      .take(BATCH_SIZE);
    for (const row of throttles) {
      await ctx.db.delete(row._id);
    }
  },
});

export const recomputeUserCounts = internalMutation({
  args: { cursor: v.optional(v.string()) },
  handler: async (ctx, { cursor }) => {
    // Use paginate() so each cron invocation can be called with a stored cursor
    // and eventually cover all users — not just the first USER_BATCH_SIZE.
    const page = await ctx.db
      .query("users")
      .paginate({ numItems: USER_BATCH_SIZE, cursor: cursor ?? null });
    for (const user of page.page) {
      const [liked, watched, watchlist] = await Promise.all([
        ctx.db.query("liked").withIndex("by_userId", (q: any) => q.eq("userId", user._id)).collect(),
        ctx.db.query("watched").withIndex("by_userId", (q: any) => q.eq("userId", user._id)).collect(),
        ctx.db.query("watchlist").withIndex("by_userId", (q: any) => q.eq("userId", user._id)).collect(),
      ]);
      await ctx.db.patch(user._id, {
        likedCount: liked.length,
        watchedCount: watched.length,
        watchlistCount: watchlist.length,
      });
    }
    // Returns the continuation cursor so callers can page through all users if needed
    return { isDone: page.isDone, continueCursor: page.continueCursor };
  },
});
