# CineBlock — Claude project memory

Last reviewed: 2026-08-22

@AGENTS.md

## Project identity

CineBlock is a movie and series discovery, collection, and sharing app. Users can discover titles through TMDB, maintain liked/favourite, watchlist, and watched libraries, create shareable CineBlocks, use CineSwipe, write personal stamps, and connect an AI client through a protected stateless MCP endpoint.

- Production: https://www.cineblock.in
- Repository: https://github.com/peterish8/CineBlock
- Current branch used for MCP/OAuth work: `codex/mcp-oauth`
- Product feel: cinematic night-glass UI; posters and titles remain the visual heroes.

The root `index.html` and legacy files are not the source of truth for the current app. The current product is the Next.js App Router application under `src/` with Convex under `convex/`.

## Source-of-truth order

When instructions conflict, use this order:

1. The user’s current request and explicit scope.
2. This file and `AGENTS.md` for project conventions.
3. `README.md` for product capabilities and local setup.
4. `MCP.md` for MCP/OAuth behavior and deployment notes.
5. The implementation and generated types in the relevant feature area.

Read only the relevant route, component, hook, backend function, and schema before editing. Do not treat old planning documents or generated build output as current behavior without checking the implementation.

## Stack and architecture

- Next.js App Router, React, TypeScript, Tailwind CSS, Framer Motion, and Lucide.
- Convex is the durable backend and database. Schema: `convex/schema.ts`.
- Convex Auth and `@auth/core` handle application authentication.
- TMDB supplies movie, TV, poster, credits, and discovery metadata.
- `/api/*` contains Next.js Route Handlers for server-side integrations.
- `convex/*.ts` contains queries, mutations, actions, HTTP functions, scheduled work, and domain logic.
- `src/components/` contains reusable UI; `src/hooks/` contains client behavior; `src/lib/` contains shared types, TMDB helpers, cache helpers, and theme configuration.
- `src/app/globals.css` owns the glass/brutalist theme tokens and shared visual primitives.
- `MCP.md`, `src/app/api/mcp/route.ts`, `convex/mcp.ts`, and the OAuth routes are the MCP integration seam.

Keep data ownership clear:

- Client components manage interaction, local UI state, browser APIs, and optimistic presentation.
- Server components and Route Handlers keep secrets and server-only integration logic off the client.
- Convex functions own authenticated reads/writes and durable state.
- Never call Convex internals or TMDB with privileged credentials from a browser component.

## Local commands

```text
npm install
npm run dev
npm run lint
npx tsc --noEmit
npm run build
npx convex dev
```

Run `npm run lint`, `npx tsc --noEmit`, and `npm run build` for meaningful code changes. There is currently no `npm test` script in `package.json`; do not report tests as passing unless a real test command exists and was run.

`npx convex dev` is the local development sync loop. Production Convex deployment is a deliberate release operation and requires the production deploy key; do not run it casually from a local shell.

## Environment and deployment

Secrets belong in `.env.local` or the Vercel/Convex environment configuration, never in Markdown, source, commits, screenshots, or chat output. Do not print secret values while diagnosing configuration.

Recognized configuration includes:

- `NEXT_PUBLIC_CONVEX_URL` and `NEXT_PUBLIC_CONVEX_SITE_URL` — browser-safe Convex URLs.
- `CONVEX_DEPLOYMENT` — the local Convex deployment selector.
- `CONVEX_SITE_URL` — Convex Auth/server configuration where required.
- `SITE_URL` and `NEXT_PUBLIC_APP_URL` — canonical origin and share-link host.
- `TMDB_API_KEY` — server-only TMDB credential.
- `MCP_ALLOWED_ORIGIN` — exact browser-origin allowlist for MCP CORS.
- `CONVEX_DEPLOY_KEY` — production/CI-only deploy credential; keep it scoped to the environment that deploys Convex.

Credential boundaries are strict: `cb_...` is the CineBlock Terminal CLI token for movie search and its daily quota, while `mcp_...` is the separate ChatGPT/MCP credential for library access, playlist actions, and stamps. The website must explain this distinction and never suggest swapping the two credentials.

The Git-connected Vercel project uses Preview for non-production branches and Production for the production branch. Environment changes apply only to new deployments, so redeploy after changing them. The Vercel CLI is optional for Git deployments; if CLI operations are needed, install it with `npm i -g vercel` and use `vercel env pull`, `vercel deploy`, or `vercel logs` deliberately.

