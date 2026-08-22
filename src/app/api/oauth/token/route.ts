import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

export const runtime = "nodejs";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function headers() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Cache-Control": "no-store",
  };
}

function oauthError(error: unknown, status = 400) {
  const description = error instanceof Error ? error.message : "OAuth request failed.";
  return NextResponse.json({ error: "invalid_grant", error_description: description }, { status, headers: headers() });
}

function canonicalResource(request: Request) {
  const base = (process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin).replace(/\/$/, "");
  return `${base}/api/mcp`;
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: headers() });
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const grantType = String(form.get("grant_type") ?? "");
    const clientId = String(form.get("client_id") ?? "");
    const resource = String(form.get("resource") ?? "");
    if (!clientId || !resource) return oauthError(new Error("client_id and resource are required."));
    if (resource !== canonicalResource(request)) return NextResponse.json({ error: "invalid_target", error_description: "The token resource must be CineBlock's MCP endpoint." }, { status: 400, headers: headers() });

    if (grantType === "authorization_code") {
      const code = String(form.get("code") ?? "");
      const redirectUri = String(form.get("redirect_uri") ?? "");
      const codeVerifier = String(form.get("code_verifier") ?? "");
      if (!code || !redirectUri || !codeVerifier) return oauthError(new Error("code, redirect_uri, and code_verifier are required."));
      const result = await convex.mutation(api.mcp.exchangeMcpAuthorizationCode, { code, clientId, redirectUri, codeVerifier, resource });
      return NextResponse.json({ access_token: result.accessToken, token_type: "Bearer", expires_in: result.expiresIn, refresh_token: result.refreshToken, scope: result.scope }, { headers: headers() });
    }

    if (grantType === "refresh_token") {
      const refreshToken = String(form.get("refresh_token") ?? "");
      if (!refreshToken) return oauthError(new Error("refresh_token is required."));
      const result = await convex.mutation(api.mcp.refreshMcpTokens, { refreshToken, clientId, resource });
      return NextResponse.json({ access_token: result.accessToken, token_type: "Bearer", expires_in: result.expiresIn, refresh_token: result.refreshToken, scope: result.scope }, { headers: headers() });
    }

    return NextResponse.json({ error: "unsupported_grant_type" }, { status: 400, headers: headers() });
  } catch (error) {
    console.error("MCP OAuth token error:", error);
    return oauthError(error);
  }
}
