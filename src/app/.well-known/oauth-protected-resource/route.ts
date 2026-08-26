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
    resource: `${base}/api/mcp`,
    authorization_servers: [base],
    scopes_supported: ["cineblock"],
    bearer_methods_supported: ["header"],
  }, { headers: { ...mcpCorsHeaders(request), "Cache-Control": "public, max-age=300" } });
}
