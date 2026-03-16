import { NextResponse } from "next/server";
import RSSParser from "rss-parser";

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

// Parse media namespace + content:encoded for image extraction
const parser = new RSSParser({
  customFields: {
    item: [
      ["media:content", "mediaContent"],
      ["media:thumbnail", "mediaThumbnail"],
      ["content:encoded", "contentEncoded"],
    ],
  },
});

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

function slugify(title: string, source: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 80) +
    "-" +
    source.toLowerCase().replace(/\s+/g, "-")
  );
}

function normalizeTitle(title: string): string {
  return title.toLowerCase().trim().replace(/\s+/g, " ");
}

/** Extract the best available image from an RSS item */
function extractRSSImage(item: any): string | undefined {
  // 1. Direct enclosure (most reliable)
  if (item.enclosure?.url && item.enclosure.url.startsWith("http")) {
    return item.enclosure.url;
  }

  // 2. media:content — may be an array or single object
  if (item.mediaContent) {
    const arr = Array.isArray(item.mediaContent) ? item.mediaContent : [item.mediaContent];
    for (const m of arr) {
      const url = m?.$?.url || m?.url;
      if (url && url.startsWith("http")) return url;
    }
  }

  // 3. media:thumbnail
  if (item.mediaThumbnail) {
    const url = item.mediaThumbnail?.$?.url || item.mediaThumbnail?.url;
    if (url && url.startsWith("http")) return url;
  }

  // 4. First <img> in content:encoded
  if (item.contentEncoded) {
    const match = item.contentEncoded.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (match?.[1]?.startsWith("http")) return match[1];
  }

  // 5. First <img> in item.content
  if (item.content) {
    const match = item.content.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (match?.[1]?.startsWith("http")) return match[1];
  }

  return undefined;
}

async function fetchRSSFeeds(): Promise<NewsArticle[]> {
  const articles: NewsArticle[] = [];

  const results = await Promise.allSettled(
    RSS_FEEDS.map(async (feed) => {
      const parsed = await parser.parseURL(feed.url);
      return (parsed.items || []).map((item: any) => ({
        id: slugify(item.title || "", feed.source),
        title: item.title || "",
        description: (item.contentSnippet || "").slice(0, 200),
        url: item.link || "",
        source: feed.source,
        type: "rss" as const,
        publishedAt: item.pubDate
          ? new Date(item.pubDate).toISOString()
          : new Date().toISOString(),
        thumbnail: extractRSSImage(item),
      }));
    })
  );

  for (const result of results) {
    if (result.status === "fulfilled") {
      articles.push(...result.value);
    }
  }

  return articles;
}

async function fetchRedditFeeds(): Promise<NewsArticle[]> {
  const articles: NewsArticle[] = [];

  const results = await Promise.allSettled(
    REDDIT_FEEDS.map(async (feed) => {
      const res = await fetch(feed.url, {
        headers: { "User-Agent": "CineBlock/1.0" },
      });
      if (!res.ok) return [];
      const data = await res.json();
      const posts = data?.data?.children || [];
      return posts
        .filter((p: any) => !p.data.stickied)
        .map((p: any) => {
          const d = p.data;

          // Reddit encodes & as &amp; in preview URLs — decode them
          let thumbnail: string | undefined;

          // Best: high-res preview image
          const preview = d.preview?.images?.[0];
          if (preview) {
            const src =
              preview.resolutions?.[preview.resolutions.length - 1]?.url ||
              preview.source?.url;
            if (src) thumbnail = src.replace(/&amp;/g, "&");
          }

          // Fallback: reddit thumbnail field
          if (!thumbnail && d.thumbnail?.startsWith("https")) {
            thumbnail = d.thumbnail;
          }

          return {
            id: slugify(d.title || "", feed.source),
            title: d.title || "",
            description: (d.selftext || "").slice(0, 200),
            url: d.url || `https://reddit.com${d.permalink}`,
            source: feed.source,
            type: "reddit" as const,
            publishedAt: new Date(d.created_utc * 1000).toISOString(),
            thumbnail,
          };
        });
    })
  );

  for (const result of results) {
    if (result.status === "fulfilled") {
      articles.push(...result.value);
    }
  }

  return articles;
}

