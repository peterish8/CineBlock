import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import * as z from "zod/v4";
import { isMcpTransportAllowed, mcpCorsHeaders } from "@/lib/mcpCors";

export const runtime = "nodejs";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const MAX_BODY_BYTES = 64 * 1024;
const clientMetadataSchema = z.object({
  client_name: z.string().trim().max(120).optional(),
  redirect_uris: z.array(z.string().min(1).max(2048)).min(1).max(10),
}).strict();

export async function OPTIONS(request: NextRequest) {
  if (!isMcpTransportAllowed(request)) return NextResponse.json({ error: "Origin or host is not allowed." }, { status: 403, headers: mcpCorsHeaders(request) });
  return new Response(null, { status: 204, headers: mcpCorsHeaders(request) });
}

export async function POST(request: NextRequest) {
  const responseHeaders = mcpCorsHeaders(request);
  if (!isMcpTransportAllowed(request)) return NextResponse.json({ error: "Origin or host is not allowed." }, { status: 403, headers: responseHeaders });
  const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  if (contentType !== "application/json") return NextResponse.json({ error: "invalid_client_metadata" }, { status: 415, headers: responseHeaders });
  const contentLengthHeader = request.headers.get("content-length");
  const contentLength = contentLengthHeader === null ? 0 : Number(contentLengthHeader);
  if (!Number.isSafeInteger(contentLength) || contentLength < 0 || contentLength > MAX_BODY_BYTES) return NextResponse.json({ error: "invalid_client_metadata" }, { status: 413, headers: responseHeaders });

  try {
    const body = await request.text();
    if (new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES) return NextResponse.json({ error: "invalid_client_metadata" }, { status: 413, headers: responseHeaders });
    let json: unknown;
    try {
      json = JSON.parse(body) as unknown;
    } catch {
      return NextResponse.json({ error: "invalid_client_metadata" }, { status: 400, headers: responseHeaders });
    }
    const parsed = clientMetadataSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "invalid_client_metadata" }, { status: 400, headers: responseHeaders });
    const result = await convex.mutation(api.mcp.registerMcpClient, { clientName: parsed.data.client_name, redirectUris: parsed.data.redirect_uris });
    return NextResponse.json({
      client_id: result.clientId,
      client_id_issued_at: Math.floor(Date.now() / 1000),
      client_name: parsed.data.client_name,
      redirect_uris: result.redirectUris,
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
    }, { status: 201, headers: responseHeaders });
  } catch (error) {
    console.error("MCP OAuth client registration failed:", error instanceof Error ? error.name : "unknown error");
    return NextResponse.json({ error: "invalid_client_metadata", error_description: "Client metadata was rejected." }, { status: 400, headers: responseHeaders });
  }
}
