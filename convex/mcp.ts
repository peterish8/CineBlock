import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

const MAX_BLOCKS_PER_USER = 15;
const MAX_MOVIES_PER_BLOCK = 35;
const STAMP_REVIEW_MAX = 1000;
const MAX_TITLE_LENGTH = 200;
const MAX_POSTER_PATH_LENGTH = 2048;
const PLAYLIST_MIN_INTERVAL_MS = 4000;
const STAMP_MIN_INTERVAL_MS = 2000;
const MCP_ACCESS_TOKEN_REGEX = /^mcp_[0-9a-f]{64}$/;

async function hashMcpToken(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function getUserByToken(ctx: QueryCtx | MutationCtx, token: string) {
  if (!MCP_ACCESS_TOKEN_REGEX.test(token)) return null;
  const tokenHash = await hashMcpToken(token);
  const user = await ctx.db.query("users").withIndex("by_mcpTokenHash", (q) => q.eq("mcpTokenHash", tokenHash)).first()
    ?? await ctx.db.query("users").withIndex("by_mcpToken", (q) => q.eq("mcpToken", token)).first();
  if (user) return user;

  const oauthToken = await ctx.db.query("mcp_oauth_tokens")
    .withIndex("by_accessTokenHash", (q) => q.eq("accessTokenHash", tokenHash))
    .first();
  if (!oauthToken || oauthToken.revokedAt || oauthToken.accessExpiresAt <= Date.now()) return null;
  return await ctx.db.get(oauthToken.userId);
}

async function enforceMcpRateLimit(ctx: MutationCtx, userId: Id<"users">, action: string, minIntervalMs: number) {
  const now = Date.now();
  const row = await ctx.db.query("mutation_throttles")
    .withIndex("by_userId_action", (q) => q.eq("userId", userId).eq("action", action))
    .first();
  if (row && now - row.lastAt < minIntervalMs) {
    throw new ConvexError("MCP writes are limited to one request every few seconds. Please wait and retry.");
  }
  if (row) await ctx.db.patch(row._id, { lastAt: now });
  else await ctx.db.insert("mutation_throttles", { userId, action, lastAt: now });
}

function validateActionId(actionId: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(actionId)) {
    throw new ConvexError("Invalid MCP confirmation. Please preview again.");
  }
}

const movieValidator = v.object({
  movieId: v.number(),
  movieTitle: v.string(),
  posterPath: v.string(),
});

function validateRedirectUri(redirectUri: string) {
  try {
    if (redirectUri.length === 0 || redirectUri.length > 2048) throw new Error("Unsupported redirect URI");
    const url = new URL(redirectUri);
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (url.hash || url.username || url.password || (url.protocol !== "https:" && !(local && url.protocol === "http:"))) {
      throw new Error("Unsupported redirect URI");
    }
  } catch {
    throw new ConvexError("Redirect URI must use HTTPS, or HTTP on localhost, without a fragment.");
  }
}

function validateResource(resource: string) {
  try {
    if (resource.length > 2048) throw new Error("Unsupported resource");
    const url = new URL(resource);
    const configuredBase = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "");
    const configuredOrigin = configuredBase ? new URL(configuredBase).origin : null;
    if (url.pathname !== "/api/mcp" || url.search || url.hash || (configuredOrigin && url.origin !== configuredOrigin) || (url.protocol !== "https:" && !(url.hostname === "localhost" && url.protocol === "http:"))) {
      throw new Error("Unsupported resource");
    }
  } catch {
    throw new ConvexError("Invalid MCP resource.");
  }
}

function validateMoviePayload(movie: { movieId: number; movieTitle: string; posterPath: string }) {
  if (!Number.isSafeInteger(movie.movieId) || movie.movieId <= 0) throw new ConvexError("Invalid movie ID.");
  const movieTitle = movie.movieTitle.trim();
  if (!movieTitle || movieTitle.length > MAX_TITLE_LENGTH) throw new ConvexError("Every playlist title must be between 1 and 200 characters.");
  const posterPath = movie.posterPath.trim();
  if (posterPath.length > MAX_POSTER_PATH_LENGTH) throw new ConvexError("Poster path is too long.");
  return { movieId: movie.movieId, movieTitle, posterPath };
}

