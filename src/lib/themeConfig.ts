import type { ThemeName } from "@/lib/types";

export const AVAILABLE_THEMES: ThemeName[] = ["glass"];

export function sanitizeTheme(theme: string | null | undefined): ThemeName {
  // Glass is the permanent CineBlock product theme. Keep this function for
  // legacy callers, but normalize every stored or incoming value to Glass.
  void theme;
  return "glass";
}

export function getNextTheme(theme: ThemeName): ThemeName {
  void theme;
  return "glass";
}

export function getThemeDisplayName(theme: ThemeName): string {
  void theme;
  return "CineGlass Premium";
}

/** Blocking inline script — injected in root layout <head> (server-only, not a React Script). */
export const THEME_INIT_SCRIPT = `(function(){try{localStorage.setItem('theme','glass');function apply(){document.body.classList.remove('theme-netflix');document.body.classList.add('theme-glass');}if(document.body)apply();else document.addEventListener('DOMContentLoaded',apply);}catch(e){}})();`;
