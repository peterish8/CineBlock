import { mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

const MAX_BLOCKS_PER_USER = 20;
const MAX_MOVIES_PER_BLOCK = 50;
const CREATE_BLOCK_MIN_INTERVAL_MS = 4000;
const ADD_MOVIE_MIN_INTERVAL_MS = 500;
const TOGGLE_SAVE_MIN_INTERVAL_MS = 500;

type BlockMovie = {
  movieId: number;
  movieTitle: string;
  posterPath: string;
  addedAt: number;
};

function normalizeBlockMovies(movies: BlockMovie[]) {
  const byId = new Map<number, BlockMovie>();
  for (const movie of movies) {
    const existing = byId.get(movie.movieId);
    if (!existing || movie.addedAt > existing.addedAt) {
      byId.set(movie.movieId, movie);
    }
  }
  return Array.from(byId.values()).sort((a, b) => b.addedAt - a.addedAt);
}

function normalizeOptionalString(input: string | undefined) {
  if (input === undefined) return undefined;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

async function enforceRateLimit(
  ctx: any,
  userId: any,
  action: string,
  minIntervalMs: number
) {
  const now = Date.now();
  const row = await ctx.db
    .query("mutation_throttles")
    .withIndex("by_userId_action", (q: any) => q.eq("userId", userId).eq("action", action))
    .first();

  if (row && now - row.lastAt < minIntervalMs) {
    throw new ConvexError("You're doing that too quickly. Please wait a moment.");
  }

  if (row) {
    await ctx.db.patch(row._id, { lastAt: now });
  } else {
    await ctx.db.insert("mutation_throttles", { userId, action, lastAt: now });
  }
}

export const createBlock = mutation({
  args: { title: v.string(), description: v.optional(v.string()) },
  handler: async (ctx, { title, description }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    await enforceRateLimit(ctx, userId, "createBlock", CREATE_BLOCK_MIN_INTERVAL_MS);

    const normalizedTitle = title.trim();
    const normalizedDescription = normalizeOptionalString(description);

    if (!normalizedTitle) {
      throw new ConvexError("Block title is required.");
    }
    if (normalizedTitle.length > 60) {
      throw new ConvexError("Block title must be 60 characters or fewer.");
    }
    if (normalizedDescription && normalizedDescription.length > 280) {
      throw new ConvexError("Description must be 280 characters or fewer.");
    }

    const userBlocks = await ctx.db
      .query("blocks")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    if (userBlocks.length >= MAX_BLOCKS_PER_USER) {
      throw new ConvexError(`You have reached the maximum limit of ${MAX_BLOCKS_PER_USER} CineBlocks.`);
    }

    const blockId = await ctx.db.insert("blocks", {
      userId,
      title: normalizedTitle,
      description: normalizedDescription,
      isPublic: true,
      movieCount: 0,
      movies: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return blockId;
  },
});

export const deleteBlock = mutation({
  args: { blockId: v.id("blocks") },
  handler: async (ctx, { blockId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    const block = await ctx.db.get(blockId);
    if (!block) throw new ConvexError("CineBlock not found");
    if (block.userId !== userId) throw new ConvexError("Unauthorized");

    const saves = await ctx.db
      .query("saved_blocks")
      .withIndex("by_blockId", (q) => q.eq("blockId", blockId))
      .collect();
    for (const save of saves) {
      await ctx.db.delete(save._id);
    }

    // Clean up stale throttle rows for this user to prevent unbounded table growth
    const throttles = await ctx.db
      .query("mutation_throttles")
      .withIndex("by_userId_action", (q) => q.eq("userId", userId))
      .collect();
    for (const t of throttles) {
      await ctx.db.delete(t._id);
    }

    await ctx.db.delete(blockId);
  },
});

export const addMovieToBlock = mutation({
  args: {
    blockId: v.id("blocks"),
    movieId: v.number(),
    movieTitle: v.string(),
    posterPath: v.string(),
  },
  handler: async (ctx, { blockId, movieId, movieTitle, posterPath }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    await enforceRateLimit(ctx, userId, "addMovieToBlock", ADD_MOVIE_MIN_INTERVAL_MS);

    const normalizedTitle = movieTitle.trim();

    if (!normalizedTitle) {
      throw new ConvexError("Movie title is required.");
    }
    if (normalizedTitle.length > 160) {
      throw new ConvexError("Movie title is too long.");
    }

    const block = await ctx.db.get(blockId);
    if (!block) throw new ConvexError("CineBlock not found");
    if (block.userId !== userId) throw new ConvexError("Unauthorized to add movies to this block");

    const currentMovies = block.movies ?? [];

    if (currentMovies.some((m) => m.movieId === movieId)) {
      throw new ConvexError("Movie is already in this CineBlock");
    }

    if (currentMovies.length >= MAX_MOVIES_PER_BLOCK) {
      throw new ConvexError(`This CineBlock has reached the maximum limit of ${MAX_MOVIES_PER_BLOCK} movies.`);
    }

    const nextMovies = normalizeBlockMovies([
      ...currentMovies,
      { movieId, movieTitle: normalizedTitle, posterPath, addedAt: Date.now() },
    ]);

    await ctx.db.patch(blockId, {
      updatedAt: Date.now(),
      movieCount: nextMovies.length,
      movies: nextMovies,
    });

  },
});

export const removeMovieFromBlock = mutation({
  args: { blockId: v.id("blocks"), movieId: v.number() },
  handler: async (ctx, { blockId, movieId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    const block = await ctx.db.get(blockId);
    if (!block || block.userId !== userId) throw new ConvexError("Unauthorized");

    const currentMovies = block.movies ?? [];
    const nextMovies = currentMovies.filter((m) => m.movieId !== movieId);

    if (nextMovies.length !== currentMovies.length) {
      await ctx.db.patch(blockId, {
        updatedAt: Date.now(),
        movieCount: nextMovies.length,
        movies: nextMovies,
      });
    }

  },
});

export const updateBlock = mutation({
  args: {
    blockId: v.id("blocks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, { blockId, title, description, isPublic }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    const block = await ctx.db.get(blockId);
    if (!block) throw new ConvexError("CineBlock not found");
    if (block.userId !== userId) throw new ConvexError("Unauthorized");

    const patch: {
      title?: string;
      description?: string;
      isPublic?: boolean;
      updatedAt: number;
    } = { updatedAt: Date.now() };

    if (title !== undefined) {
      const normalizedTitle = title.trim();
      if (!normalizedTitle) throw new ConvexError("Block title is required.");
      if (normalizedTitle.length > 60) throw new ConvexError("Block title must be 60 characters or fewer.");
      patch.title = normalizedTitle;
    }

    if (description !== undefined) {
      const normalizedDescription = normalizeOptionalString(description);
      if (normalizedDescription && normalizedDescription.length > 280) {
        throw new ConvexError("Description must be 280 characters or fewer.");
      }
      patch.description = normalizedDescription;
    }

    if (isPublic !== undefined) {
      patch.isPublic = isPublic;
    }

    await ctx.db.patch(blockId, patch);
  },
});

export const setBlockVisibility = mutation({
  args: { blockId: v.id("blocks"), isPublic: v.boolean() },
  handler: async (ctx, { blockId, isPublic }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    const block = await ctx.db.get(blockId);
    if (!block) throw new ConvexError("CineBlock not found");
    if (block.userId !== userId) throw new ConvexError("Unauthorized");

    await ctx.db.patch(blockId, { isPublic, updatedAt: Date.now() });
  },
});

export const toggleSaveBlock = mutation({
  args: { blockId: v.id("blocks") },
  handler: async (ctx, { blockId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    await enforceRateLimit(ctx, userId, "toggleSaveBlock", TOGGLE_SAVE_MIN_INTERVAL_MS);

    const block = await ctx.db.get(blockId);
    if (!block) throw new ConvexError("CineBlock not found");
    if (block.userId === userId) throw new ConvexError("You cannot save your own CineBlock");
    if (!block.isPublic) throw new ConvexError("This CineBlock is private.");

    const existingSave = await ctx.db
      .query("saved_blocks")
      .withIndex("by_userId_blockId", (q) => q.eq("userId", userId).eq("blockId", blockId))
      .first();

    if (existingSave) {
      await ctx.db.delete(existingSave._id);
      return false;
    }

    await ctx.db.insert("saved_blocks", {
      userId,
      blockId,
      savedAt: Date.now(),
    });
    return true;
  },
});

export const getUserBlocks = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const blocks = await ctx.db
      .query("blocks")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return Promise.all(
      blocks.map(async (block) => {
        const previewMovies = normalizeBlockMovies(block.movies ?? []).slice(0, 4);

        return {
          ...block,
          movieCount: block.movieCount ?? 0,
          previewPosters: previewMovies.map((m) => m.posterPath),
        };
      })
    );
  },
});

export const getSavedBlocks = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const saves = await ctx.db
      .query("saved_blocks")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    // Batch-fetch all blocks first, then owners + previews in parallel
    const blocks = await Promise.all(saves.map((s) => ctx.db.get(s.blockId)));

    const results = await Promise.all(
      saves.map(async (save, i) => {
        const block = blocks[i];
        if (!block) return null;
        if (!block.isPublic && block.userId !== userId) return null;

        const [owner, previewMovies] = await Promise.all([
          ctx.db.get(block.userId),
          (async () => {
            return normalizeBlockMovies(block.movies ?? []).slice(0, 4);
          })(),
        ]);

        return {
          ...save,
          block: {
            ...block,
            ownerName: (owner as any)?.username ?? (owner as any)?.name ?? "Unknown creator",
            movieCount: block.movieCount ?? 0,
            previewPosters: previewMovies.map((m) => m.posterPath),
          },
        };
      })
    );

    return results.filter((item): item is NonNullable<typeof item> => item !== null);
  },
});

export const getBlockDetails = query({
  args: { blockId: v.id("blocks") },
  handler: async (ctx, { blockId }) => {
    const userId = await getAuthUserId(ctx);

    const block = await ctx.db.get(blockId);
    if (!block) return null;
    if (!block.isPublic && block.userId !== userId) return null;

    const owner = await ctx.db.get(block.userId);

    const blockMovies = normalizeBlockMovies(block.movies ?? []);

    let isSaved = false;
    let watchedCount = 0;

    if (userId) {
      const [existingSave, userWatchedList] = await Promise.all([
        ctx.db
          .query("saved_blocks")
          .withIndex("by_userId_blockId", (q) => q.eq("userId", userId).eq("blockId", blockId))
          .first(),
        ctx.db
          .query("watched")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .collect(),
      ]);

      isSaved = !!existingSave;
      const watchedMovieIds = new Set(userWatchedList.map((w) => w.movieId));

      for (const movie of blockMovies) {
        if (watchedMovieIds.has(movie.movieId)) {
          watchedCount += 1;
        }
      }
    }

    return {
      block: {
        ...block,
        ownerName: owner?.username ?? owner?.name ?? "Unknown creator",
      },
      movies: blockMovies,
      isOwner: block.userId === userId,
      isSaved,
      progress: {
        watched: watchedCount,
        total: blockMovies.length,
        percentage: blockMovies.length > 0 ? (watchedCount / blockMovies.length) * 100 : 0,
      },
    };
  },
});

export const searchUsersPublicBlocks = query({
  args: { query: v.string() },
  handler: async (ctx, { query }) => {
    const viewerId = await getAuthUserId(ctx);
    const normalizedQuery = query.trim().toLowerCase();

    if (normalizedQuery.length < 2) return [];

    const users = await ctx.db.query("users").collect();

    const matchedUsers = users
      .filter((user) => {
        if (viewerId && user._id === viewerId) return false;
        const username = (user.username ?? "").toLowerCase();
        const name = (user.name ?? "").toLowerCase();
        return username.includes(normalizedQuery) || name.includes(normalizedQuery);
      })
      .slice(0, 12);

    const results = await Promise.all(
      matchedUsers.map(async (user) => {
        const blocks = await ctx.db
          .query("blocks")
          .withIndex("by_userId", (q) => q.eq("userId", user._id))
          .order("desc")
          .collect();

        const publicBlocks = blocks.filter((block) => block.isPublic).slice(0, 20);
        if (publicBlocks.length === 0) return null;

        const blocksWithPreview = await Promise.all(
          publicBlocks.map(async (block) => {
            const previewMovies = normalizeBlockMovies(block.movies ?? []).slice(0, 4);

            return {
              ...block,
              movieCount: block.movieCount ?? 0,
              previewPosters: previewMovies.map((m) => m.posterPath),
            };
          })
        );

        return {
          user: {
            _id: user._id,
            username: user.username ?? null,
            name: user.name ?? null,
          },
          blocks: blocksWithPreview,
        };
      })
    );

    return results.filter((item): item is NonNullable<typeof item> => item !== null);
  },
});

export const importPublicBlock = mutation({
  args: { sourceBlockId: v.id("blocks") },
  handler: async (ctx, { sourceBlockId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    await enforceRateLimit(ctx, userId, "importPublicBlock", CREATE_BLOCK_MIN_INTERVAL_MS);

    const sourceBlock = await ctx.db.get(sourceBlockId);
    if (!sourceBlock) throw new ConvexError("CineBlock not found");
    if (!sourceBlock.isPublic) throw new ConvexError("This CineBlock is private.");
    if (sourceBlock.userId === userId) {
      throw new ConvexError("This is already your CineBlock.");
    }

    const userBlocks = await ctx.db
      .query("blocks")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    if (userBlocks.length >= MAX_BLOCKS_PER_USER) {
      throw new ConvexError(`You have reached the maximum limit of ${MAX_BLOCKS_PER_USER} CineBlocks.`);
    }

    const sourceMovies = normalizeBlockMovies(sourceBlock.movies ?? []);

    const dedupedMovies: BlockMovie[] = [];
    const seenMovieIds = new Set<number>();
    for (const movie of sourceMovies) {
      if (seenMovieIds.has(movie.movieId)) continue;
      seenMovieIds.add(movie.movieId);
      dedupedMovies.push(movie);
      if (dedupedMovies.length >= MAX_MOVIES_PER_BLOCK) break;
    }

    const now = Date.now();
    const newBlockId = await ctx.db.insert("blocks", {
      userId,
      title: sourceBlock.title,
      description: sourceBlock.description,
      isPublic: true,
      movieCount: 0,
      movies: [],
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(newBlockId, {
      movieCount: dedupedMovies.length,
      movies: dedupedMovies.map((m) => ({
        movieId: m.movieId,
        movieTitle: m.movieTitle,
        posterPath: m.posterPath,
        addedAt: Date.now(),
      })),
      updatedAt: Date.now(),
    });

    return newBlockId;
  },
});
