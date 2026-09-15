"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Settings } from "lucide-react";
import { setListKind, setListResetInterval } from "../actions";
import { LIST_KINDS, LIST_KIND_LABELS, RESET_INTERVAL_OPTIONS, type ListKind } from "../types";

/**
 * List type + (for shopping lists) auto-reset interval. Opens as a glassy
 * panel over the item list rather than pushing it down. Renders as a
 * fragment (no wrapping element) so the button sits as an ordinary flex
 * item in ListControls' row, while the panel's `absolute` positioning
 * resolves against ListControls' own `relative` root — that's a full-width
 * block box, which is what lets the panel span the whole content column
 * instead of just the width of this button.
 */
export function ListSettingsMenu({
  listId,
  kind,
  resetIntervalDays,
}: {
  listId: string;
  kind: ListKind;
  resetIntervalDays: number | null;
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();

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

  const selectClass =
    "mt-1 w-full rounded-md border border-white/15 bg-white/5 px-2 py-1.5 text-sm text-white disabled:opacity-50";

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
          <div className="mt-3 max-w-xs space-y-3">
            <label className="block text-sm text-white/70">
              List type
              <select
                value={kind}
                disabled={isPending}
                onChange={(e) => startTransition(() => setListKind(listId, e.target.value))}
                className={selectClass}
              >
                {LIST_KINDS.map((k) => (
                  <option key={k} value={k} className="bg-card-background text-white">
                    {LIST_KIND_LABELS[k]}
                  </option>
                ))}
              </select>
            </label>
            {kind === "shopping" && (
              <label className="block text-sm text-white/70">
                Reset checked-off items after
                <select
                  value={resetIntervalDays ?? ""}
                  disabled={isPending}
                  onChange={(e) => {
                    const value = e.target.value === "" ? null : Number(e.target.value);
                    startTransition(() => setListResetInterval(listId, value));
                  }}
                  className={selectClass}
                >
                  <option value="" className="bg-card-background text-white">
                    Never
                  </option>
                  {RESET_INTERVAL_OPTIONS.map((opt) => (
                    <option key={opt.days} value={opt.days} className="bg-card-background text-white">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </div>
      )}
    </>
  );
}
