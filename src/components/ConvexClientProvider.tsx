"use client";

import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ReactNode, useRef } from "react";

export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  // useRef ensures the client is only created once per component mount,
  // and defers instantiation out of module scope so static prerender
  // (which runs without NEXT_PUBLIC_CONVEX_URL) doesn't crash.
  const clientRef = useRef<ConvexReactClient | null>(null);
  if (!clientRef.current) {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) {
      // During static prerender at build time the env var is absent.
      // Render children without Convex so the build succeeds;
      // in production the env var is always present.
      return <>{children}</>;
    }
    clientRef.current = new ConvexReactClient(url);
  }

  return (
    <ConvexAuthProvider client={clientRef.current}>
      {children}
    </ConvexAuthProvider>
  );
}
