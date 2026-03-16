import { query, mutation, action, internalMutation, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const storeNewsFeed = internalMutation({
  args: {
    fetchedDate: v.string(),
    articles: v.array(
      v.object({
        id: v.string(),
        title: v.string(),
        description: v.string(),
        url: v.string(),
        source: v.string(),
        type: v.union(v.literal("rss"), v.literal("reddit")),
        publishedAt: v.string(),
        thumbnail: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("news_feed")
      .withIndex("by_fetchedDate", (q) => q.eq("fetchedDate", args.fetchedDate))
      .first();
    if (existing) return;
    await ctx.db.insert("news_feed", {
      fetchedDate: args.fetchedDate,
      articles: args.articles,
      createdAt: Date.now(),
    });
  },
});

// Public mutation so the client can cache today's articles after fetching them directly
const articleValidator = v.object({
  id: v.string(),
  title: v.string(),
  description: v.string(),
  url: v.string(),
  source: v.string(),
  type: v.union(v.literal("rss"), v.literal("reddit")),
  publishedAt: v.string(),
  thumbnail: v.optional(v.string()),
});

export const storeToday = mutation({
  args: { articles: v.array(articleValidator) },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split("T")[0];
    const existing = await ctx.db
      .query("news_feed")
      .withIndex("by_fetchedDate", (q) => q.eq("fetchedDate", today))
      .first();
    if (existing) return;
    await ctx.db.insert("news_feed", {
      fetchedDate: today,
      articles: args.articles,
      createdAt: Date.now(),
    });
  },
});

// Deletes today's cache so the next load fetches fresh articles
export const invalidateToday = mutation({
  handler: async (ctx) => {
    const today = new Date().toISOString().split("T")[0];
    const existing = await ctx.db
      .query("news_feed")
      .withIndex("by_fetchedDate", (q) => q.eq("fetchedDate", today))
      .first();
    if (existing) await ctx.db.delete(existing._id);
  },
});

export const fetchAndStore = internalAction({
  handler: async (ctx) => {
    const today = new Date().toISOString().split("T")[0];
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      console.error("NEXT_PUBLIC_APP_URL not set");
      return;
    }
    try {
      const res = await fetch(`${appUrl}/api/internal/fetch-news`);
      if (!res.ok) {
        console.error("News fetch failed:", res.status);
        return;
      }
      const data = await res.json();
      await ctx.runMutation(internal.news.storeNewsFeed, {
        fetchedDate: today,
        articles: data.articles,
      });
    } catch (e) {
      console.error("News fetch error:", e);
    }
  },
});

export const triggerFetch = action({
  handler: async (ctx) => {
    await ctx.runAction(internal.news.fetchAndStore, {});
  },
});

export const getNewsFeed = query({
  args: { fetchedDate: v.string() },
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query("news_feed")
      .withIndex("by_fetchedDate", (q) => q.eq("fetchedDate", args.fetchedDate))
      .first();
    return result?.articles ?? null;
  },
});
