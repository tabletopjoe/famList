"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Settings, Trash2 } from "lucide-react";
import { setListKind, setListResetInterval, deleteList } from "../actions";
import { LIST_KINDS, LIST_KIND_LABELS, RESET_INTERVAL_OPTIONS, type ListKind } from "../types";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { CategoryManager } from "./CategoryManager";

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
  title,
  kind,
  resetIntervalDays,
  totalCount,
  categories,
}: {
  listId: string;
  title: string;
  kind: ListKind;
  resetIntervalDays: number | null;
  totalCount: number;
  categories: { id: string; name: string }[];
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
    "mt-1 w-full rounded-md border border-black/15 bg-white/80 px-2 py-1.5 text-sm text-field-ink disabled:opacity-50";

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
          open ? "bg-foreground/15 text-foreground" : "text-foreground/40 hover:text-foreground/70"
        }`}
      >
        <Settings className="size-4" strokeWidth={1.75} />
      </button>
      {open && (
        <div
          ref={panelRef}
          className="absolute inset-x-0 top-full z-20 mt-2 rounded-lg border border-foreground/15 bg-card-background/70 p-4 shadow-xl backdrop-blur-md"
        >
          <p className="text-sm font-medium text-foreground">List settings</p>
          <div className="mt-3 max-w-sm space-y-3">
            <label className="block text-sm text-foreground/70">
              List type
              <select
                value={kind}
                disabled={isPending}
                onChange={(e) => startTransition(() => setListKind(listId, e.target.value))}
                className={selectClass}
              >
                {LIST_KINDS.map((k) => (
                  <option key={k} value={k} className="bg-white/80 text-field-ink">
                    {LIST_KIND_LABELS[k]}
                  </option>
                ))}
              </select>
            </label>
            {kind === "shopping" && (
              <label className="block text-sm text-foreground/70">
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
                  <option value="" className="bg-white/80 text-field-ink">
                    Never
                  </option>
                  {RESET_INTERVAL_OPTIONS.map((opt) => (
                    <option key={opt.days} value={opt.days} className="bg-white/80 text-field-ink">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div className="border-t border-foreground/10 pt-3">
              <CollapsibleSection title="Categories">
                <CategoryManager listId={listId} categories={categories} />
              </CollapsibleSection>
            </div>
            <div className="border-t border-foreground/10 pt-3">
              <button
                type="button"
                onClick={() => {
                  const itemPhrase = `${totalCount} item${totalCount === 1 ? "" : "s"}`;
                  if (confirm(`Delete "${title}" and its ${itemPhrase}? This can't be undone.`)) {
                    startTransition(() => deleteList(listId));
                  }
                }}
                disabled={isPending}
                className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 disabled:opacity-50"
              >
                <Trash2 className="size-4" strokeWidth={1.75} />
                Delete list
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
