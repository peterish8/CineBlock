import { mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateInviteCode(): string {
  // Unambiguous chars: no 0/O/1/I
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ─── Create / Join / Leave ────────────────────────────────────────────────────

export const createRoom = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    // Generate a unique invite code
    let inviteCode = generateInviteCode();
    while (
      await ctx.db
        .query("rooms")
        .withIndex("by_inviteCode", (q) => q.eq("inviteCode", inviteCode))
        .first()
    ) {
      inviteCode = generateInviteCode();
    }

    const roomId = await ctx.db.insert("rooms", {
      name: name.trim(),
      ownerId: userId,
      inviteCode,
      createdAt: Date.now(),
    });

    await ctx.db.insert("room_members", {
      roomId,
      userId,
      joinedAt: Date.now(),
      role: "admin",
    });

    return { roomId, inviteCode };
  },
});

export const joinByCode = mutation({
  args: { inviteCode: v.string() },
  handler: async (ctx, { inviteCode }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    const room = await ctx.db
      .query("rooms")
      .withIndex("by_inviteCode", (q) =>
        q.eq("inviteCode", inviteCode.trim().toUpperCase())
      )
      .first();

    if (!room) throw new ConvexError("Room not found. Check the invite code.");

    const existing = await ctx.db
      .query("room_members")
      .withIndex("by_roomId_userId", (q) =>
        q.eq("roomId", room._id).eq("userId", userId)
      )
      .first();

    if (existing) return room._id; // already a member — just return id

    await ctx.db.insert("room_members", {
      roomId: room._id,
      userId,
      joinedAt: Date.now(),
      role: "member",
    });

    return room._id;
  },
});

export const leaveRoom = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    const room = await ctx.db.get(roomId);
    if (!room) return;
    if (room.ownerId === userId)
      throw new ConvexError("Room owner cannot leave — delete the room instead.");

    const membership = await ctx.db
      .query("room_members")
      .withIndex("by_roomId_userId", (q) =>
        q.eq("roomId", roomId).eq("userId", userId)
      )
      .first();

    if (!membership) return;
    await ctx.db.delete(membership._id);

    // Delete user's votes in this room
    const votes = await ctx.db
      .query("room_votes")
      .withIndex("by_roomId", (q) => q.eq("roomId", roomId))
      .collect();
    for (const vote of votes.filter((vote) => vote.userId === userId)) {
      await ctx.db.delete(vote._id);
    }

    // If no members left, delete the room
    const remaining = await ctx.db
      .query("room_members")
      .withIndex("by_roomId", (q) => q.eq("roomId", roomId))
      .collect();

    if (remaining.length === 0) {
      await ctx.db.delete(roomId);
    }
  },
});

export const deleteRoom = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    const room = await ctx.db.get(roomId);
    if (!room) throw new ConvexError("Room not found");
    if (room.ownerId !== userId) throw new ConvexError("Only the room owner can delete it");

    // Delete all members
    const members = await ctx.db
      .query("room_members")
      .withIndex("by_roomId", (q) => q.eq("roomId", roomId))
      .collect();
    for (const m of members) await ctx.db.delete(m._id);

    // Delete all votes
    const votes = await ctx.db
      .query("room_votes")
      .withIndex("by_roomId", (q) => q.eq("roomId", roomId))
      .collect();
    for (const vote of votes) await ctx.db.delete(vote._id);

    await ctx.db.delete(roomId);
  },
});

// ─── Queries ──────────────────────────────────────────────────────────────────

export const getMyRooms = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const memberships = await ctx.db
      .query("room_members")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const rooms = await Promise.all(
      memberships.map(async (m) => {
        const room = await ctx.db.get(m.roomId);
        if (!room) return null;
        const memberCount = (
          await ctx.db
            .query("room_members")
            .withIndex("by_roomId", (q) => q.eq("roomId", m.roomId))
            .collect()
        ).length;
        return { ...room, memberCount, isOwner: room.ownerId === userId };
      })
    );

    return rooms
      .filter(Boolean)
      .sort((a, b) => b!.createdAt - a!.createdAt);
  },
});

