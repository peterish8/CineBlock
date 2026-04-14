"use client";

import { ExternalLink } from "lucide-react";
import { useThemeMode } from "@/hooks/useThemeMode";

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
  const isGlass = useThemeMode() === "glass";

  const badgeColor =
    article.type === "reddit"
      ? isGlass ? { background: "rgba(255,69,0,0.12)", border: "1px solid rgba(255,69,0,0.30)", color: "#FB923C" } : "text-brutal-orange border-brutal-orange"
      : isGlass ? { background: "rgba(34,211,238,0.12)", border: "1px solid rgba(34,211,238,0.30)", color: "#67E8F9" } : "text-brutal-cyan border-brutal-cyan";

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex flex-col p-0 overflow-hidden animate-fade-in cursor-pointer transition-all ${
        isGlass ? "rounded-2xl hover:ring-1 hover:ring-white/15" : "brutal-card hover:border-brutal-yellow"
      }`}
      style={isGlass ? {
        background: "rgba(8,15,40,0.72)",
        backdropFilter: "blur(28px) saturate(200%)",
        WebkitBackdropFilter: "blur(28px) saturate(200%)",
        border: "1px solid rgba(255,255,255,0.10)",
        animationDelay: `${(index % 20) * 40}ms`,
      } : { animationDelay: `${(index % 20) * 40}ms` }}
    >
      {/* Image */}
      <div
        className={`w-full h-40 overflow-hidden shrink-0 ${isGlass ? "" : "border-b-3 border-brutal-border bg-surface-2"}`}
        style={isGlass ? { borderBottom: "1px solid rgba(255,255,255,0.08)" } : undefined}
      >
        {article.thumbnail ? (
          <img
            src={article.thumbnail}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            loading="lazy"
            onError={(e) => {
              const parent = (e.target as HTMLImageElement).parentElement;
              if (parent) parent.setAttribute("data-fallback", "true");
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : null}
        {/* Fallback banner */}
        <div
          className={`w-full h-full flex flex-col items-center justify-center gap-2 ${
            article.thumbnail ? "hidden" : "flex"
          } ${
            article.type === "reddit"
              ? isGlass ? "" : "bg-[#ff4500]/10"
              : isGlass ? "" : "bg-brutal-yellow/5"
          }`}
          style={isGlass ? {
            background: article.type === "reddit" ? "rgba(255,69,0,0.08)" : "rgba(34,211,238,0.05)",
          } : undefined}
          aria-hidden="true"
        >
          <span className={`font-black text-2xl uppercase tracking-widest ${
            isGlass
              ? article.type === "reddit" ? "text-orange-400" : "text-cyan-400"
              : article.type === "reddit" ? "text-brutal-orange" : "text-brutal-cyan"
          }`}>
            {article.source.replace("Hollywood Reporter", "THR").toUpperCase()}
          </span>
          <div className={`h-[3px] w-16 ${
            isGlass
              ? article.type === "reddit" ? "bg-orange-400/50" : "bg-cyan-400/50"
              : article.type === "reddit" ? "bg-brutal-orange" : "bg-brutal-cyan"
          }`} />
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-2">
          {isGlass ? (
            <span
              className="px-1.5 py-0.5 text-[9px] font-bold rounded-md"
              style={badgeColor as React.CSSProperties}
            >
              {article.source.toUpperCase()}
            </span>
          ) : (
            <span className={`brutal-chip ${badgeColor as string} text-[9px] px-1.5 py-0`}>
              {article.source.toUpperCase()}
            </span>
          )}
          <span className={`text-[10px] ${isGlass ? "text-slate-600" : "text-brutal-dim font-mono"}`}>
            {timeAgo(article.publishedAt)}
          </span>
        </div>
        <h3 className={`font-bold text-sm leading-tight line-clamp-3 mb-2 transition-colors ${
          isGlass
            ? "text-slate-200 group-hover:text-white"
            : "font-display text-brutal-white uppercase group-hover:text-brutal-yellow"
        }`}>
          {article.title}
        </h3>
        {article.description && (
          <p className={`text-xs leading-relaxed line-clamp-2 mb-3 ${isGlass ? "text-slate-500" : "text-brutal-muted font-body"}`}>
            {article.description}
          </p>
        )}
        <div className={`mt-auto flex items-center gap-1 text-[10px] transition-colors ${
          isGlass
            ? "text-slate-600 group-hover:text-slate-400"
            : "text-brutal-dim font-mono group-hover:text-brutal-yellow"
        }`}>
          <ExternalLink className="w-3 h-3" strokeWidth={2.5} />
          READ MORE
        </div>
      </div>
    </a>
  );
}
