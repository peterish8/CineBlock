"use node";

import RSSParser from "rss-parser";
import { internalAction } from "./_generated/server";
import type { NewsArticle } from "./news";

// Fetched inside Convex so every deployment (dev, preview, prod) can build its own feed
// without calling back into the Next.js app or sharing a secret with it.

const RSS_FEEDS = [
  { url: "https://variety.com/feed/", source: "Variety" },
  { url: "https://deadline.com/feed/", source: "Deadline" },
  { url: "https://www.hollywoodreporter.com/feed/", source: "Hollywood Reporter" },
  { url: "https://collider.com/feed/", source: "Collider" },
];

const REDDIT_FEEDS = [
  { url: "https://www.reddit.com/r/movies/hot.json?limit=25", source: "r/movies" },
  { url: "https://www.reddit.com/r/television/hot.json?limit=25", source: "r/television" },
];

const MAX_ARTICLES = 40;
const MAX_IMAGE_LOOKUPS = 12;

const parser = new RSSParser({
  customFields: {
    item: [
      ["media:content", "mediaContent"],
      ["media:thumbnail", "mediaThumbnail"],
      ["content:encoded", "contentEncoded"],
    ],
  },
});

type RssItem = {
  enclosure?: { url?: string };
  mediaContent?: { $?: { url?: string }; url?: string } | Array<{ $?: { url?: string }; url?: string }>;
  mediaThumbnail?: { $?: { url?: string }; url?: string };
  contentEncoded?: string;
  content?: string;
  title?: string;
  contentSnippet?: string;
  link?: string;
  pubDate?: string;
};

type RedditPost = {
  stickied?: boolean;
  preview?: { images?: { resolutions?: { url?: string }[]; source?: { url?: string } }[] };
  thumbnail?: string;
  title?: string;
  selftext?: string;
  url?: string;
  permalink?: string;
  created_utc?: number;
};

function slugify(title: string, source: string) {
  return `${title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").slice(0, 80)}-${source.toLowerCase().replace(/\s+/g, "-")}`;
}

function firstHttp(...candidates: (string | undefined)[]) {
  return candidates.find((url) => url?.startsWith("http"));
}

function rssImage(item: RssItem) {
  const media = item.mediaContent ? (Array.isArray(item.mediaContent) ? item.mediaContent : [item.mediaContent]) : [];
  const imgIn = (html?: string) => html?.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];
  return firstHttp(
    item.enclosure?.url,
    ...media.map((m) => m?.$?.url || m?.url),
    item.mediaThumbnail?.$?.url || item.mediaThumbnail?.url,
    imgIn(item.contentEncoded),
    imgIn(item.content),
  );
}

async function fetchRss(): Promise<NewsArticle[]> {
  const results = await Promise.allSettled(RSS_FEEDS.map(async (feed) => {
    const parsed = await parser.parseURL(feed.url);
    return (parsed.items ?? []).map((item: RssItem): NewsArticle => ({
      id: slugify(item.title || "", feed.source),
      title: item.title || "",
      description: (item.contentSnippet || "").slice(0, 200),
      url: item.link || "",
      source: feed.source,
      type: "rss",
      publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
      thumbnail: rssImage(item),
    }));
  }));
  return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}

async function fetchReddit(): Promise<NewsArticle[]> {
  const results = await Promise.allSettled(REDDIT_FEEDS.map(async (feed) => {
    const res = await fetch(feed.url, { headers: { "User-Agent": "CineBlock/1.0" } });
    if (!res.ok) return [];
    const data = (await res.json()) as { data?: { children?: { data: RedditPost }[] } };
    return (data.data?.children ?? [])
      .map((child) => child.data)
      .filter((post) => !post.stickied)
      .map((post): NewsArticle => {
        const preview = post.preview?.images?.[0];
        const previewUrl = preview?.resolutions?.[preview.resolutions.length - 1]?.url || preview?.source?.url;
        return {
          id: slugify(post.title || "", feed.source),
          title: post.title || "",
          description: (post.selftext || "").slice(0, 200),
          url: post.url || `https://reddit.com${post.permalink}`,
          source: feed.source,
          type: "reddit",
          publishedAt: new Date((post.created_utc ?? 0) * 1000).toISOString(),
          // Reddit escapes & as &amp; in preview URLs.
          thumbnail: previewUrl?.replace(/&amp;/g, "&") || (post.thumbnail?.startsWith("https") ? post.thumbnail : undefined),
        };
      });
  }));
  return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}

