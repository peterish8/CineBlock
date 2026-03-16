"use client";

import Link from "next/link";
import { ArrowLeft, Newspaper, RefreshCw } from "lucide-react";
import NewsFeed from "@/components/NewsFeed";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";

export default function NewsPage() {
  const invalidateToday = useMutation(api.news.invalidateToday);
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await invalidateToday();
    // Small delay so Convex propagates the deletion before NewsFeed re-queries
    await new Promise((r) => setTimeout(r, 800));
    setRefreshKey((k) => k + 1);
    setRefreshing(false);
  };

  return (
    <main className="min-h-screen bg-bg flex flex-col pb-16 lg:pb-0">
      <div className="sticky top-0 z-50 bg-bg border-b-3 border-brutal-border">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="brutal-btn p-2.5">
              <ArrowLeft className="w-4 h-4" strokeWidth={3} />
            </Link>
            <Newspaper className="w-5 h-5 text-brutal-orange" strokeWidth={2.5} />
            <h1 className="font-display font-bold text-xl sm:text-2xl text-brutal-white uppercase tracking-tight">
              MOVIE NEWS
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => void handleRefresh()}
              disabled={refreshing}
              className="brutal-btn p-2 hover:!border-brutal-orange hover:!text-brutal-orange disabled:opacity-40"
              title="Refresh news"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} strokeWidth={2.5} />
            </button>
            <span className="brutal-chip text-brutal-orange border-brutal-orange text-[10px]">
              DAILY FEED
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-[1600px] mx-auto w-full px-4 sm:px-6 py-6">
        <p className="text-brutal-dim text-[10px] font-mono uppercase tracking-wider mb-4">
          LATEST FROM VARIETY • DEADLINE • HOLLYWOOD REPORTER • COLLIDER • REDDIT
        </p>
        <NewsFeed key={refreshKey} />
      </div>

    </main>
  );
}
