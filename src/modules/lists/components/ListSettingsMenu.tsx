"use client";

import { useEffect, useRef, useState } from "react";
import { Settings } from "lucide-react";

/**
 * Placeholder shell for per-list settings — nothing to configure yet (list
 * types are coming soon and will likely live here), so this just wires up
 * the toggle and the overlay panel for future controls to land in. Opens
 * as a glassy panel over the item list rather than pushing it down, so
 * nothing below shifts when it's toggled.
 *
 * Renders as a fragment (no wrapping element) so the button sits as an
 * ordinary flex item in ListControls' row, while the panel's `absolute`
 * positioning resolves against ListControls' own `relative` root — that's
 * a full-width block box, which is what lets the panel span the whole
 * content column instead of just the width of this button.
 */
export function ListSettingsMenu() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target)) return; // let the button's own onClick toggle it
      if (panelRef.current && !panelRef.current.contains(target)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="List settings"
        title="List settings"
        className={`flex size-8 items-center justify-center rounded-md transition-colors ${
          open
            ? "bg-white/15 text-white"
            : "text-black/40 hover:text-black/70 dark:text-white/40 dark:hover:text-white/70"
        }`}
      >
        <Settings className="size-4" strokeWidth={1.75} />
      </button>
      {open && (
        <div
          ref={panelRef}
          className="absolute inset-x-0 top-full z-20 mt-2 rounded-lg border border-white/15 bg-card-background/70 p-4 shadow-xl backdrop-blur-md"
        >
          <p className="text-sm font-medium text-white">List settings</p>
          <p className="mt-1 text-sm text-white/60">
            Nothing to configure yet — sorting, filtering, and list type are coming soon.
          </p>
        </div>
      )}
    </>
  );
}
