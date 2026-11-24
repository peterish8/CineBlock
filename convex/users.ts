import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

export const upsertUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    const existing = await ctx.db.get(userId);
    if (existing) {
      await ctx.db.patch(userId, {
        name: args.name,
        email: args.email,
      });
    }
  },
});

export const setUsername = mutation({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    // Validate format: 3-20 chars, lowercase alphanumeric + underscores
    const cleaned = username.toLowerCase().trim();
    if (!/^[a-z0-9_]{3,20}$/.test(cleaned)) {
      throw new ConvexError("Username must be 3–20 characters: letters, numbers, underscores only.");
    }

    // Check uniqueness
    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", cleaned))
      .first();

    if (existing && existing._id !== userId) {
      throw new ConvexError("That username is already taken.");
    }

    await ctx.db.patch(userId, { username: cleaned });
    return cleaned;
  },
});

export const setPreferredLanguage = mutation({
  args: { language: v.string() },
  handler: async (ctx, { language }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    
    if (language) {
      const langs = language.split(",").filter(Boolean);
      if (langs.length > 5) {
        throw new ConvexError("You can select a maximum of 5 preferred languages.");
      }
    }
    
    // "" means "no preference" (all languages)
    await ctx.db.patch(userId, { preferredLanguage: language || undefined });
  },
});

export const getUserByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username.toLowerCase().trim()))
      .first();
    if (!user) return null;
    // Only return safe fields — never expose email
    return { _id: user._id, name: user.name, username: user.username };
  },
});

export const deleteAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    const user = await ctx.db.get(userId);

    // Delete all list entries
    for (const table of ["watchlist", "watched", "liked"] as const) {
      const entries = await ctx.db.query(table).withIndex("by_userId", q => q.eq("userId", userId)).collect();
      for (const e of entries) await ctx.db.delete(e._id);
    }

    // Delete block invitations (sent and received)
    const receivedInvites = await ctx.db
      .query("block_invitations")
      .withIndex("by_invitedUser", (q) => q.eq("invitedUserId", userId))
      .collect();
    for (const inv of receivedInvites) await ctx.db.delete(inv._id);

    // Delete room memberships and votes in rooms the user joined
    const memberships = await ctx.db.query("room_members").withIndex("by_userId", q => q.eq("userId", userId)).collect();
    for (const m of memberships) {
      const votes = await ctx.db.query("room_votes").withIndex("by_roomId", q => q.eq("roomId", m.roomId)).collect();
      for (const v of votes.filter(v => v.userId === userId)) await ctx.db.delete(v._id);
      await ctx.db.delete(m._id);
    }

    // Delete rooms the user owns + all their members/votes/invitations
    const ownedRooms = await ctx.db.query("rooms").withIndex("by_ownerId", q => q.eq("ownerId", userId)).collect();
    for (const room of ownedRooms) {
      const members = await ctx.db.query("room_members").withIndex("by_roomId", q => q.eq("roomId", room._id)).collect();
      for (const m of members) await ctx.db.delete(m._id);
      const votes = await ctx.db.query("room_votes").withIndex("by_roomId", q => q.eq("roomId", room._id)).collect();
      for (const v of votes) await ctx.db.delete(v._id);
      const invites = await ctx.db.query("block_invitations").withIndex("by_roomId", q => q.eq("roomId", room._id)).collect();
      for (const inv of invites) await ctx.db.delete(inv._id);
      await ctx.db.delete(room._id);
    }

    // Clean up auth tables to avoid orphaned accounts/sessions
    const sessions = await ctx.db.query("authSessions").withIndex("userId", q => q.eq("userId", userId)).collect();
    for (const session of sessions) {
      const refreshTokens = await ctx.db
        .query("authRefreshTokens")
        .withIndex("sessionId", q => q.eq("sessionId", session._id))
        .collect();
      for (const token of refreshTokens) await ctx.db.delete(token._id);
      await ctx.db.delete(session._id);
    }

    const accounts = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", q => q.eq("userId", userId))
      .collect();
    for (const account of accounts) {
      const codes = await ctx.db
        .query("authVerificationCodes")
        .withIndex("accountId", q => q.eq("accountId", account._id))
        .collect();
      for (const code of codes) await ctx.db.delete(code._id);
      await ctx.db.delete(account._id);
    }

    // Delete rate-limit records for all known identifiers tied to this account
    const identifiers: string[] = [];
    if (user?.email) identifiers.push(user.email);
    if (user?.phone) identifiers.push(user.phone);
    for (const identifier of identifiers) {
      const rateLimits = await ctx.db
        .query("authRateLimits")
        .withIndex("identifier", q => q.eq("identifier", identifier))
        .collect();
      for (const r of rateLimits) await ctx.db.delete(r._id);
    }

    // Delete stamps
    const stamps = await ctx.db.query("stamps").withIndex("by_userId", q => q.eq("userId", userId)).collect();
    for (const s of stamps) await ctx.db.delete(s._id);

    // Delete the user's CineBlocks, and everyone's saves of them, plus blocks they saved
    const ownedBlocks = await ctx.db.query("blocks").withIndex("by_userId", q => q.eq("userId", userId)).collect();
    for (const block of ownedBlocks) {
      const saves = await ctx.db.query("saved_blocks").withIndex("by_blockId", q => q.eq("blockId", block._id)).collect();
      for (const s of saves) await ctx.db.delete(s._id);
      await ctx.db.delete(block._id);
    }
    const savedBlocks = await ctx.db.query("saved_blocks").withIndex("by_userId", q => q.eq("userId", userId)).collect();
    for (const s of savedBlocks) await ctx.db.delete(s._id);

    // Delete radar, CineSwipe history and per-user throttles
    const radar = await ctx.db.query("radar").withIndex("by_userId", q => q.eq("userId", userId)).collect();
    for (const r of radar) await ctx.db.delete(r._id);
    const swipes = await ctx.db.query("swipe_history").withIndex("by_userId", q => q.eq("userId", userId)).collect();
    for (const s of swipes) await ctx.db.delete(s._id);
    const swipeDays = await ctx.db.query("swipe_daily").withIndex("by_userId_date", q => q.eq("userId", userId)).collect();
    for (const d of swipeDays) await ctx.db.delete(d._id);
    const throttles = await ctx.db.query("mutation_throttles").withIndex("by_userId_action", q => q.eq("userId", userId)).collect();
    for (const t of throttles) await ctx.db.delete(t._id);

    // Revoke every ChatGPT/MCP connection: tokens, pending codes and write receipts
    const mcpTokens = await ctx.db.query("mcp_oauth_tokens").withIndex("by_userId", q => q.eq("userId", userId)).collect();
    for (const t of mcpTokens) await ctx.db.delete(t._id);
    const mcpCodes = await ctx.db.query("mcp_oauth_codes").withIndex("by_userId", q => q.eq("userId", userId)).collect();
    for (const c of mcpCodes) await ctx.db.delete(c._id);
    const receipts = await ctx.db.query("mcp_action_receipts").withIndex("by_userId_actionId", q => q.eq("userId", userId)).collect();
    for (const r of receipts) await ctx.db.delete(r._id);

    // Delete the user record
    await ctx.db.delete(userId as Id<"users">);
  },
});

