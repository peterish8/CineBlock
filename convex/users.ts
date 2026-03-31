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
    return await ctx.db.get(userId);
  },
});