/** Most likely film or show name in a headline: the longest quoted phrase, else the text before ":" or "-". */
function headlineSubject(title: string) {
  const quoted = [...title.matchAll(/[‘’“”'"]([\w\s:&!',.\-]{3,50})[‘’“”'"]/g)]
    .map((m) => m[1].trim())
    .sort((a, b) => b.length - a.length)[0];
  if (quoted) return quoted;
  const lead = title.split(/\s*[:\-–|]\s*/)[0].trim().replace(/^(review|exclusive|watch|new|first|official|breaking)\s+/gi, "").trim();
  return lead.length >= 4 && lead.length <= 60 ? lead : null;
}

/** og:image / twitter:image from the first 40 KB of the article page. */
async function ogImage(articleUrl: string) {
  try {
    const res = await fetch(articleUrl, {
      signal: AbortSignal.timeout(3000),
      redirect: "follow",
      headers: {
        // Many news sites block bot user agents.
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    const reader = res.ok ? res.body?.getReader() : undefined;
    if (!reader) return undefined;
    const decoder = new TextDecoder();
    let html = "";
    while (html.length < 40_000) {
      const { value, done } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
      if (html.includes("</head>")) break;
    }
    void reader.cancel();
    const patterns = [
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
      /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["']/i,
    ];
    for (const re of patterns) {
      const found = html.match(re)?.[1];
      if (found?.startsWith("//")) return `https:${found}`;
      if (found?.startsWith("http")) return found;
    }
  } catch {
    // A slow or blocking article page just means no thumbnail.
  }
  return undefined;
}

async function tmdbBackdrop(query: string, apiKey: string) {
  for (const q of [query, query.split(" ").slice(0, 3).join(" ")]) {
    try {
      const params = new URLSearchParams({ query: q, language: "en-US", page: "1" });
      const res = await fetch(`https://api.themoviedb.org/3/search/multi?${params}`, { headers: { Authorization: `Bearer ${apiKey}` } });
      if (!res.ok) continue;
      const data = (await res.json()) as { results?: { backdrop_path?: string; poster_path?: string }[] };
      const hit = data.results?.find((r) => r.backdrop_path || r.poster_path);
      if (hit) return `https://image.tmdb.org/t/p/w780${hit.backdrop_path || hit.poster_path}`;
    } catch {
      // Try the shorter query.
    }
  }
  return undefined;
}

export const fetchArticles = internalAction({
  args: {},
  handler: async (): Promise<NewsArticle[]> => {
    const [rss, reddit] = await Promise.all([fetchRss(), fetchReddit()]);

    const seen = new Set<string>();
    const articles = [...rss, ...reddit]
      .filter((a) => {
        const key = a.title.toLowerCase().trim().replace(/\s+/g, " ");
        if (!a.title || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
      .slice(0, MAX_ARTICLES);

    // Fill missing thumbnails: the article's own og:image first, then a TMDB backdrop.
    const apiKey = process.env.TMDB_API_KEY;
    await Promise.all(articles.filter((a) => !a.thumbnail).slice(0, MAX_IMAGE_LOOKUPS).map(async (article) => {
      article.thumbnail = await ogImage(article.url);
      const subject = !article.thumbnail && apiKey ? headlineSubject(article.title) : null;
      if (subject && apiKey) article.thumbnail = await tmdbBackdrop(subject, apiKey);
    }));

    // Convex rejects explicit undefined fields, so drop missing thumbnails entirely.
    return articles.map(({ thumbnail, ...rest }) => (thumbnail ? { ...rest, thumbnail } : rest));
  },
});
