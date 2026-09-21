"use client";

import { useTransition } from "react";
import { Check } from "lucide-react";
import { setTheme } from "../actions";
import { THEMES, THEME_LABELS, THEME_MODES, type Theme, type ThemeMode } from "@/lib/themes";

/**
 * A live preview swatch, not a hardcoded color chip: nesting data-theme (and
 * .dark for the dark preview) re-scopes the --background/--accent custom
 * properties from globals.css for just this element, so the preview can
 * never drift out of sync with the real theme colors.
 */
function ThemeSwatch({ theme, mode }: { theme: Theme; mode: ThemeMode }) {
  return (
    <div data-theme={theme} className={mode === "dark" ? "dark" : ""}>
      <div
        className="flex size-9 items-center justify-center rounded-full border border-black/10"
        style={{ background: "var(--background)" }}
      >
        <div className="size-3.5 rounded-full" style={{ background: "var(--accent)" }} />
      </div>
    </div>
  );
}

export function ThemePicker({ theme, themeMode }: { theme: Theme; themeMode: ThemeMode }) {
  const [isPending, startTransition] = useTransition();

  function pick(nextTheme: Theme, nextMode: ThemeMode) {
    startTransition(() => setTheme(nextTheme, nextMode));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {THEMES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => pick(t, themeMode)}
            disabled={isPending}
            aria-pressed={theme === t}
            aria-label={THEME_LABELS[t]}
            title={THEME_LABELS[t]}
            className="flex flex-col items-center gap-1.5 active:opacity-70 disabled:opacity-50"
          >
            <span
              className={`relative flex items-center justify-center rounded-full p-0.5 ${
                theme === t ? "ring-2 ring-foreground" : "ring-1 ring-foreground/15"
              }`}
            >
              <ThemeSwatch theme={t} mode={themeMode} />
              {theme === t && (
                <span className="absolute -right-0.5 -bottom-0.5 flex size-4 items-center justify-center rounded-full bg-foreground text-background">
                  <Check className="size-2.5" strokeWidth={3} />
                </span>
              )}
            </span>
            <span className="text-xs text-foreground/70">{THEME_LABELS[t]}</span>
          </button>
        ))}
      </div>
      <div className="inline-flex rounded-full border border-foreground/15 p-0.5">
        {THEME_MODES.map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => pick(theme, mode)}
            disabled={isPending}
            aria-pressed={themeMode === mode}
            className={`rounded-full px-3 py-1 text-sm capitalize transition-colors ${
              themeMode === mode
                ? "bg-foreground/15 text-foreground active:bg-foreground/25"
                : "text-foreground/60 hover:text-foreground active:bg-foreground/10"
            }`}
          >
            {mode}
          </button>
        ))}
      </div>
    </div>
  );
}
