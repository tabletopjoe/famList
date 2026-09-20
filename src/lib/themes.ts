/**
 * Central theme registry. Each theme has a light and a dark mode, each of
 * which sets the same four CSS custom properties (see the matching
 * `[data-theme="…"]` blocks in src/app/globals.css, which must stay in sync
 * with the values here — this file is the source of truth for what those
 * *should* be, but CSS can't read a TS module, so the hex values are
 * duplicated by hand in both places).
 *
 * "eggplant" + "dark" is the app's original, unchanged look. The rest are a
 * first pass — expect to retune the exact hex values from here.
 */
export const THEMES = ["eggplant", "fern", "rust", "ocean"] as const;

export type Theme = (typeof THEMES)[number];

export const THEME_LABELS: Record<Theme, string> = {
  eggplant: "Eggplant",
  fern: "Fern",
  rust: "Rust",
  ocean: "Ocean",
};

export const THEME_MODES = ["light", "dark"] as const;

export type ThemeMode = (typeof THEME_MODES)[number];

export function parseTheme(raw: string | undefined | null): Theme {
  return (THEMES as readonly string[]).includes(raw ?? "") ? (raw as Theme) : "eggplant";
}

export function parseThemeMode(raw: string | undefined | null): ThemeMode {
  return raw === "light" || raw === "dark" ? raw : "dark";
}
