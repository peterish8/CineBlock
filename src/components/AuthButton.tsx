"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState, useRef, useEffect } from "react";
import { LogIn, LogOut, User, Bookmark, Layers } from "lucide-react";
import Link from "next/link";
import { api } from "../../convex/_generated/api";

export default function AuthButton() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pendingInvites = useQuery(
    api.blocks.getPendingInvitations,
    isAuthenticated ? {} : "skip"
  );
  const inviteCount = pendingInvites?.length ?? 0;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (isLoading) {
    return (
      <div className="brutal-btn p-1.5 opacity-50">
        <User className="w-4 h-4" strokeWidth={2.5} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Link
        href="/sign-in"
        className="brutal-btn px-3 py-1.5 text-xs font-bold font-mono tracking-widest flex items-center gap-2 bg-surface border-brutal-border hover:!bg-brutal-yellow hover:!text-black hover:!border-brutal-yellow"
      >
        <LogIn className="w-4 h-4" strokeWidth={2.5} />
        <span className="hidden sm:inline-block">SIGN IN</span>
      </Link>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="brutal-btn p-1.5 sm:px-3 sm:py-1.5 flex items-center gap-2 bg-surface border-brutal-border hover:!border-brutal-yellow hover:!text-brutal-yellow relative"
      >
        <User className="w-4 h-4" strokeWidth={2.5} />
        <span className="hidden sm:inline-block text-xs font-bold font-mono tracking-widest">
          ACCOUNT
        </span>
        {inviteCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-brutal-yellow text-black text-[9px] font-black flex items-center justify-center border border-black">
            {inviteCount > 9 ? "9+" : inviteCount}
          </span>
        )}
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 brutal-card p-0 z-[100] animate-pop-in">
          <Link
            href="/profile"
            onClick={() => setDropdownOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-xs font-mono font-bold text-brutal-white hover:bg-surface-2 hover:text-brutal-cyan transition-colors border-b-2 border-brutal-border"
          >
            <User className="w-3.5 h-3.5" strokeWidth={2.5} />
            PROFILE
          </Link>
          <Link
            href="/watchlist"
            onClick={() => setDropdownOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-xs font-mono font-bold text-brutal-white hover:bg-surface-2 hover:text-brutal-lime transition-colors border-b-2 border-brutal-border"
          >
            <Bookmark className="w-3.5 h-3.5" strokeWidth={2.5} />
            MY LISTS
          </Link>
          <Link
            href="/blocks"
            onClick={() => setDropdownOpen(false)}
            className="flex items-center justify-between px-4 py-3 text-xs font-mono font-bold text-brutal-white hover:bg-surface-2 hover:text-brutal-violet transition-colors border-b-2 border-brutal-border"
          >
            <div className="flex items-center gap-3">
              <Layers className="w-3.5 h-3.5" strokeWidth={2.5} />
              BLOCKS
            </div>
            {inviteCount > 0 && (
              <span className="bg-brutal-yellow text-black text-[9px] font-black px-1.5 py-0.5 rounded-sm">
                {inviteCount}
              </span>
            )}
          </Link>
          <button
            onClick={() => {
              setDropdownOpen(false);
              void signOut();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-xs font-mono font-bold text-brutal-white hover:bg-surface-2 hover:text-brutal-red transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" strokeWidth={2.5} />
            SIGN OUT
          </button>
        </div>
      )}
    </div>
  );
}
