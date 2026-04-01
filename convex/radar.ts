import { query, mutation, action, internalMutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api, internal } from "./_generated/api";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export const purgeExpiredRadarItems = internalMutation({
  args: {},
  handler: async (ctx) => {
    const today = new Date().toISOString().split("T")[0];
    const items = await ctx.db
      .query("radar")
      .withIndex("by_releaseDate", (q) => q.lt("releaseDate", today))
      .collect();

    console.log(`[Radar Janitor] Purging ${items.length} expired movies...`);
    for (const item of items) {
      await ctx.db.delete(item._id);
    }
    return { purged: items.length };
  },
});

export const clearUserRadar = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    const items = await ctx.db
      .query("radar")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    for (const item of items) {
      await ctx.db.delete(item._id);
    }
  },
});

export const getUserRadar = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("radar")
      .withIndex("by_userId_releaseDate", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const updateRadarItems = mutation({
  args: {
    movies: v.array(
      v.object({
        tmdbId: v.number(),
        title: v.string(),
        releaseDate: v.string(),
        posterPath: v.string(),
        genreIds: v.array(v.number()),
        overview: v.string(),
        voteAverage: v.number(),
        popularity: v.number(),
      })
    ),
    syncedLanguage: v.optional(v.string()),
  },
  handler: async (ctx, { movies, syncedLanguage }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    const today = new Date().toISOString().split("T")[0];

    // 1. Delete Expired Items
    const expired = await ctx.db
      .query("radar")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    for (const item of expired) {
      if (item.releaseDate < today) {
        await ctx.db.delete(item._id);
      }
    }

    // 2. Upsert New Items (Deduplicated)
    const now = Date.now();
    for (const movie of movies) {
      // HARD GUARD: Skip any movie released before 2024 (Classics/Re-releases)
      if (movie.releaseDate < "2024-01-01") continue;

      const existing = await ctx.db
        .query("radar")
        .withIndex("by_userId_tmdbId", (q) => 
          q.eq("userId", userId).eq("tmdbId", movie.tmdbId)
        )
        .unique();

      if (existing) {
        // Update if already exists (to refresh metadata/dates)
        await ctx.db.patch(existing._id, {
          ...movie,
          addedAt: now,
        });
      } else {
        // Create new
        await ctx.db.insert("radar", {
          userId,
          ...movie,
          addedAt: now,
        });
      }
    }

    // 3. Update Sync Metadata
    await ctx.db.patch(userId, { 
      lastRadarSync: now,
      lastRadarSyncLanguage: syncedLanguage
    });

    return { success: true, count: movies.length };
  },
});

export const syncRadar = action({
  args: {
    genreIds: v.array(v.number()),
    region: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) throw new ConvexError("TMDB_API_KEY is not configured");

    try {
      const region = args.region || "IN";
      const today = new Date().toISOString().split("T")[0];
      const sixMonths = new Date();
      sixMonths.setMonth(sixMonths.getMonth() + 6);
      const sixMonthsStr = sixMonths.toISOString().split("T")[0];
      const headers = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };

      // Use /discover/movie with a 6-month window — much broader than /movie/upcoming (~2 weeks only)
      const fetchPage = async (page: number) => {
        const url = new URL(`${TMDB_BASE_URL}/discover/movie`);
        url.searchParams.set("region", region);
        url.searchParams.set("primary_release_date.gte", today);
        url.searchParams.set("primary_release_date.lte", sixMonthsStr);
        url.searchParams.set("sort_by", "popularity.desc");
        url.searchParams.set("include_adult", "false");
        url.searchParams.set("page", page.toString());
        const res = await fetch(url.toString(), { headers });
        const data = await res.json();
        return (data.results || []) as any[];
      };

      const fetchGenrePage = async () => {
        if (args.genreIds.length === 0) return [];
        const url = new URL(`${TMDB_BASE_URL}/discover/movie`);
        url.searchParams.set("region", region);
        url.searchParams.set("with_genres", args.genreIds.join(","));
        url.searchParams.set("primary_release_date.gte", today);
        url.searchParams.set("primary_release_date.lte", sixMonthsStr);
        url.searchParams.set("sort_by", "popularity.desc");
        url.searchParams.set("include_adult", "false");
        const res = await fetch(url.toString(), { headers });
        const data = await res.json();
        return (data.results || []) as any[];
      };

      const [page1, page2, genreMovies] = await Promise.all([
        fetchPage(1),
        fetchPage(2),
        fetchGenrePage(),
      ]);

      // Genre matches go first so they appear prioritized in dedup
      const allMovies = [...genreMovies, ...page1, ...page2];

      // 3. Deduplicate, filter past releases, normalize
      const movieMap = new Map<number, any>();
      for (const m of allMovies) {
        if (!m.release_date || m.release_date < today) continue;
        if (movieMap.has(m.id)) continue;
        movieMap.set(m.id, {
          tmdbId: m.id,
          title: m.title || "Untitled",
          releaseDate: m.release_date,
          posterPath: m.poster_path || "",
          genreIds: m.genre_ids || [],
          overview: m.overview || "",
          voteAverage: m.vote_average || 0,
          popularity: m.popularity || 0,
        });
      }

      const finalMovies = Array.from(movieMap.values())
        .sort((a, b) => a.releaseDate.localeCompare(b.releaseDate))
        .slice(0, 60);

      console.log(`Radar sync [region=${region}]: ${finalMovies.length} movies`);

      await ctx.runMutation(api.radar.updateRadarItems, {
        movies: finalMovies,
        syncedLanguage: region, // reusing field to store region
      });

      return { success: true, count: finalMovies.length };
    } catch (error) {
      console.error("Radar Sync Error:", error);
      return { success: false, error: "Failed to sync with TMDB" };
    }
  },
});
