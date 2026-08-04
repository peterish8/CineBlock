/**
 * Feature flags — flip to `true` and deploy to enable unfinished surfaces.
 * All default to `false` until explicitly ready for production.
 */

/** Netflix / Prime / Disney+ / Hotstar / Apple TV+ streaming skins — nav + /streaming route. */
export const ENABLE_STREAMING = false;

/** Netflix dark UI theme in the theme switcher. */
export const ENABLE_NETFLIX_THEME = false;

/** CineBlock Terminal CLI — profile token UI + /api/cli endpoint. */
export const ENABLE_CLI = false;
