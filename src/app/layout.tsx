import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { MovieListsProvider } from "@/hooks/useMovieLists";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import MobileBottomNav from "@/components/MobileBottomNav";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://cineblock.in"),
  title: {
    default: "CineBlock — Find Movies Together",
    template: "%s | CineBlock",
  },
  description:
    "CineBlock is a free cinema discovery app to find, track and match movies with friends. Search by genre, language and mood. Create blocks and discover what to watch next.",
  keywords: [
    "cineblock", "cine block", "cinblock", "cineblok", "cinebloc",
    "cinema discovery", "find movies", "cinema finder", "movie finder",
    "finding cinema", "cinema match", "movie matching", "watch together",
    "movie watchlist", "movie recommendations", "film discovery",
    "what to watch", "movie tracker", "watch list app", "film finder",
    "movie night", "cinema app", "free movie app", "movie suggestion",
  ],
  authors: [{ name: "CineBlock" }],
  creator: "CineBlock",
  publisher: "CineBlock",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://cineblock.in",
    siteName: "CineBlock",
    title: "CineBlock",
    description: "Discover, track and match movies with friends. Free cinema discovery app with mood-based recommendations, blocks and personalised lists.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "CineBlock — Cinema Discovery" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CineBlock — Find Movies Together",
    description: "Discover, track and match movies with friends. Free cinema discovery app.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://cineblock.in",
  },
  icons: {
    icon: "/brand/cineblock-favicon.png",
    apple: "/brand/cineblock-icon-256.png",
    shortcut: "/brand/cineblock-favicon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

import { BlockModalProvider } from "@/components/BlockModalProvider";
import { StampProvider } from "@/components/StampProvider";
import { ToastProvider } from "@/components/ToastProvider";
import { THEME_INIT_SCRIPT } from "@/lib/themeConfig";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "CineBlock",
  url: "https://cineblock.in",
  description: "Free cinema discovery app to find, track and match movies with friends.",
  applicationCategory: "EntertainmentApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "Movie discovery by genre, language and mood",
    "Personal watchlist and liked movies tracker",
    "Blocks to match movies with friends",
    "Box office charts and trending films",
    "Personalised movie recommendations",
    "Cinema news feed",
  ],
  keywords: "cineblock, cinema discovery, find movies, movie finder, cinema app, watch together, movie recommendations",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        </head>
        <body className="theme-glass min-h-screen bg-bg antialiased" suppressHydrationWarning>
          <ConvexClientProvider>
            <ToastProvider>
              <BlockModalProvider>
                <StampProvider>
                  <MovieListsProvider>
                    {children}
                    <MobileBottomNav />
                    <Analytics />
                  </MovieListsProvider>
                </StampProvider>
              </BlockModalProvider>
            </ToastProvider>
          </ConvexClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
