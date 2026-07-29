import { notFound } from "next/navigation";
import { ENABLE_STREAMING } from "@/lib/featureFlags";
import StreamingClient from "./StreamingClient";

export default function StreamingPage() {
  if (!ENABLE_STREAMING) notFound();
  return <StreamingClient />;
}

export type { Platform } from "./types";
