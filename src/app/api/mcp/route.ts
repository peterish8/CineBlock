import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { createMcpHandler, McpServer, type ContentBlock } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { isMcpTransportAllowed, mcpCorsHeaders, publicMcpCorsHeaders } from "@/lib/mcpCors";
import { CINEBLOCK_MCP_ICON, CONFIRMATION_CARD_URI, registerMcpAppResources, STAMP_INTERVIEW_URI, TITLE_CAROUSEL_URI } from "@/lib/mcpAppResources";

export const runtime = "nodejs";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";
const MCP_TOKEN_REGEX = /^mcp_[0-9a-f]{64}$/;
const CONFIRMATION_TTL_MS = 10 * 60 * 1000;
const MAX_MCP_BODY_BYTES = 1024 * 1024;
const MAX_TMDB_BODY_BYTES = 2 * 1024 * 1024;
const MAX_POSTER_BYTES = 4 * 1024 * 1024;
const TMDB_TIMEOUT_MS = 10_000;
const PUBLIC_MCP_TOOL_NAMES = [
  "find_titles",
  "get_library",
  "get_unstamped_watched",
  "preview_playlist",
  "create_playlist",
  "get_stamp_questions",
  "preview_stamp",
  "save_stamp",
] as const;

type MediaType = "movie" | "tv";
type TitlePreview = {
  id: number;
  mediaType: MediaType;
  title: string;
  year: string | null;
  overview: string;
  posterPath: string | null;
  posterUrl: string | null;
};

const titleCardOutputSchema = z.object({
  id: z.number().int().positive(),
  mediaType: z.enum(["movie", "tv"]),
  title: z.string(),
  year: z.string().nullable(),
  overview: z.string(),
  posterUrl: z.string().url().nullable(),
});
const titleSearchOutputSchema = z.object({
  kind: z.literal("title-search"),
  query: z.string(),
  titles: z.array(titleCardOutputSchema).max(8),
});
const unstampedWatchedOutputSchema = z.object({
  kind: z.literal("unstamped-watched"),
  scanned: z.number().int().nonnegative(),
  items: z.array(z.object({
    movieId: z.number().int().positive(),
    movieTitle: z.string(),
    posterUrl: z.string().url().nullable(),
    watchedAt: z.number().int().positive(),
  })).max(25),
});
const stampInterviewOutputSchema = z.object({
  kind: z.literal("stamp-interview"),
  movie: titleCardOutputSchema,
  existingDraft: z.boolean(),
  questions: z.array(z.object({
    id: z.enum(["feeling", "memory", "meaning"]),
    prompt: z.string(),
    helper: z.string(),
    options: z.array(z.string()).min(3).max(6),
    placeholder: z.string(),
  })).length(3),
});
const playlistPreviewOutputSchema = z.object({
  kind: z.literal("playlist-preview"),
  title: z.string(),
  description: z.string().optional(),
  isPublic: z.boolean(),
  sources: z.array(z.enum(["liked", "watchlist", "watched"])),
  movies: z.array(z.object({ movieId: z.number().int().positive(), movieTitle: z.string(), posterPath: z.string() })).max(35),
  confirmationToken: z.string(),
});
const stampPreviewOutputSchema = z.object({
  kind: z.literal("stamp-preview"),
  movie: titleCardOutputSchema,
  reviewText: z.string(),
  isPublic: z.boolean(),
  confirmationToken: z.string(),
});
const savedOutputSchema = z.object({
  kind: z.enum(["playlist-saved", "stamp-saved"]),
  title: z.string().optional(),
  movieTitle: z.string().optional(),
  message: z.string(),
  link: z.string().url(),
});

function extractToken(request: Request): string | null {
  const value = request.headers.get("authorization");
  if (!value?.toLowerCase().startsWith("bearer ")) return null;
  const token = value.slice(7).trim();
  return MCP_TOKEN_REGEX.test(token) ? token : null;
}

