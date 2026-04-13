"use client";

import { useEffect, useState } from "react";
import type { ThemeName } from "@/lib/types";
import { sanitizeTheme } from "@/lib/themeConfig";

export function detectThemeFromBody(): ThemeName {
  if (typeof document === "undefined") return "default";
  if (document.body.classList.contains("theme-glass")) return "glass";
  if (document.body.classList.contains("theme-netflix")) return sanitizeTheme("netflix");
  return "default";
}

export function readStoredTheme(): ThemeName {
  if (typeof window === "undefined") return "glass";
  const stored = window.localStorage.getItem("theme");
  if (!stored) {
    window.localStorage.setItem("theme", "glass");
    return "glass";
  }
  return sanitizeTheme(stored);
}

export function applyThemeToDocument(theme: ThemeName) {
  if (typeof document === "undefined") return;
  const nextTheme = sanitizeTheme(theme);
  document.body.classList.remove("theme-netflix", "theme-glass");
  if (nextTheme === "netflix") document.body.classList.add("theme-netflix");
  if (nextTheme === "glass") document.body.classList.add("theme-glass");
  if (typeof window !== "undefined") {
    window.localStorage.setItem("theme", nextTheme);
  }
}

export function useThemeMode() {
  const [theme, setTheme] = useState<ThemeName>("default");

  useEffect(() => {
    // Sync from DOM immediately on client mount — the inline <script> in <head>
    // sets the class before React hydrates, so useState SSR default misses it.
    setTheme(detectThemeFromBody());

    const observer = new MutationObserver(() => {
      setTheme(detectThemeFromBody());
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return theme;
}
