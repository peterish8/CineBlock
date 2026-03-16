"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function SignInPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [step, setStep] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      await signIn("password", formData);
      router.push("/");
    } catch (err: any) {
      setError(
        err instanceof Error
          ? err.message
          : step === "signIn"
            ? "Invalid email or password"
            : "Could not create account. Email may already be in use."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="brutal-btn inline-flex items-center gap-2 px-3 py-2 text-xs font-mono font-bold mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={3} />
          BACK
        </Link>

        <div className="brutal-card p-8">
          <h1 className="font-display font-bold text-2xl text-brutal-white uppercase tracking-tight mb-1">
            {step === "signIn" ? "SIGN IN" : "CREATE ACCOUNT"}
          </h1>
          <p className="text-brutal-muted text-sm font-mono mb-6">
            {step === "signIn"
              ? "Welcome back to CineBlock"
              : "Join CineBlock to save your lists"}
          </p>

          {error && (
            <div className="brutal-chip text-brutal-red border-brutal-red px-3 py-2 mb-4 text-xs w-full text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {step === "signUp" && (
              <div>
                <label className="block text-[10px] font-mono font-bold text-brutal-muted uppercase tracking-[0.15em] mb-1.5">
                  NAME
                </label>
                <div className="brutal-input flex items-center px-3 py-2.5 focus-within:border-brutal-yellow focus-within:shadow-brutal-accent">
                  <User className="w-4 h-4 text-brutal-dim mr-2 flex-shrink-0" strokeWidth={2.5} />
                  <input
                    name="name"
                    type="text"
                    placeholder="Your name"
                    required
                    className="flex-1 bg-transparent text-brutal-white text-sm font-body placeholder:text-brutal-dim outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-mono font-bold text-brutal-muted uppercase tracking-[0.15em] mb-1.5">
                EMAIL
              </label>
              <div className="brutal-input flex items-center px-3 py-2.5 focus-within:border-brutal-yellow focus-within:shadow-brutal-accent">
                <Mail className="w-4 h-4 text-brutal-dim mr-2 flex-shrink-0" strokeWidth={2.5} />
                <input
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  className="flex-1 bg-transparent text-brutal-white text-sm font-body placeholder:text-brutal-dim outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold text-brutal-muted uppercase tracking-[0.15em] mb-1.5">
                PASSWORD
              </label>
              <div className="brutal-input flex items-center px-3 py-2.5 focus-within:border-brutal-yellow focus-within:shadow-brutal-accent">
                <Lock className="w-4 h-4 text-brutal-dim mr-2 flex-shrink-0" strokeWidth={2.5} />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="flex-1 bg-transparent text-brutal-white text-sm font-body placeholder:text-brutal-dim outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-brutal-dim hover:text-brutal-white transition-colors ml-2"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" strokeWidth={2.5} />
                  ) : (
                    <Eye className="w-4 h-4" strokeWidth={2.5} />
                  )}
                </button>
              </div>
            </div>

            <input name="flow" type="hidden" value={step} />

            <button
              type="submit"
              disabled={loading}
              className="brutal-btn w-full py-3 text-sm font-mono font-bold uppercase tracking-wider !bg-brutal-yellow !text-black !border-brutal-yellow hover:!shadow-brutal-hover disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading
                ? "LOADING..."
                : step === "signIn"
                  ? "SIGN IN"
                  : "CREATE ACCOUNT"}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t-2 border-brutal-border text-center">
            <button
              type="button"
              onClick={() => {
                setStep(step === "signIn" ? "signUp" : "signIn");
                setError("");
              }}
              className="text-brutal-muted text-xs font-mono hover:text-brutal-yellow transition-colors"
            >
              {step === "signIn"
                ? "Don't have an account? SIGN UP"
                : "Already have an account? SIGN IN"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