/** Extract the most likely movie/show name from a news headline */
function extractSearchQuery(title: string): string | null {
  // Match both straight AND curly/typographic quotes used by news sites
  // e.g. \u2018 \u2019 ('' ) and \u201C \u201D ("" )
  const allQuoted = [...title.matchAll(/[\u2018\u2019\u201C\u201D'"]([\w\s:&!',.\-]{3,50})[\u2018\u2019\u201C\u201D'"]/g)];
  if (allQuoted.length > 0) {
    // Pick the longest quoted string — most likely to be the title
    const best = allQuoted
      .map((m) => m[1].trim())
      .filter((s) => s.length >= 3)
      .sort((a, b) => b.length - a.length)[0];
    if (best) return best;
  }

  // Fall back to text before first colon/dash/pipe
  const beforePunct = title.split(/\s*[:\-–|]\s*/)[0].trim();
  if (beforePunct.length >= 4 && beforePunct.length <= 60) {
    const cleaned = beforePunct
      .replace(/^(review|exclusive|watch|new|first|official|breaking)\s+/gi, "")
      .trim();
    if (cleaned.length >= 4) return cleaned;
  }

  return null;
}

/** Fetch the article URL and extract og:image / twitter:image from <head> only */
async function fetchOGImage(articleUrl: string): Promise<string | undefined> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(articleUrl, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        // Full Chrome-like headers — many news sites block Googlebot or curl
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
      },
    });
    clearTimeout(timer);
    if (!res.ok) return undefined;

    // Stream only the first 40 KB — enough to cover <head>
    const reader = res.body?.getReader();
    if (!reader) return undefined;
    let html = "";
    while (html.length < 40_000) {
      const { value, done } = await reader.read();
      if (done) break;
      html += new TextDecoder().decode(value);
      if (html.includes("</head>") || html.includes("<body")) break;
    }
    void reader.cancel();

    // og:image — attribute order varies across CMS platforms
    const patterns = [
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
      /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["']/i,
    ];
    for (const re of patterns) {
      const m = html.match(re);
      const found = m?.[1];
      if (!found) continue;
      // Handle protocol-relative URLs
      if (found.startsWith("//")) return `https:${found}`;
      if (found.startsWith("http")) return found;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

/** Search TMDB for a backdrop image — tries full query then first 3 words */
async function tmdbBackdrop(query: string, apiKey: string): Promise<string | undefined> {
  const attempts = [query, query.split(" ").slice(0, 3).join(" ")];
  for (const q of attempts) {
    try {
      const params = new URLSearchParams({ query: q, language: "en-US", page: "1" });
      const res = await fetch(`https://api.themoviedb.org/3/search/multi?${params}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!res.ok) continue;
      const data = await res.json();
      const hit = (data.results || []).find((r: any) => r.backdrop_path || r.poster_path);
      if (hit) {
        const path = hit.backdrop_path || hit.poster_path;
        return `https://image.tmdb.org/t/p/w780${path}`;
      }
    } catch {
      continue;
    }
  }
  return undefined;
}

export async function GET() {
  try {
    const [rssArticles, redditArticles] = await Promise.all([
      fetchRSSFeeds(),
      fetchRedditFeeds(),
    ]);

    const all = [...rssArticles, ...redditArticles];
    const seen = new Set<string>();
    const deduped: NewsArticle[] = [];

    for (const article of all) {
      const key = normalizeTitle(article.title);
      if (!seen.has(key) && article.title) {
        seen.add(key);
        deduped.push(article);
      }
    }

    deduped.sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    const articles = deduped.slice(0, 60);

    // Fill missing thumbnails: og:image first (actual article photo), then TMDB backdrop
    const apiKey = process.env.TMDB_API_KEY;
    const missing = articles.filter((a) => !a.thumbnail).slice(0, 30);

    await Promise.all(
      missing.map(async (article) => {
        // 1. Try og:image from the article page
        const og = await fetchOGImage(article.url);
        if (og) { article.thumbnail = og; return; }

        // 2. Fall back to TMDB backdrop
        if (apiKey) {
          const q = extractSearchQuery(article.title);
          if (q) {
            const tmdb = await tmdbBackdrop(q, apiKey);
            if (tmdb) article.thumbnail = tmdb;
          }
        }
      })
    );

    return NextResponse.json({
      articles,
      count: articles.length,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Fetch news error:", err);
    return NextResponse.json({ error: "Failed to fetch news" }, { status: 500 });
  }
}
