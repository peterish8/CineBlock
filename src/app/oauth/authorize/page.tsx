"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clapperboard,
  Film,
  KeyRound,
  Link2,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { usePathname, useSearchParams } from "next/navigation";
import { api } from "../../../../convex/_generated/api";

type PermissionTone = "blue" | "orange" | "green";

function BrandMark({ eyebrow = "CineBlock" }: { eyebrow?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="auth-brand-mark flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-200/25 bg-[#07132d]">
        <Image src="/brand/cineblock-icon-256.png" alt="CineBlock" width={31} height={31} unoptimized />
      </span>
      <div>
        <p className="font-display text-[15px] font-semibold tracking-[-0.02em] text-white">{eyebrow}</p>
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-100/55">Permission studio</p>
      </div>
    </div>
  );
}

function PermissionItem({
  icon: Icon,
  label,
  detail,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  detail: string;
  tone: PermissionTone;
}) {
  return (
    <div className={`auth-permission auth-permission-${tone}`}>
      <span className="auth-permission-icon" aria-hidden="true"><Icon className="h-4 w-4" /></span>
      <span className="min-w-0">
        <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-white/90">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-slate-300/65">{detail}</span>
      </span>
    </div>
  );
}

function ConnectionMap({ clientName }: { clientName: string }) {
  return (
    <div className="auth-connection-map" aria-label={`${clientName} connection to CineBlock`}>
      <div className="auth-map-node auth-map-client">
        <span className="auth-live-dot" aria-hidden="true" />
        <span className="truncate">{clientName}</span>
      </div>
      <div className="auth-map-route" aria-hidden="true"><span /><ArrowRight className="h-3.5 w-3.5" /></div>
      <div className="auth-map-node auth-map-cineblock"><Clapperboard className="h-3.5 w-3.5" /><span>CineBlock</span></div>
    </div>
  );
}

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
    return <main className="auth-shell flex min-h-screen items-center justify-center px-4 text-sm text-slate-300"><div className="auth-card rounded-3xl border border-white/10 bg-white/[0.06] px-6 py-5 font-mono shadow-glass-lg backdrop-blur-2xl">Preparing your secure scene…</div></main>;
  }

  if (!isAuthenticated) {
    return (
      <main className="auth-shell relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 sm:py-12">
        <div className="auth-grid pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="auth-orbit auth-orbit-blue pointer-events-none absolute -left-40 top-10 h-96 w-96" aria-hidden="true" />
        <div className="auth-orbit auth-orbit-orange pointer-events-none absolute -right-48 bottom-[-5rem] h-[30rem] w-[30rem]" aria-hidden="true" />
        <div className="relative w-full max-w-5xl">
          <Link href="/" className="mb-6 inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-400 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020817]"><ArrowLeft className="h-3.5 w-3.5" /> Back to CineBlock</Link>
          <div className="auth-layout-grid">
            <section className="auth-story-panel hidden lg:flex" aria-hidden="true">
              <div className="auth-story-kicker"><span className="auth-live-dot" /> Secure handoff / 01</div>
              <div className="mt-auto">
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-orange-200/65">Your library, your call</p>
                <h1 className="mt-4 max-w-md font-display text-6xl font-semibold leading-[0.92] tracking-[-0.07em] text-white">Every great connection starts with a scene.</h1>
                <p className="mt-6 max-w-sm text-sm leading-6 text-slate-300/65">Sign in once, review the handoff, and keep the final cut in your hands.</p>
              </div>
              <div className="auth-story-foot"><LockKeyhole className="h-4 w-4 text-emerald-200/75" /> PKCE protected · no passwords shared</div>
            </section>
            <div className="auth-card rounded-[30px] border border-white/[0.14] bg-[#07132d]/75 p-2 shadow-glass-xl backdrop-blur-2xl">
              <div className="rounded-[23px] border border-white/[0.08] bg-white/[0.045] p-7 sm:p-9">
                <BrandMark />
                <div className="mt-10">
                  <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-orange-200/65">Secure account link</p>
                  <h2 className="font-display text-4xl font-semibold tracking-[-0.06em] text-white">Step into your cinema.</h2>
                  <p className="mt-4 text-sm leading-6 text-slate-300/75">Sign in to let this MCP client access your CineBlock library. You will review the exact permissions before connecting.</p>
                </div>
                <div className="mt-7 space-y-3 rounded-2xl border border-white/10 bg-black/10 p-4">
                  {["Read your movie collections", "Prepare playlists and personal stamps", "Ask for your approval before saving"].map((item) => <div key={item} className="flex items-center gap-2.5 text-xs text-slate-300"><Check className="h-3.5 w-3.5 shrink-0 text-cyan-200/80" />{item}</div>)}
                </div>
                <Link href={signInUrl} className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-200/30 bg-gradient-to-r from-cyan-200 to-blue-300 py-3.5 text-sm font-semibold text-[#06112c] shadow-glow-blue-sm transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07132d]">Sign in to continue <ArrowRight className="h-4 w-4" /></Link>
                <p className="mt-5 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.18em] text-slate-500"><ShieldCheck className="h-3.5 w-3.5 text-emerald-300/70" /> PKCE protected</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const validRedirect = !!client && redirectUri.length <= 2048 && client.redirectUris.includes(redirectUri);
  const validRequest = validRedirect && resource.length <= 2048 && !!resource && /^[A-Za-z0-9_-]{43,128}$/.test(codeChallenge) && codeChallengeMethod === "S256" && (!state || state.length <= 2048);
  const clientName = client?.clientName || "This MCP client";

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

  const decline = () => {
    if (!validRedirect || authorizing) return;
    const callback = new URL(redirectUri);
    callback.searchParams.set("error", "access_denied");
    callback.searchParams.set("error_description", "The CineBlock connection was declined.");
    if (state) callback.searchParams.set("state", state);
    window.location.assign(callback.toString());
  };

  return (
    <main className="auth-shell relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 sm:py-12">
      <div className="auth-grid pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="auth-orbit auth-orbit-orange pointer-events-none absolute -right-48 bottom-[-5rem] h-[30rem] w-[30rem]" aria-hidden="true" />
      <div className="auth-orbit auth-orbit-blue pointer-events-none absolute -left-56 top-[-9rem] h-[27rem] w-[27rem]" aria-hidden="true" />
      <div className="relative w-full max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-4 px-1">
          <BrandMark />
          <span className="hidden items-center gap-2 rounded-full border border-emerald-200/15 bg-emerald-200/[0.06] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.18em] text-emerald-100/65 sm:flex"><span className="auth-live-dot" /> Encrypted handoff</span>
        </div>
        <div className="auth-layout-grid">
          <section className="auth-story-panel hidden lg:flex" aria-label="Connection overview">
            <div>
              <div className="auth-story-kicker"><span className="auth-live-dot" /> Connection request / 02</div>
              <div className="mt-14 flex h-20 w-20 items-center justify-center rounded-[26px] border border-orange-200/20 bg-orange-200/[0.06] text-orange-100 shadow-[0_0_55px_rgba(249,115,22,0.12)]"><Sparkles className="h-8 w-8" /></div>
              <p className="mt-8 max-w-sm font-mono text-[10px] uppercase tracking-[0.24em] text-cyan-200/60">A considered connection</p>
              <h1 className="mt-4 max-w-lg font-display text-6xl font-semibold leading-[0.9] tracking-[-0.07em] text-white">Give the right story a way in.</h1>
              <p className="mt-6 max-w-md text-sm leading-6 text-slate-300/65">CineBlock keeps your collections private and makes every write action visible before it happens.</p>
            </div>
            <div className="mt-auto">
              <ConnectionMap clientName={clientName} />
              <div className="auth-story-foot mt-7"><LockKeyhole className="h-4 w-4 text-emerald-200/75" /> S256 PKCE · one-time code · rotating token</div>
            </div>
          </section>
          <div className="auth-cinema-card auth-card rounded-[30px] border border-white/[0.14] bg-[#07132d]/80 p-2 shadow-glass-xl backdrop-blur-2xl">
            <div className="rounded-[23px] border border-white/[0.08] bg-white/[0.045] p-6 sm:p-9">
              <div className="flex items-start justify-between gap-4 lg:hidden">
                <BrandMark />
                <span className="mt-1 flex items-center gap-1.5 rounded-full border border-emerald-200/15 bg-emerald-200/[0.06] px-2.5 py-1.5 font-mono text-[8px] uppercase tracking-[0.14em] text-emerald-100/65"><span className="auth-live-dot" /> Secure</span>
              </div>
              <div className="mt-8 flex items-start justify-between gap-4 lg:mt-0">
                <div>
                  <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.23em] text-cyan-200/65"><span className="h-1.5 w-1.5 rounded-full bg-cyan-200 shadow-[0_0_14px_rgba(165,243,252,0.8)]" /> Permission studio</div>
                  <h2 className="mt-3 font-display text-4xl font-semibold leading-[0.95] tracking-[-0.06em] text-white sm:text-5xl">Connect to<br className="sm:hidden" /> CineBlock.</h2>
                </div>
                <div className="hidden rounded-2xl border border-orange-200/15 bg-orange-200/[0.05] p-3 text-orange-100/75 sm:block"><Film className="h-5 w-5" /></div>
              </div>
              <p className="mt-5 max-w-xl text-sm leading-6 text-slate-300/75"><span className="font-medium text-white">{clientName}</span> is requesting access to your CineBlock account.</p>
              <div className="mt-6 lg:hidden"><ConnectionMap clientName={clientName} /></div>
              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                <PermissionItem icon={Film} label="Read" detail="Liked, watchlist, and watched titles" tone="blue" />
                <PermissionItem icon={Sparkles} label="Prepare" detail="Playlists and personal stamps" tone="orange" />
                <PermissionItem icon={KeyRound} label="Control" detail="You approve every save" tone="green" />
              </div>
              {(!validRequest || error) && <p role="alert" className="mt-5 rounded-2xl border border-red-300/25 bg-red-400/[0.08] px-4 py-3 text-xs leading-5 text-red-100">{error || "Invalid OAuth request, redirect URI, or PKCE challenge."}</p>}
              <div className="mt-7 border-t border-white/[0.09] pt-6">
                <div className="mb-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-slate-500"><Link2 className="h-3.5 w-3.5 text-cyan-200/65" /> The handoff is scoped to this request</div>
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button type="button" onClick={decline} disabled={!validRedirect || authorizing} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-xs font-medium text-slate-400 transition hover:bg-white/[0.05] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100/80 disabled:cursor-not-allowed disabled:opacity-40"><X className="h-3.5 w-3.5" /> Not now</button>
                  <button type="button" onClick={() => void authorize()} disabled={!validRequest || authorizing} aria-busy={authorizing} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-cyan-200/30 bg-gradient-to-r from-cyan-200 to-blue-300 px-5 text-sm font-semibold text-[#06112c] shadow-glow-blue-sm transition hover:-translate-y-0.5 hover:shadow-[0_12px_35px_rgba(96,165,250,0.24)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07132d] disabled:cursor-not-allowed disabled:opacity-50 sm:max-w-[260px]">{authorizing ? "Securing connection…" : "Allow CineBlock access"}<ArrowRight className="h-4 w-4" /></button>
                </div>
              </div>
              <p className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center font-mono text-[9px] uppercase tracking-[0.16em] text-slate-500"><ShieldCheck className="h-3.5 w-3.5 text-emerald-300/70" /> You stay in control <span className="text-white/15">•</span> No passwords shared</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function AuthorizePage() {
  return <Suspense fallback={<main className="auth-shell flex min-h-screen items-center justify-center text-sm text-slate-300">Preparing your secure scene…</main>}><AuthorizeContent /></Suspense>;
}
