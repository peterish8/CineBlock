import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function origin(request: NextRequest) {
  return (process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin).replace(/\/$/, "");
}

export function GET(request: NextRequest) {
  const base = origin(request);
  return NextResponse.json({
    resource: `${base}/api/mcp`,
    authorization_servers: [base],
    scopes_supported: ["cineblock"],
    bearer_methods_supported: ["header"],
  }, { headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=300" } });
}
