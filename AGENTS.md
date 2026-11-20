# CineBlock agent and contributor contract

Last reviewed: 2026-11-20

This file is shared operational guidance for coding agents and contributors. Read `CLAUDE.md` first for the product architecture, MCP contract, environment names, and visual language.

## Start every task

1. Read the user request carefully and identify the exact files and behavior in scope.
2. Run `git status --short` and preserve unrelated edits already present in the worktree.
3. Read `README.md`, `MCP.md`, and the relevant implementation files before deciding how to change code.
4. Check whether the requested behavior already exists in another route or component and reuse that seam.
5. State or record a narrow implementation boundary before making edits.

Do not infer that a feature is complete from a route existing, a typecheck passing, or a deployment being created. Verify the behavior at the level the user requested.

## Editing rules

- Use TypeScript for new application code and follow the existing alias `@/*` → `src/*`.
- Keep Server Components server-side by default. Add `"use client"` only for state, event handlers, browser APIs, or client-only hooks.
- Keep API keys, OAuth secrets, deploy keys, and privileged Convex operations server-only.
- Validate external input at Route Handler and Convex boundaries. Prefer existing types and Zod/Convex validators over unchecked casts.
- Use Convex queries/mutations/actions according to their purpose; keep authorization next to the data operation.
- Reuse existing hooks, modal patterns, toast handling, image loader, theme tokens, and shared types before creating duplicates.
- Glass is the permanent product theme for every user. Do not add or restore a theme toggle; legacy brutalist classes are compatibility styles only.
- Do not edit `convex/_generated/`, `.next/`, `node_modules/`, or deployment artifacts by hand.
- Do not add a new dependency for a problem already solved by the current stack.
- Do not put credentials, real tokens, private URLs, or copied `.env.local` values into docs or test fixtures.

## Web application quality bar

For every user-facing request or mutation:

- show pending/disabled feedback;
- handle success and failure visibly;
- provide a useful empty state where a collection can be empty;
- preserve accessible names, keyboard operation, focus visibility, and touch targets;
- avoid client waterfalls when a server fetch or parallel request is appropriate;
- keep browser bundles free of secrets and unnecessary server-only modules;
- verify responsive behavior at narrow and wide layouts when UI is changed.

Use the App Router deliberately: fetch server-safe data in Server Components or the appropriate backend seam, pass only the needed serializable data into Client Components, and use loading boundaries for slow data. Do not route a Server Component’s data request through its own Route Handler without a concrete reason.

## MCP/OAuth safety bar

MCP is a privileged integration. Treat all MCP input as untrusted and all bearer tokens as secrets.

- Keep `/api/mcp` stateless; persist durable state in Convex.
- Keep `cb_...` CLI and `mcp_...` MCP credentials separate: CLI is for CineBlock Terminal search/quota, MCP is for ChatGPT library operations and stamps.
- Authenticate every user-scoped read and write.
- Resolve movie/series identity before any write and include exact TMDB ID plus media type in the approval boundary.
- Keep preview and commit as separate tool calls.
- Require the exact short-lived confirmation handle for writes.
- Preserve idempotent receipts so retries do not duplicate CineBlocks or stamps.
- Keep OAuth discovery metadata, redirect URI validation, S256 PKCE, token expiry, refresh behavior, and resource audience validation aligned.
- Keep CORS restricted to explicit configured origins; never use `*` for credentialed MCP access.
- Do not log authorization headers, access tokens, refresh tokens, confirmation handles, or full user-library payloads.
- Test unauthenticated, wrong-user, expired-confirmation, replay, invalid-resource, and malformed-input paths.

When changing a tool schema, verify `tools/list` and a real `tools/call`, not only TypeScript. Modern MCP clients may cache schemas and metadata; reconnect after schema changes during manual testing.

## Convex and deployment safety

- Keep schema indexes and validators aligned with query access patterns.
- Treat `npx convex dev` as local development and `npx convex deploy` as a release operation.
- Scope `CONVEX_DEPLOY_KEY` to the deployment environment that needs it, preferably Production-only for a production Vercel build.
- Remember that Vercel environment changes affect new deployments only.
- Use Preview for QA and Production for the public `cineblock.in` domain.
- Verify live metadata and protected endpoints after deployment; do not claim OAuth is working from a build log alone.
- After pointing the app at a different Convex deployment, check the whole sign-in path: the browser bundle uses the new Convex URL, Google accepts that deployment's `/api/auth/callback/google` redirect (follow the redirect chain; a 302 to `signin/oauth/error` is a failure), and a real sign-in writes `users`, `authAccounts` and `authSessions` rows.

## Verification ladder

Run the narrowest relevant checks first, then the full checks for meaningful changes:

```text
npx tsc --noEmit
npm run lint
npm run build
```

For MCP/OAuth changes, also test:

```text
GET  /.well-known/oauth-protected-resource
GET  /.well-known/oauth-authorization-server
GET  /api/mcp                       # must challenge without credentials
OPTIONS /api/mcp                    # from an allowed origin
POST /api/oauth/register            # validation and client registration
```

For UI changes, inspect the actual route in a browser when possible. Check loading, empty, error, retry, keyboard, mobile, and theme states. If browser or live-service testing is unavailable, say exactly what remains unverified.

## Git and handoff

- Keep commits focused and describe the behavior changed.
- Do not reset, checkout, clean, or delete unrelated user work.
- Before committing, inspect the diff and ensure no secrets or generated artifacts were added.
- Do not push or change deployment configuration unless the user has asked for that scope.
- Final handoff must state changed files, verification commands/results, and any external blocker or unverified runtime path.

## Useful project references

- Product/setup: `README.md`
- MCP/OAuth contract: `MCP.md`
- Theme system: `src/app/globals.css`, `src/lib/themeConfig.ts`
- Backend schema: `convex/schema.ts`
- MCP route: `src/app/api/mcp/route.ts`
- MCP domain functions: `convex/mcp.ts`
- OAuth routes: `src/app/oauth/authorize/page.tsx`, `src/app/api/oauth/register/route.ts`, `src/app/api/oauth/token/route.ts`

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