async function tmdbFetch<T>(path: string): Promise<T> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) throw new Error("TMDB_API_KEY is not configured on the server.");
  const response = await fetch(`${TMDB_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(TMDB_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`TMDB request failed (${response.status}).`);
  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (contentLength > MAX_TMDB_BODY_BYTES) throw new Error("TMDB response was too large.");
  const body = await response.text();
  if (new TextEncoder().encode(body).byteLength > MAX_TMDB_BODY_BYTES) throw new Error("TMDB response was too large.");
  return JSON.parse(body) as T;
}

function titleFromResult(item: {
  id: number;
  media_type?: string;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  overview?: string;
  poster_path?: string | null;
}): TitlePreview | null {
  const mediaType = item.media_type === "tv" ? "tv" : item.media_type === "movie" ? "movie" : null;
  if (!mediaType) return null;
  const title = item.title ?? item.name;
  if (!title) return null;
  const posterUrl = item.poster_path ? `${TMDB_IMAGE_BASE_URL}${item.poster_path}` : null;
  return {
    id: item.id,
    mediaType,
    title,
    year: (item.release_date ?? item.first_air_date)?.slice(0, 4) || null,
    overview: item.overview ?? "",
    posterPath: item.poster_path ?? null,
    posterUrl,
  };
}

async function findTitles(query: string, mediaType?: MediaType): Promise<TitlePreview[]> {
  const search = encodeURIComponent(query.trim().slice(0, 120));
  const data = await tmdbFetch<{ results?: Array<Parameters<typeof titleFromResult>[0]> }>(`/search/multi?query=${search}&include_adult=false&language=en-US&page=1`);
  return (data.results ?? [])
    .map(titleFromResult)
    .filter((item): item is TitlePreview => item !== null && (!mediaType || item.mediaType === mediaType))
    .slice(0, 8);
}

async function getTitle(id: number, mediaType: MediaType): Promise<TitlePreview> {
  const data = await tmdbFetch<Parameters<typeof titleFromResult>[0]>(`/${mediaType}/${id}?language=en-US`);
  const result = titleFromResult({ ...data, media_type: mediaType });
  if (!result) throw new Error("TMDB returned an incomplete title record.");
  return result;
}

function toTitleCard(title: TitlePreview) {
  return {
    id: title.id,
    mediaType: title.mediaType,
    title: title.title,
    year: title.year,
    overview: title.overview,
    posterUrl: title.posterUrl,
  };
}

async function posterContent(posterUrl: string | null): Promise<ContentBlock | null> {
  if (!posterUrl) return null;
  let parsed: URL;
  try {
    parsed = new URL(posterUrl);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" || parsed.hostname !== "image.tmdb.org" || !parsed.pathname.startsWith("/t/p/")) return null;
  try {
    const response = await fetch(posterUrl, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(TMDB_TIMEOUT_MS) });
    if (!response.ok) return null;
    const mimeType = response.headers.get("content-type")?.split(";")[0] || "image/jpeg";
    if (!mimeType.startsWith("image/")) return null;
    const contentLength = Number(response.headers.get("content-length") ?? 0);
    if (contentLength > MAX_POSTER_BYTES) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.byteLength > MAX_POSTER_BYTES) return null;
    const data = bytes.toString("base64");
    return { type: "image", data, mimeType };
  } catch {
    return null;
  }
}

function encodeConfirmation(token: string, kind: "playlist" | "stamp", data: unknown): string {
  const payload = Buffer.from(JSON.stringify({ kind, data: { actionId: randomUUID(), ...(data as object) }, expiresAt: Date.now() + CONFIRMATION_TTL_MS })).toString("base64url");
  const signature = createHmac("sha256", token).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function decodeConfirmation<T>(token: string, confirmationToken: string, kind: "playlist" | "stamp"): T {
  const [payload, signature] = confirmationToken.split(".");
  if (!payload || !signature || payload.length > 20000) throw new Error("Confirmation expired or invalid. Please preview again.");
  const expected = createHmac("sha256", token).update(payload).digest();
  const received = Buffer.from(signature, "base64url");
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) throw new Error("Confirmation expired or invalid. Please preview again.");
  let decoded: { kind?: string; data?: T; expiresAt?: number };
  try {
    decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as typeof decoded;
  } catch {
    throw new Error("Confirmation expired or invalid. Please preview again.");
  }
  const expiresAt = decoded.expiresAt;
  if (
    decoded.kind !== kind ||
    typeof expiresAt !== "number" ||
    !Number.isSafeInteger(expiresAt) ||
    expiresAt <= Date.now() ||
    !decoded.data ||
    typeof decoded.data !== "object"
  ) throw new Error("Confirmation expired or invalid. Please preview again.");
  return decoded.data;
}

function textResult(text: string, images: Array<ContentBlock | null> = [], structuredContent?: Record<string, unknown>) {
  return {
    ...(structuredContent ? { structuredContent } : {}),
    content: [{ type: "text" as const, text }, ...images.filter((item): item is ContentBlock => item !== null)],
  };
}

function errorResult(error: unknown) {
  const message = error instanceof Error ? error.message : "MCP operation failed.";
  return { isError: true, ...textResult(message) };
}

function getBaseUrl(request: Request | undefined) {
  return (process.env.NEXT_PUBLIC_APP_URL || (request ? new URL(request.url).origin : "http://localhost:3000")).trim().replace(/\/+$/, "");
}

function toPosterUrl(path: string | null | undefined) {
  if (!path) return null;
  if (path.startsWith("/")) return `${TMDB_IMAGE_BASE_URL}${path}`;
  try {
    const parsed = new URL(path);
    return parsed.protocol === "https:" && parsed.hostname === "image.tmdb.org" && parsed.pathname.startsWith("/t/p/") ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function escapeMarkdown(value: string) {
  return value.replace(/\s+/g, " ").replace(/[\\`*_{}[\]()#+.!|>]/g, "\\$&");
}

