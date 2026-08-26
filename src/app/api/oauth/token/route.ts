import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { isMcpTransportAllowed, mcpCorsHeaders } from "@/lib/mcpCors";

export const runtime = "nodejs";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const MAX_BODY_BYTES = 64 * 1024;

function headers(request: Request) { return mcpCorsHeaders(request); }

function oauthError(request: Request, description = "OAuth request could not be completed.", status = 400) {
  return NextResponse.json({ error: "invalid_grant", error_description: description }, { status, headers: headers(request) });
}

function canonicalResource(request: Request) {
  const base = (process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin).trim().replace(/\/+$/, "");
  return `${base}/api/mcp`;
}

export async function OPTIONS(request: NextRequest) {
  if (!isMcpTransportAllowed(request)) return NextResponse.json({ error: "Origin or host is not allowed." }, { status: 403, headers: headers(request) });
  return new Response(null, { status: 204, headers: headers(request) });
}

export async function POST(request: NextRequest) {
  if (!isMcpTransportAllowed(request)) return NextResponse.json({ error: "Origin or host is not allowed." }, { status: 403, headers: headers(request) });
  const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  if (contentType !== "application/x-www-form-urlencoded") return NextResponse.json({ error: "invalid_request" }, { status: 415, headers: headers(request) });
  const contentLengthHeader = request.headers.get("content-length");
  const contentLength = contentLengthHeader === null ? 0 : Number(contentLengthHeader);
  if (!Number.isSafeInteger(contentLength) || contentLength < 0 || contentLength > MAX_BODY_BYTES) return NextResponse.json({ error: "invalid_request" }, { status: 413, headers: headers(request) });

  try {
    const body = await request.text();
    if (new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES) return NextResponse.json({ error: "invalid_request" }, { status: 413, headers: headers(request) });
    const form = new URLSearchParams(body);
    const grantType = form.get("grant_type") ?? "";
    const clientId = form.get("client_id") ?? "";
    const resource = form.get("resource") ?? "";
    if (!clientId || !resource || clientId.length > 256 || resource.length > 2048) return oauthError(request, "client_id and resource are required.");
    if (resource !== canonicalResource(request)) return NextResponse.json({ error: "invalid_target", error_description: "The token resource must be CineBlock's MCP endpoint." }, { status: 400, headers: headers(request) });

    if (grantType === "authorization_code") {
      const code = form.get("code") ?? "";
      const redirectUri = form.get("redirect_uri") ?? "";
      const codeVerifier = form.get("code_verifier") ?? "";
      if (!code || !redirectUri || codeVerifier.length < 43 || code.length > 512 || redirectUri.length > 2048 || codeVerifier.length > 128) return oauthError(request, "code, redirect_uri, and a valid code_verifier are required.");
      const result = await convex.mutation(api.mcp.exchangeMcpAuthorizationCode, { code, clientId, redirectUri, codeVerifier, resource });
      return NextResponse.json({ access_token: result.accessToken, token_type: "Bearer", expires_in: result.expiresIn, refresh_token: result.refreshToken, scope: result.scope }, { headers: headers(request) });
    }

    if (grantType === "refresh_token") {
      const refreshToken = form.get("refresh_token") ?? "";
      if (!refreshToken || refreshToken.length > 256) return oauthError(request, "refresh_token is required.");
      const result = await convex.mutation(api.mcp.refreshMcpTokens, { refreshToken, clientId, resource });
      return NextResponse.json({ access_token: result.accessToken, token_type: "Bearer", expires_in: result.expiresIn, refresh_token: result.refreshToken, scope: result.scope }, { headers: headers(request) });
    }

    return NextResponse.json({ error: "unsupported_grant_type" }, { status: 400, headers: headers(request) });
  } catch (error) {
    console.error("MCP OAuth token request failed:", error instanceof Error ? error.name : "unknown error");
    return oauthError(request);
  }
}
