"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

function extractAuthErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string") return err;
  return "Something went wrong. Please try again.";
}

export default function SignInPage() {
  const { signIn } = useAuthActions();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, router]);

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
    <main className="min-h-screen bg-bg flex items-center justify-center px-4 pb-16 lg:pb-0">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="brutal-btn inline-flex items-center gap-2 px-3 py-2 text-xs font-mono font-bold mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={3} />
          BACK
        </Link>

        <div className="brutal-card p-8">
          <h1 className="font-display font-bold text-2xl text-brutal-white uppercase tracking-tight mb-1">SIGN IN</h1>
          <p className="text-brutal-muted text-sm font-mono mb-6">Use Google to access CineBlock</p>

          {error && (
            <div className="brutal-chip text-brutal-red border-brutal-red px-3 py-2 mb-3 text-xs w-full text-center">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading || isLoading}
            className="brutal-btn w-full py-3 text-sm font-mono font-bold uppercase tracking-wider !bg-brutal-yellow !text-black !border-brutal-yellow hover:!shadow-brutal-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <span className="font-google font-extrabold text-2xl leading-none tracking-tight text-black">
              G
            </span>
            {loading || isLoading ? "CONNECTING..." : "CONTINUE WITH GOOGLE"}
          </button>

          <p className="text-brutal-dim text-[11px] font-mono mt-4 text-center">
            By continuing, you agree to sign in with your Google account.
          </p>
        </div>
      </div>
    </main>
  );
}
