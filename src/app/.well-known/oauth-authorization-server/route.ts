import { NextRequest, NextResponse } from "next/server";
import { isMcpTransportAllowed, mcpCorsHeaders } from "@/lib/mcpCors";

export const runtime = "nodejs";

function origin(request: NextRequest) {
  return (process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin).trim().replace(/\/+$/, "");
}

export function GET(request: NextRequest) {
  if (!isMcpTransportAllowed(request)) return NextResponse.json({ error: "Origin or host is not allowed." }, { status: 403, headers: mcpCorsHeaders(request) });
  const base = origin(request);
  return NextResponse.json({
    issuer: base,
    authorization_endpoint: `${base}/oauth/authorize`,
    token_endpoint: `${base}/api/oauth/token`,
    registration_endpoint: `${base}/api/oauth/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    token_endpoint_auth_methods_supported: ["none"],
    code_challenge_methods_supported: ["S256"],
    scopes_supported: ["cineblock"],
    logo_uri: `${base}/brand/cineblock-icon-256.png`,
    client_id_metadata_document_supported: false,
    authorization_response_iss_parameter_supported: true,
  }, { headers: { ...mcpCorsHeaders(request), "Cache-Control": "public, max-age=300" } });
}
