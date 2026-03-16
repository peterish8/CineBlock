"use client";

import { ExternalLink } from "lucide-react";

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

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

export default function NewsArticleCard({
  article,
  index,
}: {
  article: NewsArticle;
  index: number;
}) {
  const badgeColor =
    article.type === "reddit"
      ? "text-brutal-orange border-brutal-orange"
      : "text-brutal-cyan border-brutal-cyan";

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="brutal-card group flex flex-col p-0 overflow-hidden animate-fade-in cursor-pointer"
      style={{ animationDelay: `${(index % 20) * 40}ms` }}
    >
      {/* Image — always rendered; fallback banner if no thumbnail */}
      <div className="w-full h-40 overflow-hidden border-b-3 border-brutal-border bg-surface-2 shrink-0">
        {article.thumbnail ? (
          <img
            src={article.thumbnail}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            loading="lazy"
            onError={(e) => {
              // If image fails to load, hide it and show fallback
              const parent = (e.target as HTMLImageElement).parentElement;
              if (parent) parent.setAttribute("data-fallback", "true");
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : null}
        {/* Fallback banner — visible when no thumbnail or img fails */}
        <div
          className={`w-full h-full flex flex-col items-center justify-center gap-2 ${
            article.thumbnail ? "hidden" : "flex"
          } ${
            article.type === "reddit"
              ? "bg-[#ff4500]/10 border-0"
              : "bg-brutal-yellow/5"
          }`}
          aria-hidden="true"
        >
          <span className={`font-display font-black text-2xl uppercase tracking-widest ${badgeColor.split(" ")[0]}`}>
            {article.source.replace("Hollywood Reporter", "THR").toUpperCase()}
          </span>
          <div className={`h-[3px] w-16 ${article.type === "reddit" ? "bg-brutal-orange" : "bg-brutal-cyan"}`} />
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className={`brutal-chip ${badgeColor} text-[9px] px-1.5 py-0`}>
            {article.source.toUpperCase()}
          </span>
          <span className="text-brutal-dim text-[10px] font-mono">
            {timeAgo(article.publishedAt)}
          </span>
        </div>
        <h3 className="font-display font-bold text-sm text-brutal-white uppercase leading-tight line-clamp-3 mb-2 group-hover:text-brutal-yellow transition-colors">
          {article.title}
        </h3>
        {article.description && (
          <p className="text-brutal-muted text-xs font-body leading-relaxed line-clamp-2 mb-3">
            {article.description}
          </p>
        )}
        <div className="mt-auto flex items-center gap-1 text-brutal-dim text-[10px] font-mono group-hover:text-brutal-yellow transition-colors">
          <ExternalLink className="w-3 h-3" strokeWidth={2.5} />
          READ MORE
        </div>
      </div>
    </a>
  );
}
