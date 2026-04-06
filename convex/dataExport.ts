import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Export Query
export const exportUserData = query({
  args: {
    options: v.object({
      watched: v.boolean(),
      liked: v.boolean(),
      watchlist: v.boolean(),
      blocks: v.boolean(),
      stamps: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    const internalId = await getAuthUserId(ctx);
    if (!internalId) throw new Error("Unauthorized");

    const data: any = {
      version: 1,
      timestamp: Date.now(),
    };

    if (args.options.watched) {
      const w = await ctx.db.query("watched").withIndex("by_userId", q => q.eq("userId", internalId)).collect();
      data.watched = w.map(({ movieId, movieTitle, posterPath, genreIds, watchedAt }) => ({ movieId, movieTitle, posterPath, ...(genreIds !== undefined ? { genreIds } : {}), watchedAt }));
    }

    if (args.options.liked) {
      const l = await ctx.db.query("liked").withIndex("by_userId", q => q.eq("userId", internalId)).collect();
      data.liked = l.map(({ movieId, movieTitle, posterPath, genreIds, likedAt }) => ({ movieId, movieTitle, posterPath, ...(genreIds !== undefined ? { genreIds } : {}), likedAt }));
    }

    if (args.options.watchlist) {
      const w = await ctx.db.query("watchlist").withIndex("by_userId", q => q.eq("userId", internalId)).collect();
      data.watchlist = w.map(({ movieId, movieTitle, posterPath, genreIds, addedAt }) => ({ movieId, movieTitle, posterPath, ...(genreIds !== undefined ? { genreIds } : {}), addedAt }));
    }

    if (args.options.blocks) {
      const b = await ctx.db.query("blocks").withIndex("by_userId", q => q.eq("userId", internalId)).collect();
      data.blocks = b.map(({ title, description, isPublic, movieCount, movies, createdAt, updatedAt }) => ({ title, isPublic, createdAt, updatedAt, ...(description !== undefined ? { description } : {}), ...(movieCount !== undefined ? { movieCount } : {}), ...(movies !== undefined ? { movies } : {}) }));
    }

    if (args.options.stamps) {
      const s = await ctx.db.query("stamps").withIndex("by_userId", q => q.eq("userId", internalId)).collect();
      data.stamps = s.map(({ movieId, movieTitle, posterPath, reviewText, isPublic, isDraft, createdAt }) => ({ movieId, movieTitle, posterPath, reviewText, isPublic, createdAt, ...(isDraft !== undefined ? { isDraft } : {}) }));
    }

    return data;
  },
});

// Import Mutation
export const importUserData = mutation({
  args: {
    payload: v.any(), // Expect parsed JSON object
  },
  handler: async (ctx, args) => {
    const internalId = await getAuthUserId(ctx);
    if (!internalId) throw new Error("Unauthorized");

    const p = args.payload;
    if (!p || typeof p !== "object") throw new Error("Invalid payload");
    
    let stats = {
      watchedAdded: 0,
      likedAdded: 0,
      watchlistAdded: 0,
      blocksAdded: 0,
      stampsAdded: 0,
    };

    // 1. Watched Movies
    if (Array.isArray(p.watched)) {
      for (const item of p.watched) {
        if (!item.movieId || !item.movieTitle) continue;
        const existing = await ctx.db.query("watched")
          .withIndex("by_userId_movieId", q => q.eq("userId", internalId).eq("movieId", item.movieId))
          .first();
        if (!existing) {
          await ctx.db.insert("watched", {
            userId: internalId,
            movieId: item.movieId,
            movieTitle: item.movieTitle,
            posterPath: item.posterPath || "",
            genreIds: item.genreIds, 
            watchedAt: typeof item.watchedAt === "number" ? item.watchedAt : Date.now(),
          });
          stats.watchedAdded++;
        }
      }
    }

    // 2. Liked Movies
    if (Array.isArray(p.liked)) {
      for (const item of p.liked) {
        if (!item.movieId || !item.movieTitle) continue;
        const existing = await ctx.db.query("liked")
          .withIndex("by_userId_movieId", q => q.eq("userId", internalId).eq("movieId", item.movieId))
          .first();
        if (!existing) {
          await ctx.db.insert("liked", {
            userId: internalId,
            movieId: item.movieId,
            movieTitle: item.movieTitle,
            posterPath: item.posterPath || "",
            genreIds: item.genreIds, 
            likedAt: typeof item.likedAt === "number" ? item.likedAt : Date.now(),
          });
          stats.likedAdded++;
        }
      }
    }

    // 3. Watchlist
    if (Array.isArray(p.watchlist)) {
      for (const item of p.watchlist) {
        if (!item.movieId || !item.movieTitle) continue;
        const existing = await ctx.db.query("watchlist")
          .withIndex("by_userId_movieId", q => q.eq("userId", internalId).eq("movieId", item.movieId))
          .first();
        if (!existing) {
          await ctx.db.insert("watchlist", {
            userId: internalId,
            movieId: item.movieId,
            movieTitle: item.movieTitle,
            posterPath: item.posterPath || "",
            genreIds: item.genreIds, 
            addedAt: typeof item.addedAt === "number" ? item.addedAt : Date.now(),
          });
          stats.watchlistAdded++;
        }
      }
    }

    // 4. Stamps
    if (Array.isArray(p.stamps)) {
      for (const item of p.stamps) {
        if (!item.movieId || !item.movieTitle || !item.reviewText) continue;
        const existing = await ctx.db.query("stamps")
          .withIndex("by_userId_movieId", q => q.eq("userId", internalId).eq("movieId", item.movieId))
          .first();
        if (!existing) {
          await ctx.db.insert("stamps", {
            userId: internalId,
            movieId: item.movieId,
            movieTitle: item.movieTitle,
            posterPath: item.posterPath || "",
            reviewText: item.reviewText,
            isPublic: !!item.isPublic,
            isDraft: !!item.isDraft,
            createdAt: typeof item.createdAt === "number" ? item.createdAt : Date.now(),
          });
          stats.stampsAdded++;
        }
      }
    }

    // 5. Blocks (Playlists)
    if (Array.isArray(p.blocks)) {
      for (const item of p.blocks) {
        if (!item.title) continue;
        // Always insert block to avoid confusing merges of different playlists with same names.
        await ctx.db.insert("blocks", {
          userId: internalId,
          title: item.title,
          description: item.description || "",
          isPublic: !!item.isPublic,
          movieCount: Array.isArray(item.movies) ? item.movies.length : (item.movieCount || 0),
          movies: item.movies || [],
          createdAt: typeof item.createdAt === "number" ? item.createdAt : Date.now(),
          updatedAt: typeof item.updatedAt === "number" ? item.updatedAt : Date.now(),
        });
        stats.blocksAdded++;
      }
    }

    // Update User Counts using standard query length for consistency
    const totalLiked = (await ctx.db.query("liked").withIndex("by_userId", q => q.eq("userId", internalId)).collect()).length;
    const totalWatched = (await ctx.db.query("watched").withIndex("by_userId", q => q.eq("userId", internalId)).collect()).length;
    const totalWatchlist = (await ctx.db.query("watchlist").withIndex("by_userId", q => q.eq("userId", internalId)).collect()).length;
    
    await ctx.db.patch(internalId, {
      likedCount: totalLiked,
      watchedCount: totalWatched,
      watchlistCount: totalWatchlist,
    });

    return stats;
  },
});
