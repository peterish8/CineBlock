"use client";

import { useEffect, useState } from "react";
import { Check, Copy, LogIn, RefreshCw, ShieldCheck, X } from "lucide-react";

type HealthState = "idle" | "checking" | "healthy" | "unavailable";

type IntegrationAccessModalProps = {
  open: boolean;
  onClose: () => void;
  isGlass: boolean;
  mcpUrl: string;
  hasMcpToken: boolean;
  mcpTokenValue: string | null;
  mcpTokenVisible: boolean;
  copiedMcpToken: boolean;
  generatingMcpToken: boolean;
  onToggleMcpToken: () => void;
  onCopyMcpToken: () => void;
  onGenerateMcpToken: () => void;
};

function healthLabel(state: HealthState, unavailableLabel: string) {
  if (state === "checking") return "CHECKING";
  if (state === "healthy") return "PROTECTED & READY";
  if (state === "unavailable") return unavailableLabel;
  return "NOT CHECKED";
}

export default function IntegrationAccessModal({
  open,
  onClose,
  isGlass,
  mcpUrl,
  hasMcpToken,
  mcpTokenValue,
  mcpTokenVisible,
  copiedMcpToken,
  generatingMcpToken,
  onToggleMcpToken,
  onCopyMcpToken,
  onGenerateMcpToken,
}: IntegrationAccessModalProps) {
  const [mcpHealth, setMcpHealth] = useState<HealthState>("idle");

  const checkHealth = async () => {
    setMcpHealth("checking");

    const mcpCheck = fetch("/api/mcp", { cache: "no-store", headers: { Accept: "application/json" } })
      .then(async (response) => {
        const challenge = response.headers.get("www-authenticate") ?? "";
        // An unauthenticated MCP request should challenge. That proves the route
        // is reachable without sending a bearer token from the browser.
        return response.status === 401 && challenge.includes("oauth-protected-resource");
      })
      .catch(() => false);

    const metadataCheck = Promise.all([
      fetch("/.well-known/oauth-protected-resource", { cache: "no-store" }),
      fetch("/.well-known/oauth-authorization-server", { cache: "no-store" }),
    ])
      .then(async ([resource, authorization]) => {
        if (!resource.ok || !authorization.ok) return false;
        const resourceBody = await resource.json() as { resource?: string; authorization_servers?: string[] };
        const authorizationBody = await authorization.json() as { authorization_endpoint?: string; token_endpoint?: string; code_challenge_methods_supported?: string[] };
        const expectedOrigin = new URL(mcpUrl).origin;
        return Boolean(
          resourceBody.resource === mcpUrl &&
          resourceBody.authorization_servers?.includes(expectedOrigin) &&
          authorizationBody.authorization_endpoint &&
          authorizationBody.token_endpoint &&
          authorizationBody.code_challenge_methods_supported?.includes("S256"),
        );
      })
      .catch(() => false);

    const mcpReady = await Promise.all([mcpCheck, metadataCheck]).then(([protectedRoute, metadata]) => protectedRoute && metadata);
    setMcpHealth(mcpReady ? "healthy" : "unavailable");
  };

  useEffect(() => {
    if (!open) return;
    void checkHealth();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
    // Health should refresh each time the modal is opened, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const glassPanel = {
    background: "rgba(5,12,34,0.96)",
    backdropFilter: "blur(32px) saturate(170%)",
    WebkitBackdropFilter: "blur(32px) saturate(170%)",
    border: "1px solid rgba(96,165,250,0.26)",
    boxShadow: "0 24px 90px rgba(0,0,0,0.72), 0 0 55px rgba(37,99,235,0.12), inset 0 1px 0 rgba(255,255,255,0.08)",
  };
  const surface = isGlass
    ? { background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.10)" }
    : undefined;
  const tokenSurface = isGlass
    ? { background: "rgba(1,5,18,0.78)", border: "1px solid rgba(148,163,184,0.16)" }
    : undefined;

  const HealthBadge = ({ state, label }: { state: HealthState; label: string }) => (
    <div className="flex items-center gap-2" aria-live="polite">
      <span className={`h-2 w-2 rounded-full ${state === "healthy" ? "bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.8)]" : state === "checking" ? "animate-pulse bg-amber-300" : state === "unavailable" ? "bg-red-300" : "bg-slate-500"}`} />
      <span className={isGlass ? "text-[9px] font-display font-semibold uppercase tracking-[0.14em] text-slate-400" : "text-[9px] font-mono uppercase"}>{label}</span>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="integration-access-title"
      style={{ background: isGlass ? "rgba(1,4,16,0.82)" : "rgba(0,0,0,0.78)", backdropFilter: isGlass ? "blur(14px) saturate(150%)" : undefined }}
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div className="relative flex max-h-[min(880px,calc(100dvh-1.5rem))] w-full max-w-2xl flex-col overflow-hidden rounded-[24px]" style={isGlass ? glassPanel : undefined}>
        {isGlass && <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-blue-400 via-cyan-300 to-orange-300 opacity-90" />}
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] px-5 py-5 sm:px-7">
          <div>
            <p className={isGlass ? "text-[9px] font-display font-semibold uppercase tracking-[0.24em] text-cyan-300/80" : "text-[9px] font-mono uppercase"}>Connected tools</p>
            <h2 id="integration-access-title" className={isGlass ? "mt-1 text-xl font-display font-black text-white sm:text-2xl" : "mt-1 text-xl font-black"}>MCP access</h2>
            <p className={isGlass ? "mt-1 max-w-xl text-[11px] leading-5 text-slate-400" : "mt-1 max-w-xl text-xs"}>Connect ChatGPT with OAuth sign-in. Your CineBlock account stays linked without copying a bearer token.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close access settings" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:text-white" style={surface}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl px-3 py-2.5" style={surface}>
            <div className="flex items-center gap-2">
              <ShieldCheck className={isGlass ? "h-4 w-4 text-emerald-300" : "h-4 w-4"} />
              <span className={isGlass ? "text-[10px] font-display font-semibold uppercase tracking-[0.16em] text-slate-300" : "text-[10px] font-bold uppercase"}>Connection health</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <HealthBadge state={mcpHealth} label={`MCP · ${healthLabel(mcpHealth, "UNAVAILABLE")}`} />
              <button type="button" onClick={() => void checkHealth()} disabled={mcpHealth === "checking"} className="inline-flex items-center gap-1 text-[9px] font-display font-semibold uppercase tracking-[0.12em] text-cyan-300 transition hover:text-white disabled:opacity-50" aria-label="Refresh connection health">
                <RefreshCw className={`h-3 w-3 ${mcpHealth === "checking" ? "animate-spin" : ""}`} /> Refresh
              </button>
            </div>
          </div>

          <section className="space-y-4 rounded-2xl p-4 sm:p-5" style={isGlass ? { ...surface, border: "1px solid rgba(52,211,153,0.24)", background: "rgba(8,36,38,0.50)" } : undefined}>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={isGlass ? { background: "rgba(52,211,153,0.14)", border: "1px solid rgba(52,211,153,0.28)" } : undefined}><LogIn className="h-4 w-4 text-emerald-300" /></div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className={isGlass ? "text-sm font-display font-bold text-white" : "text-sm font-bold"}>OAuth sign-in</h3>
                  <span className="rounded-full px-2 py-0.5 text-[8px] font-mono font-bold tracking-[0.12em] text-emerald-200" style={isGlass ? { background: "rgba(52,211,153,0.13)", border: "1px solid rgba(52,211,153,0.25)" } : undefined}>RECOMMENDED</span>
                </div>
                <p className={isGlass ? "mt-1 text-[11px] leading-5 text-slate-400" : "mt-1 text-xs"}>When ChatGPT connects, CineBlock opens its sign-in and consent page. Sign in with Google, approve access, and the connection is linked to this account.</p>
              </div>
            </div>

            <div className="space-y-1 rounded-xl p-3 font-mono text-[10px]" style={tokenSurface}>
              <p className="text-emerald-300">MCP ENDPOINT</p>
              <p className="break-all text-slate-300">{mcpUrl}</p>
              <p className="pt-1 text-slate-500">OAuth is the primary connection. The manual mcp_ token below is a fallback for clients without OAuth.</p>
            </div>

            {hasMcpToken || mcpTokenValue ? (
              <div className="space-y-2">
                <p className={isGlass ? "text-[10px] font-display font-semibold uppercase tracking-[0.14em] text-slate-400" : "text-[10px] font-mono font-bold uppercase"}>Manual fallback token</p>
                <div className="flex items-center gap-2 rounded-xl p-3 font-mono text-xs" style={tokenSurface}>
                  <span className={`min-w-0 flex-1 truncate text-slate-300 ${mcpTokenVisible && mcpTokenValue ? "select-all" : "blur-sm select-none"}`}>{mcpTokenValue ?? "Token stored securely — regenerate to reveal it once"}</span>
                  {mcpTokenValue && <button type="button" onClick={onToggleMcpToken} className="shrink-0 rounded-full px-2 py-1 text-[9px] font-display font-semibold text-slate-300" style={surface}>{mcpTokenVisible ? "HIDE" : "SHOW"}</button>}
                  {mcpTokenValue && <button type="button" onClick={onCopyMcpToken} className="flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[9px] font-display font-semibold text-cyan-200" style={isGlass ? { background: "rgba(34,211,238,0.12)", border: "1px solid rgba(34,211,238,0.25)" } : undefined}>{copiedMcpToken ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}{copiedMcpToken ? "COPIED" : "COPY"}</button>}
                </div>
                <button type="button" onClick={onGenerateMcpToken} disabled={generatingMcpToken} className="text-[10px] font-display font-semibold uppercase tracking-[0.1em] text-slate-400 transition hover:text-cyan-300 disabled:opacity-50">{generatingMcpToken ? "REGENERATING…" : "↻ Regenerate and revoke old MCP token"}</button>
              </div>
            ) : (
              <button type="button" onClick={onGenerateMcpToken} disabled={generatingMcpToken} className="w-full rounded-xl py-3 text-xs font-display font-semibold text-cyan-200 transition hover:text-white disabled:opacity-50" style={isGlass ? { background: "rgba(34,211,238,0.13)", border: "1px solid rgba(34,211,238,0.32)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)" } : undefined}>{generatingMcpToken ? "GENERATING…" : "GENERATE MCP TOKEN"}</button>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}
