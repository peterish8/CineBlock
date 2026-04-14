// Custom Next.js image loader — serves TMDB images directly from their CDN,
// bypassing Vercel's image optimizer entirely (saves the 5000/month free quota).
// TMDB already serves WebP-optimized images at fixed sizes via their own CDN.

const TMDB_POSTER_SIZES = [92, 154, 185, 342, 500, 780];
const TMDB_BACKDROP_SIZES = [300, 780, 1280];

function nearestTmdbSize(width: number, sizes: number[]): string {
  for (const s of sizes) {
    if (width <= s) return `w${s}`;
  }
  return "original";
}

export default function tmdbImageLoader({
  src,
  width,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  // Only intercept TMDB image URLs — everything else passes through as-is
  if (!src.includes("image.tmdb.org/t/p/")) return src;

  // Extract just the file path (e.g. /abc123.jpg) from any TMDB size URL
  const filePath = src.replace(/https:\/\/image\.tmdb\.org\/t\/p\/[^/]+/, "");

  // Pick the right TMDB native size based on requested width
  const isBackdrop = width > 600;
  const tmdbSize = isBackdrop
    ? nearestTmdbSize(width, TMDB_BACKDROP_SIZES)
    : nearestTmdbSize(width, TMDB_POSTER_SIZES);

  // Append ?w= so Next.js's loader validation sees the width in the URL.
  // TMDB's CDN ignores query params — images serve correctly regardless.
  return `https://image.tmdb.org/t/p/${tmdbSize}${filePath}?w=${width}`;
}
