"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useConvexAuth } from "convex/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  ArrowLeft, Users, Copy, Check, Crown, Popcorn, LogOut, Loader2,
  Flame, Star, Shield, UserMinus, ChevronDown, ChevronUp,
} from "lucide-react";
import { posterUrl } from "@/lib/constants";
import type { Id } from "../../../../convex/_generated/dataModel";

// ─── Member Card ──────────────────────────────────────────────────────────────

function MemberCard({
  member,
  isAdmin,
  onPromote,
  onRemove,
}: {
  member: { userId: string; name: string; username: string | null; isOwner: boolean; isMe: boolean; role: string };
  isAdmin: boolean;
  onPromote: (userId: string) => void;
  onRemove: (userId: string) => void;
}) {
  const initials = member.name.slice(0, 2).toUpperCase();
  const isAdminMember = member.role === "admin";
  const canAct = isAdmin && !member.isMe && !isAdminMember;

  return (
    <div className={`flex items-center gap-3 p-3 border-2 ${member.isMe ? "border-brutal-violet bg-brutal-violet/10" : "border-brutal-border bg-surface-2"}`}>
      <div className={`w-10 h-10 shrink-0 flex items-center justify-center font-display font-black text-sm border-2 border-brutal-border relative ${member.isMe ? "bg-brutal-violet text-white" : "bg-surface text-brutal-white"}`}>
        {initials}
        {member.isOwner && (
          <Crown className="w-2.5 h-2.5 text-brutal-yellow absolute -top-1 -right-1" strokeWidth={2.5} fill="currentColor" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-brutal-white truncate">
            {member.isMe ? "You" : member.name}
          </span>
          {isAdminMember && (
            <span className="flex items-center gap-0.5 bg-brutal-yellow/20 text-brutal-yellow text-[9px] font-black px-1.5 py-0.5 border border-brutal-yellow/50">
              <Shield className="w-2.5 h-2.5" strokeWidth={2.5} />
              ADMIN
            </span>
          )}
        </div>
        {member.username && (
          <p className="text-[10px] font-mono text-brutal-dim">@{member.username}</p>
        )}
      </div>
      {canAct && (
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => onPromote(member.userId)}
            className="brutal-btn p-1.5 hover:!bg-brutal-yellow hover:!text-black hover:!border-brutal-yellow"
            title="Make Admin"
          >
            <Shield className="w-3 h-3" strokeWidth={2.5} />
          </button>
          <button
            onClick={() => onRemove(member.userId)}
            className="brutal-btn p-1.5 hover:!bg-brutal-red hover:!text-white hover:!border-brutal-red"
            title="Remove from Block"
          >
            <UserMinus className="w-3 h-3" strokeWidth={2.5} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Match Card ───────────────────────────────────────────────────────────────

function MatchCard({
  movieTitle,
  posterPath,
  memberCount,
  totalMembers,
  iInvolved,
  alsoWantedBy,
  voted,
  voteCount,
  onVote,
}: {
  movieId: number;
  movieTitle: string;
  posterPath: string;
  memberCount: number;
  totalMembers: number;
  iInvolved: boolean;
  alsoWantedBy: string[];
  voted: boolean;
  voteCount: number;
  onVote: () => void;
}) {
  const allIn = memberCount === totalMembers;

  const MAX_SHOWN = 2;
  const shown = alsoWantedBy.slice(0, MAX_SHOWN);
  const extra = alsoWantedBy.length - MAX_SHOWN;
  const nameLabel = shown.join(", ") + (extra > 0 ? ` +${extra} more` : "");

  return (
    <div className="brutal-card p-0 overflow-hidden group">
      <div
        className={`h-1.5 w-full transition-colors ${
          allIn ? "bg-brutal-yellow" : memberCount >= 3 ? "bg-brutal-lime" : "bg-brutal-cyan"
        }`}
      />

      <div className="flex gap-3 p-3">
        {/* Poster */}
        <div className="relative w-16 shrink-0 aspect-[2/3] border-2 border-brutal-border bg-surface-2 overflow-hidden">
          {posterPath ? (
            <Image
              src={posterUrl(posterPath, "small")}
              alt={movieTitle}
              fill
              className="object-cover"
              sizes="64px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center p-1">
              <span className="text-brutal-dim text-[9px] font-mono text-center uppercase leading-tight">
                {movieTitle}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div>
            <p className="font-display font-black text-sm text-brutal-white uppercase leading-tight line-clamp-2">
              {movieTitle}
            </p>

            <div className="flex items-center gap-1.5 mt-1.5">
              <div
                className={`brutal-chip text-[9px] font-mono flex items-center gap-1 ${
                  allIn
                    ? "text-brutal-yellow border-brutal-yellow"
                    : "text-brutal-cyan border-brutal-cyan"
                }`}
              >
                <Users className="w-2.5 h-2.5" strokeWidth={2.5} />
                {memberCount}/{totalMembers} want to watch
              </div>
              {allIn && (
                <Star className="w-3 h-3 text-brutal-yellow fill-current" strokeWidth={2} />
              )}
            </div>

            {iInvolved ? (
              <p className="text-brutal-dim text-[10px] font-mono mt-1 leading-tight">
                <span className="text-brutal-white font-bold">{nameLabel}</span>
                {" "}also queued this
              </p>
            ) : (
              <p className="text-brutal-dim text-[10px] font-mono mt-1 leading-tight">
                <span className="text-brutal-white font-bold">{memberCount}/{totalMembers}</span>
                {" "}people&apos;s watchlist contains this
              </p>
            )}
          </div>

          <button
            onClick={onVote}
            className={`mt-2 brutal-btn px-3 py-1.5 text-[10px] font-mono font-black tracking-wide flex items-center gap-1.5 w-fit transition-all ${
              voted
                ? "!bg-brutal-orange !text-black !border-brutal-orange"
                : "hover:!bg-brutal-orange hover:!text-black hover:!border-brutal-orange"
            }`}
          >
            <Flame className={`w-3 h-3 ${voted ? "fill-current" : ""}`} strokeWidth={2.5} />
            {voted ? "LET'S WATCH!" : "LET'S WATCH"}
            {voteCount > 0 && (
              <span className={`ml-0.5 ${voted ? "text-black/70" : "text-brutal-orange"}`}>
                {voteCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Block Page ───────────────────────────────────────────────────────────────

function BlockContent({ blockId }: { blockId: Id<"rooms"> }) {
  const room = useQuery(api.blocks.getRoom, { roomId: blockId });
  const matches = useQuery(api.blocks.getRoomMatches, { roomId: blockId });
  const votes = useQuery(api.blocks.getRoomVotes, { roomId: blockId });
  const toggleVote = useMutation(api.blocks.toggleVote);
  const leaveRoom = useMutation(api.blocks.leaveRoom);
  const inviteByUsername = useMutation(api.blocks.inviteByUsername);
  const promoteToAdmin = useMutation(api.blocks.promoteToAdmin);
  const removeMember = useMutation(api.blocks.removeMember);
  const router = useRouter();

  const [copiedCode, setCopiedCode] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [inviteUsername, setInviteUsername] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState(false);
  // Mobile tab switcher
  const [mobileTab, setMobileTab] = useState<"members" | "matches" | "invite">("matches");

  const copyCode = () => {
    if (!room) return;
    void navigator.clipboard.writeText(room.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleLeave = async () => {
    if (!confirm("Leave this Block?")) return;
    setLeaving(true);
    try {
      await leaveRoom({ roomId: blockId });
      router.push("/blocks");
    } finally {
      setLeaving(false);
    }
  };

  const handleVote = async (movieId: number) => {
    await toggleVote({ roomId: blockId, movieId });
  };

  const handleInvite = async () => {
    const u = inviteUsername.replace(/^@/, "").trim();
    if (!u) return;
    setInviteLoading(true);
    setInviteError("");
    setInviteSuccess(false);
    try {
      await inviteByUsername({ roomId: blockId, username: u });
      setInviteSuccess(true);
      setInviteUsername("");
      setTimeout(() => setInviteSuccess(false), 3000);
    } catch (err: any) {
      setInviteError(err.data ?? err.message?.replace("Uncaught Error: ", "") ?? "Failed to send invite.");
    } finally {
      setInviteLoading(false);
    }
  };

  const handlePromote = async (targetUserId: string) => {
    if (!confirm("Make this member an admin?")) return;
    try {
      await promoteToAdmin({ roomId: blockId, targetUserId: targetUserId as any });
    } catch (err: any) {
      alert(err.data ?? err.message?.replace("Uncaught Error: ", "") ?? "Failed to promote.");
    }
  };

  const handleRemoveMember = async (targetUserId: string) => {
    if (!confirm("Remove this member from the Block?")) return;
    try {
      await removeMember({ roomId: blockId, targetUserId: targetUserId as any });
    } catch (err: any) {
      alert(err.data ?? err.message?.replace("Uncaught Error: ", "") ?? "Failed to remove.");
    }
  };

  const voteLookup = new Map(
    (votes ?? []).map((v) => [v.movieId, { voterCount: v.voterCount, iVoted: v.iVoted }])
  );

  if (room === undefined || matches === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <Loader2 className="w-8 h-8 text-brutal-violet animate-spin" strokeWidth={2.5} />
      </div>
    );
  }

  if (room === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg gap-4">
        <p className="font-display font-black text-xl text-brutal-white uppercase">Block not found</p>
        <Link href="/blocks" className="brutal-btn px-4 py-2 text-xs font-mono font-black">
          BACK TO BLOCKS
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-bg flex flex-col pb-16 lg:pb-0">

      {/* ── Top Bar ── */}
      <div className="sticky top-0 z-50 bg-bg border-b-3 border-brutal-border">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/blocks" className="brutal-btn p-2 shrink-0">
              <ArrowLeft className="w-4 h-4" strokeWidth={3} />
            </Link>
            <div className="min-w-0">
              <h1 className="font-display font-black text-lg text-brutal-white uppercase tracking-tight truncate leading-none">
                {room.name}
              </h1>
              <p className="text-brutal-dim text-[10px] font-mono mt-0.5">
                {room.members.length} {room.members.length === 1 ? "member" : "members"} · BLOCK
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={copyCode}
              className={`brutal-btn px-3 py-1.5 flex items-center gap-2 text-[10px] font-mono font-black transition-all ${
                copiedCode ? "!bg-brutal-lime !text-black !border-brutal-lime" : "hover:!border-brutal-violet hover:!text-brutal-violet"
              }`}
              title="Copy invite code"
            >
              {copiedCode ? <Check className="w-3 h-3" strokeWidth={3} /> : <Copy className="w-3 h-3" strokeWidth={2.5} />}
              <span className="tracking-[0.15em]">{room.inviteCode}</span>
            </button>
            {!room.isOwner && (
              <button
                onClick={() => void handleLeave()}
                disabled={leaving}
                className="brutal-btn p-2 hover:!bg-brutal-red hover:!border-brutal-red hover:!text-white text-brutal-dim"
                title="Leave Block"
              >
                <LogOut className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Bento Body ── */}
      <div className="flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 py-6">

        {/* ── MOBILE TAB BAR (hidden on md+) ── */}
        <div className="flex md:hidden border-3 border-brutal-border mb-4 overflow-hidden">
          {(["matches", "members", "invite"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setMobileTab(tab)}
              className={`flex-1 py-3 text-[10px] font-mono font-black uppercase tracking-widest tap-target transition-all ${
                mobileTab === tab
                  ? "bg-brutal-yellow text-black"
                  : "bg-surface text-brutal-dim"
              }`}
            >
              {tab === "matches" ? `Matches${matches?.length ? ` (${matches.length})` : ""}` : tab === "members" ? `Members (${room.members.length})` : "Invite"}
            </button>
          ))}
        </div>

        {/* Mobile: tab content / Tablet+: two-column bento */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-5 md:items-start">

          {/* ── LEFT PANEL (sidebar on md+, tab-controlled on mobile) ── */}
          <div className={`w-full md:w-[300px] lg:w-[320px] shrink-0 flex flex-col gap-4 md:sticky md:top-[73px] ${mobileTab === "matches" ? "hidden md:flex" : ""}`}>

            {/* Members bento card — show only on members tab on mobile */}
            <div className={`brutal-card p-0 overflow-hidden ${mobileTab === "invite" ? "hidden md:block" : ""}`}>
              {/* Accent header */}
              <div className="h-1.5 w-full bg-brutal-violet" />
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[9px] font-mono font-black text-brutal-dim uppercase tracking-[0.2em] flex items-center gap-1.5">
                    <Users className="w-3 h-3" strokeWidth={2.5} />
                    Members
                  </p>
                  <span className="brutal-chip text-brutal-violet border-brutal-violet text-[9px] px-2 py-0">
                    {room.members.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {room.members.map((m) => (
                    <MemberCard
                      key={m.userId}
                      member={m}
                      isAdmin={room.isAdmin ?? false}
                      onPromote={handlePromote}
                      onRemove={handleRemoveMember}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Invite bento card — show only on invite tab on mobile */}
            <div className={`brutal-card p-0 overflow-hidden ${mobileTab === "members" ? "hidden md:block" : ""}`}>
              <div className="h-1.5 w-full bg-brutal-yellow" />
              <div className="p-4">
                <p className="text-[9px] font-mono font-black text-brutal-dim uppercase tracking-[0.2em] mb-3">
                  Invite by Username
                </p>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center brutal-input px-3 gap-1.5 focus-within:border-brutal-yellow">
                    <span className="text-brutal-dim font-mono text-sm shrink-0">@</span>
                    <input
                      value={inviteUsername}
                      onChange={(e) => { setInviteUsername(e.target.value); setInviteError(""); }}
                      onKeyDown={(e) => { if (e.key === "Enter") void handleInvite(); }}
                      placeholder="username or name"
                      className="flex-1 bg-transparent text-brutal-white text-sm font-mono outline-none placeholder:text-brutal-dim"
                      maxLength={30}
                    />
                  </div>
                  <button
                    onClick={() => void handleInvite()}
                    disabled={inviteLoading || !inviteUsername.trim()}
                    className={`brutal-btn px-3 font-mono text-xs font-black tracking-wider shrink-0 disabled:opacity-40 transition-all ${
                      inviteSuccess ? "!bg-brutal-lime !text-black !border-brutal-lime" : "hover:!border-brutal-yellow hover:!text-brutal-yellow"
                    }`}
                  >
                    {inviteSuccess ? "SENT ✓" : inviteLoading ? "..." : "INVITE"}
                  </button>
                </div>
                {inviteError && <p className="text-brutal-red text-[10px] font-mono mt-2 leading-snug">{inviteError}</p>}
                {inviteSuccess && <p className="text-brutal-lime text-[10px] font-mono mt-2">Invite sent! They'll see it in their Blocks page.</p>}
              </div>
            </div>

            {/* Privacy note — hidden on mobile, shown on sidebar */}
            <div className="hidden md:flex items-start gap-3 px-3 py-3 bg-surface border-2 border-brutal-border">
              <span className="text-base shrink-0">🔒</span>
              <p className="text-brutal-dim text-[10px] font-mono leading-relaxed">
                If <span className="text-brutal-white font-bold">you have</span> a matched movie, you see who else wants to watch. Otherwise only the count is shown.
              </p>
            </div>
          </div>

          {/* ── RIGHT PANEL (matches — tab-controlled on mobile) ── */}
          <div className={`flex-1 min-w-0 flex-col gap-4 ${mobileTab === "matches" ? "flex" : "hidden md:flex"}`}>

            {/* Privacy note — mobile only */}
            <div className="flex md:hidden items-start gap-3 px-4 py-3 bg-surface border-2 border-brutal-border">
              <span className="text-base shrink-0">🔒</span>
              <p className="text-brutal-dim text-xs font-mono leading-relaxed">
                If <span className="text-brutal-white font-bold">you have</span> a matched movie, you see <span className="text-brutal-white font-bold">who else</span> wants to watch it. Otherwise only the count is shown.
              </p>
            </div>

            {/* Matches */}
            <div className="brutal-card p-0 overflow-hidden flex-1">
              <div className="h-1.5 w-full bg-brutal-orange" />
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[9px] font-mono font-black text-brutal-dim uppercase tracking-[0.2em] flex items-center gap-1.5">
                    <Flame className="w-3 h-3 text-brutal-orange" strokeWidth={2.5} />
                    Matches
                    {matches !== null && matches.length > 0 && (
                      <span className="text-brutal-white ml-1">— {matches.length} movies</span>
                    )}
                  </p>
                  {matches !== null && matches.length > 0 && (
                    <span className="brutal-chip text-brutal-violet border-brutal-violet text-[9px]">
                      REAL-TIME
                    </span>
                  )}
                </div>

                {matches === null || matches.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Popcorn className="w-12 h-12 text-brutal-dim mx-auto mb-4" strokeWidth={1.5} />
                    <p className="font-display font-black text-lg text-brutal-white uppercase mb-2">
                      NO MATCHES YET
                    </p>
                    <p className="text-brutal-muted text-sm font-mono max-w-xs">
                      When 2+ members share a movie in their Watchlist, it appears here in real-time.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {matches.map((m) => {
                      const voteData = voteLookup.get(m.movieId);
                      return (
                        <MatchCard
                          key={m.movieId}
                          movieId={m.movieId}
                          movieTitle={m.movieTitle}
                          posterPath={m.posterPath}
                          memberCount={m.memberCount}
                          totalMembers={m.totalMembers}
                          iInvolved={m.iInvolved}
                          alsoWantedBy={m.alsoWantedBy}
                          voted={voteData?.iVoted ?? false}
                          voteCount={voteData?.voterCount ?? 0}
                          onVote={() => void handleVote(m.movieId)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function BlockPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  const params = useParams();
  const blockId = params.blockId as Id<"rooms">;

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

  return <BlockContent blockId={blockId} />;
}
