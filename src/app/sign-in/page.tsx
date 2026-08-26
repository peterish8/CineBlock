"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Check, Film, FlaskConical, Link2, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";

const IS_DEV = process.env.NODE_ENV === "development";
const TEST_EMAIL = "test@cineblock.dev";
const TEST_PASSWORD = "testpass123";

function extractAuthErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string") return err;
  return "Something went wrong. Please try again.";
}

export default function SignInPage() {
  const { signIn } = useAuthActions();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  const [returnTo] = useState(() => {
    if (typeof window === "undefined") return "/";
    const value = new URLSearchParams(window.location.search).get("returnTo");
    return value?.startsWith("/") && !value.startsWith("//") ? value : "/";
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [devLoading, setDevLoading] = useState(false);
  const isOAuthConnection = returnTo.startsWith("/oauth/authorize");

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(returnTo);
    }
  }, [isAuthenticated, router, returnTo]);

  const handleDevSignIn = async () => {
    setError("");
    setDevLoading(true);
    try {
      // Try sign in first; if user doesn't exist yet, create it
      try {
        await signIn("password", { email: TEST_EMAIL, password: TEST_PASSWORD, flow: "signIn" });
      } catch {
        await signIn("password", { email: TEST_EMAIL, password: TEST_PASSWORD, flow: "signUp" });
      }
    } catch (err: unknown) {
      setError(extractAuthErrorMessage(err));
    } finally {
      setDevLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      await signIn("google");
    } catch (err: unknown) {
      setError(extractAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-shell relative min-h-screen overflow-hidden px-4 py-6 text-white sm:px-8 lg:px-12">
      <div className="auth-grid pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="auth-orbit auth-orbit-blue pointer-events-none absolute -left-40 top-12 h-96 w-96" aria-hidden="true" />
      <div className="auth-orbit auth-orbit-orange pointer-events-none absolute -right-48 bottom-[-5rem] h-[30rem] w-[30rem]" aria-hidden="true" />

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl flex-col">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="group inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.045] px-3 py-2 text-sm text-slate-300 backdrop-blur-xl transition hover:border-white/25 hover:bg-white/[0.08]">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[#07132d] shadow-[0_0_22px_rgba(96,165,250,0.22)]">
              <Image src="/brand/cineblock-icon-256.png" alt="CineBlock" width={24} height={24} className="object-contain" unoptimized />
            </span>
            <span className="font-display font-semibold tracking-tight">CineBlock</span>
            <ArrowLeft className="h-3.5 w-3.5 text-slate-500 transition group-hover:-translate-x-0.5" />
          </Link>
          <div className="hidden items-center gap-2 rounded-full border border-cyan-200/10 bg-cyan-100/[0.04] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-100/65 sm:flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_12px_3px_rgba(103,232,249,0.6)]" />
            Secure connection
          </div>
        </header>

        <div className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20 lg:py-16">
          <section className="auth-reveal max-w-xl" aria-labelledby="auth-title">
            <div className="mb-7 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.28em] text-orange-200/65" style={{ animationDelay: "80ms" }}>
              <span className="h-px w-10 bg-gradient-to-r from-orange-300/80 to-transparent" />
              CineBlock MCP
            </div>
            <h1 id="auth-title" className="auth-reveal font-display text-5xl font-semibold leading-[0.96] tracking-[-0.06em] text-white sm:text-6xl lg:text-[5.25rem]" style={{ animationDelay: "160ms" }}>
              Your cinema,
              <span className="block bg-gradient-to-r from-cyan-200 via-blue-300 to-orange-200 bg-clip-text pb-2 text-transparent">in the conversation.</span>
            </h1>
            <p className="auth-reveal mt-7 max-w-md text-base leading-7 text-slate-300/75 sm:text-lg" style={{ animationDelay: "240ms" }}>
              {isOAuthConnection ? "Sign in once to link your CineBlock library with ChatGPT. You stay in control of every playlist and stamp." : "Sign in to keep your watchlist, memories, and movie nights together."}
            </p>

            <div className="auth-reveal relative mt-12 h-40 max-w-md" style={{ animationDelay: "320ms" }} aria-hidden="true">
              <div className="auth-signal-line absolute left-8 right-8 top-1/2 h-px bg-gradient-to-r from-cyan-300/0 via-cyan-200/45 to-orange-200/0" />
              <div className="absolute left-0 top-1/2 flex -translate-y-1/2 flex-col items-center gap-2">
                <div className="auth-node flex h-16 w-16 items-center justify-center rounded-[22px] border border-cyan-200/20 bg-[#07132d]/80 shadow-[0_0_35px_rgba(96,165,250,0.2),inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-xl">
                  <Image src="/brand/cineblock-icon-256.png" alt="" width={42} height={42} className="object-contain" unoptimized />
                </div>
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-100/55">CineBlock</span>
              </div>
              <div className="absolute right-0 top-1/2 flex -translate-y-1/2 flex-col items-center gap-2">
                <div className="flex h-16 w-16 items-center justify-center rounded-[22px] border border-orange-200/20 bg-white/[0.07] text-orange-100 shadow-[0_0_35px_rgba(249,115,22,0.16),inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-xl">
                  <Link2 className="h-7 w-7" strokeWidth={1.5} />
                </div>
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-orange-100/55">ChatGPT</span>
              </div>
              <div className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-[#07132d] text-cyan-100 shadow-[0_0_20px_rgba(34,211,238,0.25)]">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>

            <div className="auth-reveal grid max-w-md grid-cols-3 gap-2 border-t border-white/10 pt-5" style={{ animationDelay: "400ms" }}>
              {[{ icon: Film, label: "Library" }, { icon: Sparkles, label: "Stamps" }, { icon: ShieldCheck, label: "Private" }].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-xs text-slate-400">
                  <Icon className="h-3.5 w-3.5 text-cyan-200/70" strokeWidth={1.7} />
                  {label}
                </div>
              ))}
            </div>
          </section>

          <section className="auth-reveal w-full max-w-md justify-self-center lg:justify-self-end" style={{ animationDelay: "180ms" }}>
            <div className="auth-card rounded-[30px] border border-white/[0.14] bg-[#07132d]/70 p-2 shadow-[0_30px_100px_rgba(0,0,0,0.55),0_0_70px_rgba(96,165,250,0.10)] backdrop-blur-2xl">
              <div className="rounded-[23px] border border-white/[0.08] bg-white/[0.045] p-6 sm:p-8">
                <div className="mb-8 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-cyan-200/65">Account link</p>
                    <h2 className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em] text-white">{isOAuthConnection ? "Connect your taste." : "Welcome back."}</h2>
                  </div>
                  <div className="rounded-2xl border border-orange-200/15 bg-orange-100/[0.06] p-3 text-orange-100/80">
                    <Link2 className="h-5 w-5" strokeWidth={1.6} />
                  </div>
                </div>

                <p className="mb-6 text-sm leading-6 text-slate-300/70">{isOAuthConnection ? "Use your CineBlock account to continue. ChatGPT will only receive the access you approve." : "Use Google to access your CineBlock account."}</p>

                {error && (
                  <div role="alert" className="mb-4 rounded-2xl border border-red-300/25 bg-red-400/[0.08] px-4 py-3 text-xs leading-5 text-red-100">
                    {error}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading || isLoading}
                  className="group flex w-full items-center justify-between rounded-2xl border border-cyan-200/30 bg-gradient-to-r from-cyan-200 to-blue-300 px-4 py-3.5 text-sm font-semibold text-[#06112c] shadow-[0_10px_30px_rgba(96,165,250,0.18)] transition duration-300 hover:-translate-y-0.5 hover:border-white/70 hover:shadow-[0_14px_38px_rgba(96,165,250,0.3)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/70 font-google text-xl font-extrabold leading-none">G</span>
                    {loading || isLoading ? "Connecting…" : "Continue with Google"}
                  </span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>

                <div className="mt-6 space-y-3 border-t border-white/10 pt-5">
                  {[
                    isOAuthConnection ? "One sign-in links your existing CineBlock account" : "Your collections stay synced across CineBlock",
                    "You approve writes before anything is saved",
                    "OAuth tokens are short-lived and protected with PKCE",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2.5 text-xs leading-5 text-slate-400">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-200/80" strokeWidth={2.5} />
                      {item}
                    </div>
                  ))}
                </div>

                <p className="mt-6 text-center text-[10px] leading-4 text-slate-500">By continuing, you agree to sign in with your Google account.</p>

                {IS_DEV && (
                  <div className="mt-6 border-t border-dashed border-white/10 pt-5">
                    <div className="mb-3 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-violet-200/60"><FlaskConical className="h-3 w-3" /> Development only</div>
                    <button type="button" onClick={() => void handleDevSignIn()} disabled={devLoading || isLoading} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-violet-300/35 bg-violet-300/[0.06] py-2.5 text-xs font-medium text-violet-100 transition hover:bg-violet-300/[0.12] disabled:opacity-50">
                      {devLoading ? "Signing in…" : "Use test credentials"}
                    </button>
                    <p className="mt-2 text-center font-mono text-[9px] text-slate-500">{TEST_EMAIL} · {TEST_PASSWORD}</p>
                  </div>
                )}
              </div>
            </div>
            <p className="mt-4 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.18em] text-slate-500"><ShieldCheck className="h-3.5 w-3.5 text-emerald-300/70" /> Encrypted CineBlock connection</p>
          </section>
        </div>
      </div>
    </main>
  );
}
