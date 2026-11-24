import { action, internalAction, internalMutation, internalQuery, query, type ActionCtx } from "./_generated/server";
import { v, type Infer } from "convex/values";
import { internal } from "./_generated/api";

const REFRESH_COOLDOWN_MS = 10 * 60 * 1000;

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

export type NewsArticle = Infer<typeof articleValidator>;

function todayKey() {
  return new Date().toISOString().split("T")[0];
}

export const storeNewsFeed = internalMutation({
  args: { fetchedDate: v.string(), articles: v.array(articleValidator) },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("news_feed")
      .withIndex("by_fetchedDate", (q) => q.eq("fetchedDate", args.fetchedDate))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { articles: args.articles, createdAt: Date.now() });
    } else {
      await ctx.db.insert("news_feed", { fetchedDate: args.fetchedDate, articles: args.articles, createdAt: Date.now() });
    }
  },
});

export const feedCreatedAt = internalQuery({
  args: { fetchedDate: v.string() },
  handler: async (ctx, args) => {
    const feed = await ctx.db
      .query("news_feed")
      .withIndex("by_fetchedDate", (q) => q.eq("fetchedDate", args.fetchedDate))
      .first();
    return feed?.createdAt ?? null;
  },
});

// Articles only ever come from Convex fetching the public feeds itself, never from a browser.
async function fetchAndStoreToday(ctx: ActionCtx) {
  const articles = await ctx.runAction(internal.newsSources.fetchArticles, {});
  // An empty fetch keeps the last good feed instead of blanking the page.
  if (!articles.length) return;
  await ctx.runMutation(internal.news.storeNewsFeed, { fetchedDate: todayKey(), articles });
}

export const fetchAndStore = internalAction({
  handler: async (ctx) => {
    await fetchAndStoreToday(ctx);
  },
});

// Anyone viewing the news page may ask for fresh articles, at most once per cooldown.
export const refreshToday = action({
  args: {},
  handler: async (ctx) => {
    const createdAt = await ctx.runQuery(internal.news.feedCreatedAt, { fetchedDate: todayKey() });
    if (createdAt !== null && Date.now() - createdAt < REFRESH_COOLDOWN_MS) return;
    await fetchAndStoreToday(ctx);
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
