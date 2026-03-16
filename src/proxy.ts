import { convexAuthNextjsMiddleware } from "@convex-dev/auth/nextjs/server";

// Middleware only wraps auth token into requests — client-side guards handle redirects
// (server-side isAuthenticated() has a race condition with the auth cookie on first navigation)
export default convexAuthNextjsMiddleware();

export const config = {
  // Exclude API routes, static files, and _next — proxy only guards pages
  matcher: ["/((?!api|.*\\..*|_next).*)"],
};
