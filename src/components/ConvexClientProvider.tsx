"use client";

import { ConvexReactClient } from "convex/react";
import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { ReactNode, useRef } from "react";

export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  const clientRef = useRef<ConvexReactClient | null>(null);
  if (!clientRef.current) {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) {
      return <>{children}</>;
    }
    clientRef.current = new ConvexReactClient(url);
  }

  return (
    <ConvexAuthNextjsProvider client={clientRef.current}>
      {children}
    </ConvexAuthNextjsProvider>
  );
}
