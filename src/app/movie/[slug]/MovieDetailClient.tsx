"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { TMDBMovie } from "@/lib/types";

const MovieModal = dynamic(() => import("@/components/MovieModal"), { ssr: false });

export default function MovieDetailClient({ movie }: { movie: TMDBMovie }) {
  const router = useRouter();
  const [current, setCurrent] = useState<TMDBMovie | null>(movie);

  return (
    <div className="min-h-screen bg-bg">
      <MovieModal
        movie={current}
        onClose={() => {
          setCurrent(null);
          router.push("/");
        }}
      />
    </div>
  );
}
