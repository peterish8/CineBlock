"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAction, useQuery } from "convex/react";
import { Newspaper } from "lucide-react";
import { api } from "../../convex/_generated/api";
import NewsArticleCard from "./NewsArticleCard";
import ErrorState from "./ErrorState";

const today = new Date().toISOString().split("T")[0];

export default function NewsFeed() {
  const cached = useQuery(api.news.getNewsFeed, { fetchedDate: today });
  const refreshToday = useAction(api.news.refreshToday);
  const [fetching, setFetching] = useState(false);
  const [failed, setFailed] = useState(false);

  // Articles with images first. The query is reactive, so a refresh shows up here on its own.
  const articles = useMemo(
    () => [...(cached ?? [])].sort((a, b) => (b.thumbnail ? 1 : 0) - (a.thumbnail ? 1 : 0)),
    [cached],
  );

  const fetchFeed = useCallback(() => {
    setFailed(false);
    setFetching(true);
    refreshToday()
      .catch(() => setFailed(true))
      .finally(() => setFetching(false));
  }, [refreshToday]);

  // No feed for today yet: ask the server to fetch one.
  useEffect(() => {
    if (cached === null) queueMicrotask(fetchFeed);
  }, [cached, fetchFeed]);

  if (failed && articles.length === 0) {
    return (
      <ErrorState
        icon={Newspaper}
        title="The newsroom is quiet right now"
        message="We couldn't reach today's headlines. Give it another go in a minute."
        onRetry={fetchFeed}
        retrying={fetching}
      />
    );
  }

  if (cached === undefined || (fetching && articles.length === 0)) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading headlines">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="h-64 animate-pulse rounded-2xl bg-white/[0.05]" />
        ))}
      </div>
    );
  }

  if (articles.length === 0) {
    return <ErrorState icon={Newspaper} title="No headlines yet today" message="Check back a little later." onRetry={fetchFeed} retryLabel="Check again" retrying={fetching} />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {articles.map((article, i) => (
        <NewsArticleCard key={article.id} article={article} index={i} />
      ))}
    </div>
  );
}