const STAMP_QUESTIONS = [
  {
    id: "feeling" as const,
    prompt: "What did it leave you feeling?",
    helper: "Choose one, or say it in your own words.",
    options: ["Moved", "Delighted", "Unsettled", "Thoughtful", "Disappointed"],
    placeholder: "Your feeling, in your words…",
  },
  {
    id: "memory" as const,
    prompt: "What stayed with you most?",
    helper: "A single detail is enough.",
    options: ["A scene or image", "A character", "A relationship", "An idea", "The mood or music"],
    placeholder: "The scene, person, idea, or detail…",
  },
  {
    id: "meaning" as const,
    prompt: "Why did that matter to you?",
    helper: "Skip this if the first two answers already say enough.",
    options: ["It felt personal", "It changed my view", "It confirmed something", "I am still unsure"],
    placeholder: "What it changed, confirmed, or left unresolved…",
  },
] as const;

function stampInterview(title: TitlePreview, existingDraft: boolean) {
  const safeTitle = escapeMarkdown(title.title);
  return [
    `# Stamp interview: ${safeTitle}`,
    "",
    existingDraft ? "A private draft already exists for this title. These answers may replace that draft only after preview and approval." : "Nothing has been saved.",
    "",
    "Answer any one to three prompts. Options are suggestions, not required wording:",
    "",
    ...STAMP_QUESTIONS.flatMap((question, index) => [
      `${index + 1}. **${question.prompt}**`,
      `   ${question.options.join(" · ")} · Own words`,
    ]),
    "",
    "Ask no additional questions unless the user explicitly requests a deeper interview. Accept partial answers, mixed languages, and informal wording. Draft only from what the user supplied, then call `preview_stamp`; never invent a reaction.",
  ].join("\n");
}

