import type { Metadata, Viewport } from "next";
import { MovieListsProvider } from "@/hooks/useMovieLists";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import MobileBottomNav from "@/components/MobileBottomNav";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://cineblock.in"),
  title: {
    default: "CineBlock — Find Movies Together",
    template: "%s | CineBlock",
  },
  description:
    "CineBlock is a free cinema discovery app to find, track and match movies with friends. Search by genre, language and mood. Create watch rooms and discover what to watch next.",
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
    title: "CineBlock — Find Movies Together",
    description: "Discover, track and match movies with friends. Free cinema discovery app with mood-based recommendations, watch rooms and personalised lists.",
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
    icon: "/logo.png",
    apple: "/logo.png",
    shortcut: "/logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-bg antialiased" suppressHydrationWarning>
        <ConvexClientProvider>
          <MovieListsProvider>
            {children}
            <MobileBottomNav />
          </MovieListsProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
