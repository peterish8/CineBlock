import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

// Extract authTables minus users so we can extend the users table
const { users: _usersTable, ...otherAuthTables } = authTables;
void _usersTable;

const nullableString = v.union(v.string(), v.null());

// One movie inside a Franchise Vault snapshot (mirrors FranchisePart in src/lib/franchiseBuilder.ts)
export const franchisePartValidator = v.object({
  id: v.number(),
  title: v.string(),
  original_title: v.string(),
  overview: v.string(),
  poster_path: nullableString,
  backdrop_path: nullableString,
  release_date: v.string(),
  vote_average: v.number(),
  vote_count: v.number(),
  genre_ids: v.array(v.number()),
  original_language: v.string(),
  popularity: v.number(),
  adult: v.boolean(),
  custom_era: v.optional(v.string()),
});

// How a franchise is assembled from TMDB (mirrors FranchiseSource in src/lib/franchiseBuilder.ts)
export const franchiseSourceValidator = v.union(
  // A plain TMDB collection
  v.object({ type: v.literal("collection"), tmdbCollectionId: v.number() }),
  // Every film tagged with a TMDB keyword (optionally from one studio), e.g. the MCU
  v.object({
    type: v.literal("keyword"),
    keywordId: v.number(),
    companyId: v.optional(v.number()),
    excludeGenreIds: v.array(v.number()),
    excludeIds: v.array(v.number()),
    pinnedOrder: v.array(v.number()), // known in-universe order; new films append by date
    minRuntime: v.number(), // released films shorter than this are shorts/specials
  }),
  // Several TMDB collections merged, each labelled as an era, e.g. Spider-Man
  v.object({
    type: v.literal("merge"),
    eras: v.array(v.object({ tmdbCollectionId: v.number(), era: v.string() })),
  })
);

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
    // Custom fields:
    username: v.optional(v.string()),
    preferredLanguage: v.optional(v.string()),
    likedCount: v.optional(v.number()),
    watchedCount: v.optional(v.number()),
    watchlistCount: v.optional(v.number()),
    lastRadarSync: v.optional(v.number()),
    lastRadarSyncLanguage: v.optional(v.string()),
    // CineBlock Terminal CLI
    cliToken: v.optional(v.string()),
    cliSearchesUsed: v.optional(v.number()),
    cliSearchesResetAt: v.optional(v.number()),
    // Remote MCP access token. Kept separate from the CLI token so either
    // integration can be revoked without affecting the other.
    mcpToken: v.optional(v.string()),
    mcpTokenHash: v.optional(v.string()),
    mcpTokenLast4: v.optional(v.string()),
  })
    .index("email", ["email"])
    .index("by_username", ["username"])
    .index("by_cliToken", ["cliToken"])
    .index("by_mcpToken", ["mcpToken"])
    .index("by_mcpTokenHash", ["mcpTokenHash"])
    .searchIndex("search_by_username", { searchField: "username" })
    .searchIndex("search_by_name", { searchField: "name" }),

  watchlist: defineTable({
    userId: v.id("users"),
    movieId: v.number(),
    movieTitle: v.string(),
    posterPath: v.string(),
    genreIds: v.optional(v.array(v.number())),
    addedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_movieId", ["userId", "movieId"]),

  watched: defineTable({
    userId: v.id("users"),
    movieId: v.number(),
    movieTitle: v.string(),
    posterPath: v.string(),
    genreIds: v.optional(v.array(v.number())),
    watchedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_movieId", ["userId", "movieId"])
    .index("by_userId_watchedAt", ["userId", "watchedAt"]),

  liked: defineTable({
    userId: v.id("users"),
    movieId: v.number(),
    movieTitle: v.string(),
    posterPath: v.string(),
    genreIds: v.optional(v.array(v.number())),
    likedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_movieId", ["userId", "movieId"]),

  blocks: defineTable({
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    isPublic: v.boolean(),
    movieCount: v.optional(v.number()),
    movies: v.optional(
      v.array(
        v.object({
          movieId: v.number(),
          movieTitle: v.string(),
          posterPath: v.string(),
          addedAt: v.number(),
        })
      )
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  saved_blocks: defineTable({
    userId: v.id("users"),
    blockId: v.id("blocks"),
    savedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_blockId", ["blockId"])
    .index("by_userId_blockId", ["userId", "blockId"]),

  stamps: defineTable({
    userId: v.id("users"),
    movieId: v.number(),
    mediaType: v.optional(v.union(v.literal("movie"), v.literal("tv"))),
    movieTitle: v.string(),
    posterPath: v.string(),
    reviewText: v.string(),
    isPublic: v.boolean(),
    isDraft: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_movieId", ["userId", "movieId"])
    .index("by_userId_isPublic", ["userId", "isPublic"]),

  mutation_throttles: defineTable({
    userId: v.id("users"),
    action: v.string(),
    lastAt: v.number(),
  })
    .index("by_userId_action", ["userId", "action"])
    .index("by_lastAt", ["lastAt"]),

  // Durable one-time receipts for stateless MCP write confirmations. The
  // signed preview carries actionId; this table makes the write idempotent.
  mcp_action_receipts: defineTable({
    userId: v.id("users"),
    actionId: v.string(),
    kind: v.union(v.literal("playlist"), v.literal("stamp")),
    blockId: v.optional(v.id("blocks")),
    stampId: v.optional(v.id("stamps")),
    movieCount: v.optional(v.number()),
    isPublic: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_userId_actionId", ["userId", "actionId"])
    .index("by_createdAt", ["createdAt"]),

  mcp_oauth_clients: defineTable({
    clientId: v.string(),
    clientName: v.optional(v.string()),
    redirectUris: v.array(v.string()),
    createdAt: v.number(),
  }).index("by_clientId", ["clientId"]),

  mcp_oauth_codes: defineTable({
    codeHash: v.string(),
    clientId: v.string(),
    redirectUri: v.string(),
    codeChallenge: v.string(),
    resource: v.string(),
    userId: v.id("users"),
    scope: v.string(),
    expiresAt: v.number(),
    usedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_codeHash", ["codeHash"])
    .index("by_userId", ["userId"]),

  mcp_oauth_tokens: defineTable({
    accessTokenHash: v.string(),
    refreshTokenHash: v.string(),
    clientId: v.string(),
    resource: v.string(),
    userId: v.id("users"),
    scope: v.string(),
    accessExpiresAt: v.number(),
    refreshExpiresAt: v.number(),
    revokedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_accessTokenHash", ["accessTokenHash"])
    .index("by_refreshTokenHash", ["refreshTokenHash"])
    .index("by_userId", ["userId"]),

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
  })
    .index("by_fetchedDate", ["fetchedDate"])
    .index("by_createdAt", ["createdAt"]),

  // Franchise Vault catalog — the database, not the code, decides which franchises
  // exist. Seeded once, grown by the weekly discovery cron, health-checked by the
  // hourly sync tick (see convex/franchises.ts). Rows stay small so the Vault grid
  // and Radar badges can read the whole table cheaply.
  franchises: defineTable({
    key: v.number(), // stable id the app uses (the TMDB collection id for plain collections)
    name: v.string(),
    overview: v.optional(v.string()), // only for rule-built franchises; collections use TMDB's
    source: franchiseSourceValidator,
    featuredMovieId: v.optional(v.number()), // whose poster/backdrop represents the franchise
    themeColor: v.optional(v.string()),
    badge: v.optional(v.object({ label: v.optional(v.string()), tone: v.optional(v.string()) })),
    rank: v.optional(v.number()), // curated order; discovered franchises sort by popularity
    origin: v.union(v.literal("seed"), v.literal("discovered")),
    status: v.union(v.literal("active"), v.literal("broken")),
    addedAt: v.number(),
    // Summary of the last good snapshot, so the grid never needs the full film list
    posterPath: v.optional(nullableString),
    filmCount: v.number(),
    partIds: v.array(v.number()),
    recent: v.array(v.object({ movieId: v.number(), releaseDate: v.string() })), // for Radar badges
    popularity: v.number(),
    // Schedule + health
    nextSyncAt: v.number(),
    syncedAt: v.optional(v.number()),
    failures: v.number(),
    health: v.optional(
      v.object({ ok: v.boolean(), checkedAt: v.number(), issues: v.array(v.string()) })
    ),
  })
    .index("by_key", ["key"])
    .index("by_nextSyncAt", ["nextSyncAt"]),

  // Full film list per franchise (last good TMDB snapshot), read by the Vault modal
  franchise_snapshots: defineTable({
    collectionId: v.number(), // = franchises.key
    name: v.string(),
    overview: v.string(),
    poster_path: nullableString,
    backdrop_path: nullableString,
    parts: v.array(franchisePartValidator),
    changedAt: v.number(), // last time the content actually changed
  }).index("by_collectionId", ["collectionId"]),

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
    role: v.optional(v.union(v.literal("admin"), v.literal("member"))),
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

  radar: defineTable({
    userId: v.id("users"),
    tmdbId: v.number(),
    title: v.string(),
    releaseDate: v.string(), // ISO format
    posterPath: v.string(),
    genreIds: v.array(v.number()),
    overview: v.string(),
    voteAverage: v.number(),
    popularity: v.number(),
    addedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_tmdbId", ["userId", "tmdbId"])
    .index("by_userId_releaseDate", ["userId", "releaseDate"])
    .index("by_releaseDate", ["releaseDate"]),

  // ─── CineSwipe ──────────────────────────────────────────────────────────────

  // Individual swipe records — used for "never show this movie again" filtering
  swipe_history: defineTable({
    userId: v.id("users"),
    movieId: v.number(),
    action: v.union(
      v.literal("liked"),
      v.literal("watchlist"),
      v.literal("watched"),
      v.literal("block"),
      v.literal("skip")
    ),
    swipedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_movieId", ["userId", "movieId"]),

  // Daily swipe counter — lightweight ledger for enforcing the 200/day limit
  swipe_daily: defineTable({
    userId: v.id("users"),
    date: v.string(), // ISO date e.g. "2026-04-10"
    count: v.number(),
  })
    .index("by_userId_date", ["userId", "date"]),
});

export default schema;
