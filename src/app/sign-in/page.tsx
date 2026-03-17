"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff, KeyRound } from "lucide-react";
import Link from "next/link";

type Step =
  | "signIn"
  | "signUp"
  | "forgot"           // enter email to request reset
  | "reset-verify"     // enter OTP + new password
  | "email-verify";    // enter OTP after sign up

export default function SignInPage() {
  const { signIn } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, router]);

  const [step, setStep] = useState<Step>("signIn");
  const [pendingEmail, setPendingEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const reset = (nextStep: Step) => {
    setError("");
    setStep(nextStep);
  };

  // ── Sign In / Sign Up ────────────────────────────────────────────────────────
  const handleAuthSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    try {
      await signIn("password", formData);
      if (step === "signUp") {
        // Verification email sent — show OTP step
        setPendingEmail(email);
        setStep("email-verify");
      } else {
        window.location.href = "/";
      }
    } catch (err: any) {
      const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
      if (step === "signUp") {
        // For signup: only block if email is truly duplicate
        // Any other error (e.g. Resend failing) means account was created — show verify step
        if (msg.includes("already") || msg.includes("duplicate") || msg.includes("exists")) {
          setError("An account with this email already exists. Please sign in.");
        } else {
          setPendingEmail(email);
          setStep("email-verify");
        }
      } else {
        if (msg.includes("verif")) {
          setPendingEmail(email);
          setStep("email-verify");
        } else {
          setError("Invalid email or password.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot password: request reset code ─────────────────────────────────────
  const handleForgotSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    formData.set("flow", "reset");
    try {
      await signIn("password", formData);
      setPendingEmail(email);
      setStep("reset-verify");
    } catch (err: any) {
      const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
      if (msg.includes("not found") || msg.includes("no account") || msg.includes("invalid") || msg.includes("credentials")) {
        setError("No account found with that email.");
      } else {
        // Account exists but something else failed (e.g. email sending)
        // Still proceed to verify step so user can try the code if email arrived
        setPendingEmail(email);
        setStep("reset-verify");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Reset verification: OTP + new password ───────────────────────────────────
  const handleResetVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("email", pendingEmail);
    formData.set("flow", "reset-verification");
    try {
      await signIn("password", formData);
      window.location.href = "/";
    } catch (err: any) {
      setError("Invalid or expired code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Email verification after sign up ────────────────────────────────────────
  const handleEmailVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("email", pendingEmail);
    formData.set("flow", "email-verification");
    try {
      await signIn("password", formData);
      window.location.href = "/";
    } catch (err: any) {
      setError("Invalid or expired code. Please try again.");
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

          {/* ── Sign In ── */}
          {step === "signIn" && (
            <>
              <h1 className="font-display font-bold text-2xl text-brutal-white uppercase tracking-tight mb-1">SIGN IN</h1>
              <p className="text-brutal-muted text-sm font-mono mb-6">Welcome back to CineBlock</p>
              {error && <ErrorBox msg={error} />}
              <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
                <input name="flow" type="hidden" value="signIn" />
                <EmailField />
                <PasswordField show={showPassword} onToggle={() => setShowPassword(!showPassword)} name="password" label="PASSWORD" />
                <SubmitBtn loading={loading} label="SIGN IN" />
              </form>
              <div className="mt-4 flex flex-col gap-2 items-center border-t-2 border-brutal-border pt-4">
                <button onClick={() => reset("signUp")} className="text-brutal-muted text-xs font-mono hover:text-brutal-yellow transition-colors">
                  Don&apos;t have an account? <span className="text-brutal-yellow">SIGN UP</span>
                </button>
                <button onClick={() => reset("forgot")} className="text-brutal-muted text-xs font-mono hover:text-brutal-yellow transition-colors">
                  Forgot password?
                </button>
              </div>
            </>
          )}

          {/* ── Sign Up ── */}
          {step === "signUp" && (
            <>
              <h1 className="font-display font-bold text-2xl text-brutal-white uppercase tracking-tight mb-1">CREATE ACCOUNT</h1>
              <p className="text-brutal-muted text-sm font-mono mb-6">Join CineBlock to save your lists</p>
              {error && <ErrorBox msg={error} />}
              <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
                <input name="flow" type="hidden" value="signUp" />
                <div>
                  <label className="block text-[10px] font-mono font-bold text-brutal-muted uppercase tracking-[0.15em] mb-1.5">NAME</label>
                  <div className="brutal-input flex items-center px-3 py-2.5 focus-within:border-brutal-yellow focus-within:shadow-brutal-accent">
                    <User className="w-4 h-4 text-brutal-dim mr-2 flex-shrink-0" strokeWidth={2.5} />
                    <input name="name" type="text" placeholder="Your name" required className="flex-1 bg-transparent text-brutal-white text-sm font-body placeholder:text-brutal-dim outline-none" />
                  </div>
                </div>
                <EmailField />
                <PasswordField show={showPassword} onToggle={() => setShowPassword(!showPassword)} name="password" label="PASSWORD" />
                <SubmitBtn loading={loading} label="CREATE ACCOUNT" />
              </form>
              <div className="mt-4 border-t-2 border-brutal-border pt-4 text-center">
                <button onClick={() => reset("signIn")} className="text-brutal-muted text-xs font-mono hover:text-brutal-yellow transition-colors">
                  Already have an account? <span className="text-brutal-yellow">SIGN IN</span>
                </button>
              </div>
            </>
          )}

          {/* ── Forgot password: enter email ── */}
          {step === "forgot" && (
            <>
              <h1 className="font-display font-bold text-2xl text-brutal-white uppercase tracking-tight mb-1">FORGOT PASSWORD</h1>
              <p className="text-brutal-muted text-sm font-mono mb-6">We&apos;ll send a reset code to your email</p>
              {error && <ErrorBox msg={error} />}
              <form onSubmit={handleForgotSubmit} className="flex flex-col gap-4">
                <EmailField />
                <SubmitBtn loading={loading} label="SEND RESET CODE" />
              </form>
              <div className="mt-4 border-t-2 border-brutal-border pt-4 text-center">
                <button onClick={() => reset("signIn")} className="text-brutal-muted text-xs font-mono hover:text-brutal-yellow transition-colors">
                  Back to sign in
                </button>
              </div>
            </>
          )}

          {/* ── Reset verification: enter OTP + new password ── */}
          {step === "reset-verify" && (
            <>
              <h1 className="font-display font-bold text-2xl text-brutal-white uppercase tracking-tight mb-1">ENTER CODE</h1>
              <p className="text-brutal-muted text-sm font-mono mb-6">
                Code sent to <span className="text-brutal-yellow">{pendingEmail}</span>
              </p>
              {error && <ErrorBox msg={error} />}
              <form onSubmit={handleResetVerify} className="flex flex-col gap-4">
                <OTPField />
                <PasswordField show={showNewPassword} onToggle={() => setShowNewPassword(!showNewPassword)} name="newPassword" label="NEW PASSWORD" />
                <SubmitBtn loading={loading} label="RESET PASSWORD" />
              </form>
              <div className="mt-4 border-t-2 border-brutal-border pt-4 text-center">
                <button onClick={() => reset("forgot")} className="text-brutal-muted text-xs font-mono hover:text-brutal-yellow transition-colors">
                  Resend code
                </button>
              </div>
            </>
          )}

          {/* ── Email verification after sign up ── */}
          {step === "email-verify" && (
            <>
              <h1 className="font-display font-bold text-2xl text-brutal-white uppercase tracking-tight mb-1">VERIFY EMAIL</h1>
              <p className="text-brutal-muted text-sm font-mono mb-6">
                Code sent to <span className="text-brutal-yellow">{pendingEmail}</span>
              </p>
              {error && <ErrorBox msg={error} />}
              <form onSubmit={handleEmailVerify} className="flex flex-col gap-4">
                <OTPField />
                <SubmitBtn loading={loading} label="VERIFY" />
              </form>
            </>
          )}

        </div>
      </div>
    </main>
  );
}

// ── Reusable field components ────────────────────────────────────────────────

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="brutal-chip text-brutal-red border-brutal-red px-3 py-2 mb-2 text-xs w-full text-center">
      {msg}
    </div>
  );
}

function EmailField() {
  return (
    <div>
      <label className="block text-[10px] font-mono font-bold text-brutal-muted uppercase tracking-[0.15em] mb-1.5">EMAIL</label>
      <div className="brutal-input flex items-center px-3 py-2.5 focus-within:border-brutal-yellow focus-within:shadow-brutal-accent">
        <Mail className="w-4 h-4 text-brutal-dim mr-2 flex-shrink-0" strokeWidth={2.5} />
        <input name="email" type="email" placeholder="you@example.com" required className="flex-1 bg-transparent text-brutal-white text-sm font-body placeholder:text-brutal-dim outline-none" />
      </div>
    </div>
  );
}

function PasswordField({ show, onToggle, name, label }: { show: boolean; onToggle: () => void; name: string; label: string }) {
  return (
    <div>
      <label className="block text-[10px] font-mono font-bold text-brutal-muted uppercase tracking-[0.15em] mb-1.5">{label}</label>
      <div className="brutal-input flex items-center px-3 py-2.5 focus-within:border-brutal-yellow focus-within:shadow-brutal-accent">
        <Lock className="w-4 h-4 text-brutal-dim mr-2 flex-shrink-0" strokeWidth={2.5} />
        <input name={name} type={show ? "text" : "password"} placeholder="••••••••" required minLength={8} className="flex-1 bg-transparent text-brutal-white text-sm font-body placeholder:text-brutal-dim outline-none" />
        <button type="button" onClick={onToggle} className="text-brutal-dim hover:text-brutal-white transition-colors ml-2">
          {show ? <EyeOff className="w-4 h-4" strokeWidth={2.5} /> : <Eye className="w-4 h-4" strokeWidth={2.5} />}
        </button>
      </div>
    </div>
  );
}

function OTPField() {
  return (
    <div>
      <label className="block text-[10px] font-mono font-bold text-brutal-muted uppercase tracking-[0.15em] mb-1.5">6-DIGIT CODE</label>
      <div className="brutal-input flex items-center px-3 py-2.5 focus-within:border-brutal-yellow focus-within:shadow-brutal-accent">
        <KeyRound className="w-4 h-4 text-brutal-dim mr-2 flex-shrink-0" strokeWidth={2.5} />
        <input name="code" type="text" inputMode="numeric" placeholder="000000" required maxLength={6} className="flex-1 bg-transparent text-brutal-white text-xl font-display font-black tracking-[0.3em] placeholder:text-brutal-dim outline-none" />
      </div>
    </div>
  );
}

function SubmitBtn({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="brutal-btn w-full py-3 text-sm font-mono font-bold uppercase tracking-wider !bg-brutal-yellow !text-black !border-brutal-yellow hover:!shadow-brutal-hover disabled:opacity-50 disabled:cursor-not-allowed mt-2"
    >
      {loading ? "LOADING..." : label}
    </button>
  );
}