function randomToken(prefix = "mcp_") {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return prefix + Array.from(bytes).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function base64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function hashBase64Url(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return base64Url(new Uint8Array(digest));
}

export const getLibrary = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const user = await getUserByToken(ctx, token);
    if (!user) throw new ConvexError("Invalid MCP token");

    const [liked, watchlist, watched] = await Promise.all([
      ctx.db.query("liked").withIndex("by_userId", (q) => q.eq("userId", user._id)).collect(),
      ctx.db.query("watchlist").withIndex("by_userId", (q) => q.eq("userId", user._id)).collect(),
      ctx.db.query("watched").withIndex("by_userId", (q) => q.eq("userId", user._id)).collect(),
    ]);

    return {
      user: { name: user.name ?? user.username ?? "CineBlock user", username: user.username ?? null },
      liked: liked.sort((a, b) => b.likedAt - a.likedAt),
      watchlist: watchlist.sort((a, b) => b.addedAt - a.addedAt),
      watched: watched.sort((a, b) => b.watchedAt - a.watchedAt),
    };
  },
});

export const createPlaylist = mutation({
  args: {
    token: v.string(),
    actionId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    isPublic: v.boolean(),
    movies: v.array(movieValidator),
  },
  handler: async (ctx, args) => {
    const user = await getUserByToken(ctx, args.token);
    if (!user) throw new ConvexError("Invalid MCP token");
    validateActionId(args.actionId);

    const priorReceipt = await ctx.db.query("mcp_action_receipts")
      .withIndex("by_userId_actionId", (q) => q.eq("userId", user._id).eq("actionId", args.actionId))
      .first();
    if (priorReceipt) {
      if (priorReceipt.kind !== "playlist" || !priorReceipt.blockId || priorReceipt.movieCount === undefined) {
        throw new ConvexError("This confirmation was already used for another operation.");
      }
      return { blockId: priorReceipt.blockId, movieCount: priorReceipt.movieCount, isPublic: priorReceipt.isPublic };
    }

    const title = args.title.trim();
    const description = args.description?.trim() || undefined;
    if (!title) throw new ConvexError("Playlist title is required.");
    if (title.length > 60) throw new ConvexError("Playlist title must be 60 characters or fewer.");
    if (description && description.length > 280) throw new ConvexError("Description must be 280 characters or fewer.");
    if (args.movies.length === 0) throw new ConvexError("Playlist must contain at least one title.");
    if (args.movies.length > MAX_MOVIES_PER_BLOCK) throw new ConvexError(`A playlist can contain at most ${MAX_MOVIES_PER_BLOCK} titles.`);

    await enforceMcpRateLimit(ctx, user._id as Id<"users">, "mcpCreatePlaylist", PLAYLIST_MIN_INTERVAL_MS);

    const blocks = await ctx.db.query("blocks").withIndex("by_userId", (q) => q.eq("userId", user._id)).collect();
    if (blocks.length >= MAX_BLOCKS_PER_USER) throw new ConvexError(`You have reached the maximum limit of ${MAX_BLOCKS_PER_USER} CineBlocks.`);

    const unique = new Map<number, { movieId: number; movieTitle: string; posterPath: string; addedAt: number }>();
    const now = Date.now();
    for (const movie of args.movies) {
      const normalized = validateMoviePayload(movie);
      if (!unique.has(normalized.movieId)) unique.set(normalized.movieId, { ...normalized, addedAt: now });
    }
    const movies = Array.from(unique.values());
    const blockId = await ctx.db.insert("blocks", {
      userId: user._id as Id<"users">,
      title,
      description,
      isPublic: args.isPublic,
      movieCount: movies.length,
      movies,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("mcp_action_receipts", {
      userId: user._id as Id<"users">,
      actionId: args.actionId,
      kind: "playlist",
      blockId,
      movieCount: movies.length,
      isPublic: args.isPublic,
      createdAt: now,
    });
    return { blockId, movieCount: movies.length, isPublic: args.isPublic };
  },
});

export const createStamp = mutation({
  args: {
    token: v.string(),
    actionId: v.string(),
    movieId: v.number(),
    mediaType: v.optional(v.union(v.literal("movie"), v.literal("tv"))),
    movieTitle: v.string(),
    posterPath: v.string(),
    reviewText: v.string(),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await getUserByToken(ctx, args.token);
    if (!user) throw new ConvexError("Invalid MCP token");
    validateActionId(args.actionId);

    const priorReceipt = await ctx.db.query("mcp_action_receipts")
      .withIndex("by_userId_actionId", (q) => q.eq("userId", user._id).eq("actionId", args.actionId))
      .first();
    if (priorReceipt) {
      if (priorReceipt.kind !== "stamp" || !priorReceipt.stampId) {
        throw new ConvexError("This confirmation was already used for another operation.");
      }
      return { stampId: priorReceipt.stampId, isPublic: priorReceipt.isPublic };
    }

    const reviewText = args.reviewText.trim();
    if (!reviewText) throw new ConvexError("Feeling text cannot be empty.");
    if (reviewText.length > STAMP_REVIEW_MAX) throw new ConvexError(`Feeling text exceeds ${STAMP_REVIEW_MAX} characters.`);
    const movieTitle = args.movieTitle.trim();
    if (!Number.isSafeInteger(args.movieId) || args.movieId <= 0 || !movieTitle || movieTitle.length > MAX_TITLE_LENGTH) throw new ConvexError("Invalid stamp title or movie ID.");
    if (args.posterPath.trim().length > MAX_POSTER_PATH_LENGTH) throw new ConvexError("Poster path is too long.");

    await enforceMcpRateLimit(ctx, user._id as Id<"users">, "mcpCreateStamp", STAMP_MIN_INTERVAL_MS);

    const existing = await ctx.db.query("stamps").withIndex("by_userId_movieId", (q) => q.eq("userId", user._id).eq("movieId", args.movieId)).first();
    if (existing && !existing.isDraft) throw new ConvexError("You already stamped this title.");

    if (existing) {
      await ctx.db.patch(existing._id, { mediaType: args.mediaType, movieTitle, posterPath: args.posterPath.trim(), reviewText, isPublic: args.isPublic, isDraft: false, createdAt: Date.now() });
      await ctx.db.insert("mcp_action_receipts", {
        userId: user._id as Id<"users">,
        actionId: args.actionId,
        kind: "stamp",
        stampId: existing._id,
        isPublic: args.isPublic,
        createdAt: Date.now(),
      });
      return { stampId: existing._id, isPublic: args.isPublic };
    }

    const stampId = await ctx.db.insert("stamps", {
      userId: user._id as Id<"users">,
      movieId: args.movieId,
      mediaType: args.mediaType,
      movieTitle,
      posterPath: args.posterPath.trim(),
      reviewText,
      isPublic: args.isPublic,
      isDraft: false,
      createdAt: Date.now(),
    });
    await ctx.db.insert("mcp_action_receipts", {
      userId: user._id as Id<"users">,
      actionId: args.actionId,
      kind: "stamp",
      stampId,
      isPublic: args.isPublic,
      createdAt: Date.now(),
    });
    return { stampId, isPublic: args.isPublic };
  },
});

export const registerMcpClient = mutation({
  args: {
    clientName: v.optional(v.string()),
    redirectUris: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const clientName = args.clientName?.trim();
    if (clientName && clientName.length > MAX_TITLE_LENGTH) throw new ConvexError("Client name is too long.");
    if (args.redirectUris.length < 1 || args.redirectUris.length > 10) {
      throw new ConvexError("A client must register between one and ten redirect URIs.");
    }
    for (const redirectUri of args.redirectUris) validateRedirectUri(redirectUri);
    if (new Set(args.redirectUris).size !== args.redirectUris.length) throw new ConvexError("Redirect URIs must be unique.");
    const clientId = `cb_client_${randomToken("")}`;
    await ctx.db.insert("mcp_oauth_clients", {
      clientId,
      clientName: clientName || undefined,
      redirectUris: args.redirectUris,
      createdAt: Date.now(),
    });
    return { clientId, redirectUris: args.redirectUris };
  },
});

export const getMcpClient = query({
  args: { clientId: v.string() },
  handler: async (ctx, { clientId }) => {
    return await ctx.db.query("mcp_oauth_clients").withIndex("by_clientId", (q) => q.eq("clientId", clientId)).first();
  },
});

export const createMcpAuthorizationCode = mutation({
  args: {
    clientId: v.string(),
    redirectUri: v.string(),
    codeChallenge: v.string(),
    codeChallengeMethod: v.string(),
    resource: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Sign in to authorize CineBlock.");
    if (args.clientId.length === 0 || args.clientId.length > 256 || args.redirectUri.length > 2048 || args.codeChallengeMethod !== "S256" || !/^[A-Za-z0-9_-]{43,128}$/.test(args.codeChallenge)) {
      throw new ConvexError("OAuth authorization requires an S256 PKCE challenge.");
    }
    validateRedirectUri(args.redirectUri);
    validateResource(args.resource);
    const client = await ctx.db.query("mcp_oauth_clients").withIndex("by_clientId", (q) => q.eq("clientId", args.clientId)).first();
    if (!client || !client.redirectUris.includes(args.redirectUri)) throw new ConvexError("Unknown OAuth client or redirect URI.");

    const code = randomToken("mcp_code_");
    await ctx.db.insert("mcp_oauth_codes", {
      codeHash: await hashMcpToken(code),
      clientId: args.clientId,
      redirectUri: args.redirectUri,
      codeChallenge: args.codeChallenge,
      resource: args.resource,
      userId,
      scope: "cineblock",
      expiresAt: Date.now() + 5 * 60 * 1000,
      createdAt: Date.now(),
    });
    return { code, expiresIn: 300, scope: "cineblock" };
  },
});

async function issueMcpTokens(ctx: MutationCtx, userId: Id<"users">, clientId: string, resource: string, scope: string) {
  const accessToken = randomToken();
  const refreshToken = randomToken("mcp_refresh_");
  const now = Date.now();
  await ctx.db.insert("mcp_oauth_tokens", {
    accessTokenHash: await hashMcpToken(accessToken),
    refreshTokenHash: await hashMcpToken(refreshToken),
    clientId,
    resource,
    userId,
    scope,
    accessExpiresAt: now + 60 * 60 * 1000,
    refreshExpiresAt: now + 30 * 24 * 60 * 60 * 1000,
    createdAt: now,
  });
  return { accessToken, refreshToken, expiresIn: 3600, scope };
}

export const exchangeMcpAuthorizationCode = mutation({
  args: {
    code: v.string(),
    clientId: v.string(),
    redirectUri: v.string(),
    codeVerifier: v.string(),
    resource: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.code.length === 0 || args.code.length > 512 || args.clientId.length === 0 || args.clientId.length > 256 || args.redirectUri.length > 2048 || !/^[A-Za-z0-9._~-]{43,128}$/.test(args.codeVerifier)) {
      throw new ConvexError("Invalid authorization request.");
    }
    validateRedirectUri(args.redirectUri);
    validateResource(args.resource);
    const codeHash = await hashMcpToken(args.code);
    const code = await ctx.db.query("mcp_oauth_codes")
      .withIndex("by_codeHash", (q) => q.eq("codeHash", codeHash))
      .first();
    if (!code || code.usedAt || code.expiresAt <= Date.now() || code.clientId !== args.clientId || code.redirectUri !== args.redirectUri || code.resource !== args.resource) {
      throw new ConvexError("Invalid, expired, or already-used authorization code.");
    }
    if (await hashBase64Url(args.codeVerifier) !== code.codeChallenge) throw new ConvexError("PKCE verification failed.");
    await ctx.db.patch(code._id, { usedAt: Date.now() });
    return await issueMcpTokens(ctx, code.userId, code.clientId, code.resource, code.scope);
  },
});

export const refreshMcpTokens = mutation({
  args: { refreshToken: v.string(), clientId: v.string(), resource: v.string() },
  handler: async (ctx, args) => {
    if (!/^mcp_refresh_[0-9a-f]{64}$/.test(args.refreshToken) || args.clientId.length === 0 || args.clientId.length > 256) {
      throw new ConvexError("Invalid or expired refresh token.");
    }
    validateResource(args.resource);
    const refreshTokenHash = await hashMcpToken(args.refreshToken);
    const token = await ctx.db.query("mcp_oauth_tokens")
      .withIndex("by_refreshTokenHash", (q) => q.eq("refreshTokenHash", refreshTokenHash))
      .first();
    if (!token || token.revokedAt || token.refreshExpiresAt <= Date.now() || token.clientId !== args.clientId || token.resource !== args.resource) {
      throw new ConvexError("Invalid or expired refresh token.");
    }
    await ctx.db.patch(token._id, { revokedAt: Date.now() });
    return await issueMcpTokens(ctx, token.userId, token.clientId, token.resource, token.scope);
  },
});
