import type { Metadata, Viewport } from "next";
import { MovieListsProvider } from "@/hooks/useMovieLists";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import MobileBottomNav from "@/components/MobileBottomNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "CineBlock — Cinematic Discovery",
  description:
    "A neo-brutalist movie discovery engine powered by TMDB. Filter by genre, language, and year to find your next watch.",
  keywords: ["movies", "discovery", "TMDB", "cinema", "film", "recommendations", "neo-brutalism", "cineblock"],
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
