"use client";

import { use, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ArrowLeft, LayoutGrid, Share2, Globe } from "lucide-react";
import { posterUrl } from "@/lib/constants";
import StampCard from "@/components/StampCard";

type BlockPreview = {
  _id: string;
  title: string;
  description?: string;
  isPublic: boolean;
  movieCount: number;
  previewPosters: string[];
};

function PublicBlockCard({ block }: { block: BlockPreview }) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const shareUrl = `${window.location.origin}/cineblock/${block._id}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <Link
      href={`/cineblock/${block._id}`}
      className="group brutal-card flex flex-col overflow-hidden hover:-translate-y-1 transition-transform duration-200 ease-out motion-reduce:transform-none motion-reduce:transition-none"
    >
      {/* Poster collage */}
      <div className="grid grid-cols-2 aspect-video bg-surface-2 relative overflow-hidden border-b-4 border-brutal-border">
        {block.previewPosters.length > 0 ? (
          block.previewPosters.slice(0, 4).map((path, i) => (
            <div key={i} className="relative overflow-hidden bg-surface-2">
              <Image
                src={posterUrl(path, "small")}
                alt=""
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300 ease-out motion-reduce:transform-none motion-reduce:transition-none"
                sizes="200px"
              />
            </div>
          ))
        ) : (
          <div className="col-span-2 flex items-center justify-center h-full">
            <LayoutGrid className="w-12 h-12 text-brutal-dim" strokeWidth={1} />
          </div>
        )}
        <div className="absolute bottom-0 right-0 bg-black border-t-3 border-l-3 border-brutal-border px-3 py-1">
          <span className="font-mono font-bold text-xs text-brutal-white">{block.movieCount} films</span>
        </div>
        <div className="absolute top-0 left-0 border-r-3 border-b-3 border-brutal-border p-1.5 bg-brutal-violet">
          <Globe className="w-3 h-3 text-black" />
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="font-display font-bold text-sm uppercase tracking-wider line-clamp-1 text-brutal-white group-hover:text-brutal-violet transition-colors">
          {block.title}
        </h3>
        <div className="flex gap-2 mt-auto pt-2">
          <button
            onClick={handleCopyLink}
            className="brutal-btn flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-mono uppercase"
          >
            <Share2 className="w-3 h-3" />
            {copied ? "COPIED!" : "SHARE"}
          </button>
        </div>
      </div>
    </Link>
  );
}

export default function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);

  const profile = useQuery(api.users.getUserPublicProfile, { username });
  const blocks = useQuery(
    api.cineblocks.getPublicBlocksByUserId,
    profile ? { userId: profile._id } : "skip"
  );
  const stamps = useQuery(
    api.stamps.getPublicStampsByUserId,
    profile ? { userId: profile._id } : "skip"
  );

  if (profile === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="w-10 h-10 border-4 border-brutal-yellow border-t-transparent animate-spin" />
      </div>
    );
  }

  if (profile === null) {
    return (
      <div className="min-h-screen bg-bg pb-16 lg:pb-0">
        <div className="sticky top-0 z-50 bg-bg border-b-3 border-brutal-border px-4 sm:px-8 py-5 flex items-center gap-4">
          <Link href="/search" className="brutal-btn p-2.5 shrink-0">
            <ArrowLeft className="w-4 h-4" strokeWidth={3} />
          </Link>
          <span className="font-display font-black text-lg text-brutal-white tracking-tight">
            USER <span className="text-brutal-yellow">NOT FOUND</span>
          </span>
        </div>
        <div className="max-w-2xl mx-auto px-4 sm:px-8 py-16 text-center">
          <p className="font-mono text-xs uppercase text-brutal-dim tracking-widest">
            No user found for @{username}
          </p>
          <Link href="/search" className="brutal-btn mt-6 inline-block px-4 py-2 font-mono text-xs uppercase">
            Back to Search
          </Link>
        </div>
      </div>
    );
  }

  const displayName = profile.name || "CineBlock User";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-bg pb-16 lg:pb-0">
      {/* Top bar */}
      <div className="sticky top-0 z-50 bg-bg border-b-3 border-brutal-border px-4 sm:px-8 py-5 flex items-center gap-4">
        <Link href="/search" className="brutal-btn p-2.5 shrink-0">
          <ArrowLeft className="w-4 h-4" strokeWidth={3} />
        </Link>
        <span className="font-display font-black text-lg text-brutal-white tracking-tight truncate">
          {profile.username ? (
            <>@<span className="text-brutal-yellow">{profile.username}</span></>
          ) : displayName}
        </span>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-10 space-y-8 animate-fade-in">

        {/* Hero card */}
        <div className="brutal-card p-0 overflow-hidden">
          <div className="h-3 w-full bg-brutal-yellow" />
          <div className="p-6 sm:p-8 flex items-center gap-6">
            <div className="w-20 h-20 shrink-0 bg-brutal-yellow border-4 border-brutal-border flex items-center justify-center overflow-hidden">
              {profile.image ? (
                <Image src={profile.image} alt={displayName} width={80} height={80} className="w-full h-full object-cover" />
              ) : (
                <span className="font-display font-black text-2xl text-black">{initials}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-display font-black text-2xl sm:text-3xl text-brutal-white uppercase tracking-tight truncate">
                {displayName}
              </h1>
              {profile.username && (
                <p className="font-mono text-sm text-brutal-dim mt-1">@{profile.username}</p>
              )}
            </div>
          </div>
        </div>

        {/* Public CineBlocks */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 border-b-2 border-brutal-border pb-3">
            <h2 className="font-mono font-black text-[10px] uppercase tracking-[0.2em] text-brutal-dim flex-1">
              Public CineBlocks
            </h2>
            {blocks && blocks.length > 0 && (
              <span className="brutal-chip text-brutal-violet border-brutal-violet text-[10px]">
                {blocks.length}
              </span>
            )}
          </div>

          {blocks === undefined ? (
            <div className="py-8 flex items-center justify-center">
              <div className="w-7 h-7 border-4 border-brutal-violet border-t-transparent animate-spin" />
            </div>
          ) : blocks.length === 0 ? (
            <div className="border-2 border-dashed border-brutal-border py-8 text-center font-mono text-xs text-brutal-dim uppercase">
              No public CineBlocks yet
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(blocks as BlockPreview[]).map((block) => (
                <PublicBlockCard key={block._id} block={block} />
              ))}
            </div>
          )}
        </section>

        {/* Stamps */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 border-b-2 border-brutal-border pb-3">
            <h2 className="font-mono font-black text-[10px] uppercase tracking-[0.2em] text-brutal-dim flex-1">
              Stamps
            </h2>
            {stamps && stamps.length > 0 && (
              <span className="brutal-chip text-brutal-yellow border-brutal-yellow text-[10px]">
                {stamps.length}
              </span>
            )}
          </div>

          {stamps === undefined ? (
            <div className="py-8 flex items-center justify-center">
              <div className="w-7 h-7 border-4 border-brutal-yellow border-t-transparent animate-spin" />
            </div>
          ) : stamps.length === 0 ? (
            <div className="border-2 border-dashed border-brutal-border py-8 text-center font-mono text-xs text-brutal-dim uppercase">
              No public stamps yet
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {stamps.map((stamp) => (
                <StampCard key={stamp._id} stamp={stamp} isOwner={false} />
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
