"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Check, Link2, ShieldCheck } from "lucide-react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { usePathname, useSearchParams } from "next/navigation";
import { api } from "../../../../convex/_generated/api";

function AuthorizeContent() {
  const params = useSearchParams();
  const pathname = usePathname();
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

  const query = params.toString();
  const returnTo = `${pathname}${query ? `?${query}` : ""}`;
  const signInUrl = `/sign-in?returnTo=${encodeURIComponent(returnTo)}`;

  if (isLoading || (isAuthenticated && client === undefined)) {
    return <main className="auth-shell flex min-h-screen items-center justify-center px-4 text-sm text-slate-300"><div className="auth-card rounded-3xl border border-white/10 bg-white/[0.06] px-6 py-5 font-mono shadow-glass-lg backdrop-blur-2xl">Checking authorization…</div></main>;
  }

  if (!isAuthenticated) {
    return (
      <main className="auth-shell relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8">
        <div className="auth-grid pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="auth-orbit auth-orbit-blue pointer-events-none absolute -left-40 top-10 h-96 w-96" aria-hidden="true" />
        <div className="relative w-full max-w-lg">
          <Link href="/" className="mb-6 inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-400 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020817]"><ArrowLeft className="h-3.5 w-3.5" /> Back to CineBlock</Link>
          <div className="auth-card rounded-[30px] border border-white/[0.14] bg-[#07132d]/75 p-2 shadow-glass-xl backdrop-blur-2xl">
            <div className="rounded-[23px] border border-white/[0.08] bg-white/[0.045] p-7 sm:p-9">
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-200/20 bg-[#07132d] shadow-glow-blue-sm"><Image src="/brand/cineblock-icon-256.png" alt="CineBlock" width={32} height={32} unoptimized /></span><div><p className="font-display font-semibold text-white">CineBlock</p><p className="font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-100/55">MCP connection</p></div></div>
                <Link2 className="h-5 w-5 text-orange-200/70" />
              </div>
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-orange-200/65">Secure account link</p>
              <h1 className="font-display text-4xl font-semibold tracking-[-0.05em] text-white">Authorize CineBlock.</h1>
              <p className="mt-4 text-sm leading-6 text-slate-300/75">Sign in to let this MCP client access your CineBlock library. You will review the exact permissions before connecting.</p>
              <div className="mt-7 space-y-3 rounded-2xl border border-white/10 bg-black/10 p-4">
                {["Read your movie collections", "Prepare playlists and personal stamps", "Ask for your approval before saving"] .map((item) => <div key={item} className="flex items-center gap-2.5 text-xs text-slate-300"><Check className="h-3.5 w-3.5 text-cyan-200/80" />{item}</div>)}
              </div>
              <Link href={signInUrl} className="mt-7 flex w-full items-center justify-center rounded-2xl border border-cyan-200/30 bg-gradient-to-r from-cyan-200 to-blue-300 py-3.5 text-sm font-semibold text-[#06112c] shadow-glow-blue-sm transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07132d]">Sign in to continue</Link>
              <p className="mt-5 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.18em] text-slate-500"><ShieldCheck className="h-3.5 w-3.5 text-emerald-300/70" /> PKCE protected</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const validRedirect = !!client && redirectUri.length <= 2048 && client.redirectUris.includes(redirectUri);
  const validRequest = validRedirect && resource.length <= 2048 && !!resource && /^[A-Za-z0-9_-]{43,128}$/.test(codeChallenge) && codeChallengeMethod === "S256" && (!state || state.length <= 2048);

  const authorize = async () => {
    if (!validRequest || authorizing) return;
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
    <main className="auth-shell relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8">
      <div className="auth-grid pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="auth-orbit auth-orbit-orange pointer-events-none absolute -right-48 bottom-[-5rem] h-[30rem] w-[30rem]" aria-hidden="true" />
      <div className="auth-card relative w-full max-w-lg rounded-[30px] border border-white/[0.14] bg-[#07132d]/75 p-2 shadow-glass-xl backdrop-blur-2xl">
        <div className="rounded-[23px] border border-white/[0.08] bg-white/[0.045] p-7 sm:p-9">
          <div className="mb-8 flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-200/20 bg-[#07132d] shadow-glow-blue-sm"><Image src="/brand/cineblock-icon-256.png" alt="CineBlock" width={32} height={32} unoptimized /></span><div><p className="font-display font-semibold text-white">CineBlock</p><p className="font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-100/55">OAuth consent</p></div></div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-cyan-200/65">Connection request</p>
            <h1 className="mt-2 font-display text-4xl font-semibold tracking-[-0.05em] text-white">Connect to CineBlock.</h1>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-300/75">
            {client?.clientName || "This MCP client"} is requesting access to your CineBlock account.
          </p>
          <div className="mt-7 space-y-3 rounded-2xl border border-white/10 bg-black/10 p-4 text-xs leading-5 text-slate-300/75">
            <p><span className="text-white">Access:</span> liked, watchlist, and watched titles</p>
            <p><span className="text-white">Actions:</span> create playlists and save stamps after ChatGPT confirmation</p>
            <p><span className="text-white">Security:</span> PKCE S256, one-time code, short-lived access token, rotating refresh token</p>
          </div>
          {(!validRequest || error) && <p role="alert" className="mt-5 rounded-2xl border border-red-300/25 bg-red-400/[0.08] px-4 py-3 text-xs leading-5 text-red-100">{error || "Invalid OAuth request, redirect URI, or PKCE challenge."}</p>}
          <button onClick={() => void authorize()} disabled={!validRequest || authorizing} aria-busy={authorizing} className="mt-7 flex w-full items-center justify-center rounded-2xl border border-cyan-200/30 bg-gradient-to-r from-cyan-200 to-blue-300 py-3.5 text-sm font-semibold text-[#06112c] shadow-glow-blue-sm transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07132d] disabled:cursor-not-allowed disabled:opacity-50">
            {authorizing ? "Authorizing…" : "Allow CineBlock access"}
          </button>
          <p className="mt-5 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.18em] text-slate-500"><ShieldCheck className="h-3.5 w-3.5 text-emerald-300/70" /> You stay in control</p>
        </div>
      </div>
    </main>
  );
}

export default function AuthorizePage() {
  return <Suspense fallback={<main className="auth-shell flex min-h-screen items-center justify-center text-sm text-slate-300">Loading authorization…</main>}><AuthorizeContent /></Suspense>;
}
