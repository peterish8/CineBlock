"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useConvexAuth } from "convex/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Layers, Plus, LogIn, Copy, Check, Trash2, Crown, ChevronRight, X, Bell } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";
import { useThemeMode } from "@/hooks/useThemeMode";

// ─── Create Block Modal ───────────────────────────────────────────────────────

function CreateBlockModal({ onClose }: { onClose: () => void }) {
  const createRoom = useMutation(api.blocks.createRoom);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ roomId: string; inviteCode: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const isGlass = useThemeMode() === "glass";

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await createRoom({ name: name.trim() });
      setResult(res as { roomId: string; inviteCode: string });
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    if (!result) return;
    void navigator.clipboard.writeText(result.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isGlass) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(2,8,23,0.75)", backdropFilter: "blur(8px)" }}>
        <div className="w-full max-w-sm animate-pop-in" style={{ background: "rgba(8,15,40,0.96)", backdropFilter: "blur(28px) saturate(160%)", WebkitBackdropFilter: "blur(28px) saturate(160%)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "20px", overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)" }}>
          {/* Accent bar */}
          <div style={{ height: 3, background: "linear-gradient(90deg, #4ADE80, #34D399)" }} />
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-semibold text-base text-white tracking-tight">
                {result ? "Block Created" : "Create Block"}
              </h2>
              <button onClick={onClose} className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors hover:bg-white/10" style={{ border: "1px solid rgba(255,255,255,0.12)", color: "rgba(148,163,184,0.8)" }}>
                <X className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
            </div>

            {result ? (
              <div className="space-y-4">
                <p className="text-slate-400 text-xs leading-relaxed">Share this code with friends to join your Block.</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-4 py-3 text-center rounded-xl" style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.25)" }}>
                    <span className="font-display font-black text-2xl tracking-[0.3em]" style={{ color: "#4ADE80" }}>{result.inviteCode}</span>
                  </div>
                  <button onClick={copyCode} className="flex items-center justify-center w-12 h-12 rounded-xl transition-colors" style={copied ? { background: "rgba(74,222,128,0.20)", border: "1px solid rgba(74,222,128,0.45)", color: "#4ADE80" } : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(148,163,184,0.8)" }}>
                    {copied ? <Check className="w-4 h-4" strokeWidth={2.5} /> : <Copy className="w-4 h-4" strokeWidth={2.5} />}
                  </button>
                </div>
                <button onClick={() => router.push(`/blocks/${result.roomId}`)} className="w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]" style={{ background: "linear-gradient(135deg, rgba(74,222,128,0.22), rgba(52,211,153,0.15))", border: "1px solid rgba(74,222,128,0.45)", color: "#4ADE80" }}>
                  Go to Block →
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-display font-semibold uppercase tracking-[0.15em] block mb-2" style={{ color: "rgba(148,163,184,0.7)" }}>Block Name</label>
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") void handleCreate(); }}
                    placeholder="e.g. Family, College Gang..."
                    maxLength={40}
                    className="w-full px-4 py-3 text-sm text-white outline-none rounded-xl placeholder:text-slate-500"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
                  />
                </div>
                <button
                  onClick={() => void handleCreate()}
                  disabled={!name.trim() || loading}
                  className="w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, rgba(74,222,128,0.22), rgba(52,211,153,0.15))", border: "1px solid rgba(74,222,128,0.45)", color: "#4ADE80" }}
                >
                  {loading ? "Creating..." : "Create Block"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="brutal-card w-full max-w-sm p-0 overflow-hidden animate-pop-in">
        <div className="h-2 w-full bg-brutal-lime" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-black text-lg text-brutal-white uppercase tracking-tight">
              {result ? "BLOCK CREATED" : "CREATE BLOCK"}
            </h2>
            <button onClick={onClose} className="brutal-btn p-1.5">
              <X className="w-3.5 h-3.5" strokeWidth={3} />
            </button>
          </div>

          {result ? (
            <div className="space-y-4">
              <p className="text-brutal-dim text-xs font-mono">
                Share this code with friends to let them join your Block.
              </p>
              <div className="flex items-center gap-2">
                <div className="brutal-input flex-1 px-4 py-3 text-center">
                  <span className="font-display font-black text-2xl text-brutal-lime tracking-[0.3em]">
                    {result.inviteCode}
                  </span>
                </div>
                <button
                  onClick={copyCode}
                  className={`brutal-btn p-3 ${copied ? "!bg-brutal-lime !text-black !border-brutal-lime" : ""}`}
                  title="Copy code"
                >
                  {copied ? (
                    <Check className="w-4 h-4" strokeWidth={3} />
                  ) : (
                    <Copy className="w-4 h-4" strokeWidth={2.5} />
                  )}
                </button>
              </div>
              <button
                onClick={() => router.push(`/blocks/${result.roomId}`)}
                className="brutal-btn w-full py-3 text-xs font-mono font-black tracking-widest !bg-brutal-lime !text-black !border-brutal-lime"
              >
                GO TO BLOCK →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-mono font-black text-brutal-dim uppercase tracking-widest block mb-1.5">
                  Block Name
                </label>
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") void handleCreate(); }}
                  placeholder="e.g. Family, College Gang..."
                  maxLength={40}
                  className="brutal-input w-full px-3 py-2.5 text-sm font-bold text-brutal-white bg-bg focus:border-brutal-lime focus:shadow-brutal-lime outline-none placeholder:text-brutal-dim"
                />
              </div>
              <button
                onClick={() => void handleCreate()}
                disabled={!name.trim() || loading}
                className="brutal-btn w-full py-3 text-xs font-mono font-black tracking-widest !bg-brutal-lime !text-black !border-brutal-lime disabled:opacity-40"
              >
                {loading ? "CREATING..." : "CREATE BLOCK"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Join Block Modal ─────────────────────────────────────────────────────────

function JoinBlockModal({ onClose }: { onClose: () => void }) {
  const joinByCode = useMutation(api.blocks.joinByCode);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const isGlass = useThemeMode() === "glass";

  const handleJoin = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError("");
    try {
      const roomId = await joinByCode({ inviteCode: code.trim() });
      router.push(`/blocks/${roomId}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Invalid code");
    } finally {
      setLoading(false);
    }
  };

  if (isGlass) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(2,8,23,0.75)", backdropFilter: "blur(8px)" }}>
        <div className="w-full max-w-sm animate-pop-in" style={{ background: "rgba(8,15,40,0.96)", backdropFilter: "blur(28px) saturate(160%)", WebkitBackdropFilter: "blur(28px) saturate(160%)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "20px", overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)" }}>
          <div style={{ height: 3, background: "linear-gradient(90deg, #22D3EE, #67E8F9)" }} />
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-semibold text-base text-white tracking-tight">Join Block</h2>
              <button onClick={onClose} className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors hover:bg-white/10" style={{ border: "1px solid rgba(255,255,255,0.12)", color: "rgba(148,163,184,0.8)" }}>
                <X className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-display font-semibold uppercase tracking-[0.15em] block mb-2" style={{ color: "rgba(148,163,184,0.7)" }}>Invite Code</label>
                <input
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => { if (e.key === "Enter") void handleJoin(); }}
                  placeholder="XXXXXX"
                  maxLength={6}
                  className="w-full px-4 py-3 text-center text-xl font-display font-black tracking-[0.3em] text-white outline-none rounded-xl uppercase placeholder:text-slate-600"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
                />
                {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
              </div>
              <button
                onClick={() => void handleJoin()}
                disabled={code.trim().length < 6 || loading}
                className="w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, rgba(34,211,238,0.20), rgba(103,232,249,0.12))", border: "1px solid rgba(34,211,238,0.40)", color: "#22D3EE" }}
              >
                {loading ? "Joining..." : "Join Block"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="brutal-card w-full max-w-sm p-0 overflow-hidden animate-pop-in">
        <div className="h-2 w-full bg-brutal-cyan" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-black text-lg text-brutal-white uppercase tracking-tight">
              JOIN BLOCK
            </h2>
            <button onClick={onClose} className="brutal-btn p-1.5">
              <X className="w-3.5 h-3.5" strokeWidth={3} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[9px] font-mono font-black text-brutal-dim uppercase tracking-widest block mb-1.5">
                Invite Code
              </label>
              <input
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => { if (e.key === "Enter") void handleJoin(); }}
                placeholder="XXXXXX"
                maxLength={6}
                className="brutal-input w-full px-3 py-2.5 text-center text-xl font-display font-black tracking-[0.3em] text-brutal-white bg-bg focus:border-brutal-cyan focus:shadow-brutal-cyan outline-none placeholder:text-brutal-dim uppercase"
              />
              {error && (
                <p className="text-brutal-red text-[11px] font-mono mt-1.5">{error}</p>
              )}
            </div>
            <button
              onClick={() => void handleJoin()}
              disabled={code.trim().length < 6 || loading}
              className="brutal-btn w-full py-3 text-xs font-mono font-black tracking-widest !bg-brutal-cyan !text-black !border-brutal-cyan disabled:opacity-40"
            >
              {loading ? "JOINING..." : "JOIN BLOCK"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function BlocksContent() {
  const rooms = useQuery(api.blocks.getMyRooms);
  const pendingInvites = useQuery(api.blocks.getPendingInvitations);
  const inviteCount = pendingInvites?.length ?? 0;
  const deleteRoom = useMutation(api.blocks.deleteRoom);
  const leaveRoom = useMutation(api.blocks.leaveRoom);
  const respondToInvitation = useMutation(api.blocks.respondToInvitation);
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [showInvites, setShowInvites] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const isGlass = useThemeMode() === "glass";

  const handleRespond = async (invitationId: string, accept: boolean) => {
    setRespondingId(invitationId);
    try {
      const roomId = await respondToInvitation({ invitationId: invitationId as any, accept });
      if (accept && roomId) router.push(`/blocks/${roomId}`);
    } finally {
      setRespondingId(null);
    }
  };

  const handleDelete = async (roomId: Id<"rooms">) => {
    if (!confirm("Delete this Block? This cannot be undone.")) return;
    await deleteRoom({ roomId });
  };

  const handleLeave = async (roomId: Id<"rooms">) => {
    if (!confirm("Leave this Block?")) return;
    await leaveRoom({ roomId });
  };

  const glassCard = { background: "rgba(8,15,40,0.70)", backdropFilter: "blur(20px) saturate(150%)", WebkitBackdropFilter: "blur(20px) saturate(150%)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: "16px", boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)" };
  const glassBtn = (color: string) => ({ background: `rgba(${color},0.14)`, border: `1px solid rgba(${color},0.35)`, borderRadius: "10px", color: `rgb(${color})` });

  return (
    <>
      <main className={`min-h-screen flex flex-col pb-16 lg:pb-0 ${isGlass ? "bg-[#020817]" : "bg-bg"}`}>
        {/* Header */}
        <div className={`sticky top-0 z-50 ${isGlass ? "" : "bg-bg border-b-3 border-brutal-border"}`}
          style={isGlass ? { background: "rgba(2,8,23,0.82)", backdropFilter: "blur(24px) saturate(160%)", WebkitBackdropFilter: "blur(24px) saturate(160%)", borderBottom: "1px solid rgba(255,255,255,0.08)" } : undefined}>
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center gap-3">
            <div className="flex items-center gap-3 flex-1">
              <Link href="/" className={isGlass ? "flex items-center justify-center w-9 h-9 rounded-xl transition-colors hover:bg-white/10" : "brutal-btn p-2.5"} style={isGlass ? { border: "1px solid rgba(255,255,255,0.12)", color: "rgba(148,163,184,0.8)" } : undefined}>
                <ArrowLeft className="w-4 h-4" strokeWidth={isGlass ? 2 : 3} />
              </Link>
              <Layers className={`w-5 h-5 ${isGlass ? "" : "text-brutal-violet"}`} style={isGlass ? { color: "#A78BFA" } : undefined} strokeWidth={2.5} />
              <h1 className={`font-display font-bold text-xl sm:text-2xl uppercase tracking-tight ${isGlass ? "text-white" : "text-brutal-white"}`}>
                Watch Blocks
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowInvites((v) => !v)}
                className={`relative flex items-center justify-center w-9 h-9 transition-all ${isGlass ? "rounded-xl hover:bg-white/10" : `brutal-btn p-2.5 ${showInvites ? "!bg-brutal-yellow !text-black !border-brutal-yellow" : "hover:!border-brutal-yellow hover:!text-brutal-yellow"}`}`}
                style={isGlass ? { border: showInvites ? "1px solid rgba(250,204,21,0.45)" : "1px solid rgba(255,255,255,0.12)", background: showInvites ? "rgba(250,204,21,0.12)" : undefined, color: showInvites ? "#FDE047" : "rgba(148,163,184,0.8)" } : undefined}
                title="Invitations"
              >
                <Bell className="w-4 h-4" strokeWidth={2.5} />
                {inviteCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center" style={isGlass ? { background: "#FDE047", color: "#0a0a0a" } : { background: "#BFFF00", color: "#000", border: "1px solid #000" }}>
                    {inviteCount > 9 ? "9+" : inviteCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowJoin(true)}
                className={isGlass ? "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:bg-white/10" : "brutal-btn px-3 py-2.5 flex items-center justify-center gap-2 text-xs font-mono font-black hover:!bg-brutal-cyan hover:!text-black hover:!border-brutal-cyan"}
                style={isGlass ? { border: "1px solid rgba(34,211,238,0.30)", color: "#22D3EE" } : undefined}
              >
                <LogIn className="w-3.5 h-3.5" strokeWidth={2.5} />
                <span className="hidden sm:inline">Join</span>
              </button>
              <button
                onClick={() => setShowCreate(true)}
                className={isGlass ? "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all active:scale-95" : "brutal-btn px-3 py-2.5 flex items-center justify-center gap-2 text-xs font-mono font-black !bg-brutal-lime !text-black !border-brutal-lime"}
                style={isGlass ? { background: "linear-gradient(135deg, rgba(74,222,128,0.22), rgba(52,211,153,0.15))", border: "1px solid rgba(74,222,128,0.45)", color: "#4ADE80" } : undefined}
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={isGlass ? 2 : 3} />
                <span className="hidden sm:inline">Create</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-[1200px] mx-auto w-full px-4 sm:px-6 py-8">

          {/* Pending Invitations Panel */}
          {showInvites && (
            <div className={isGlass ? "mb-6 p-4" : "mb-6 brutal-card p-4 border-brutal-yellow"} style={isGlass ? { ...glassCard, borderColor: "rgba(250,204,21,0.25)" } : undefined}>
              <p className={`text-[10px] font-semibold uppercase tracking-[0.18em] flex items-center gap-2 mb-3 ${isGlass ? "" : "font-mono font-black text-brutal-yellow"}`} style={isGlass ? { color: "#FDE047" } : undefined}>
                <Bell className="w-3 h-3" />
                Invitations
                {inviteCount > 0 && <span className="px-1.5 py-0.5 text-[9px] font-black rounded" style={isGlass ? { background: "rgba(250,204,21,0.15)", color: "#FDE047", border: "1px solid rgba(250,204,21,0.3)" } : { background: "#BFFF00", color: "#000" }}>{inviteCount} pending</span>}
              </p>
              {!pendingInvites ? (
                <p className="text-slate-500 text-xs">Loading...</p>
              ) : pendingInvites.length === 0 ? (
                <p className="text-slate-500 text-xs">No pending invitations.</p>
              ) : (
                <div className="space-y-3">
                  {pendingInvites.map((inv) => (
                    <div key={inv._id} className="flex items-center gap-4 p-3 rounded-xl" style={isGlass ? { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" } : { background: "var(--surface-2)", border: "2px solid var(--brutal-border)" }}>
                      <div className="flex-1 min-w-0">
                        <p className={`font-display font-bold text-sm truncate ${isGlass ? "text-white" : "text-brutal-white uppercase font-black"}`}>{inv.roomName}</p>
                        <p className="text-slate-500 text-[11px] mt-0.5">from {inv.invitedByUsername ? `@${inv.invitedByUsername}` : inv.invitedByName}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => void handleRespond(inv._id, true)} disabled={respondingId === inv._id} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all disabled:opacity-50 ${isGlass ? "" : "brutal-btn font-mono font-black !bg-brutal-lime !text-black !border-brutal-lime"}`} style={isGlass ? glassBtn("74,222,128") : undefined}>
                          Join
                        </button>
                        <button onClick={() => void handleRespond(inv._id, false)} disabled={respondingId === inv._id} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all disabled:opacity-50 ${isGlass ? "" : "brutal-btn font-mono font-black hover:!bg-brutal-red hover:!text-white hover:!border-brutal-red"}`} style={isGlass ? glassBtn("248,113,113") : undefined}>
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Explainer */}
          <div className={isGlass ? "p-4 mb-6" : "brutal-card p-4 mb-6 border-brutal-violet bg-surface"} style={isGlass ? { ...glassCard, borderColor: "rgba(167,139,250,0.25)" } : undefined}>
            <p className={`text-xs leading-relaxed ${isGlass ? "text-slate-400" : "text-brutal-dim font-mono"}`}>
              <span className={`font-bold ${isGlass ? "text-violet-300" : "text-brutal-violet font-black"}`}>Watch Blocks</span> let you discover which movies you and your friends all want to watch — without anyone seeing each other&apos;s full list.{" "}
              <span className={isGlass ? "text-white font-medium" : "text-brutal-white font-bold"}>Only matches are shown.</span>
            </p>
          </div>

          {rooms === undefined ? (
            <div className="flex justify-center py-24">
              <div className={`w-8 h-8 border-4 animate-spin ${isGlass ? "border-violet-400/40 border-t-violet-400 rounded-full" : "border-brutal-violet border-t-transparent"}`} />
            </div>
          ) : rooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className={isGlass ? "p-8 max-w-md w-full" : "brutal-card p-8 max-w-md w-full"} style={isGlass ? glassCard : undefined}>
                <Layers className={`w-12 h-12 mx-auto mb-4 ${isGlass ? "text-slate-600" : "text-brutal-dim"}`} strokeWidth={1.5} />
                <p className={`font-display font-bold text-lg mb-2 ${isGlass ? "text-white" : "text-brutal-white uppercase"}`}>No Blocks Yet</p>
                <p className={`text-sm mb-6 ${isGlass ? "text-slate-400" : "text-brutal-muted font-mono"}`}>Create a Block and share the invite code with friends.</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button onClick={() => setShowCreate(true)} className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all active:scale-[0.98] ${isGlass ? "" : "brutal-btn text-xs font-mono font-black !bg-brutal-lime !text-black !border-brutal-lime"}`} style={isGlass ? { background: "linear-gradient(135deg, rgba(74,222,128,0.22), rgba(52,211,153,0.15))", border: "1px solid rgba(74,222,128,0.45)", color: "#4ADE80" } : undefined}>
                    {isGlass ? "Create Block" : "CREATE BLOCK"}
                  </button>
                  <button onClick={() => setShowJoin(true)} className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all active:scale-[0.98] ${isGlass ? "" : "brutal-btn text-xs font-mono font-black hover:!bg-brutal-cyan hover:!text-black hover:!border-brutal-cyan"}`} style={isGlass ? { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(34,211,238,0.30)", color: "#22D3EE" } : undefined}>
                    {isGlass ? "Join with Code" : "JOIN WITH CODE"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <p className={`text-[10px] uppercase tracking-wider mb-4 ${isGlass ? "text-slate-500 font-display" : "text-brutal-dim font-mono font-black"}`}>
                {rooms.length} {rooms.length === 1 ? "Block" : "Blocks"}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {rooms.map((room) => (
                  <div key={room!._id} className={isGlass ? "overflow-hidden" : "brutal-card p-0 overflow-hidden group"} style={isGlass ? glassCard : undefined}>
                    <div className="h-1" style={isGlass ? { background: "linear-gradient(90deg, #A78BFA, #7C3AED)" } : { height: 6, background: "var(--brutal-violet)" }} />
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className={`font-display font-bold text-base truncate ${isGlass ? "text-white" : "text-brutal-white uppercase font-black"}`}>{room!.name}</h3>
                            {room!.isOwner && <Crown className="w-3.5 h-3.5 shrink-0" style={{ color: "#FCD34D" }} strokeWidth={2.5} fill="currentColor" />}
                          </div>
                          <p className="text-slate-500 text-[11px] mt-0.5">{room!.memberCount} {room!.memberCount === 1 ? "member" : "members"}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {room!.isOwner ? (
                            <button onClick={() => void handleDelete(room!._id)} className={`p-1.5 rounded-lg transition-all ${isGlass ? "hover:bg-red-500/15" : "brutal-btn hover:!bg-brutal-red hover:!border-brutal-red hover:!text-white"}`} style={isGlass ? { border: "1px solid rgba(255,255,255,0.10)", color: "rgba(148,163,184,0.6)" } : undefined} title="Delete Block">
                              <Trash2 className="w-3 h-3" strokeWidth={2.5} />
                            </button>
                          ) : (
                            <button onClick={() => void handleLeave(room!._id)} className={`p-1.5 rounded-lg transition-all ${isGlass ? "hover:bg-red-500/15" : "brutal-btn hover:!bg-brutal-red hover:!border-brutal-red hover:!text-white text-brutal-dim"}`} style={isGlass ? { border: "1px solid rgba(255,255,255,0.10)", color: "rgba(148,163,184,0.6)" } : undefined} title="Leave Block">
                              <X className="w-3 h-3" strokeWidth={2.5} />
                            </button>
                          )}
                        </div>
                      </div>
                      <Link href={`/blocks/${room!._id}`} className={`w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-2 rounded-xl transition-all active:scale-[0.98] ${isGlass ? "" : "brutal-btn font-mono font-black tracking-widest hover:!bg-brutal-violet hover:!text-black hover:!border-brutal-violet"}`} style={isGlass ? { background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.28)", color: "#C4B5FD" } : undefined}>
                        {isGlass ? "View Matches" : "VIEW MATCHES"}
                        <ChevronRight className="w-3.5 h-3.5" strokeWidth={isGlass ? 2 : 3} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {showCreate && <CreateBlockModal onClose={() => setShowCreate(false)} />}
      {showJoin && <JoinBlockModal onClose={() => setShowJoin(false)} />}
    </>
  );
}

export default function BlocksPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="w-10 h-10 border-4 border-brutal-violet border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push("/sign-in");
    return null;
  }

  return <BlocksContent />;
}
