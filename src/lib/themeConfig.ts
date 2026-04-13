import type { ThemeName } from "@/lib/types";

export const ENABLE_NETFLIX_THEME = false;

export const AVAILABLE_THEMES: ThemeName[] = ENABLE_NETFLIX_THEME
  ? ["default", "netflix", "glass"]
  : ["default", "glass"];

export function sanitizeTheme(theme: string | null | undefined): ThemeName {
  if (theme === "glass") return "glass";
  if (theme === "netflix" && ENABLE_NETFLIX_THEME) return "netflix";
  return "default";
}

export function getNextTheme(theme: ThemeName): ThemeName {
  const current = sanitizeTheme(theme);
  const currentIndex = AVAILABLE_THEMES.indexOf(current);
  const nextIndex = (currentIndex + 1) % AVAILABLE_THEMES.length;
  return AVAILABLE_THEMES[nextIndex] ?? "default";
}

export function getThemeDisplayName(theme: ThemeName): string {
  switch (sanitizeTheme(theme)) {
    case "glass":
      return "CineGlass Premium";
    case "netflix":
      return "Netflix Dark";
    default:
      return "CineBlock Default";
  }
}
