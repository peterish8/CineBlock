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
    if (url) {
      clientRef.current = new ConvexReactClient(url);
    }
  }

  // If we STILL don't have a client (URL genuinely missing or connection failed),
  // we must show a clear error UI instead of letting hooks crash the entire site.
  if (!clientRef.current) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg p-4 font-mono">
        <div className="brutal-card p-6 border-4 border-black bg-white shadow-[8px_8px_0px_rgba(0,0,0,1)] max-w-md w-full">
          <h1 className="text-xl font-bold text-brutal-red mb-4">CONNECTION ERROR</h1>
          <p className="text-sm mb-4">
            The website is unable to connect to the CineBlock database. 
            This is usually caused by missing environment variables on the server.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full brutal-btn bg-brutal-yellow font-bold py-2 border-2 border-black"
          >
            RETRY CONNECTION
          </button>
        </div>
      </div>
    );
  }

  return (
    <ConvexAuthNextjsProvider client={clientRef.current}>
      {children}
    </ConvexAuthNextjsProvider>
  );
}