export const searchUsers = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const q = args.query.trim();
    if (q.length < 2) return [];

    const viewerId = await getAuthUserId(ctx);

    const [byUsername, byName] = await Promise.all([
      ctx.db
        .query("users")
        .withSearchIndex("search_by_username", (s) => s.search("username", q))
        .take(12),
      ctx.db
        .query("users")
        .withSearchIndex("search_by_name", (s) => s.search("name", q))
        .take(12),
    ]);

    const seen = new Set<string>();
    const results: { _id: string; name?: string; username?: string; image?: string }[] = [];

    for (const user of [...byUsername, ...byName]) {
      if (seen.has(user._id)) continue;
      if (viewerId && user._id === viewerId) continue;
      seen.add(user._id);
      results.push({ _id: user._id, name: user.name, username: user.username, image: user.image });
      if (results.length >= 12) break;
    }

    return results;
  },
});

export const getUserPublicProfile = query({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username.toLowerCase().trim()))
      .first();
    if (!user) return null;
    return { _id: user._id, name: user.name, username: user.username, image: user.image };
  },
});

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;
    const { mcpToken, mcpTokenHash, ...safeUser } = user;
    return {
      ...safeUser,
      hasMcpToken: Boolean(mcpToken || mcpTokenHash),
      mcpTokenLast4: user.mcpTokenLast4 ?? (mcpToken ? mcpToken.slice(-4) : undefined),
    };
  },
});

// ── CLI TOKEN ─────────────────────────────────────────────────────────────────

const CLI_DAILY_LIMIT = 15;

/** Searches used today; the count resets at midnight UTC. */
function cliSearchesToday(user: { cliSearchesUsed?: number; cliSearchesResetAt?: number }, todayStart: number) {
  return (user.cliSearchesResetAt ?? 0) < todayStart ? 0 : (user.cliSearchesUsed ?? 0);
}

function utcDayStart() {
  const day = new Date();
  day.setUTCHours(0, 0, 0, 0);
  return day.getTime();
}

export const generateCliToken = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    const token = "cb_" + Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");

    // Only the token changes. Keeping the counters means a new token can't reset the daily quota.
    await ctx.db.patch(userId, { cliToken: token });
    return token;
  },
});

// Verify token without consuming a search count (used on first login)
export const pingCliToken = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_cliToken", (q) => q.eq("cliToken", token))
      .first();
    if (!user) return { ok: false, error: "Invalid token" };

    const searchesUsed = cliSearchesToday(user, utcDayStart());
    return {
      ok: true,
      name: user.name ?? "User",
      searchesUsed,
      searchesRemaining: Math.max(0, CLI_DAILY_LIMIT - searchesUsed),
    };
  },
});

