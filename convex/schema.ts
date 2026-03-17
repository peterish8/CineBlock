import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

// Extract authTables minus users so we can extend the users table
const { users: _authUsers, ...otherAuthTables } = authTables;

const schema = defineSchema({
  ...otherAuthTables,

  // Extended users table — includes all @convex-dev/auth fields + username
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    // Custom field:
    username: v.optional(v.string()),
  })
    .index("email", ["email"])
    .index("by_username", ["username"]),

  watchlist: defineTable({
    userId: v.id("users"),
    movieId: v.number(),
    movieTitle: v.string(),
    posterPath: v.string(),
    addedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_movieId", ["userId", "movieId"]),

  watched: defineTable({
    userId: v.id("users"),
    movieId: v.number(),
    movieTitle: v.string(),
    posterPath: v.string(),
    watchedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_movieId", ["userId", "movieId"]),

  liked: defineTable({
    userId: v.id("users"),
    movieId: v.number(),
    movieTitle: v.string(),
    posterPath: v.string(),
    likedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_movieId", ["userId", "movieId"]),

  news_feed: defineTable({
    fetchedDate: v.string(),
    articles: v.array(
      v.object({
        id: v.string(),
        title: v.string(),
        description: v.string(),
        url: v.string(),
        source: v.string(),
        type: v.union(v.literal("rss"), v.literal("reddit")),
        publishedAt: v.string(),
        thumbnail: v.optional(v.string()),
      })
    ),
    createdAt: v.number(),
  }).index("by_fetchedDate", ["fetchedDate"]),

  rooms: defineTable({
    name: v.string(),
    ownerId: v.id("users"),
    inviteCode: v.string(),
    createdAt: v.number(),
  })
    .index("by_inviteCode", ["inviteCode"])
    .index("by_ownerId", ["ownerId"]),

  room_members: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    joinedAt: v.number(),
  })
    .index("by_roomId", ["roomId"])
    .index("by_userId", ["userId"])
    .index("by_roomId_userId", ["roomId", "userId"]),

  room_votes: defineTable({
    roomId: v.id("rooms"),
    movieId: v.number(),
    userId: v.id("users"),
    votedAt: v.number(),
  })
    .index("by_roomId", ["roomId"])
    .index("by_roomId_movieId_userId", ["roomId", "movieId", "userId"]),

  block_invitations: defineTable({
    roomId: v.id("rooms"),
    invitedUserId: v.id("users"),
    invitedByUserId: v.id("users"),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("declined")),
    createdAt: v.number(),
  })
    .index("by_invitedUser", ["invitedUserId"])
    .index("by_invitedUser_status", ["invitedUserId", "status"])
    .index("by_roomId", ["roomId"])
    .index("by_roomId_invitedUser", ["roomId", "invitedUserId"]),
});

export default schema;
