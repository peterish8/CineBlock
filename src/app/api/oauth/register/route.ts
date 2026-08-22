import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

export const runtime = "nodejs";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: cors });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { client_name?: string; redirect_uris?: string[] };
    if (!Array.isArray(body.redirect_uris)) return NextResponse.json({ error: "invalid_client_metadata" }, { status: 400, headers: cors });
    const result = await convex.mutation(api.mcp.registerMcpClient, { clientName: body.client_name, redirectUris: body.redirect_uris });
    return NextResponse.json({
      client_id: result.clientId,
      client_id_issued_at: Math.floor(Date.now() / 1000),
      client_name: body.client_name,
      redirect_uris: result.redirectUris,
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
    }, { status: 201, headers: cors });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid client metadata.";
    return NextResponse.json({ error: "invalid_client_metadata", error_description: message }, { status: 400, headers: cors });
  }
}
