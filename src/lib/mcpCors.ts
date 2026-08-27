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

const openAiRegistrationOrigins = new Set([
  "https://chatgpt.com",
  "https://chat.openai.com",
  "https://platform.openai.com",
]);

export type McpCorsOptions = {
  /**
   * OAuth dynamic client registration may be called from an opaque origin
   * (for example, an isolated ChatGPT connector context). Registration only
   * returns public client metadata, so this is intentionally opt-in and must
   * never be enabled for the MCP or token endpoints.
   */
  allowNullOrigin?: boolean;
  /**
   * Allow the official OpenAI connector registration origin. This must remain
   * limited to dynamic registration, which returns no user data or tokens.
   */
  allowOpenAiRegistrationOrigin?: boolean;
};

export function isMcpTransportAllowed(request: Request, options: McpCorsOptions = {}) {
  const configured = configuredOrigins();
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");

  if (process.env.NODE_ENV === "production" && configured.length === 0) return false;

  if (origin) {
    if (origin.trim().toLowerCase() === "null") return options.allowNullOrigin === true;
    const normalizedOrigin = normalizeOrigin(origin);
    if (!normalizedOrigin) return false;
    if (options.allowOpenAiRegistrationOrigin && openAiRegistrationOrigins.has(normalizedOrigin)) return true;
    return normalizedOrigin === requestUrl.origin || configured.includes(normalizedOrigin);
  }

  // Non-browser MCP clients normally omit Origin. In production, accept only
  // the configured canonical origin; local development keeps its fallback.
  if (configured.includes(requestUrl.origin)) return true;
  return process.env.NODE_ENV !== "production";
}

export function mcpCorsHeaders(request: Request, options: McpCorsOptions = {}) {
  const origin = request.headers.get("origin");
  const isNullOrigin = origin?.trim().toLowerCase() === "null";
  const normalizedOrigin = origin ? normalizeOrigin(origin) : null;
  const allowedOrigin = isNullOrigin
    ? options.allowNullOrigin && isMcpTransportAllowed(request, options) ? "null" : undefined
    : normalizedOrigin && isMcpTransportAllowed(request, options) ? normalizedOrigin : undefined;

  return {
    ...(allowedOrigin ? { "Access-Control-Allow-Origin": allowedOrigin } : {}),
    "Access-Control-Allow-Headers": "Authorization, Content-Type, Mcp-Method, Mcp-Name, Mcp-Protocol-Version",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Expose-Headers": "WWW-Authenticate",
    "Cache-Control": "no-store",
    "Vary": "Origin",
  };
}
