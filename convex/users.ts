import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

export const upsertUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db.get(userId);
    if (existing) {
      await ctx.db.patch(userId, {
        name: args.name,
        email: args.email,
      });
    }
  },
});

export const deleteAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Delete all list entries
    for (const table of ["watchlist", "watched", "liked"] as const) {
      const entries = await ctx.db.query(table).withIndex("by_userId", q => q.eq("userId", userId)).collect();
      for (const e of entries) await ctx.db.delete(e._id);
    }

    // Delete room memberships and votes in rooms the user joined
    const memberships = await ctx.db.query("room_members").withIndex("by_userId", q => q.eq("userId", userId)).collect();
    for (const m of memberships) {
      const votes = await ctx.db.query("room_votes").withIndex("by_roomId", q => q.eq("roomId", m.roomId)).collect();
      for (const v of votes.filter(v => v.userId === userId)) await ctx.db.delete(v._id);
      await ctx.db.delete(m._id);
    }

    // Delete rooms the user owns + all their members/votes
    const ownedRooms = await ctx.db.query("rooms").withIndex("by_ownerId", q => q.eq("ownerId", userId)).collect();
    for (const room of ownedRooms) {
      const members = await ctx.db.query("room_members").withIndex("by_roomId", q => q.eq("roomId", room._id)).collect();
      for (const m of members) await ctx.db.delete(m._id);
      const votes = await ctx.db.query("room_votes").withIndex("by_roomId", q => q.eq("roomId", room._id)).collect();
      for (const v of votes) await ctx.db.delete(v._id);
      await ctx.db.delete(room._id);
    }

    // Delete the user record
    await ctx.db.delete(userId as Id<"users">);
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
