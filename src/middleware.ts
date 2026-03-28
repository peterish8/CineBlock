import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // ── Security Headers ──────────────────────────────────────────────────────
  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");

  // Prevent MIME sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Control referrer info sent to other sites
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Disable browser features not used by this app
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()"
  );

  // Force HTTPS for 2 years (only applies in production over HTTPS)
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );

  // Content Security Policy — tailored to CineBlock's needs:
  //   - Images: TMDB CDN, Google (auth avatars)
  //   - Scripts: self + YouTube (iframe)
  //   - Frames: YouTube only (trailer embeds)
  //   - Connect: Convex WebSocket + HTTPS, TMDB API
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",  // Next.js needs these for hydration
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

// Apply to all routes except static files and Next.js internals
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.png|og-image.png).*)",
  ],
};
