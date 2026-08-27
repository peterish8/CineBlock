import { NextRequest, NextResponse } from "next/server";
import { isMcpTransportAllowed, mcpCorsHeaders } from "@/lib/mcpCors";

export const runtime = "nodejs";

function origin(request: NextRequest) {
  return (process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin).trim().replace(/\/+$/, "");
}

export function protectedResourceMetadata(request: NextRequest) {
  const base = origin(request);
  return {
    resource: `${base}/api/mcp`,
    authorization_servers: [base],
    scopes_supported: ["cineblock"],
    bearer_methods_supported: ["header"],
  };
}

export function protectedResourceResponse(request: NextRequest) {
  if (!isMcpTransportAllowed(request)) {
    return NextResponse.json({ error: "Origin or host is not allowed." }, { status: 403, headers: mcpCorsHeaders(request) });
  }
  return NextResponse.json(protectedResourceMetadata(request), {
    headers: { ...mcpCorsHeaders(request), "Cache-Control": "public, max-age=300" },
  });
}
