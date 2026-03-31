"use client";

import React, { useState } from "react";
import Image from "next/image";

type StampIndicatorProps = {
  hasStamp: boolean;
  reviewText?: string;
};

export default function StampIndicator({ hasStamp, reviewText }: StampIndicatorProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!hasStamp) return null;

  const preview = reviewText ? reviewText.slice(0, 60) + (reviewText.length > 60 ? "…" : "") : null;

  return (
    <div
      className="absolute bottom-1 left-1 z-10"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
    >
      <Image
        src="/stamped_cineblock.png"
        alt="Stamped"
        width={36}
        height={36}
        className="drop-shadow-md"
      />

      {showTooltip && preview && (
        <div className="absolute bottom-full left-0 mb-1 w-48 border-2 border-brutal-border bg-bg p-2 font-mono text-[10px] text-text leading-snug shadow-lg z-20">
          {preview}
        </div>
      )}
    </div>
  );
}
