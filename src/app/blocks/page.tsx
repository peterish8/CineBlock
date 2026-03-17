"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useConvexAuth } from "convex/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Layers, Plus, LogIn, Copy, Check, Trash2, Crown, ChevronRight, X, Bell } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

// ─── Create Block Modal ───────────────────────────────────────────────────────

function CreateBlockModal({ onClose }: { onClose: () => void }) {
  const createRoom = useMutation(api.blocks.createRoom);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ roomId: string; inviteCode: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

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

  return (
    <>
      <main className="min-h-screen bg-bg flex flex-col pb-16 lg:pb-0">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-bg border-b-3 border-brutal-border">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center gap-3">
            <div className="flex items-center gap-3 flex-1">
              <Link href="/" className="brutal-btn p-2.5">
                <ArrowLeft className="w-4 h-4" strokeWidth={3} />
              </Link>
              <Layers className="w-5 h-5 text-brutal-violet" strokeWidth={2.5} />
              <h1 className="font-display font-bold text-xl sm:text-2xl text-brutal-white uppercase tracking-tight">
                WATCH BLOCKS
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {/* Invitations bell */}
              <button
                onClick={() => setShowInvites((v) => !v)}
                className={`brutal-btn p-2.5 relative flex items-center justify-center transition-all ${showInvites ? "!bg-brutal-yellow !text-black !border-brutal-yellow" : "hover:!border-brutal-yellow hover:!text-brutal-yellow"}`}
                title="Invitations"
              >
                <Bell className="w-4 h-4" strokeWidth={2.5} />
                {inviteCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-brutal-yellow text-black text-[9px] font-black flex items-center justify-center border border-black">
                    {inviteCount > 9 ? "9+" : inviteCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowJoin(true)}
                className="brutal-btn px-3 py-2.5 flex items-center justify-center gap-2 text-xs font-mono font-black hover:!bg-brutal-cyan hover:!text-black hover:!border-brutal-cyan"
              >
                <LogIn className="w-3.5 h-3.5" strokeWidth={2.5} />
                <span className="hidden sm:inline">JOIN</span>
              </button>
              <button
                onClick={() => setShowCreate(true)}
                className="brutal-btn px-3 py-2.5 flex items-center justify-center gap-2 text-xs font-mono font-black !bg-brutal-lime !text-black !border-brutal-lime"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={3} />
                <span className="hidden sm:inline">CREATE</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-[1200px] mx-auto w-full px-4 sm:px-6 py-8">

          {/* Pending Invitations Panel */}
          {showInvites && (
            <div className="mb-6 brutal-card p-4 border-brutal-yellow">
              <p className="text-[9px] font-mono font-black text-brutal-yellow uppercase tracking-[0.2em] flex items-center gap-2 mb-3">
                <Bell className="w-3 h-3" />
                Invitations
                {inviteCount > 0 && (
                  <span className="bg-brutal-yellow text-black px-1.5 py-0.5 text-[9px] font-black rounded-sm">{inviteCount} pending</span>
                )}
              </p>
              {!pendingInvites ? (
                <p className="text-brutal-dim text-xs font-mono">Loading...</p>
              ) : pendingInvites.length === 0 ? (
                <p className="text-brutal-dim text-xs font-mono">No pending invitations.</p>
              ) : (
                <div className="space-y-3">
                  {pendingInvites.map((inv) => (
                    <div key={inv._id} className="flex items-center gap-4 p-3 bg-surface-2 border-2 border-brutal-border">
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-black text-sm text-brutal-white uppercase truncate">{inv.roomName}</p>
                        <p className="text-brutal-dim text-[11px] font-mono mt-0.5">
                          from {inv.invitedByUsername ? `@${inv.invitedByUsername}` : inv.invitedByName}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => void handleRespond(inv._id, true)}
                          disabled={respondingId === inv._id}
                          className="brutal-btn px-3 py-1.5 text-[10px] font-mono font-black !bg-brutal-lime !text-black !border-brutal-lime disabled:opacity-50"
                        >
                          JOIN
                        </button>
                        <button
                          onClick={() => void handleRespond(inv._id, false)}
                          disabled={respondingId === inv._id}
                          className="brutal-btn px-3 py-1.5 text-[10px] font-mono font-black hover:!bg-brutal-red hover:!text-white hover:!border-brutal-red disabled:opacity-50"
                        >
                          DECLINE
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Explainer */}
          <div className="brutal-card p-4 mb-6 border-brutal-violet bg-surface">
            <p className="text-brutal-dim text-xs font-mono leading-relaxed">
              <span className="text-brutal-violet font-black">WATCH BLOCKS</span> let you discover which movies you and your friends all want to watch — without anyone seeing each other&apos;s full watchlist.{" "}
              <span className="text-brutal-white font-bold">Only matches are shown.</span>
            </p>
          </div>

          {rooms === undefined ? (
            <div className="flex justify-center py-24">
              <div className="w-8 h-8 border-4 border-brutal-violet border-t-transparent animate-spin" />
            </div>
          ) : rooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="brutal-card p-8 max-w-md w-full">
                <Layers className="w-12 h-12 text-brutal-dim mx-auto mb-4" strokeWidth={1.5} />
                <p className="font-display font-bold text-lg text-brutal-white uppercase mb-2">NO BLOCKS YET</p>
                <p className="text-brutal-muted text-sm font-mono mb-6">
                  Create a Block and share the invite code with friends.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setShowCreate(true)}
                    className="brutal-btn flex-1 py-3 text-xs font-mono font-black !bg-brutal-lime !text-black !border-brutal-lime"
                  >
                    CREATE BLOCK
                  </button>
                  <button
                    onClick={() => setShowJoin(true)}
                    className="brutal-btn flex-1 py-3 text-xs font-mono font-black hover:!bg-brutal-cyan hover:!text-black hover:!border-brutal-cyan"
                  >
                    JOIN WITH CODE
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <p className="text-brutal-dim text-[10px] font-mono uppercase tracking-wider mb-4">
                {rooms.length} {rooms.length === 1 ? "BLOCK" : "BLOCKS"}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {rooms.map((room) => (
                  <div key={room!._id} className="brutal-card p-0 overflow-hidden group">
                    <div className="h-1.5 w-full bg-brutal-violet" />
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-display font-black text-base text-brutal-white uppercase truncate">
                              {room!.name}
                            </h3>
                            {room!.isOwner && (
                              <Crown className="w-3.5 h-3.5 text-brutal-yellow shrink-0" strokeWidth={2.5} fill="currentColor" />
                            )}
                          </div>
                          <p className="text-brutal-dim text-[11px] font-mono mt-0.5">
                            {room!.memberCount} {room!.memberCount === 1 ? "member" : "members"}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {room!.isOwner ? (
                            <button
                              onClick={() => void handleDelete(room!._id)}
                              className="brutal-btn p-1.5 hover:!bg-brutal-red hover:!border-brutal-red hover:!text-white"
                              title="Delete Block"
                            >
                              <Trash2 className="w-3 h-3" strokeWidth={2.5} />
                            </button>
                          ) : (
                            <button
                              onClick={() => void handleLeave(room!._id)}
                              className="brutal-btn p-1.5 hover:!bg-brutal-red hover:!border-brutal-red hover:!text-white text-brutal-dim"
                              title="Leave Block"
                            >
                              <X className="w-3 h-3" strokeWidth={2.5} />
                            </button>
                          )}
                        </div>
                      </div>

                      <Link
                        href={`/blocks/${room!._id}`}
                        className="brutal-btn w-full py-2.5 text-[11px] font-mono font-black tracking-widest flex items-center justify-center gap-2 hover:!bg-brutal-violet hover:!text-black hover:!border-brutal-violet"
                      >
                        VIEW MATCHES
                        <ChevronRight className="w-3.5 h-3.5" strokeWidth={3} />
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