Before calling a deployment complete, verify the actual deployment URL and, for production, check:

- `/` responds successfully.
- `/.well-known/oauth-protected-resource` and `/.well-known/oauth-authorization-server` return valid JSON.
- `/api/mcp` rejects unauthenticated access with an OAuth challenge.
- MCP CORS preflight works only for the configured client origins.

## MCP and OAuth contract

CineBlock’s MCP endpoint is stateless at:

`https://www.cineblock.in/api/mcp`

The server does not keep MCP session state in process memory. Durable user data, OAuth records, and write receipts live in Convex. OAuth uses dynamic client registration, authorization code flow, S256 PKCE, short-lived access tokens, and refresh-token support. The exact endpoint metadata and setup instructions live in `MCP.md`.

Available MCP behavior includes:

- `find_titles` — resolve movie/series candidates with poster-backed identity data.
- `get_library` — read liked/favourite, watchlist, and watched titles.
- `preview_playlist` then `create_playlist` — create a public/private CineBlock only after exact preview confirmation.
- `preview_stamp` then `save_stamp` — resolve one exact title, preview the poster/title/year/type and <=1,000-character text, then save only that approved item.

CineBlock Terminal has two search modes: AI natural-language search, which requires the user’s own provider key, and Guided no-AI search, which asks the same three filters as the website—story signal, language, and release era—and calls `/api/find-movie` for five server-ranked results.

Never collapse preview and write into one unsafe action. A write must carry the exact short-lived confirmation handle returned by the matching preview. Preserve idempotency and durable action receipts when changing this flow. Any title write must be anchored to an exact TMDB identifier and media type, not only a fuzzy title string.

When changing MCP tools, preserve real input schemas, explicit required/optional fields, safe tool annotations, authenticated user scoping, and current protocol metadata. Test both discovery and invocation; clients may cache schemas, so document when reconnecting is required.

## UI and product rules

The Glass theme is the permanent CineBlock product theme for every user. It is a treatment over CineBlock’s existing identity, not permission for a generic redesign. Do not add theme switching or a user-selectable brutalist/default mode.

- Foundation: deep ink/navy backgrounds (`#020817`, `#050F2E`, `#0A1628`).
- Primary: electric blue (`#60A5FA`) for navigation, focus, and active states.
- Accent: warm orange (`#F97316`) for poster energy, highlights, and film moments.
- Surfaces: translucent white layers with blur, subtle top specular light, and restrained shadows.
- Legacy brutalist classes may remain for compatibility, but they are not a user-facing theme. New user-facing UI must use Glass.
- Keep posters, titles, ratings, and meaningful content more prominent than decoration.
- Avoid purple/pink neon, opaque black slabs, excessive glow, and gratuitous animation.
- Every data screen needs loading, empty, error, and retry states where applicable.
- Every request action needs disabled/loading feedback and a human-readable failure message.
- Preserve keyboard navigation, visible focus, semantic buttons/links, useful labels, and touch-friendly hit targets.

## Change discipline

Before editing, inspect `git status --short` and preserve unrelated user changes. Make the smallest coherent change. Do not rewrite generated files under `convex/_generated/`, `.next/`, or dependency folders. Do not delete or reset user work to make a check pass.

For a feature change, trace the full path: UI trigger → client/server boundary → Route Handler or Convex function → schema/authz → persisted result → refreshed UI/share link. Fix the shared seam rather than masking one example.

Report verification honestly: distinguish typecheck, lint, local build, live endpoint smoke, deployed behavior, and browser/device testing. A successful build does not prove OAuth, MCP client compatibility, or runtime UX.

## Official references

- Claude Code memory: https://docs.anthropic.com/en/docs/claude-code/memory
- Claude Code MCP: https://docs.anthropic.com/en/docs/claude-code/mcp
- Model Context Protocol: https://docs.anthropic.com/en/docs/mcp
- Next.js App Router: https://nextjs.org/docs/app
- Next.js Server and Client Components: https://nextjs.org/docs/app/getting-started/server-and-client-components
- Convex documentation: https://docs.convex.dev/
- Vercel environments and variables: https://vercel.com/docs/deployments/environments
