import type { Metadata } from "next";
import SwipeDeckView from "@/components/CineSwipe/SwipeDeckView";

export const metadata: Metadata = {
  title: "CineSwipe — Swipe to Discover",
  description:
    "Discover movies the fun way. Swipe right to watchlist, double-tap to like, swipe down for watched — gamified movie discovery at your fingertips.",
  openGraph: {
    title: "CineSwipe — Swipe to Discover | CineBlock",
    description:
      "Discover movies the fun way. Swipe right to watchlist, double-tap to like, swipe down for watched.",
  },
};

export default function SwipePage() {
  return <SwipeDeckView />;
}