export const getRoom = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    // Must be a member
    const membership = await ctx.db
      .query("room_members")
      .withIndex("by_roomId_userId", (q) =>
        q.eq("roomId", roomId).eq("userId", userId)
      )
      .first();
    if (!membership) return null;

    const room = await ctx.db.get(roomId);
    if (!room) return null;

    const memberships = await ctx.db
      .query("room_members")
      .withIndex("by_roomId", (q) => q.eq("roomId", roomId))
      .collect();

    const members = await Promise.all(
      memberships.map(async (m) => {
        const user = await ctx.db.get(m.userId);
        return {
          userId: m.userId,
          name: user?.name || "CineBlock User",
          username: user?.username ?? null,
          joinedAt: m.joinedAt,
          isOwner: m.userId === room.ownerId,
          isMe: m.userId === userId,
          role: m.role ?? (m.userId === room.ownerId ? "admin" : "member"),
        };
      })
    );

    members.sort((a, b) => a.joinedAt - b.joinedAt);

    const myRole = membership.role ?? (room.ownerId === userId ? "admin" : "member");

    return {
      ...room,
      members,
      isOwner: room.ownerId === userId,
      isAdmin: myRole === "admin",
    };
  },
});

export const getRoomMatches = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    // Must be a member
    const callerMembership = await ctx.db
      .query("room_members")
      .withIndex("by_roomId_userId", (q) =>
        q.eq("roomId", roomId).eq("userId", userId)
      )
      .first();
    if (!callerMembership) return null;

    const memberships = await ctx.db
      .query("room_members")
      .withIndex("by_roomId", (q) => q.eq("roomId", roomId))
      .collect();

    const totalMembers = memberships.length;

    // Step 1 — build a map of the current user's watchlist for O(1) lookup
    const myItems = await ctx.db
      .query("watchlist")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const myMovieSet = new Set(myItems.map((i) => i.movieId));

    // Step 2 — batch fetch all users + watchlists in parallel (avoids N+1)
    const [allUsers, allWatchlists] = await Promise.all([
      Promise.all(memberships.map((m) => ctx.db.get(m.userId))),
      Promise.all(
        memberships.map((m) =>
          ctx.db.query("watchlist").withIndex("by_userId", (q) => q.eq("userId", m.userId)).collect()
        )
      ),
    ]);

    // movieMap: movieId → { title, poster, memberCount, names of ALL who have it }
    const movieMap = new Map<
      number,
      { movieTitle: string; posterPath: string; count: number; names: string[] }
    >();

    for (let i = 0; i < memberships.length; i++) {
      const m = memberships[i];
      const user = allUsers[i];
      const memberName = user?.name || "CineBlock User";
      const items = allWatchlists[i];

      for (const item of items) {
        const entry = movieMap.get(item.movieId) ?? {
          movieTitle: item.movieTitle,
          posterPath: item.posterPath,
          count: 0,
          names: [],
        };
        entry.count += 1;
        // Only store name if it's not the current user (we show "also" names)
        if (m.userId !== userId) entry.names.push(memberName);
        movieMap.set(item.movieId, entry);
      }
    }

    // Step 3 — only surface movies 2+ members share
    // If current user HAS the movie → include names of others (alsoWantedBy)
    // If current user does NOT have it → include count only, no names (privacy)
    const matches = Array.from(movieMap.entries())
      .filter(([, e]) => e.count >= 2)
      .map(([movieId, e]) => ({
        movieId,
        movieTitle: e.movieTitle,
        posterPath: e.posterPath,
        memberCount: e.count,
        totalMembers,
        iInvolved: myMovieSet.has(movieId),
        // Only expose names to members who are part of the match
        alsoWantedBy: myMovieSet.has(movieId) ? e.names : [],
      }))
      .sort((a, b) => b.memberCount - a.memberCount);

    return matches;
  },
});

