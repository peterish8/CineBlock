import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://cineblock.in";
  const now = new Date();

  return [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/sign-in`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/box-office`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/collections`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/news`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${base}/blocks`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/recommendations`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/liked`, lastModified: now, changeFrequency: "weekly", priority: 0.4 },
    { url: `${base}/watchlist`, lastModified: now, changeFrequency: "weekly", priority: 0.4 },
    { url: `${base}/watched`, lastModified: now, changeFrequency: "weekly", priority: 0.4 },
  ];
}
