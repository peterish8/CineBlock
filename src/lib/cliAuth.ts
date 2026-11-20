import type { NextRequest } from "next/server";

// CineBlock Terminal tokens: "cb_" plus 48 hex characters. These are never MCP
// credentials; MCP uses its own mcp_ tokens and OAuth.
const CLI_TOKEN_REGEX = /^cb_[0-9a-f]{48}$/;

export type CliTokenResult =
  | { ok: true; token: string }
  | { ok: false; error: "Missing token" | "Invalid token format" };

export function readCliToken(req: NextRequest): CliTokenResult {
  const auth = req.headers.get("Authorization");
  if (!auth) return { ok: false, error: "Missing token" };
  if (!auth.toLowerCase().startsWith("bearer ")) return { ok: false, error: "Invalid token format" };
  const token = auth.slice(7).trim();
  return CLI_TOKEN_REGEX.test(token) ? { ok: true, token } : { ok: false, error: "Invalid token format" };
}
