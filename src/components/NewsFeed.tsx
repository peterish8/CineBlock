"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import NewsArticleCard from "./NewsArticleCard";

interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  type: "rss" | "reddit";
  publishedAt: string;
  thumbnail?: string;
}

const today = new Date().toISOString().split("T")[0];

export default function NewsFeed() {
  const cached = useQuery(api.news.getNewsFeed, { fetchedDate: today });
  const storeToday = useMutation(api.news.storeToday);

  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");

  // cached === undefined  → Convex still loading
  // cached === null       → no data for today in DB → fetch fresh
  // cached === [...] → serve immediately
  useEffect(() => {
    if (cached === undefined) return; // still loading from Convex

    if (cached !== null) {
      const sorted = [...(cached as NewsArticle[])].sort(
        (a, b) => (b.thumbnail ? 1 : 0) - (a.thumbnail ? 1 : 0)
      );
      setArticles(sorted);
      return;
    }

    // Cache miss — fetch fresh from RSS/Reddit + TMDB fallback
    setFetching(true);
    fetch("/api/internal/fetch-news")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch");
        return r.json();
      })
      .then((data) => {
        const fetched: NewsArticle[] = data.articles || [];
        // Articles with images first, no-image articles at the end
        fetched.sort((a, b) => (b.thumbnail ? 1 : 0) - (a.thumbnail ? 1 : 0));
        setArticles(fetched);
        // Store in Convex so next visitor gets instant results
        if (fetched.length > 0) {
          void storeToday({ articles: fetched });
        }
      })
      .catch(() => setError("Could not load news. Try again later."))
      .finally(() => setFetching(false));
  }, [cached, storeToday]);

  const loading = cached === undefined || fetching;

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="brutal-shimmer h-64 animate-fade-in"
            style={{ animationDelay: `${i * 50}ms` }}
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="brutal-card p-8 text-center">
        <p className="text-brutal-red font-mono font-bold text-sm">{error}</p>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="brutal-card p-8 text-center">
        <p className="text-brutal-muted font-mono font-bold text-sm">NO NEWS ARTICLES FOUND</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {articles.map((article, i) => (
        <NewsArticleCard key={article.id} article={article} index={i} />
      ))}
    </div>
  );
}
