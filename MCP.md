# CineBlock MCP

CineBlock exposes a protected, stateless MCP endpoint for ChatGPT and other MCP clients:

`https://<your-deployment>/api/mcp`

For the production ChatGPT/Claude connector, use the direct machine transport URL `https://cineblock.vercel.app/api/mcp`. CineBlock still advertises `https://www.cineblock.in/api/mcp` as the canonical OAuth resource, while registration and token exchange use the direct Vercel origin so automated clients do not cross the public-site bot/CDN layer.

The server follows the 2026-07-28 MCP shape through `createMcpHandler`, with stateless legacy fallback for clients that still speak the 2025-era protocol. Durable data remains in Convex; no MCP session is stored in memory.

## Connect ChatGPT

1. Sign in to CineBlock and open `/profile`.
2. In **ChatGPT / MCP**, generate an MCP token and copy it immediately; CineBlock stores only a hash and cannot reveal it again after a page reload.
3. Add a custom connector/server in ChatGPT using the MCP URL above. ChatGPT can discover CineBlock's OAuth metadata from the `401` challenge or the well-known metadata endpoints.
4. Prefer OAuth when ChatGPT offers it: the flow opens CineBlock's consent page, uses S256 PKCE, and returns a short-lived access token plus rotating refresh token. The manual bearer-token option remains available for clients that do not support OAuth.
5. Regenerating the manual token revokes the previous manual token and all OAuth sessions immediately.

Opening `/api/mcp` directly in a browser is not a login screen; the expected `401` response is the protected-resource challenge that tells ChatGPT where to discover OAuth. In ChatGPT, create the custom app in Developer Mode, provide the MCP endpoint, and choose OAuth when prompted.

ChatGPT's current full MCP write support is rolling out on the web for Business and Enterprise/Edu workspaces. In ChatGPT, create a custom app in developer mode, provide the remote endpoint and authentication mechanism, scan the tools, and approve the write actions.

The token is a bearer credential. Keep it private and never paste it into a movie review or a shared chat.

Credential boundary: `mcp_...` tokens (or MCP OAuth access tokens) are accepted by `/api/mcp` only. The separate `cb_...` CineBlock Terminal token is accepted by `/api/cli` for terminal movie search and its daily quota only; never exchange or reuse one in the other flow.

OAuth endpoints:

- Protected-resource metadata: `/.well-known/oauth-protected-resource`
- Authorization-server metadata: `/.well-known/oauth-authorization-server`
- Dynamic client registration: `https://cineblock.vercel.app/api/oauth/register/v3` in production, bypassing the public-site CDN for machine-to-machine registration (`/api/oauth/register` and `/v2` remain available for existing clients)
- Authorization: `/oauth/authorize`
- Token exchange/refresh: `https://cineblock.vercel.app/api/oauth/token` in production

OAuth clients must send `resource=https://<your-deployment>/api/mcp` in both the authorization and token requests. The server accepts public clients only (`token_endpoint_auth_method=none`) and requires `code_challenge_method=S256`.

## Available tools

- `find_titles` searches TMDB and returns poster-backed movie/series candidates.
- `get_library` reads liked/favourite, watchlist, and watched titles.
- `preview_playlist` prepares a public/private CineBlock preview and a signed ten-minute confirmation handle.
- `create_playlist` commits only that exact approved preview and returns the CineBlock share URL.
- `get_stamp_questions` returns a Markdown interview: four standard personal questions plus one optional movie-specific creative follow-up.
- `preview_stamp` resolves one exact TMDB movie or series, shows its poster/title/year/type, and previews the user-approved personal Markdown under the 1,000-character limit.
- `save_stamp` commits only that exact approved stamp preview.

### In-chat MCP App UI

CineBlock also advertises portable MCP App resources for hosts that support them:

- `find_titles` renders a poster carousel with exact movie/series identity and a **Use this title** handoff.
- `preview_playlist` and `preview_stamp` render approval cards showing the exact titles, visibility, poster(s), and approved text.
- `create_playlist` and `save_stamp` render a saved-state card after the server accepts the matching short-lived confirmation token.

The UI is presentation-only. It never receives a direct write capability; its approval button sends a confirmation message back to the host, and the model must still call the matching commit tool with the exact server-issued handle. Hosts without MCP App support continue to receive the text and structured results.

The resources use the standard `text/html;profile=mcp-app` MIME type and a narrow CSP allowing TMDB poster images only. Their versioned `ui://cineblock/.../v1.html` URIs are cache keys; publish a new URI when the widget contract changes and reconnect clients after tool metadata changes.

### Personal stamp conversation contract

When a user asks ChatGPT to stamp a movie or series, use this order:

1. Call `find_titles` and confirm the exact poster-backed title, year, and media type.
2. Call `get_stamp_questions` for that exact TMDB ID and ask the user the four standard questions conversationally:
   - What did it make you feel, and what caused that feeling?
   - What stayed after the ending — an idea, image, relationship, or question?
   - Which scene or moment did you like most, and why did it land?
   - Did it change, confirm, or challenge anything for you?
3. Ask the optional movie-specific creative question only when it adds something. Do not interrogate the user or invent an answer for an unanswered question.
4. Draft the stamp in first-person Markdown, keeping it personal and spoiler-light. It is a feeling/memory, not a critic review or plot summary. A useful shape is:

   ```md
   ## What stayed with me
   [feeling, image, idea, or question]

   ## The moment
   [scene/detail and why it landed]

   ## After the credits
   [what changed, was confirmed, or stayed unresolved]
   ```

5. Call `preview_stamp` with the exact Markdown and wait for approval of the title, poster, visibility, and text. Keep the entire `reviewText` payload at or below 1,000 characters. Do not use HTML or fabricate personal reactions.
6. Call `save_stamp` only with the exact confirmation token returned by `preview_stamp`; do not rewrite the Markdown between preview and save.

Writes intentionally require a preview followed by the exact confirmation token. Confirmation handles are signed with the authenticated bearer token, expire after ten minutes, and contain a unique action ID. Convex stores a durable receipt for that ID, so retries return the original result instead of creating a duplicate playlist or stamp. MCP tool annotations also identify reads versus writes so compatible clients can request confirmation; the bearer token itself must still be treated as a powerful credential.

## Deployment notes

Set `NEXT_PUBLIC_APP_URL` to the public CineBlock origin for canonical share links and host validation. Set `MCP_ALLOWED_ORIGIN` to the exact browser client origin (or a comma-separated allowlist) when using a browser-based MCP client. In production, the route fails closed when neither a configured origin nor a configured canonical host is available. Poster proxying is restricted to `image.tmdb.org`.

The route uses the regular Node.js/Fluid Compute runtime. The Vercel CLI is optional for Git-connected deployments; install it with `npm i -g vercel` before using `vercel env pull`, `vercel deploy`, or `vercel logs` directly.
