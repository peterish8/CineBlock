"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useSearchParams } from "next/navigation";
import { api } from "../../../../convex/_generated/api";

function AuthorizeContent() {
  const params = useSearchParams();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const clientId = params.get("client_id") ?? "";
  const redirectUri = params.get("redirect_uri") ?? "";
  const resource = params.get("resource") ?? "";
  const state = params.get("state");
  const codeChallenge = params.get("code_challenge") ?? "";
  const codeChallengeMethod = params.get("code_challenge_method") ?? "";
  const client = useQuery(api.mcp.getMcpClient, clientId.length <= 256 && clientId ? { clientId } : "skip");
  const createCode = useMutation(api.mcp.createMcpAuthorizationCode);
  const [error, setError] = useState("");
  const [authorizing, setAuthorizing] = useState(false);

  const returnTo = typeof window === "undefined" ? "/" : `${window.location.pathname}${window.location.search}`;
  const signInUrl = `/sign-in?returnTo=${encodeURIComponent(returnTo)}`;

  if (isLoading || (isAuthenticated && client === undefined)) {
    return <main className="min-h-screen bg-bg flex items-center justify-center text-brutal-muted font-mono text-sm">Checking authorization…</main>;
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="brutal-card p-8 max-w-md w-full space-y-4">
          <h1 className="font-display text-2xl font-bold text-brutal-white">AUTHORIZE CINEBLOCK</h1>
          <p className="font-mono text-sm text-brutal-muted">Sign in to let this MCP client access your CineBlock library.</p>
          <Link href={signInUrl} className="brutal-btn block text-center py-3 font-mono font-bold">SIGN IN TO CONTINUE</Link>
        </div>
      </main>
    );
  }

  const validRedirect = !!client && redirectUri.length <= 2048 && client.redirectUris.includes(redirectUri);
  const validRequest = validRedirect && resource.length <= 2048 && !!resource && /^[A-Za-z0-9_-]{43,128}$/.test(codeChallenge) && codeChallengeMethod === "S256" && (!state || state.length <= 2048);

  const authorize = async () => {
    setError("");
    setAuthorizing(true);
    try {
      const result = await createCode({ clientId, redirectUri, codeChallenge, codeChallengeMethod, resource });
      const callback = new URL(redirectUri);
      callback.searchParams.set("code", result.code);
      if (state) callback.searchParams.set("state", state);
      window.location.assign(callback.toString());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Authorization failed. Please try again.");
      setAuthorizing(false);
    }
  };

  return (
    <main className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="brutal-card p-8 max-w-lg w-full space-y-5">
        <div>
          <p className="text-brutal-cyan font-mono text-xs tracking-widest mb-2">OAUTH CONSENT</p>
          <h1 className="font-display text-2xl font-bold text-brutal-white">CONNECT TO CINEBLOCK</h1>
        </div>
        <p className="font-mono text-sm text-brutal-muted">
          {client?.clientName || "This MCP client"} is requesting access to your CineBlock account.
        </p>
        <div className="border-2 border-brutal-border bg-surface p-4 font-mono text-xs text-brutal-muted space-y-2">
          <p><span className="text-brutal-white">Access:</span> liked, watchlist, and watched titles</p>
          <p><span className="text-brutal-white">Actions:</span> create playlists and save stamps after ChatGPT confirmation</p>
          <p><span className="text-brutal-white">Security:</span> PKCE S256, one-time code, short-lived access token, rotating refresh token</p>
        </div>
        {!validRequest && <p className="text-brutal-red font-mono text-xs">Invalid OAuth request, redirect URI, or PKCE challenge.</p>}
        {error && <p className="text-brutal-red font-mono text-xs">{error}</p>}
        <button onClick={() => void authorize()} disabled={!validRequest || authorizing} className="brutal-btn w-full py-3 font-mono font-bold disabled:opacity-50">
          {authorizing ? "AUTHORIZING…" : "ALLOW CINEBLOCK ACCESS"}
        </button>
      </div>
    </main>
  );
}

export default function AuthorizePage() {
  return <Suspense fallback={<main className="min-h-screen bg-bg flex items-center justify-center text-brutal-muted font-mono text-sm">Loading authorization…</main>}><AuthorizeContent /></Suspense>;
}
