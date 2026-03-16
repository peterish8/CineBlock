import type { Metadata } from "next";
import { MovieListsProvider } from "@/hooks/useMovieLists";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "CineBlock — Cinematic Discovery",
  description:
    "A neo-brutalist movie discovery engine powered by TMDB. Filter by genre, language, and year to find your next watch.",
  keywords: ["movies", "discovery", "TMDB", "cinema", "film", "recommendations", "neo-brutalism", "cineblock"],
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
          </MovieListsProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
