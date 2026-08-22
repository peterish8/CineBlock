import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { createMcpHandler, McpServer, type ContentBlock } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

export const runtime = "nodejs";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";
const MCP_TOKEN_REGEX = /^mcp_[0-9a-f]{64}$/;
const CONFIRMATION_TTL_MS = 10 * 60 * 1000;

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

function extractToken(request: Request): string | null {
  const value = request.headers.get("authorization");
  if (!value?.toLowerCase().startsWith("bearer ")) return null;
  const token = value.slice(7).trim();
  return MCP_TOKEN_REGEX.test(token) ? token : null;
}

async function authenticate(token: string | null, resource: string) {
  if (!token) throw new Error("MCP authentication required. Add your CineBlock MCP bearer token.");
  const result = await convex.query(api.users.pingMcpToken, { token });
  if (!result.ok) throw new Error("Invalid or revoked MCP token.");
  if (result.resource && result.resource !== resource) throw new Error("This OAuth token was issued for a different MCP resource.");
  return result;
}

async function tmdbFetch<T>(path: string): Promise<T> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) throw new Error("TMDB_API_KEY is not configured on the server.");
  const response = await fetch(`${TMDB_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    next: { revalidate: 300 },
  });
  if (!response.ok) throw new Error(`TMDB request failed (${response.status}).`);
  return response.json() as Promise<T>;
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
    const response = await fetch(posterUrl, { next: { revalidate: 3600 } });
    if (!response.ok) return null;
    const mimeType = response.headers.get("content-type")?.split(";")[0] || "image/jpeg";
    const data = Buffer.from(await response.arrayBuffer()).toString("base64");
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
  const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { kind: string; data: T; expiresAt: number };
  if (decoded.kind !== kind || decoded.expiresAt < Date.now()) throw new Error("Confirmation expired or invalid. Please preview again.");
  return decoded.data;
}

function textResult(text: string, images: Array<ContentBlock | null> = []) {
  return { content: [{ type: "text" as const, text }, ...images.filter((item): item is ContentBlock => item !== null)] };
}

function errorResult(error: unknown) {
  const message = error instanceof Error ? error.message : "MCP operation failed.";
  return { isError: true, ...textResult(message) };
}

function getBaseUrl(request: Request | undefined) {
  return process.env.NEXT_PUBLIC_APP_URL || (request ? new URL(request.url).origin : "http://localhost:3000");
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

const mcpHandler = createMcpHandler(({ requestInfo }) => {
  const token = requestInfo ? extractToken(requestInfo) : null;
  const baseUrl = getBaseUrl(requestInfo);
  const resource = `${baseUrl}/api/mcp`;
  const server = new McpServer({ name: "cineblock-mcp", version: "1.0.0" });

  server.registerTool(
    "find_titles",
    {
      description: "Search movies and TV series and show poster-backed candidates. Always use this before preparing a stamp for a title the user named in natural language.",
      annotations: { readOnlyHint: true, destructiveHint: false },
      inputSchema: z.object({ query: z.string().min(1).max(120), mediaType: z.enum(["movie", "tv"]).optional() }),
    },
    async ({ query, mediaType }) => {
      try {
        await authenticate(token, resource);
        const titles = await findTitles(query, mediaType);
        const images = await Promise.all(titles.slice(0, 4).map((title) => posterContent(title.posterUrl)));
        return textResult(
          titles.length
            ? `Choose the exact title before any write:\n${titles.map((title, index) => `${index + 1}. ${title.title} (${title.year ?? "year unknown"}) · ${title.mediaType} · TMDB ${title.id}\n   ${title.posterUrl ?? "No poster available"}\n   ${title.overview.slice(0, 180)}`).join("\n")}`
            : "No matching movie or series was found.",
          images,
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
        await authenticate(token, resource);
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
    "preview_playlist",
    {
      description: "Build a dry-run preview for a CineBlock playlist from liked, watchlist, and/or watched items. This is required before create_playlist and returns a signed confirmation token.",
      annotations: { readOnlyHint: true, destructiveHint: false },
      inputSchema: z.object({
        title: z.string().min(1).max(60),
        description: z.string().max(280).optional(),
        isPublic: z.boolean(),
        sources: z.array(z.enum(["liked", "watchlist", "watched"])).min(1).optional(),
        movieIds: z.array(z.number().int().positive()).max(35).optional(),
      }),
    },
    async ({ title, description, isPublic, sources, movieIds }) => {
      try {
        await authenticate(token, resource);
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
        const images = await Promise.all(selected.slice(0, 8).map((item) => posterContent(toPosterUrl(item.posterPath))));
        return textResult(
          `PLAYLIST PREVIEW — ${previewData.title}\nVisibility: ${isPublic ? "public" : "private"}\nTitles: ${selected.length}\nSources: ${selectedSources.join(", ")}\n\n${selected.map((item, index) => `${index + 1}. ${item.movieTitle} · TMDB ${item.movieId}\n   ${toPosterUrl(item.posterPath) ?? "No poster available"}`).join("\n")}\n\nNothing has been saved. Call create_playlist with confirmationToken only after the user approves this exact preview.\nconfirmationToken: ${confirmationToken}`,
          images,
        );
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    "create_playlist",
    {
      description: "Commit an approved preview_playlist into CineBlock. Never call this without the exact confirmationToken returned by preview_playlist.",
      annotations: { readOnlyHint: false, destructiveHint: false },
      inputSchema: z.object({ confirmationToken: z.string().min(20) }),
    },
    async ({ confirmationToken }) => {
      try {
        await authenticate(token, resource);
        const data = decodeConfirmation<{ actionId: string; title: string; description?: string; isPublic: boolean; movies: Array<{ movieId: number; movieTitle: string; posterPath: string }> }>(token!, confirmationToken, "playlist");
        const result = await convex.mutation(api.mcp.createPlaylist, { token: token!, ...data });
        const link = `${baseUrl}/cineblock/${result.blockId}`;
        return textResult(`Playlist saved: ${data.title}\n${result.movieCount} titles\nVisibility: ${result.isPublic ? "public" : "private"}\nShare link: ${link}${result.isPublic ? "" : " (private — only you can open it while signed in)"}`);
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    "preview_stamp",
    {
      description: "Resolve one exact movie or series from TMDB and preview the user's AI-written stamp. The poster, title, year, and media type are shown before save_stamp can write anything. Keep reviewText at or under 1,000 characters.",
      annotations: { readOnlyHint: true, destructiveHint: false },
      inputSchema: z.object({
        tmdbId: z.number().int().positive(),
        mediaType: z.enum(["movie", "tv"]),
        reviewText: z.string().min(1).max(1000),
        isPublic: z.boolean(),
      }),
    },
    async ({ tmdbId, mediaType, reviewText, isPublic }) => {
      try {
        await authenticate(token, resource);
        const title = await getTitle(tmdbId, mediaType);
        const data = { movieId: title.id, movieTitle: title.title, posterPath: title.posterPath ?? "", reviewText: reviewText.trim(), isPublic, mediaType, posterUrl: title.posterUrl, year: title.year };
        const confirmationToken = encodeConfirmation(token!, "stamp", data);
        const image = await posterContent(title.posterUrl);
        return textResult(
          `STAMP PREVIEW\nTitle: ${title.title}\nYear: ${title.year ?? "unknown"}\nType: ${mediaType === "tv" ? "TV series" : "movie"}\nTMDB ID: ${title.id}\nVisibility: ${isPublic ? "public" : "private"}\nCharacters: ${reviewText.trim().length}/1000\n\nReview:\n${reviewText.trim()}\n\nNothing has been saved. Call save_stamp with confirmationToken only after the user approves this exact title, poster, visibility, and text.\nconfirmationToken: ${confirmationToken}`,
          [image],
        );
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    "save_stamp",
    {
      description: "Commit an approved preview_stamp as a CineBlock stamp. Never call this without the exact confirmationToken returned by preview_stamp.",
      annotations: { readOnlyHint: false, destructiveHint: false },
      inputSchema: z.object({ confirmationToken: z.string().min(20) }),
    },
    async ({ confirmationToken }) => {
      try {
        await authenticate(token, resource);
        const data = decodeConfirmation<{ actionId: string; movieId: number; mediaType?: "movie" | "tv"; movieTitle: string; posterPath: string; reviewText: string; isPublic: boolean }>(token!, confirmationToken, "stamp");
        const result = await convex.mutation(api.mcp.createStamp, { token: token!, ...data });
        const link = `${baseUrl}/profile`;
        return textResult(`Stamp saved for ${data.movieTitle}.\nVisibility: ${result.isPublic ? "public" : "private"}\nProfile link: ${link}`);
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  return server;
}, { legacy: "stateless", responseMode: "json" });

function configuredOrigins() {
  return [process.env.MCP_ALLOWED_ORIGIN, process.env.NEXT_PUBLIC_APP_URL]
    .flatMap((value) => value?.split(",") ?? [])
    .map((value) => value.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

function isTransportAllowed(request: Request) {
  const configured = configuredOrigins();
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");
  if (origin) {
    if (configured.length) return configured.includes(origin);
    return process.env.NODE_ENV !== "production" && origin === requestUrl.origin;
  }

  const host = request.headers.get("host");
  const configuredHosts = configured.flatMap((value) => {
    try {
      return [new URL(value).host];
    } catch {
      return [];
    }
  });
  if (configuredHosts.length) return !!host && configuredHosts.includes(host);
  return process.env.NODE_ENV !== "production";
}

function corsHeaders(request?: Request) {
  const origin = request?.headers.get("origin");
  const allowedOrigin = origin && request && isTransportAllowed(request) ? origin : undefined;
  return {
    ...(allowedOrigin ? { "Access-Control-Allow-Origin": allowedOrigin } : {}),
    "Access-Control-Allow-Headers": "Authorization, Content-Type, Mcp-Method, Mcp-Name, Mcp-Protocol-Version",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Vary": "Origin",
  };
}

function oauthChallenge(request: Request) {
  const origin = getBaseUrl(request);
  return `Bearer realm="cineblock", resource_metadata="${origin}/.well-known/oauth-protected-resource", scope="cineblock"`;
}

async function handle(request: NextRequest): Promise<Response> {
  if (!isTransportAllowed(request)) {
    return NextResponse.json({ error: "MCP origin or host is not allowed." }, { status: 403, headers: corsHeaders(request) });
  }
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request) });

  const token = extractToken(request);
  if (!token) {
    return NextResponse.json({ error: "MCP bearer token required." }, { status: 401, headers: { ...corsHeaders(request), "WWW-Authenticate": oauthChallenge(request) } });
  }
  let auth: { ok: boolean; error?: string; resource?: string };
  try {
    auth = await convex.query(api.users.pingMcpToken, { token });
  } catch (error) {
    console.error("MCP auth backend error:", error);
    return NextResponse.json({ error: "MCP authentication backend is unavailable. Deploy the latest Convex functions first." }, { status: 503, headers: corsHeaders(request) });
  }
  if (!auth.ok) {
    return NextResponse.json({ error: "Invalid or revoked MCP token." }, { status: 401, headers: { ...corsHeaders(request), "WWW-Authenticate": oauthChallenge(request) } });
  }
  if (auth.resource && auth.resource !== `${getBaseUrl(request)}/api/mcp`) {
    return NextResponse.json({ error: "This OAuth token was issued for a different MCP resource." }, { status: 401, headers: { ...corsHeaders(request), "WWW-Authenticate": oauthChallenge(request) } });
  }

  const response = await mcpHandler.fetch(request);
  for (const [key, value] of Object.entries(corsHeaders(request))) response.headers.set(key, value);
  return response;
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