// ─── "Let's Watch" Votes ──────────────────────────────────────────────────────

export const toggleVote = mutation({
  args: {
    roomId: v.id("rooms"),
    movieId: v.number(),
  },
  handler: async (ctx, { roomId, movieId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    // Must be member
    const membership = await ctx.db
      .query("room_members")
      .withIndex("by_roomId_userId", (q) =>
        q.eq("roomId", roomId).eq("userId", userId)
      )
      .first();
    if (!membership) throw new ConvexError("Not a room member");

    const existing = await ctx.db
      .query("room_votes")
      .withIndex("by_roomId_movieId_userId", (q) =>
        q.eq("roomId", roomId).eq("movieId", movieId).eq("userId", userId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return false;
    } else {
      await ctx.db.insert("room_votes", {
        roomId,
        movieId,
        userId,
        votedAt: Date.now(),
      });
      return true;
    }
  },
});

export const getRoomVotes = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const membership = await ctx.db
      .query("room_members")
      .withIndex("by_roomId_userId", (q) =>
        q.eq("roomId", roomId).eq("userId", userId)
      )
      .first();
    if (!membership) return [];

    const votes = await ctx.db
      .query("room_votes")
      .withIndex("by_roomId", (q) => q.eq("roomId", roomId))
      .collect();

    // Group by movieId
    const voteMap = new Map<number, { voterCount: number; iVoted: boolean }>();
    for (const v of votes) {
      const entry = voteMap.get(v.movieId) ?? { voterCount: 0, iVoted: false };
      entry.voterCount += 1;
      if (v.userId === userId) entry.iVoted = true;
      voteMap.set(v.movieId, entry);
    }

    return Array.from(voteMap.entries()).map(([movieId, data]) => ({
      movieId,
      ...data,
    }));
  },
});

// ─── Invitations ──────────────────────────────────────────────────────────────

