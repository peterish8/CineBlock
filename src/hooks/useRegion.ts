"use client";

import { useEffect, useState } from "react";

// Maps country code → TMDB region code (mostly the same, with some exceptions)
const LANG_TO_REGION: Record<string, string> = {
  IN: "IN",
  US: "US",
  GB: "GB",
  CA: "CA",
  AU: "AU",
  DE: "DE",
  FR: "FR",
  JP: "JP",
  KR: "KR",
  BR: "BR",
  MX: "MX",
  SG: "SG",
  AE: "AE",
  TR: "TR",
  TH: "TH",
  RU: "RU",
  IT: "IT",
  ES: "ES",
};

// Maps TMDB region → primary movie language code
export const REGION_TO_LANGUAGE: Record<string, string> = {
  IN: "", // India is multilingual — don't force a default
  US: "en",
  GB: "en",
  CA: "en",
  AU: "en",
  DE: "de",
  FR: "fr",
  JP: "ja",
  KR: "ko",
  BR: "pt",
  MX: "es",
  SG: "en",
  AE: "ar",
  TR: "tr",
  TH: "th",
  RU: "ru",
  IT: "it",
  ES: "es",
};

function detectRegion(): string {
  if (typeof window === "undefined") return "US";
  // navigator.language is like "en-IN", "hi-IN", "ko-KR", "en-US"
  const lang = navigator.language || navigator.languages?.[0] || "en-US";
  const parts = lang.split("-");
  const country = parts.length > 1 ? parts[parts.length - 1].toUpperCase() : "";
  return LANG_TO_REGION[country] ?? "US";
}

export function useRegion() {
  const [region, setRegion] = useState<string>("US");

  useEffect(() => {
    setRegion(detectRegion());
  }, []);

  return { region, setRegion };
}