const mcpHandler = createMcpHandler(({ requestInfo }) => {
  const token = requestInfo ? extractToken(requestInfo) : null;
  const baseUrl = getBaseUrl(requestInfo);
  const server = new McpServer({
    name: "cineblock-mcp",
    title: "CineBlock",
    version: "1.0.0",
    websiteUrl: "https://www.cineblock.in",
    icons: [CINEBLOCK_MCP_ICON],
  });
  registerMcpAppResources(server);

  server.registerTool(
    "find_titles",
    {
      title: "Find your movie",
      description: "Search movies and TV series and return exact poster-backed candidates. ChatGPT-compatible hosts render these results as a CineBlock carousel. Always use this before preparing a stamp for a title the user named in natural language.",
      annotations: { readOnlyHint: true, destructiveHint: false },
      inputSchema: z.object({ query: z.string().trim().min(1).max(120), mediaType: z.enum(["movie", "tv"]).optional() }),
      outputSchema: titleSearchOutputSchema,
      _meta: {
        ui: { resourceUri: TITLE_CAROUSEL_URI },
        "openai/outputTemplate": TITLE_CAROUSEL_URI,
        "openai/toolInvocation/invoking": "Finding titles…",
        "openai/toolInvocation/invoked": "Titles ready.",
      },
    },
    async ({ query, mediaType }) => {
      try {
        const titles = await findTitles(query, mediaType);
        return textResult(
          titles.length
            ? `Choose the exact title before any write:\n${titles.map((title, index) => `${index + 1}. ${escapeMarkdown(title.title)} (${escapeMarkdown(title.year ?? "year unknown")}) · ${title.mediaType} · TMDB ${title.id}\n   ${title.posterUrl ?? "No poster available"}\n   ${escapeMarkdown(title.overview.slice(0, 180))}`).join("\n")}`
            : "No matching movie or series was found.",
          [],
          { kind: "title-search", query, titles: titles.map(toTitleCard) },
        );
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    "get_library",
    {
      description: "Read the authenticated user's liked/favourite, watchlist, and watched collections from CineBlock. This never writes.",
      annotations: { readOnlyHint: true, destructiveHint: false },
      inputSchema: z.object({}),
    },
    async () => {
      try {
        const library = await convex.query(api.mcp.getLibrary, { token: token! });
        return textResult(JSON.stringify({
          user: library.user,
          liked: library.liked,
          watchlist: library.watchlist,
          watched: library.watched,
        }, null, 2));
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    "get_unstamped_watched",
    {
      title: "Find unwritten watched titles",
      description: "Show recently watched CineBlock titles that do not yet have a stamp, up to 25 at a time. Use this when a user asks what they can stamp next. These are library candidates only: call find_titles to confirm the exact TMDB movie or series identity before starting a stamp interview. This never writes.",
      annotations: { readOnlyHint: true, destructiveHint: false },
      inputSchema: z.object({ limit: z.number().int().min(1).max(25).default(10) }),
      outputSchema: unstampedWatchedOutputSchema,
    },
    async ({ limit }) => {
      try {
        const result = await convex.query(api.mcp.getUnstampedWatched, { token: token!, limit });
        const items = result.items.map((item) => ({
          movieId: item.movieId,
          movieTitle: item.movieTitle,
          posterUrl: toPosterUrl(item.posterPath),
          watchedAt: item.watchedAt,
        }));
        const intro = items.length
          ? `Found ${items.length} unstamped title${items.length === 1 ? "" : "s"} among your ${result.scanned} most recently watched. Choose one, then call find_titles before the stamp interview.`
          : `No unstamped titles were found among your ${result.scanned} most recently watched. Mark another title as watched or revisit a private draft from CineBlock.`;
        return textResult(
          `${intro}${items.length ? `\n\n${items.map((item, index) => `${index + 1}. ${escapeMarkdown(item.movieTitle)} · library ID ${item.movieId}\n   ${item.posterUrl ?? "No poster available"}`).join("\n")}` : ""}`,
          [],
          { kind: "unstamped-watched", scanned: result.scanned, items },
        );
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    "preview_playlist",
    {
      title: "Preview a CineBlock",
      description: "Build a dry-run preview for a CineBlock playlist from liked, watchlist, and/or watched items. ChatGPT-compatible hosts render the exact preview as an in-chat approval card. This is required before create_playlist and returns a signed confirmation token.",
      annotations: { readOnlyHint: true, destructiveHint: false },
      inputSchema: z.object({
        title: z.string().trim().min(1).max(60),
        description: z.string().trim().max(280).optional(),
        isPublic: z.boolean(),
        sources: z.array(z.enum(["liked", "watchlist", "watched"])).min(1).optional(),
        movieIds: z.array(z.number().int().positive()).max(35).optional(),
      }),
      outputSchema: playlistPreviewOutputSchema,
      _meta: {
        ui: { resourceUri: CONFIRMATION_CARD_URI },
        "openai/outputTemplate": CONFIRMATION_CARD_URI,
        "openai/toolInvocation/invoking": "Preparing your CineBlock…",
        "openai/toolInvocation/invoked": "Preview ready for approval.",
      },
    },
    async ({ title, description, isPublic, sources, movieIds }) => {
      try {
        const library = await convex.query(api.mcp.getLibrary, { token: token! });
        const selectedSources = sources?.length ? sources : ["liked", "watchlist", "watched"] as const;
        const byId = new Map<number, { movieId: number; movieTitle: string; posterPath: string }>();
        for (const source of selectedSources) {
          for (const item of library[source]) {
            if (!byId.has(item.movieId)) byId.set(item.movieId, { movieId: item.movieId, movieTitle: item.movieTitle, posterPath: item.posterPath });
          }
        }
        const missingIds = movieIds?.filter((id) => !byId.has(id)) ?? [];
        if (missingIds.length) return errorResult(new Error(`The requested TMDB IDs are not present in the selected library sources: ${missingIds.join(", ")}. Nothing was saved.`));
        const selected = movieIds?.length ? movieIds.map((id) => byId.get(id)).filter((item): item is NonNullable<typeof item> => !!item) : Array.from(byId.values());
        if (!selected.length) return errorResult(new Error("The preview contains no titles. Check the requested source or movie IDs."));
        if (selected.length > 35) return errorResult(new Error("The preview contains more than CineBlock's 35-title limit. Narrow the source or movie IDs."));
        const previewData = { title: title.trim(), description: description?.trim() || undefined, isPublic, movies: selected };
        const confirmationToken = encodeConfirmation(token!, "playlist", previewData);
        return textResult(
          `PLAYLIST PREVIEW — ${escapeMarkdown(previewData.title)}\nVisibility: ${isPublic ? "public" : "private"}\nTitles: ${selected.length}\nSources: ${selectedSources.join(", ")}\n\n${selected.map((item, index) => `${index + 1}. ${escapeMarkdown(item.movieTitle)} · TMDB ${item.movieId}\n   ${toPosterUrl(item.posterPath) ?? "No poster available"}`).join("\n")}\n\nNothing has been saved. Call create_playlist with confirmationToken only after the user approves this exact preview.\nconfirmationToken: ${confirmationToken}`,
          [],
          { kind: "playlist-preview", ...previewData, confirmationToken },
        );
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    "create_playlist",
    {
      title: "Save CineBlock",
      description: "Commit an approved preview_playlist into CineBlock. Never call this without the exact confirmationToken returned by preview_playlist. The UI only asks ChatGPT to perform this call after the user approves.",
      annotations: { readOnlyHint: false, destructiveHint: false },
      inputSchema: z.object({ confirmationToken: z.string().min(20) }),
      outputSchema: savedOutputSchema,
      _meta: {
        ui: { resourceUri: CONFIRMATION_CARD_URI },
        "openai/outputTemplate": CONFIRMATION_CARD_URI,
        "openai/toolInvocation/invoking": "Saving your CineBlock…",
        "openai/toolInvocation/invoked": "CineBlock saved.",
      },
    },
    async ({ confirmationToken }) => {
      try {
        const data = decodeConfirmation<{ actionId: string; title: string; description?: string; isPublic: boolean; movies: Array<{ movieId: number; movieTitle: string; posterPath: string }> }>(token!, confirmationToken, "playlist");
        const result = await convex.mutation(api.mcp.createPlaylist, { token: token!, ...data });
        const link = `${baseUrl}/cineblock/${result.blockId}`;
        return textResult(
          `Playlist saved: ${data.title}\n${result.movieCount} titles\nVisibility: ${result.isPublic ? "public" : "private"}\nShare link: ${link}${result.isPublic ? "" : " (private — only you can open it while signed in)"}`,
          [],
          { kind: "playlist-saved", title: data.title, message: `${result.movieCount} titles · ${result.isPublic ? "public" : "private"}`, link },
        );
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    "get_stamp_questions",
    {
      title: "Start a personal stamp",
      description: "After find_titles confirms one exact title, render CineBlock's compact three-prompt personal stamp interview. In MCP App hosts, let the user tap an option or add their own words inside the card; do not copy the prompts into the chat composer. Accept one to three answers, including mixed languages. Do not ask extra questions unless the user explicitly asks for a deeper interview. Use only the answers supplied to draft a concise first-person, spoiler-light stamp, then call preview_stamp. This is read-only and saves nothing.",
      annotations: { readOnlyHint: true, destructiveHint: false },
      inputSchema: z.object({
        tmdbId: z.number().int().positive(),
        mediaType: z.enum(["movie", "tv"]),
      }),
      outputSchema: stampInterviewOutputSchema,
      _meta: {
        ui: { resourceUri: STAMP_INTERVIEW_URI },
        "openai/outputTemplate": STAMP_INTERVIEW_URI,
        "openai/toolInvocation/invoking": "Preparing your stamp prompts…",
        "openai/toolInvocation/invoked": "Your stamp prompts are ready.",
      },
    },
    async ({ tmdbId, mediaType }) => {
      try {
        const [title, status] = await Promise.all([
          getTitle(tmdbId, mediaType),
          convex.query(api.mcp.getStampStatus, { token: token!, movieId: tmdbId, mediaType }),
        ]);
        if (status === "published") {
          return errorResult(new Error("You already stamped this title. Open the existing stamp in CineBlock if you want to revisit it."));
        }
        const image = await posterContent(title.posterUrl);
        return textResult(
          stampInterview(title, status === "draft"),
          [image],
          { kind: "stamp-interview", movie: toTitleCard(title), existingDraft: status === "draft", questions: STAMP_QUESTIONS },
        );
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    "preview_stamp",
    {
      title: "Preview a stamp",
      description: "Resolve one exact movie or series from TMDB and preview a user-approved personal feeling written in Markdown. ChatGPT-compatible hosts render the exact poster, title, visibility, and text as an in-chat approval card. Before calling this, collect one to three answers through get_stamp_questions. Do not interrogate the user further or invent a reaction. Draft only from their answers; never write a formal critic review, do not use HTML, and keep reviewText at or under 1,000 characters.",
      annotations: { readOnlyHint: true, destructiveHint: false },
      inputSchema: z.object({
        tmdbId: z.number().int().positive(),
        mediaType: z.enum(["movie", "tv"]),
        reviewText: z.string().trim().min(1).max(1000).describe("The user's first-person personal feeling in Markdown, maximum 1,000 characters. No HTML, invented reactions, or critic-style summary."),
        isPublic: z.boolean(),
      }),
      outputSchema: stampPreviewOutputSchema,
      _meta: {
        ui: { resourceUri: CONFIRMATION_CARD_URI },
        "openai/outputTemplate": CONFIRMATION_CARD_URI,
        "openai/toolInvocation/invoking": "Preparing your stamp…",
        "openai/toolInvocation/invoked": "Stamp preview ready.",
      },
    },
    async ({ tmdbId, mediaType, reviewText, isPublic }) => {
      try {
        const title = await getTitle(tmdbId, mediaType);
        const data = { movieId: title.id, movieTitle: title.title, posterPath: title.posterPath ?? "", reviewText: reviewText.trim(), isPublic, mediaType, posterUrl: title.posterUrl, year: title.year };
        const confirmationToken = encodeConfirmation(token!, "stamp", data);
        return textResult(
          `# STAMP PREVIEW — ${title.title}\n\n## Confirm the exact title\n- **Year:** ${title.year ?? "unknown"}\n- **Type:** ${mediaType === "tv" ? "TV series" : "movie"}\n- **TMDB ID:** ${title.id}\n- **Visibility:** ${isPublic ? "public" : "private"}\n- **Characters:** ${reviewText.trim().length}/1000\n- **Poster:** ${title.posterUrl ?? "No poster available"}\n\n## Personal feeling\n\n${reviewText.trim()}\n\n---\nNothing has been saved. Call the save_stamp tool with the confirmationToken only after the user approves this exact title, poster, visibility, and Markdown text.\n\n**confirmationToken:** ${confirmationToken}`,
          [],
          { kind: "stamp-preview", movie: toTitleCard(title), reviewText: reviewText.trim(), isPublic, confirmationToken },
        );
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    "save_stamp",
    {
      title: "Save stamp",
      description: "Commit an approved Markdown personal feeling as a CineBlock stamp. Never call this without the exact confirmationToken returned by preview_stamp; do not rewrite, sanitize, or replace the approved text between preview and save. The UI only asks ChatGPT to perform this call after the user approves.",
      annotations: { readOnlyHint: false, destructiveHint: false },
      inputSchema: z.object({ confirmationToken: z.string().min(20) }),
      outputSchema: savedOutputSchema,
      _meta: {
        ui: { resourceUri: CONFIRMATION_CARD_URI },
        "openai/outputTemplate": CONFIRMATION_CARD_URI,
        "openai/toolInvocation/invoking": "Saving your stamp…",
        "openai/toolInvocation/invoked": "Stamp saved.",
      },
    },
    async ({ confirmationToken }) => {
      try {
        const data = decodeConfirmation<{ actionId: string; movieId: number; mediaType?: "movie" | "tv"; movieTitle: string; posterPath: string; reviewText: string; isPublic: boolean }>(token!, confirmationToken, "stamp");
        const result = await convex.mutation(api.mcp.createStamp, { token: token!, ...data });
        const link = `${baseUrl}/profile`;
        return textResult(
          `Stamp saved for ${data.movieTitle}.\nVisibility: ${result.isPublic ? "public" : "private"}\nProfile link: ${link}`,
          [],
          { kind: "stamp-saved", movieTitle: data.movieTitle, message: result.isPublic ? "Public stamp" : "Private stamp", link },
        );
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  return server;
}, { legacy: "stateless", responseMode: "json" });

function oauthChallenge(request: Request) {
  const origin = getBaseUrl(request);
  return `Bearer realm="cineblock", resource_metadata="${origin}/.well-known/oauth-protected-resource/api/mcp", scope="cineblock"`;
}

async function handle(request: NextRequest): Promise<Response> {
  // Keep the browser-facing capability probe compatible with NotesKit. This
  // descriptor contains no user data and does not execute tools; all MCP JSON-
  // RPC calls below still require an OAuth bearer token.
  if (request.method === "GET") {
    return NextResponse.json({
      name: "cineblock",
      protocol: "2026-07-28",
      tools: PUBLIC_MCP_TOOL_NAMES,
    }, { headers: publicMcpCorsHeaders() });
  }
  if (!isMcpTransportAllowed(request)) {
    return NextResponse.json({ error: "MCP origin or host is not allowed." }, { status: 403, headers: mcpCorsHeaders(request) });
  }
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: mcpCorsHeaders(request) });
  const contentLengthHeader = request.headers.get("content-length");
  const contentLength = contentLengthHeader === null ? 0 : Number(contentLengthHeader);
  if (!Number.isSafeInteger(contentLength) || contentLength < 0 || contentLength > MAX_MCP_BODY_BYTES) {
    return NextResponse.json({ error: "MCP request body is too large or invalid." }, { status: 413, headers: mcpCorsHeaders(request) });
  }

  const token = extractToken(request);
  if (!token) {
    return NextResponse.json({ error: "MCP bearer token required." }, { status: 401, headers: { ...mcpCorsHeaders(request), "WWW-Authenticate": oauthChallenge(request) } });
  }
  let auth: { ok: boolean; error?: string; resource?: string };
  try {
    auth = await convex.query(api.users.pingMcpToken, { token });
  } catch (error) {
    console.error("MCP auth backend error:", error);
    return NextResponse.json({ error: "MCP authentication backend is unavailable. Deploy the latest Convex functions first." }, { status: 503, headers: mcpCorsHeaders(request) });
  }
  if (!auth.ok) {
    return NextResponse.json({ error: "Invalid or revoked MCP token." }, { status: 401, headers: { ...mcpCorsHeaders(request), "WWW-Authenticate": oauthChallenge(request) } });
  }
  if (auth.resource && auth.resource !== `${getBaseUrl(request)}/api/mcp`) {
    return NextResponse.json({ error: "This OAuth token was issued for a different MCP resource." }, { status: 401, headers: { ...mcpCorsHeaders(request), "WWW-Authenticate": oauthChallenge(request) } });
  }

  try {
    const response = await mcpHandler.fetch(request);
    for (const [key, value] of Object.entries(mcpCorsHeaders(request))) response.headers.set(key, value);
    return response;
  } catch (error) {
    console.error("MCP request handling failed:", error instanceof Error ? error.name : "unknown error");
    return NextResponse.json({ error: "MCP request could not be completed." }, { status: 500, headers: mcpCorsHeaders(request) });
  }
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}

export async function OPTIONS(request: NextRequest) {
  return handle(request);
}
