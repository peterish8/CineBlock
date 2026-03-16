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
  Flame, Star,
} from "lucide-react";
import { posterUrl } from "@/lib/constants";
import type { Id } from "../../../../convex/_generated/dataModel";
import Attribution from "@/components/Attribution";

// ─── Member Avatar ────────────────────────────────────────────────────────────

function MemberAvatar({
  name,
  isOwner,
  isMe,
}: {
  name: string;
  isOwner: boolean;
  isMe: boolean;
}) {
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={`w-11 h-11 flex items-center justify-center font-display font-black text-sm border-3 border-brutal-border shadow-brutal relative ${
          isMe ? "bg-brutal-violet text-white" : "bg-surface-2 text-brutal-white"
        }`}
      >
        {initials}
        {isOwner && (
          <Crown
            className="w-3 h-3 text-brutal-yellow absolute -top-1.5 -right-1.5"
            strokeWidth={2.5}
            fill="currentColor"
          />
        )}
      </div>
      <span className="text-[9px] font-mono text-brutal-dim max-w-[52px] truncate text-center">
        {isMe ? "YOU" : name.split(" ")[0]}
      </span>
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
  const room = useQuery(api.rooms.getRoom, { roomId: blockId });
  const matches = useQuery(api.rooms.getRoomMatches, { roomId: blockId });
  const votes = useQuery(api.rooms.getRoomVotes, { roomId: blockId });
  const toggleVote = useMutation(api.rooms.toggleVote);
  const leaveRoom = useMutation(api.rooms.leaveRoom);
  const router = useRouter();

  const [copiedCode, setCopiedCode] = useState(false);
  const [leaving, setLeaving] = useState(false);

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
    <main className="min-h-screen bg-bg flex flex-col">
      <div className="sticky top-0 z-50 bg-bg border-b-3 border-brutal-border">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/blocks" className="brutal-btn p-2 shrink-0">
              <ArrowLeft className="w-4 h-4" strokeWidth={3} />
            </Link>
            <div className="min-w-0">
              <h1 className="font-display font-black text-lg text-brutal-white uppercase tracking-tight truncate leading-none">
                {room.name}
              </h1>
              <p className="text-brutal-dim text-[10px] font-mono mt-0.5">
                {room.members.length} {room.members.length === 1 ? "member" : "members"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={copyCode}
              className={`brutal-btn px-3 py-1.5 flex items-center gap-2 text-[10px] font-mono font-black transition-all ${
                copiedCode
                  ? "!bg-brutal-lime !text-black !border-brutal-lime"
                  : "hover:!border-brutal-violet hover:!text-brutal-violet"
              }`}
              title="Copy invite code"
            >
              {copiedCode ? (
                <Check className="w-3 h-3" strokeWidth={3} />
              ) : (
                <Copy className="w-3 h-3" strokeWidth={2.5} />
              )}
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

      <div className="flex-1 max-w-[1200px] mx-auto w-full px-4 sm:px-6 py-6 space-y-6">

        {/* Members */}
        <div className="brutal-card p-4">
          <p className="text-[9px] font-mono font-black text-brutal-dim uppercase tracking-[0.2em] mb-3">
            Members
          </p>
          <div className="flex flex-wrap gap-4">
            {room.members.map((m) => (
              <MemberAvatar
                key={m.userId}
                name={m.name}
                isOwner={m.isOwner}
                isMe={m.isMe}
              />
            ))}
          </div>
        </div>

        {/* Privacy note */}
        <div className="flex items-start gap-3 px-4 py-3 bg-surface border-2 border-brutal-border">
          <span className="text-lg shrink-0">🔒</span>
          <p className="text-brutal-dim text-xs font-mono leading-relaxed">
            If <span className="text-brutal-white font-bold">you have</span> a matched movie, you see <span className="text-brutal-white font-bold">who else</span> wants to watch it.
            If you don&apos;t have it, you only see the count — <span className="text-brutal-white font-bold">no names</span>.
          </p>
        </div>

        {/* Matches */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[9px] font-mono font-black text-brutal-dim uppercase tracking-[0.2em]">
              Matches {matches !== null && matches.length > 0 && `— ${matches.length} movies`}
            </p>
            {matches !== null && matches.length > 0 && (
              <span className="brutal-chip text-brutal-violet border-brutal-violet text-[9px]">
                REAL-TIME
              </span>
            )}
          </div>

          {matches === null || matches.length === 0 ? (
            <div className="brutal-card p-8 text-center">
              <Popcorn className="w-10 h-10 text-brutal-dim mx-auto mb-3" strokeWidth={1.5} />
              <p className="font-display font-black text-base text-brutal-white uppercase mb-1">
                NO MATCHES YET
              </p>
              <p className="text-brutal-muted text-sm font-mono">
                When 2+ members share a movie in their Watchlist, it shows up here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
      <Attribution />
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