export const inviteByUsername = mutation({
  args: { roomId: v.id("rooms"), username: v.string() },
  handler: async (ctx, { roomId, username }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    // Caller must be a member
    const callerMembership = await ctx.db
      .query("room_members")
      .withIndex("by_roomId_userId", (q) => q.eq("roomId", roomId).eq("userId", userId))
      .first();
    if (!callerMembership) throw new ConvexError("You're not a member of this Block.");

    // Find target user by username (stored lowercase)
    const cleaned = username.toLowerCase().trim();
    const target = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", cleaned))
      .first();

    if (!target) throw new ConvexError(`No user found with username "@${cleaned}". Ask them to set a username in their Profile settings first.`);
    if (target._id === userId) throw new ConvexError("You can't invite yourself.");

    // Already a member?
    const alreadyMember = await ctx.db
      .query("room_members")
      .withIndex("by_roomId_userId", (q) => q.eq("roomId", roomId).eq("userId", target._id))
      .first();
    if (alreadyMember) throw new ConvexError("That user is already in this Block.");

    // Duplicate pending invite?
    const existing = await ctx.db
      .query("block_invitations")
      .withIndex("by_roomId_invitedUser", (q) => q.eq("roomId", roomId).eq("invitedUserId", target._id))
      .first();
    if (existing && existing.status === "pending") throw new ConvexError("Invite already sent to that user.");

    // If previously declined, delete old record and re-invite
    if (existing) await ctx.db.delete(existing._id);

    await ctx.db.insert("block_invitations", {
      roomId,
      invitedUserId: target._id,
      invitedByUserId: userId,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const getPendingInvitations = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const invites = await ctx.db
      .query("block_invitations")
      .withIndex("by_invitedUser_status", (q) =>
        q.eq("invitedUserId", userId).eq("status", "pending")
      )
      .collect();

    const results = await Promise.all(
      invites.map(async (inv) => {
        const room = await ctx.db.get(inv.roomId);
        const inviter = await ctx.db.get(inv.invitedByUserId);
        return {
          _id: inv._id,
          roomId: inv.roomId,
          roomName: room?.name ?? "Deleted Block",
          invitedByName: inviter?.name ?? "Someone",
          invitedByUsername: inviter?.username ?? null,
          createdAt: inv.createdAt,
        };
      })
    );

    return results.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const respondToInvitation = mutation({
  args: { invitationId: v.id("block_invitations"), accept: v.boolean() },
  handler: async (ctx, { invitationId, accept }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    const invite = await ctx.db.get(invitationId);
    if (!invite || invite.invitedUserId !== userId) throw new ConvexError("Invitation not found.");
    if (invite.status !== "pending") throw new ConvexError("Invitation already responded to.");

    if (accept) {
      // Check not already a member
      const alreadyMember = await ctx.db
        .query("room_members")
        .withIndex("by_roomId_userId", (q) => q.eq("roomId", invite.roomId).eq("userId", userId))
        .first();
      if (!alreadyMember) {
        await ctx.db.insert("room_members", {
          roomId: invite.roomId,
          userId,
          joinedAt: Date.now(),
          role: "member",
        });
      }
      await ctx.db.patch(invitationId, { status: "accepted" });
      return invite.roomId;
    } else {
      await ctx.db.patch(invitationId, { status: "declined" });
      return null;
    }
  },
});

// ─── Admin Controls ───────────────────────────────────────────────────────────

export const promoteToAdmin = mutation({
  args: { roomId: v.id("rooms"), targetUserId: v.id("users") },
  handler: async (ctx, { roomId, targetUserId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    // Caller must be admin
    const callerMembership = await ctx.db
      .query("room_members")
      .withIndex("by_roomId_userId", (q) => q.eq("roomId", roomId).eq("userId", userId))
      .first();
    const room = await ctx.db.get(roomId);
    const callerRole = callerMembership?.role ?? (room?.ownerId === userId ? "admin" : "member");
    if (callerRole !== "admin") throw new ConvexError("Only admins can promote members.");

    // Target must be a member
    const targetMembership = await ctx.db
      .query("room_members")
      .withIndex("by_roomId_userId", (q) => q.eq("roomId", roomId).eq("userId", targetUserId))
      .first();
    if (!targetMembership) throw new ConvexError("User is not a member of this Block.");
    if (targetMembership.role === "admin") throw new ConvexError("User is already an admin.");

    await ctx.db.patch(targetMembership._id, { role: "admin" });
  },
});

export const removeMember = mutation({
  args: { roomId: v.id("rooms"), targetUserId: v.id("users") },
  handler: async (ctx, { roomId, targetUserId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    const room = await ctx.db.get(roomId);
    if (!room) throw new ConvexError("Block not found.");

    // Caller must be admin
    const callerMembership = await ctx.db
      .query("room_members")
      .withIndex("by_roomId_userId", (q) => q.eq("roomId", roomId).eq("userId", userId))
      .first();
    const callerRole = callerMembership?.role ?? (room.ownerId === userId ? "admin" : "member");
    if (callerRole !== "admin") throw new ConvexError("Only admins can remove members.");

    // Target must not be an admin (can't remove other admins)
    const targetMembership = await ctx.db
      .query("room_members")
      .withIndex("by_roomId_userId", (q) => q.eq("roomId", roomId).eq("userId", targetUserId))
      .first();
    if (!targetMembership) throw new ConvexError("User is not a member.");
    const targetRole = targetMembership.role ?? (room.ownerId === targetUserId ? "admin" : "member");
    if (targetRole === "admin") throw new ConvexError("Cannot remove an admin.");
    if (targetUserId === userId) throw new ConvexError("Cannot remove yourself.");

    // Delete their votes in this room
    const votes = await ctx.db
      .query("room_votes")
      .withIndex("by_roomId", (q) => q.eq("roomId", roomId))
      .collect();
    for (const v of votes.filter((v) => v.userId === targetUserId)) {
      await ctx.db.delete(v._id);
    }

    await ctx.db.delete(targetMembership._id);
  },
});
