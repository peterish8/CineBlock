import { NextRequest, NextResponse } from "next/server";
import { publicMcpCorsHeaders } from "@/lib/mcpCors";

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
  return NextResponse.json(protectedResourceMetadata(request), {
    headers: { ...publicMcpCorsHeaders(), "Cache-Control": "public, max-age=300" },
  });
}
