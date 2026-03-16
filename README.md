# MovieX — Neo-Brutalist Movie Discovery

MovieX is a high-energy movie discovery platform built with a bold Neo-Brutalist aesthetic. Explore, search, and manage your favourite movies and TV shows — with a cloud backend, daily news, and AI-assisted discovery.

---

## Features

- **Smart Search & Filter** — Filter by genre, year, rating, and language.
- **Find My Movie Wizard** — 5-step interactive wizard that picks movies based on your mood, time available, intensity, and dealbreakers.
- **Daily News Feed** — Latest movie news from Variety, Deadline, Collider, and Reddit. Images are sourced from RSS media, og:image scraping, or TMDB backdrops. Results are cached in Convex and refreshed daily via cron.
- **User Accounts** — Sign up / sign in with email + password (Convex Auth). Lists sync to the cloud; anonymous users get localStorage.
- **My Lists** — Liked, Watchlist, and Watched — each with a dedicated page.
- **Collections** — Browse curated movie franchises (Marvel, John Wick, Harry Potter, etc.).
- **Box Office & Streaming** — Dedicated pages for trending box office and what's streaming now.
- **Profile Page** — Editable display name, live stat cards, quick-links to your lists.
- **Neo-Brutalist UI** — High-contrast, bold design with thick borders and offset shadows.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) — App Router, Turbopack |
| Language | [TypeScript](https://www.typescriptlang.org/) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) + custom Neo-Brutalist theme |
| Icons | [Lucide React](https://lucide.dev/) |
| Data | [TMDB API](https://www.themoviedb.org/documentation/api) |
| Backend | [Convex](https://convex.dev/) — queries, mutations, actions, HTTP router, crons |
| Auth | [@convex-dev/auth](https://labs.convex.dev/auth) — Password provider |
| News parsing | [rss-parser](https://github.com/rbren/rss-parser) + native `fetch` for og:image scraping |

---

## Getting Started

### Prerequisites

- [Node.js 18+](https://nodejs.org/)
- A free [TMDB account](https://www.themoviedb.org/) — get a **v4 read-access token** (Bearer token, not the v3 key)
- A free [Convex account](https://convex.dev/)

### 1. Clone & Install

```bash
git clone https://github.com/your-username/moviex.git
cd moviex
npm install
```

### 2. Environment Variables

Create `.env.local` in the project root:

```env
# TMDB v4 Bearer token (used server-side only)
TMDB_API_KEY=your_tmdb_bearer_token_here

# Base URL — used by Convex cron to call /api/internal/fetch-news
# Change to your production URL when deploying
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> Convex will automatically add `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL` in the next step.

### 3. Start the Convex Backend

```bash
npx convex dev
```

This pushes your schema, functions, and `auth.config.ts` to your Convex dev deployment. Keep this terminal running.

### 4. Start the Next.js Dev Server

In a separate terminal:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Next.js dev server (Turbopack) |
| `npx convex dev` | Convex dev server — watches and pushes backend changes |
| `npm run build` | Production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npx convex dashboard` | Open the Convex database dashboard |

---

## Project Structure

```
moviex/
├── convex/                  # Convex backend
│   ├── schema.ts            # Database schema (lists, news_feed, users)
│   ├── auth.config.ts       # JWT issuer config for Convex Auth
│   ├── auth.ts              # Auth setup (Password provider)
│   ├── http.ts              # HTTP router — exposes auth discovery endpoint
│   ├── crons.ts             # Daily news refresh cron (3 AM UTC)
│   ├── lists.ts             # Liked / Watchlist / Watched mutations & queries
│   ├── news.ts              # News feed queries, cache store/invalidate
│   └── users.ts             # User upsert & profile queries
│
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── page.tsx         # Home — hero + poster grid
│   │   ├── news/            # Daily news feed page
│   │   ├── profile/         # Editable profile page
│   │   ├── liked/           # Liked movies list
│   │   ├── watchlist/       # Watchlist page
│   │   ├── watched/         # Watched history page
│   │   ├── collections/     # Movie franchise collections
│   │   ├── box-office/      # Trending box office page
│   │   ├── streaming/       # What's streaming now
│   │   ├── recommendations/ # Personalised recommendations
│   │   ├── sign-in/         # Auth page
│   │   └── api/
│   │       └── internal/
│   │           └── fetch-news/  # RSS fetch + og:image scraping + TMDB fallback
│   │
│   ├── components/          # Reusable UI components
│   │   ├── CommandHub.tsx   # Top nav with search, filters, NEWS, FIND MOVIE
│   │   ├── NewsFeed.tsx     # News grid — Convex cache-first, sort images-first
│   │   ├── NewsArticleCard.tsx
│   │   ├── PosterGrid.tsx
│   │   ├── MovieModal.tsx
│   │   ├── FindMyMovieWizard.tsx
│   │   └── ...
│   │
│   ├── hooks/               # Custom React hooks (useMovieLists, etc.)
│   ├── lib/                 # Utility functions and type definitions
│   └── proxy.ts             # Next.js 16 middleware (auth route protection)
```

---

## News Image Pipeline

For each article the fetch-news API tries sources in order:

1. **RSS media namespace** — `enclosure`, `media:content`, `media:thumbnail`, or `<img>` in `content:encoded`
2. **og:image scraping** — streams the first 40 KB of the article with a Chrome User-Agent and extracts `og:image` / `twitter:image`
3. **TMDB backdrop** — extracts a movie/show title from the headline and calls `search/multi` on TMDB

Articles without images are sorted to the end of the news grid.

---

## Auth Notes

- Authentication uses `@convex-dev/auth` with the **Password** provider.
- `convex/auth.config.ts` configures the JWT issuer domain (`CONVEX_SITE_URL`).
- `convex/http.ts` exposes the auth discovery endpoint required by the Next.js client.
- Route protection (e.g. `/watchlist`) is handled in `src/proxy.ts` (Next.js 16 renamed `middleware.ts` → `proxy.ts`).

---

## Attribution

This product uses the TMDB API but is not endorsed or certified by TMDB.
