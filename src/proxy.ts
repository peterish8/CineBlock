import { NextFetchEvent, NextRequest, NextResponse } from "next/server";
import { convexAuthNextjsMiddleware } from "@convex-dev/auth/nextjs/server";

function withSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()"
  );
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "media-src 'self'",
      "frame-src https://www.youtube.com https://youtube.com",
      "connect-src 'self' https://*.convex.cloud wss://*.convex.cloud https://*.convex.site wss://*.convex.site https://api.themoviedb.org https://fonts.googleapis.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; ")
  );
  return response;
}

// MCP protocol endpoints own their authentication and CORS decisions. ChatGPT
// may call OAuth registration with Origin: null; Convex Auth's CORS helper
// parses Origin as a URL and would throw before these routes can handle the
// request. Keep protocol traffic outside cookie auth middleware while retaining
// the same security headers. The MCP route still requires its bearer token.
const authMiddleware = convexAuthNextjsMiddleware(() => {
  return withSecurityHeaders(NextResponse.next());
});

export default async function proxy(request: NextRequest, event: NextFetchEvent) {
  if (["/api/mcp", "/api/oauth/register", "/api/oauth/token"].includes(request.nextUrl.pathname)) {
    return withSecurityHeaders(NextResponse.next());
  }
  return authMiddleware(request, event);
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
