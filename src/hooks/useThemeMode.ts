"use client";

import type { ThemeName } from "@/lib/types";
import { sanitizeTheme } from "@/lib/themeConfig";

export function detectThemeFromBody(): ThemeName {
  return "glass";
}

export function readStoredTheme(): ThemeName {
  if (typeof window !== "undefined") {
    window.localStorage.setItem("theme", "glass");
  }
  return "glass";
}

export function applyThemeToDocument(theme: ThemeName) {
  if (typeof document === "undefined") return;
  void theme;
  const nextTheme = sanitizeTheme("glass");
  document.body.classList.remove("theme-netflix", "theme-glass");
  document.body.classList.add("theme-glass");
  if (typeof window !== "undefined") {
    window.localStorage.setItem("theme", nextTheme);
  }
}

export function useThemeMode(): ThemeName {
  // Glass is permanent, so every render and every server/client boundary use
  // the same value. This prevents a default-theme flash during hydration.
  return "glass";
}
