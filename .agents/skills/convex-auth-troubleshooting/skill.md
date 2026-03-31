---
name: Convex Auth Troubleshooting
description: Standards and debugging patterns for setting up and fixing @convex-dev/auth in a Next.js environment, specifically focusing on Google OAuth, environment variables, and proxy.ts.
---

# Purpose
To provide a reliable checklist and troubleshooting guide when `@convex-dev/auth` fails in a Next.js application, particularly for Google OAuth sign-in flows and environment mismatch errors.

# Core Concepts & Common Mistakes

## 1. Next.js 16 Proxy vs Middleware Conflict
- **The Issue:** Next.js 16 deprecated the `middleware.ts` convention in favor of `proxy.ts` for intercepting requests.
- **The Mistake:** Having both `src/middleware.ts` and `src/proxy.ts` causes build conflicts and silent runtime failures where authentication tokens (via `convexAuthNextjsMiddleware`) are not properly injected into requests, leading to server crashes or hydration errors.
- **The Fix:** Ensure only `src/proxy.ts` exists in your Next.js 16 app and it wraps your routes with `convexAuthNextjsMiddleware`. Delete `src/middleware.ts`.

## 2. Convex Cloud vs Convex Site URLs
- **The Issue:** The Convex Web Client and the Convex HTTP Actions server use different URL suffixes.
- **The Mistake:** Setting `NEXT_PUBLIC_CONVEX_URL` to a `.convex.site` address. 
- **The Fix:** 
  - `NEXT_PUBLIC_CONVEX_URL` **must** end in `.convex.cloud` (This is for the WebSocket client).
  - `NEXT_PUBLIC_CONVEX_SITE_URL` **must** end in `.convex.site` (This is for HTTP routing, like OAuth callbacks).
  - Vercel production environment variables often get this mixed up by developers copying and pasting the wrong URL.

## 3. Google OAuth Credentials & Redirect URIs
- **The Issue:** When clicking "Sign in with Google", you get a "Something went wrong" alert, or Google throws a `redirect_uri_mismatch` error.
- **The Mistake 1:** Setting `GOOGLE_CLIENT_ID` in Next.js (`.env.local`) but forgetting to set it inside the Convex backend itself. Convex handles the OAuth flow directly.
- **The Mistake 2:** Setting `http://localhost:3000/api/auth/callback/google` as the redirect URI in Google Cloud Console instead of the Convex HTTP site URL.
- **The Fix:**
  1. Run `npx convex env set GOOGLE_CLIENT_ID "your_client_id"` and `npx convex env set GOOGLE_CLIENT_SECRET "your_secret"` for your specific deployment.
  2. In Google Cloud Console, the **Authorized redirect URI** must be the **Convex Site URL**: `https://your-deployment-name.convex.site/api/auth/callback/google`.

## 4. Local Development vs Production Auth (The "Localhost Redirects to Prod" Issue)
- **The Issue:** Developing locally (`npm run dev`) but getting redirected to the production live site after successfully signing in via Google.
- **The Root Cause:** Your Next.js app is pointing to the **production** Convex deployment (`CONVEX_DEPLOYMENT=prod:...`). Inside that prod deployment, `SITE_URL` is set to `https://cineblock.in`. When Convex finishes OAuth, it redirects you back to the hardcoded `SITE_URL`.
- **The Best Practice Fix:** 
  1. Always use a **dev** deployment for local development. In your `.env.local`:
     ```env
     CONVEX_DEPLOYMENT=dev:your-dev-deployment-name
     ```
  2. Set the variables specifically on your dev deployment:
     ```bash
     npx convex env set SITE_URL "http://localhost:3000"
     ```
  3. This ensures local stays local, and production stays production. Never test auth on localhost using the shared production database unless necessary, as browser cookies and redirects will inevitably conflict.

# Debugging Checklist
If Auth drops out again, check these in order:
1. `npx convex env list` (Are `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `SITE_URL` correct for the deployment?)
2. Vercel Dashboard Env Vars (Are the `.cloud` and `.site` URLs properly assigned to the correct variables?)
3. `src/` directory (Is there a rogue `middleware.ts` breaking Next.js 16 conventions?)
