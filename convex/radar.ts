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
    language: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) throw new ConvexError("TMDB_API_KEY is not configured");

    try {
      const today = new Date().toISOString().split("T")[0];
      const sixMonthsFromNow = new Date();
      sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
      const sixMonthsStr = sixMonthsFromNow.toISOString().split("T")[0];

      // Build TMDB Query Params
      const baseParams = {
        include_adult: "false",
        "primary_release_date.gte": today, // Use primary for true 'newness'
        "primary_release_date.lte": sixMonthsStr,
        sort_by: "popularity.desc",
      };

      const langPipe = args.language ? args.language.replace(/,/g, "|") : "";

      // 1. Fetch Language-Specific (WIDE SEARCH - 2 Pages)
      let languageMovies: any[] = [];
      if (langPipe) {
        const fetchLangPage = async (page: number) => {
          const langUrl = new URL(`${TMDB_BASE_URL}/discover/movie`);
          Object.entries(baseParams).forEach(([k, v]) => langUrl.searchParams.set(k, v));
          langUrl.searchParams.set("with_original_language", langPipe);
          langUrl.searchParams.set("page", page.toString());
          
          const res = await fetch(langUrl.toString(), {
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }
          });
          const data = await res.json();
          return data.results || [];
        };

        const [p1, p2] = await Promise.all([fetchLangPage(1), fetchLangPage(2)]);
        languageMovies = [...p1, ...p2];
      }

      // 2. Fetch Regional Trends (India Specific)
      const globalUrl = new URL(`${TMDB_BASE_URL}/discover/movie`);
      Object.entries(baseParams).forEach(([k, v]) => globalUrl.searchParams.set(k, v));
      globalUrl.searchParams.set("region", "IN");
      globalUrl.searchParams.set("with_release_type", "2|3"); // Standard theatrical for global hits
      
      const globalRes = await fetch(globalUrl.toString(), {
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }
      });
      const globalData = await globalRes.json();
      const globalMovies = globalData.results || [];

      // 3. Fetch Personalized Genre Matches
      let genreMovies: any[] = [];
      if (args.genreIds.length > 0) {
        const genreUrl = new URL(`${TMDB_BASE_URL}/discover/movie`);
        Object.entries(baseParams).forEach(([k, v]) => genreUrl.searchParams.set(k, v));
        genreUrl.searchParams.set("with_genres", args.genreIds.join(","));
        genreUrl.searchParams.set("region", "IN");
        genreUrl.searchParams.set("vote_count.gte", "0");

        const genreRes = await fetch(genreUrl.toString(), {
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }
        });
        const genreData = await genreRes.json();
        genreMovies = genreData.results || [];
      }

      // 4. Merge and Normalize
      const movieMap = new Map<number, any>();
      // Combined list, prioritizes earlier indices for mapping
      [...languageMovies, ...genreMovies, ...globalMovies].forEach(m => {
        // STRICT FILTER: Exclude any movie without a valid future release date
        if (!m.release_date || m.release_date < today) return;

        if (!movieMap.has(m.id)) {
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
      });

      // 5. Final Sort & Trim
      const finalMovies = Array.from(movieMap.values())
        .sort((a, b) => a.releaseDate.localeCompare(b.releaseDate)) // Earliest first
        .slice(0, 50);

      console.log(`Syncing Radar:
        Language: ${args.language}
        Items Found: ${finalMovies.length}
        Movies: ${finalMovies.slice(0, 3).map(m => m.title).join(", ")}
      `);

      // 4. Update Convex Database with tracking metadata
      await ctx.runMutation(api.radar.updateRadarItems, { 
        movies: finalMovies,
        syncedLanguage: args.language 
      });

      return { success: true, count: finalMovies.length };
    } catch (error) {
      console.error("Radar Sync Error:", error);
      return { success: false, error: "Failed to sync with TMDB" };
    }
  },
});