export const validateCliSearch = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_cliToken", (q) => q.eq("cliToken", token))
      .first();

    if (!user) return { ok: false, error: "Invalid token" };

    const todayStart = utcDayStart();
    const searchesUsed = cliSearchesToday(user, todayStart);

    if (searchesUsed >= CLI_DAILY_LIMIT) {
      return { ok: false, error: "Daily limit reached", searchesUsed: CLI_DAILY_LIMIT, searchesRemaining: 0 };
    }

    await ctx.db.patch(user._id, {
      cliSearchesUsed: searchesUsed + 1,
      cliSearchesResetAt: (user.cliSearchesResetAt ?? 0) < todayStart ? Date.now() : user.cliSearchesResetAt,
    });

    return {
      ok: true,
      searchesUsed: searchesUsed + 1,
      searchesRemaining: CLI_DAILY_LIMIT - searchesUsed - 1,
      name: user.name ?? "User",
    };
  },
});

const CLI_LIBRARY_MAX = 100;

// Read one of the token owner's lists for CineBlock Terminal, newest first.
// Read-only and authenticated by the CLI token alone, like pingCliToken.
export const getCliLibrary = query({
  args: {
    token: v.string(),
    list: v.union(v.literal("watchlist"), v.literal("liked"), v.literal("watched")),
    limit: v.number(),
  },
  handler: async (ctx, { token, list, limit }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_cliToken", (q) => q.eq("cliToken", token))
      .first();
    if (!user) return { ok: false as const, error: "Invalid token" };

    const take = Math.min(CLI_LIBRARY_MAX, Math.max(1, Math.floor(limit)));
    let rows: { movieId: number; movieTitle: string; posterPath: string; at: number }[];
    let total: number | undefined;
    if (list === "watched") {
      const docs = await ctx.db.query("watched")
        .withIndex("by_userId_watchedAt", (q) => q.eq("userId", user._id))
        .order("desc").take(take);
      rows = docs.map((d) => ({ ...d, at: d.watchedAt }));
      total = user.watchedCount;
    } else if (list === "liked") {
      const docs = await ctx.db.query("liked")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .order("desc").take(take);
      rows = docs.map((d) => ({ ...d, at: d.likedAt }));
      total = user.likedCount;
    } else {
      const docs = await ctx.db.query("watchlist")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .order("desc").take(take);
      rows = docs.map((d) => ({ ...d, at: d.addedAt }));
      total = user.watchlistCount;
    }

    return {
      ok: true as const,
      list,
      total: total ?? null,
      items: rows.map((r) => ({
        tmdbId: r.movieId,
        title: r.movieTitle,
        posterPath: r.posterPath || null,
        addedAt: new Date(r.at).toISOString(),
      })),
    };
  },
});

// ── REMOTE MCP TOKEN ─────────────────────────────────────────────────────────

async function hashMcpToken(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

const MCP_ACCESS_TOKEN_REGEX = /^mcp_[0-9a-f]{64}$/;

export const generateMcpToken = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    const token = "mcp_" + Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
    const mcpTokenHash = await hashMcpToken(token);

    await ctx.db.patch(userId, { mcpToken: undefined, mcpTokenHash, mcpTokenLast4: token.slice(-4) });
    const oauthTokens = await ctx.db.query("mcp_oauth_tokens").withIndex("by_userId", (q) => q.eq("userId", userId)).collect();
    for (const oauthToken of oauthTokens) {
      if (!oauthToken.revokedAt) await ctx.db.patch(oauthToken._id, { revokedAt: Date.now() });
    }
    return token;
  },
});

export const pingMcpToken = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    if (!MCP_ACCESS_TOKEN_REGEX.test(token)) return { ok: false, error: "Invalid MCP token" };
    const tokenHash = await hashMcpToken(token);
    const user = await ctx.db
      .query("users")
      .withIndex("by_mcpTokenHash", (q) => q.eq("mcpTokenHash", tokenHash))
      .first()
      ?? await ctx.db
        .query("users")
        .withIndex("by_mcpToken", (q) => q.eq("mcpToken", token))
        .first();
    if (user) {
      return {
        ok: true,
        userId: user._id,
        name: user.name ?? user.username ?? "CineBlock user",
        username: user.username ?? null,
        scopes: ["cineblock"],
      };
    }

    const oauthToken = await ctx.db.query("mcp_oauth_tokens")
      .withIndex("by_accessTokenHash", (q) => q.eq("accessTokenHash", tokenHash))
      .first();
    if (!oauthToken || oauthToken.revokedAt || oauthToken.accessExpiresAt <= Date.now()) {
      return { ok: false, error: "Invalid MCP token" };
    }
    const oauthUser = await ctx.db.get(oauthToken.userId);
    if (!oauthUser) return { ok: false, error: "Invalid MCP token" };

    return {
      ok: true,
      userId: oauthUser._id,
      name: oauthUser.name ?? oauthUser.username ?? "CineBlock user",
      username: oauthUser.username ?? null,
      resource: oauthToken.resource,
      scopes: oauthToken.scope.split(" ").filter(Boolean),
    };
  },
});
