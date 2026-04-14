"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import StampCard from "@/components/StampCard";
import { posterUrl } from "@/lib/constants";
import {
  ArrowLeft, User, LayoutGrid, Stamp, Copy, Check, Globe,
} from "lucide-react";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useThemeMode } from "@/hooks/useThemeMode";

export default function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [copied, setCopied] = useState(false);
  const isGlass = useThemeMode() === "glass";

  const userProfile = useQuery(api.users.getUserPublicProfile, {
    username: decodeURIComponent(username),
  });

  const publicBlocks = useQuery(
    api.cineblocks.getPublicBlocksByUserId,
    userProfile ? { userId: userProfile._id as Id<"users"> } : "skip"
  );

  const publicStamps = useQuery(
    api.stamps.getPublicStampsByUserId,
    userProfile ? { userId: userProfile._id as Id<"users"> } : "skip"
  );

  const copyLink = () => {
    void navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Loading
  if (userProfile === undefined) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${isGlass ? "" : "bg-bg"}`}
        style={isGlass ? { background: "#020817" } : undefined}
      >
        <div
          className={`w-10 h-10 border-4 border-t-transparent animate-spin ${isGlass ? "rounded-full border-violet-400" : "border-brutal-violet"}`}
        />
      </div>
    );
  }

  // Not found
  if (userProfile === null) {
    return (
      <main
        className={`min-h-screen flex flex-col items-center justify-center gap-6 p-6 ${isGlass ? "" : "bg-bg"}`}
        style={isGlass ? { background: "#020817" } : undefined}
      >
        <User className={`w-14 h-14 ${isGlass ? "text-slate-600" : "text-brutal-dim"}`} strokeWidth={1} />
        <p className={`font-bold text-xl text-center ${isGlass ? "text-white" : "font-display uppercase tracking-wider"}`}>
          User &ldquo;@{decodeURIComponent(username)}&rdquo; not found
        </p>
        <Link
          href="/cineblocks/discover"
          className={`flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all active:scale-[0.97] ${isGlass ? "rounded-xl" : "brutal-btn font-mono uppercase"}`}
          style={isGlass ? { background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)", color: "rgba(148,163,184,0.9)" } : undefined}
        >
          <ArrowLeft className="w-4 h-4" />Discover Users
        </Link>
      </main>
    );
  }

  const displayName = userProfile.name ?? userProfile.username ?? "Unknown";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <main
      className={`min-h-screen pb-20 lg:pb-0 ${isGlass ? "relative overflow-x-hidden" : "bg-bg"}`}
      style={isGlass ? { background: "#020817" } : undefined}
    >
      {/* Glass depth orbs */}
      {isGlass && (
        <>
          <div className="pointer-events-none fixed left-[-20%] top-[-15%] aspect-square w-[60vw] rounded-full opacity-25" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)", filter: "blur(90px)", zIndex: 0 }} />
          <div className="pointer-events-none fixed bottom-[-15%] right-[-10%] aspect-square w-[50vw] rounded-full opacity-20" style={{ background: "radial-gradient(circle, rgba(34,211,238,0.18) 0%, transparent 70%)", filter: "blur(100px)", zIndex: 0 }} />
        </>
      )}

      {/* Header */}
      <div
        className={`sticky top-0 z-50 ${isGlass ? "" : "bg-bg border-b-3 border-brutal-border"}`}
        style={isGlass ? {
          background: "rgba(2,8,23,0.80)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        } : undefined}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3 relative z-10">
          <Link
            href="/cineblocks/discover"
            className={isGlass ? "flex items-center justify-center w-9 h-9 rounded-xl transition-colors hover:bg-white/10" : "brutal-btn p-2.5"}
            style={isGlass ? { border: "1px solid rgba(255,255,255,0.12)", color: "rgba(148,163,184,0.8)" } : undefined}
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={3} />
          </Link>
          <Globe className={`w-4 h-4 ${isGlass ? "text-violet-400" : "text-brutal-violet"}`} strokeWidth={2.5} />
          <span className={`font-bold text-base flex-1 truncate ${isGlass ? "text-white tracking-tight" : "font-display uppercase tracking-tight text-brutal-white"}`}>
            @{userProfile.username ?? displayName}
          </span>
          <button
            onClick={copyLink}
            className={`flex items-center gap-2 px-3 py-2 text-[10px] font-bold transition-all active:scale-[0.97] ${isGlass ? "rounded-xl" : "brutal-btn font-mono uppercase"}`}
            style={isGlass ? (copied
              ? { background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.30)", color: "#6EE7B7" }
              : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(148,163,184,0.8)" }
            ) : undefined}
            title="Copy profile link"
          >
            {copied ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : <Copy className="w-3.5 h-3.5" strokeWidth={2.5} />}
            {copied ? "Copied!" : "Copy Link"}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8 relative z-10">
        {/* Profile card */}
        <div
          className={isGlass ? "overflow-hidden rounded-2xl" : "brutal-card p-0 overflow-hidden"}
          style={isGlass ? {
            background: "rgba(8,15,40,0.72)",
            backdropFilter: "blur(28px) saturate(200%)",
            WebkitBackdropFilter: "blur(28px) saturate(200%)",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.10)",
          } : undefined}
        >
          {isGlass
            ? <div style={{ height: 3, background: "linear-gradient(90deg, #8B5CF6, #A78BFA)", flexShrink: 0 }} />
            : <div className="h-2 w-full bg-brutal-violet" />
          }
          <div className="p-6 flex items-center gap-5">
            <div
              className={`w-16 h-16 shrink-0 flex items-center justify-center overflow-hidden ${isGlass ? "rounded-2xl" : "bg-brutal-violet border-3 border-brutal-border"}`}
              style={isGlass ? { background: "rgba(139,92,246,0.20)", border: "1px solid rgba(139,92,246,0.40)" } : undefined}
            >
              <span className={`font-black text-2xl ${isGlass ? "text-violet-300" : "font-display text-black"}`}>{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className={`font-black text-2xl truncate ${isGlass ? "text-white" : "font-display text-brutal-white uppercase tracking-tight"}`}>
                {displayName}
              </h1>
              {userProfile.username && (
                <p className={`text-sm mt-0.5 ${isGlass ? "text-slate-400" : "font-mono text-brutal-dim"}`}>@{userProfile.username}</p>
              )}
            </div>
          </div>
        </div>

        {/* Public Playlists */}
        <section className="flex flex-col gap-4">
          <div
            className={`flex items-center gap-3 pb-2 ${isGlass ? "" : "border-b-3 border-brutal-border"}`}
            style={isGlass ? { borderBottom: "1px solid rgba(255,255,255,0.08)" } : undefined}
          >
            <LayoutGrid className={`w-4 h-4 ${isGlass ? "text-cyan-400" : "text-brutal-cyan"}`} strokeWidth={2.5} />
            <h2 className={`font-bold text-lg flex-1 ${isGlass ? "text-white" : "font-display uppercase tracking-widest"}`}>Public Playlists</h2>
            {publicBlocks && (
              <span className={`text-[10px] font-bold ${isGlass ? "text-slate-500" : "font-mono text-brutal-dim"}`}>
                {isGlass ? `${publicBlocks.length} playlists` : `${publicBlocks.length} PLAYLISTS`}
              </span>
            )}
          </div>

          {publicBlocks === undefined ? (
            <div
              className={`p-10 flex items-center justify-center ${isGlass ? "rounded-2xl" : "brutal-card"}`}
              style={isGlass ? { background: "rgba(8,15,40,0.60)", border: "1px solid rgba(255,255,255,0.08)" } : undefined}
            >
              <div className={`w-6 h-6 border-t-transparent animate-spin ${isGlass ? "rounded-full border-2 border-cyan-400" : "border-3 border-brutal-cyan"}`} />
            </div>
          ) : publicBlocks.length === 0 ? (
            <div
              className={`p-10 flex flex-col items-center gap-3 ${isGlass ? "rounded-2xl" : "brutal-card border-dashed"}`}
              style={isGlass ? { background: "rgba(8,15,40,0.60)", border: "1px solid rgba(255,255,255,0.08)" } : undefined}
            >
              <LayoutGrid className={`w-10 h-10 ${isGlass ? "text-slate-600" : "text-brutal-dim"}`} strokeWidth={1} />
              <p className={`font-bold text-sm text-center ${isGlass ? "text-slate-500" : "font-display uppercase tracking-wider text-brutal-dim"}`}>
                No public playlists yet
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {publicBlocks.map((block) => (
                <Link
                  key={block._id}
                  href={`/cineblock/${block._id}`}
                  className={`flex flex-col overflow-hidden transition-all group ${
                    isGlass
                      ? "rounded-2xl hover:ring-1 hover:ring-white/20"
                      : "border-3 border-brutal-border bg-surface hover:border-brutal-violet transition-colors"
                  }`}
                  style={isGlass ? {
                    background: "rgba(8,15,40,0.60)",
                    border: "1px solid rgba(255,255,255,0.10)",
                  } : undefined}
                >
                  {/* Preview grid */}
                  <div
                    className={`grid grid-cols-2 aspect-video ${isGlass ? "" : "bg-surface-2 border-b-3 border-brutal-border"}`}
                    style={isGlass ? { background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.08)" } : undefined}
                  >
                    {block.previewPosters.length > 0 ? (
                      block.previewPosters.slice(0, 4).map((path, idx) => (
                        <div key={idx} className="relative overflow-hidden bg-surface-2">
                          <Image
                            src={posterUrl(path, "small")}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="200px"
                          />
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 h-full flex items-center justify-center">
                        <LayoutGrid className={`w-8 h-8 ${isGlass ? "text-slate-600" : "text-brutal-dim"}`} strokeWidth={1} />
                      </div>
                    )}
                  </div>
                  <div className="p-3 flex flex-col gap-1 flex-1">
                    <h3 className={`font-bold text-sm line-clamp-2 transition-colors ${
                      isGlass
                        ? "text-slate-300 group-hover:text-white"
                        : "font-display uppercase tracking-wider text-brutal-white group-hover:text-brutal-violet"
                    }`}>
                      {block.title}
                    </h3>
                    <p className={`text-[10px] font-bold ${isGlass ? "text-slate-600" : "font-mono text-brutal-dim uppercase"}`}>
                      {isGlass ? `${block.movieCount} / 50 movies` : `${block.movieCount} / 50 MOVIES`}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Public Stamps */}
        <section className="flex flex-col gap-4">
          <div
            className={`flex items-center gap-3 pb-2 ${isGlass ? "" : "border-b-3 border-brutal-border"}`}
            style={isGlass ? { borderBottom: "1px solid rgba(255,255,255,0.08)" } : undefined}
          >
            <Stamp className={`w-4 h-4 ${isGlass ? "text-amber-400" : "text-brutal-yellow"}`} strokeWidth={2.5} />
            <h2 className={`font-bold text-lg flex-1 ${isGlass ? "text-white" : "font-display uppercase tracking-widest"}`}>Stamps</h2>
            {publicStamps && (
              <span className={`text-[10px] font-bold ${isGlass ? "text-slate-500" : "font-mono text-brutal-dim"}`}>
                {isGlass ? `${publicStamps.length} stamps` : `${publicStamps.length} STAMPS`}
              </span>
            )}
          </div>

          {publicStamps === undefined ? (
            <div
              className={`p-10 flex items-center justify-center ${isGlass ? "rounded-2xl" : "brutal-card"}`}
              style={isGlass ? { background: "rgba(8,15,40,0.60)", border: "1px solid rgba(255,255,255,0.08)" } : undefined}
            >
              <div className={`w-6 h-6 border-t-transparent animate-spin ${isGlass ? "rounded-full border-2 border-amber-400" : "border-3 border-brutal-yellow"}`} />
            </div>
          ) : publicStamps.length === 0 ? (
            <div
              className={`p-10 flex flex-col items-center gap-3 ${isGlass ? "rounded-2xl" : "brutal-card border-dashed"}`}
              style={isGlass ? { background: "rgba(8,15,40,0.60)", border: "1px solid rgba(255,255,255,0.08)" } : undefined}
            >
              <Stamp className={`w-10 h-10 ${isGlass ? "text-slate-600" : "text-brutal-dim"}`} strokeWidth={1} />
              <p className={`font-bold text-sm text-center ${isGlass ? "text-slate-500" : "font-display uppercase tracking-wider text-brutal-dim"}`}>
                No public stamps yet
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {publicStamps.map((stamp) => (
                <StampCard
                  key={stamp._id}
                  stamp={stamp}
                  isOwner={false}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
