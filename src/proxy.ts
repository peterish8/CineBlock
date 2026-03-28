import { convexAuthNextjsMiddleware } from "@convex-dev/auth/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

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
      "img-src 'self' data: blob: https://image.tmdb.org https://lh3.googleusercontent.com https://avatars.githubusercontent.com",
      "media-src 'self'",
      "frame-src https://www.youtube.com https://youtube.com",
      "connect-src 'self' https://*.convex.cloud wss://*.convex.cloud https://api.themoviedb.org https://fonts.googleapis.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; ")
  );
  return response;
}

// Middleware wraps auth token into requests + applies security headers
// (client-side guards handle redirects to avoid auth race conditions)
export default convexAuthNextjsMiddleware((_request: NextRequest) => {
  return withSecurityHeaders(NextResponse.next());
});

export const config = {
  matcher: ["/((?!api|.*\\..*|_next).*)"],
};
