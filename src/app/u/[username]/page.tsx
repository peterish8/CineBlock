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

export default function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [copied, setCopied] = useState(false);

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
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="w-10 h-10 border-4 border-brutal-violet border-t-transparent animate-spin" />
      </div>
    );
  }

  // Not found
  if (userProfile === null) {
    return (
      <main className="min-h-screen bg-bg flex flex-col items-center justify-center gap-6 p-6">
        <User className="w-14 h-14 text-brutal-dim" strokeWidth={1} />
        <p className="font-display font-bold text-xl uppercase tracking-wider text-center">
          User &ldquo;@{decodeURIComponent(username)}&rdquo; not found
        </p>
        <Link href="/cineblocks/discover" className="brutal-btn px-6 py-3 text-sm font-mono uppercase">
          <ArrowLeft className="w-4 h-4 inline mr-1" />Discover Users
        </Link>
      </main>
    );
  }

  const displayName = userProfile.name ?? userProfile.username ?? "Unknown";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <main className="min-h-screen bg-bg pb-20 lg:pb-0">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-bg border-b-3 border-brutal-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <Link href="/cineblocks/discover" className="brutal-btn p-2.5">
            <ArrowLeft className="w-4 h-4" strokeWidth={3} />
          </Link>
          <Globe className="w-4 h-4 text-brutal-violet" strokeWidth={2.5} />
          <span className="font-display font-bold text-base uppercase tracking-tight text-brutal-white flex-1 truncate">
            @{userProfile.username ?? displayName}
          </span>
          <button
            onClick={copyLink}
            className="brutal-btn flex items-center gap-2 px-3 py-2 text-[10px] font-mono uppercase"
            title="Copy profile link"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-brutal-lime" strokeWidth={3} /> : <Copy className="w-3.5 h-3.5" strokeWidth={2.5} />}
            {copied ? "Copied!" : "Copy Link"}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
        {/* Profile card */}
        <div className="brutal-card p-0 overflow-hidden">
          <div className="h-2 w-full bg-brutal-violet" />
          <div className="p-6 flex items-center gap-5">
            <div className="w-16 h-16 shrink-0 bg-brutal-violet border-3 border-brutal-border flex items-center justify-center overflow-hidden">
              <span className="font-display font-black text-2xl text-black">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-display font-black text-2xl text-brutal-white uppercase tracking-tight truncate">
                {displayName}
              </h1>
              {userProfile.username && (
                <p className="font-mono text-sm text-brutal-dim mt-0.5">@{userProfile.username}</p>
              )}
            </div>
          </div>
        </div>

        {/* Public Playlists */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-3 border-b-3 border-brutal-border pb-2">
            <LayoutGrid className="w-4 h-4 text-brutal-cyan" strokeWidth={2.5} />
            <h2 className="font-display font-bold text-lg uppercase tracking-widest flex-1">Public Playlists</h2>
            {publicBlocks && (
              <span className="font-mono text-[10px] text-brutal-dim">{publicBlocks.length} PLAYLISTS</span>
            )}
          </div>

          {publicBlocks === undefined ? (
            <div className="brutal-card p-10 flex items-center justify-center">
              <div className="w-6 h-6 border-3 border-brutal-cyan border-t-transparent animate-spin" />
            </div>
          ) : publicBlocks.length === 0 ? (
            <div className="brutal-card p-10 flex flex-col items-center gap-3 border-dashed">
              <LayoutGrid className="w-10 h-10 text-brutal-dim" strokeWidth={1} />
              <p className="font-display font-bold uppercase text-brutal-dim tracking-wider text-center text-sm">
                No public playlists yet
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {publicBlocks.map((block) => (
                <Link
                  key={block._id}
                  href={`/cineblock/${block._id}`}
                  className="border-3 border-brutal-border bg-surface flex flex-col overflow-hidden hover:border-brutal-violet transition-colors group"
                >
                  {/* Preview grid */}
                  <div className="grid grid-cols-2 aspect-video bg-surface-2 border-b-3 border-brutal-border">
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
                        <LayoutGrid className="w-8 h-8 text-brutal-dim" strokeWidth={1} />
                      </div>
                    )}
                  </div>
                  <div className="p-3 flex flex-col gap-1 flex-1">
                    <h3 className="font-display font-bold text-sm uppercase tracking-wider line-clamp-2 text-brutal-white group-hover:text-brutal-violet transition-colors">
                      {block.title}
                    </h3>
                    <p className="font-mono text-[10px] text-brutal-dim uppercase">
                      {block.movieCount} / 50 movies
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Public Stamps */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-3 border-b-3 border-brutal-border pb-2">
            <Stamp className="w-4 h-4 text-brutal-yellow" strokeWidth={2.5} />
            <h2 className="font-display font-bold text-lg uppercase tracking-widest flex-1">Stamps</h2>
            {publicStamps && (
              <span className="font-mono text-[10px] text-brutal-dim">{publicStamps.length} STAMPS</span>
            )}
          </div>

          {publicStamps === undefined ? (
            <div className="brutal-card p-10 flex items-center justify-center">
              <div className="w-6 h-6 border-3 border-brutal-yellow border-t-transparent animate-spin" />
            </div>
          ) : publicStamps.length === 0 ? (
            <div className="brutal-card p-10 flex flex-col items-center gap-3 border-dashed">
              <Stamp className="w-10 h-10 text-brutal-dim" strokeWidth={1} />
              <p className="font-display font-bold uppercase text-brutal-dim tracking-wider text-center text-sm">
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
