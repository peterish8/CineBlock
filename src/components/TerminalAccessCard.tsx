"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { Check, Copy, Eye, EyeOff, RefreshCw, TerminalSquare } from "lucide-react";
import { api } from "../../convex/_generated/api";

const DAILY_SEARCHES = 15;
const INSTALL_COMMAND = "npm install -g cineblock";

type TerminalAccessCardProps = {
  cliToken?: string;
  cliSearchesUsed?: number;
  cliSearchesResetAt?: number;
};

/** Searches used today, using the same UTC-midnight reset as convex/users.ts. */
function searchesUsedToday(used = 0, resetAt = 0) {
  const todayUtc = new Date();
  todayUtc.setUTCHours(0, 0, 0, 0);
  return resetAt >= todayUtc.getTime() ? used : 0;
}

const surface = { background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.10)" };
const well = { background: "rgba(1,5,18,0.78)", border: "1px solid rgba(148,163,184,0.16)" };
const accentButton = { background: "rgba(249,115,22,0.14)", border: "1px solid rgba(249,115,22,0.38)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)" };
const chip = "inline-flex min-h-8 shrink-0 items-center gap-1 rounded-full px-2.5 text-[10px] font-display font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-50";

export default function TerminalAccessCard({ cliToken, cliSearchesUsed, cliSearchesResetAt }: TerminalAccessCardProps) {
  const generateCliToken = useMutation(api.users.generateCliToken);
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState<"token" | "install" | null>(null);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const remaining = Math.max(0, DAILY_SEARCHES - searchesUsedToday(cliSearchesUsed, cliSearchesResetAt));

  const copy = async (text: string, what: "token" | "install") => {
    setError("");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setError("Couldn't copy. Select the text and copy it by hand.");
    }
  };

  const generate = async () => {
    setError("");
    setGenerating(true);
    try {
      await generateCliToken();
      setConfirmReplace(false);
      setVisible(true);
    } catch {
      setError("Couldn't create a token. Check your connection and try again.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <section
      aria-labelledby="terminal-access-title"
      className="space-y-4 rounded-2xl p-5 sm:p-6"
      style={{
        background: "rgba(8,15,40,0.72)",
        backdropFilter: "blur(28px) saturate(200%)",
        WebkitBackdropFilter: "blur(28px) saturate(200%)",
        border: "1px solid rgba(249,115,22,0.24)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.10)",
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(249,115,22,0.14)", border: "1px solid rgba(249,115,22,0.30)" }}>
            <TerminalSquare className="h-5 w-5 text-orange-300" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-display font-semibold uppercase tracking-[0.2em] text-orange-200">CineBlock Terminal</p>
            <h2 id="terminal-access-title" className="mt-1 text-sm font-display font-semibold text-white">Find movies from your terminal</h2>
            <p className="mt-1 text-[11px] leading-5 text-slate-400">Guided picks without an AI key, or describe a mood with your own Gemini, Groq or OpenRouter key.</p>
          </div>
        </div>
        {cliToken && (
          <p className="shrink-0 text-right">
            <span className="block font-display text-xl font-black tabular-nums text-orange-300">{remaining}</span>
            <span className="block text-[9px] font-mono uppercase tracking-wider text-slate-500">of {DAILY_SEARCHES} left today</span>
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 rounded-xl p-3 font-mono text-xs" style={well}>
        <span className="text-slate-500" aria-hidden>$</span>
        <code className="min-w-0 flex-1 truncate text-slate-200">{INSTALL_COMMAND}</code>
        <button type="button" onClick={() => void copy(INSTALL_COMMAND, "install")} className={`${chip} text-slate-200`} style={surface} aria-label="Copy install command">
          {copied === "install" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied === "install" ? "Copied" : "Copy"}
        </button>
      </div>

      {cliToken ? (
        <div className="space-y-2">
          <p className="text-[10px] font-display font-semibold uppercase tracking-[0.14em] text-slate-400">Your CLI token · paste it into <code className="normal-case text-slate-300">cineblock login</code></p>
          <div className="flex items-center gap-2 rounded-xl p-3 font-mono text-xs" style={well}>
            <span className={`min-w-0 flex-1 truncate text-slate-200 ${visible ? "select-all" : "select-none"}`} aria-live="polite">
              {visible ? cliToken : `cb_${"•".repeat(16)}${cliToken.slice(-4)}`}
            </span>
            <button type="button" onClick={() => setVisible((v) => !v)} className={`${chip} text-slate-300`} style={surface} aria-label={visible ? "Hide CLI token" : "Show CLI token"}>
              {visible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              {visible ? "Hide" : "Show"}
            </button>
            <button type="button" onClick={() => void copy(cliToken, "token")} className={`${chip} text-orange-200`} style={accentButton} aria-label="Copy CLI token">
              {copied === "token" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied === "token" ? "Copied" : "Copy"}
            </button>
          </div>

          {confirmReplace ? (
            <div className="flex flex-wrap items-center gap-2 rounded-xl p-3" style={surface} role="alert">
              <p className="min-w-0 flex-1 text-[11px] text-slate-300">Your current token stops working right away. Your searches left today stay the same.</p>
              <button type="button" onClick={() => setConfirmReplace(false)} disabled={generating} className={`${chip} text-slate-300`} style={surface}>Cancel</button>
              <button type="button" onClick={() => void generate()} disabled={generating} className={`${chip} text-orange-200`} style={accentButton}>
                {generating ? "Replacing…" : "Replace token"}
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmReplace(true)} className="inline-flex min-h-8 items-center gap-1.5 rounded-lg text-[10px] font-display font-semibold uppercase tracking-[0.1em] text-slate-400 transition hover:text-orange-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
              <RefreshCw className="h-3 w-3" aria-hidden /> Replace token
            </button>
          )}
        </div>
      ) : (
        <button type="button" onClick={() => void generate()} disabled={generating} className="min-h-11 w-full rounded-xl text-xs font-display font-semibold text-orange-200 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-50" style={accentButton}>
          {generating ? "Creating your token…" : "Create CLI token"}
        </button>
      )}

      {error && <p className="text-[11px] text-red-300" role="alert">{error}</p>}

      <p className="text-[10px] leading-4 text-slate-500">
        This <code className="text-slate-400">cb_</code> token only works in CineBlock Terminal. It is not your <code className="text-slate-400">mcp_</code> token and cannot connect ChatGPT or Claude. Keep it private.
      </p>
    </section>
  );
}
