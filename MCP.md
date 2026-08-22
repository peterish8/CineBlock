# CineBlock MCP

CineBlock exposes a protected, stateless MCP endpoint for ChatGPT and other MCP clients:

`https://<your-deployment>/api/mcp`

The server follows the 2026-07-28 MCP shape through `createMcpHandler`, with stateless legacy fallback for clients that still speak the 2025-era protocol. Durable data remains in Convex; no MCP session is stored in memory.

## Connect ChatGPT

1. Sign in to CineBlock and open `/profile`.
2. In **ChatGPT / MCP**, generate an MCP token and copy it immediately; CineBlock stores only a hash and cannot reveal it again after a page reload.
3. Add a custom connector/server in ChatGPT using the MCP URL above. ChatGPT can discover CineBlock's OAuth metadata from the `401` challenge or the well-known metadata endpoints.
4. Prefer OAuth when ChatGPT offers it: the flow opens CineBlock's consent page, uses S256 PKCE, and returns a short-lived access token plus rotating refresh token. The manual bearer-token option remains available for clients that do not support OAuth.
5. Regenerating the manual token revokes the previous manual token and all OAuth sessions immediately.

ChatGPT's current full MCP write support is rolling out on the web for Business and Enterprise/Edu workspaces. In ChatGPT, create a custom app in developer mode, provide the remote endpoint and authentication mechanism, scan the tools, and approve the write actions.

The token is a bearer credential. Keep it private and never paste it into a movie review or a shared chat.

OAuth endpoints:

- Protected-resource metadata: `/.well-known/oauth-protected-resource`
- Authorization-server metadata: `/.well-known/oauth-authorization-server`
- Dynamic client registration: `/api/oauth/register`
- Authorization: `/oauth/authorize`
- Token exchange/refresh: `/api/oauth/token`

OAuth clients must send `resource=https://<your-deployment>/api/mcp` in both the authorization and token requests. The server accepts public clients only (`token_endpoint_auth_method=none`) and requires `code_challenge_method=S256`.

## Available tools

- `find_titles` searches TMDB and returns poster-backed movie/series candidates.
- `get_library` reads liked/favourite, watchlist, and watched titles.
- `preview_playlist` prepares a public/private CineBlock preview and a signed ten-minute confirmation handle.
- `create_playlist` commits only that exact approved preview and returns the CineBlock share URL.
- `preview_stamp` resolves one exact TMDB movie or series, shows its poster/title/year/type, and previews the user-provided AI-written text under the 1,000-character limit.
- `save_stamp` commits only that exact approved stamp preview.

Writes intentionally require a preview followed by the exact confirmation token. Confirmation handles are signed with the authenticated bearer token, expire after ten minutes, and contain a unique action ID. Convex stores a durable receipt for that ID, so retries return the original result instead of creating a duplicate playlist or stamp. MCP tool annotations also identify reads versus writes so compatible clients can request confirmation; the bearer token itself must still be treated as a powerful credential.

## Deployment notes

Set `NEXT_PUBLIC_APP_URL` to the public CineBlock origin for canonical share links and host validation. Set `MCP_ALLOWED_ORIGIN` to the exact browser client origin (or a comma-separated allowlist) when using a browser-based MCP client. In production, the route fails closed when neither a configured origin nor a configured canonical host is available. Poster proxying is restricted to `image.tmdb.org`.

The route uses the regular Node.js/Fluid Compute runtime. The Vercel CLI is not currently installed in this workspace; install it with `npm i -g vercel` before using `vercel env pull`, `vercel deploy`, or `vercel logs`.
