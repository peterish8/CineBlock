"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState, useRef, useEffect } from "react";
import { LogIn, LogOut, User, Bookmark, ChevronDown } from "lucide-react";
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

  const [showDebug, setShowDebug] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) setShowDebug(true);
    }, 4000);
    return () => clearTimeout(timer);
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="brutal-btn p-1.5 opacity-50">
          <User className="w-4 h-4 animate-pulse" strokeWidth={2.5} />
        </div>
        {showDebug && (
          <button 
            onClick={() => window.location.reload()}
            className="text-[9px] font-mono font-bold text-brutal-red underline decoration-2 underline-offset-2"
          >
            STUCK? RELOAD
          </button>
        )}
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
      {/* Single box: left side navigates, right side opens dropdown */}
      <div className="brutal-btn p-0 flex items-stretch overflow-hidden bg-surface border-brutal-border hover:!border-brutal-yellow hover:!text-brutal-yellow relative">
        <Link
          href="/profile"
          className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5"
        >
          <User className="w-4 h-4" strokeWidth={2.5} />
          {inviteCount > 0 && (
            <span className="absolute -top-1.5 left-4 w-4 h-4 rounded-full bg-brutal-yellow text-black text-[9px] font-black flex items-center justify-center border border-black">
              {inviteCount > 9 ? "9+" : inviteCount}
            </span>
          )}
        </Link>
        {/* divider */}
        <span className="w-px self-stretch bg-brutal-border opacity-50" />
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center px-1.5 py-1.5"
        >
          <ChevronDown
            className="w-3 h-3 transition-transform duration-200"
            style={{ transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)" }}
            strokeWidth={2.5}
          />
        </button>
      </div>

      {dropdownOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-xl z-[100] animate-pop-in"
          style={{
            background: "rgba(10, 14, 26, 0.55)",
            backdropFilter: "blur(28px) saturate(160%)",
            WebkitBackdropFilter: "blur(28px) saturate(160%)",
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)",
          }}
        >
          <Link
            href="/profile"
            onClick={() => setDropdownOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-xs font-mono font-bold text-white/90 hover:text-brutal-cyan hover:bg-white/5 transition-colors"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
          >
            <User className="w-3.5 h-3.5" strokeWidth={2.5} />
            PROFILE
          </Link>
          <Link
            href="/watchlist"
            onClick={() => setDropdownOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-xs font-mono font-bold text-white/90 hover:text-brutal-lime hover:bg-white/5 transition-colors"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
          >
            <Bookmark className="w-3.5 h-3.5" strokeWidth={2.5} />
            MY LISTS
          </Link>
          <button
            onClick={() => {
              setDropdownOpen(false);
              void signOut();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-xs font-mono font-bold text-white/90 hover:text-brutal-red hover:bg-white/5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" strokeWidth={2.5} />
            SIGN OUT
          </button>
        </div>
      )}
    </div>
  );
}
