function normalizeOrigin(value: string) {
  try {
    const url = new URL(value.trim());
    if (
      (url.protocol !== "https:" && url.protocol !== "http:") ||
      url.username ||
      url.password ||
      (url.pathname !== "" && url.pathname !== "/") ||
      url.search ||
      url.hash
    ) return null;
    return url.origin;
  } catch {
    return null;
  }
}

const configuredOrigins = () =>
  [process.env.MCP_ALLOWED_ORIGIN, process.env.NEXT_PUBLIC_APP_URL]
    .flatMap((value) => value?.split(",") ?? [])
    .map(normalizeOrigin)
    .filter((value): value is string => value !== null);

export function isMcpTransportAllowed(request: Request) {
  const configured = configuredOrigins();
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");

  if (process.env.NODE_ENV === "production" && configured.length === 0) return false;

  if (origin) {
    const normalizedOrigin = normalizeOrigin(origin);
    if (!normalizedOrigin) return false;
    return normalizedOrigin === requestUrl.origin || configured.includes(normalizedOrigin);
  }

  // Non-browser MCP clients normally omit Origin. In production, accept only
  // the configured canonical origin; local development keeps its fallback.
  if (configured.includes(requestUrl.origin)) return true;
  return process.env.NODE_ENV !== "production";
}

export function mcpCorsHeaders(request: Request) {
  const origin = request.headers.get("origin");
  const normalizedOrigin = origin ? normalizeOrigin(origin) : null;
  const allowedOrigin = normalizedOrigin && isMcpTransportAllowed(request) ? normalizedOrigin : undefined;

  return {
    ...(allowedOrigin ? { "Access-Control-Allow-Origin": allowedOrigin } : {}),
    "Access-Control-Allow-Headers": "Authorization, Content-Type, Mcp-Method, Mcp-Name, Mcp-Protocol-Version",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Expose-Headers": "WWW-Authenticate",
    "Cache-Control": "no-store",
    "Vary": "Origin",
  };
}
