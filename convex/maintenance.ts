import { internalMutation } from "./_generated/server";

const NEWS_RETENTION_DAYS = 7;
const THROTTLE_RETENTION_DAYS = 7;

export const purgeOldData = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const newsCutoff = now - NEWS_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    const throttleCutoff = now - THROTTLE_RETENTION_DAYS * 24 * 60 * 60 * 1000;

    const newsRows = await ctx.db.query("news_feed").collect();
    for (const row of newsRows) {
      if (row.createdAt < newsCutoff) {
        await ctx.db.delete(row._id);
      }
    }

    const throttles = await ctx.db.query("mutation_throttles").collect();
    for (const row of throttles) {
      if (row.lastAt < throttleCutoff) {
        await ctx.db.delete(row._id);
      }
    }
  },
});

export const recomputeUserCounts = internalMutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    for (const user of users) {
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
  },
});
