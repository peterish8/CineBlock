import type { Metadata } from "next";
import StampPageClient from "@/components/StampPageClient";

export const metadata: Metadata = {
  title: "Stamps",
  description: "Keep the personal feelings and memories your films leave with you on CineBlock.",
};

export default function StampsPage() {
  return <StampPageClient />;
}
