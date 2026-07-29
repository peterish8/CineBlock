import type { ThemeName } from "@/lib/types";
import { ENABLE_NETFLIX_THEME } from "@/lib/featureFlags";

export { ENABLE_NETFLIX_THEME };

export const AVAILABLE_THEMES: ThemeName[] = ENABLE_NETFLIX_THEME
  ? ["default", "netflix", "glass"]
  : ["default", "glass"];

export function sanitizeTheme(theme: string | null | undefined): ThemeName {
  if (theme === "glass") return "glass";
  if (theme === "netflix" && ENABLE_NETFLIX_THEME) return "netflix";
  if (theme === "default") return "default";
  return "glass"; // glass is the default for new users
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

/** Blocking inline script — injected in root layout <head> (server-only, not a React Script). */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('theme');if(!t){t='glass';localStorage.setItem('theme','glass');}var allowNetflix=${ENABLE_NETFLIX_THEME};function apply(){if(t==='glass')document.body.classList.add('theme-glass');else if(allowNetflix&&t==='netflix')document.body.classList.add('theme-netflix');}if(document.body)apply();else document.addEventListener('DOMContentLoaded',apply);}catch(e){}})();`;
