"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { X, Check } from "lucide-react";
import { SessionSwipe } from "@/hooks/useCineSwipeEngine";
import { useToast } from "@/components/ToastProvider";
import Image from "next/image";
import { posterUrl } from "@/lib/constants";

export default function SwipeSummaryScreen({ engine }: { engine: any }) {
  const [isCommiting, setIsCommiting] = useState(false);
  const recordSwipeBatch = useMutation(api.cineswipe.recordSwipeBatch);
  const router = useRouter();
  const { pushToast } = useToast();

  const handleConfirm = async () => {
    setIsCommiting(true);
    try {
      const payload = engine.sessionSwipes.map((s: SessionSwipe) => ({
        movieId: s.movie.id,
        movieTitle: s.movie.title,
        posterPath: s.movie.poster_path || "",
        genreIds: s.movie.genre_ids || [],
        action: s.action,
      }));

      await recordSwipeBatch({ swipes: payload });
      pushToast("success", "Session saved! 🍿");
      // Go back to the dashboard when complete
      router.push("/");
    } catch (e: any) {
      pushToast("error", e.message || "Failed to save session");
      setIsCommiting(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "liked":
        return "text-brutal-red border-brutal-red";
      case "watchlist":
        return "text-brutal-lime border-brutal-lime";
      case "watched":
        return "text-brutal-cyan border-brutal-cyan";
      case "block":
        return "text-brutal-violet border-brutal-violet";
      default:
        return "text-brutal-dim border-brutal-dim";
    }
  };

  const grouped = engine.sessionSwipes.reduce(
    (acc: any, curr: SessionSwipe) => {
      acc[curr.action] = (acc[curr.action] || 0) + 1;
      return acc;
    },
    {}
  );

  return (
    <div className="mx-auto flex h-[100dvh] max-w-[460px] md:max-w-[600px] flex-col bg-background">
      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b-2 border-brutal-border px-4 py-4">
        <div>
          <h1 className="font-outfit text-xl font-black uppercase tracking-wider">
            Session Summary
          </h1>
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-text-muted mt-1">
            {engine.sessionSwipes.length} Movies Swiped
          </p>
        </div>
        <button
          onClick={() => engine.setIsReviewing(false)}
          className="brutal-btn p-2 hover:bg-surface-2 transition-colors border-2 border-transparent hover:border-brutal-border"
          disabled={isCommiting}
          title="Back to Swiping"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* ── Scrollable list groups ── */}
      <div className="flex flex-col gap-6 flex-1 overflow-y-auto px-4 py-6 [&::-webkit-scrollbar]:hidden">
        {["liked", "watchlist", "watched", "block", "skip"].map((action) => {
          const count = grouped[action];
          if (!count) return null;
          const movies = engine.sessionSwipes.filter(
            (s: SessionSwipe) => s.action === action
          );

          return (
            <div key={action} className="flex flex-col gap-3">
              <h2
                className={`font-mono text-sm font-black uppercase tracking-widest ${
                  getActionColor(action).split(" ")[0]
                }`}
              >
                {action} ({count})
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-4 snap-x [&::-webkit-scrollbar]:hidden">
                {movies.map((s: SessionSwipe) => (
                  <div
                    key={s.movie.id}
                    className={`relative w-24 h-36 shrink-0 snap-start border-2 bg-black ${
                      getActionColor(action).split(" ")[1] // extracts the border color assigned above
                    }`}
                  >
                    {s.movie.poster_path ? (
                      <Image
                        src={posterUrl(s.movie.poster_path, "small")}
                        alt={s.movie.title}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center p-2 text-center font-mono text-[10px] font-bold uppercase text-brutal-muted break-words">
                        {s.movie.title}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Footer Action ── */}
      <div className="p-4 border-t-2 border-brutal-border bg-background pb-8 md:pb-4">
        <button
          onClick={handleConfirm}
          disabled={isCommiting}
          className="brutal-btn w-full flex h-14 items-center justify-center gap-3 border-2 border-brutal-pink bg-brutal-pink px-4 font-mono text-[15px] font-black uppercase tracking-widest text-black disabled:opacity-50 transition-colors hover:bg-white hover:text-brutal-pink"
        >
          {isCommiting ? (
            <span className="animate-pulse">Saving Session...</span>
          ) : (
            <>
              <Check className="h-5 w-5" strokeWidth={3} />
              Confirm & Save
            </>
          )}
        </button>
      </div>
    </div>
  );
}
