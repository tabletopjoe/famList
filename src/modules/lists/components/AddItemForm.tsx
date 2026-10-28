"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { Plus, RotateCcw } from "lucide-react";
import { addItem, toggleItem, type ActionState } from "../actions";
import type { ListKind } from "../types";
import { useItemEdit } from "./ItemEditContext";

type Category = { id: string; name: string };
type ExistingItem = { id: string; label: string; isDone: boolean };

/** How many matches the search display lists before collapsing the rest into "+N more". */
const MAX_MATCHES = 6;

/**
 * Existing items whose label, or any word in it, starts with `query`
 * (case-insensitive) — label-start matches first, then word-start ones,
 * each group in list order.
 */
function findMatches(items: ExistingItem[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const starts: ExistingItem[] = [];
  const wordStarts: ExistingItem[] = [];
  for (const item of items) {
    const label = item.label.toLowerCase();
    if (label.startsWith(q)) starts.push(item);
    else if (label.split(/\s+/).some((word) => word.startsWith(q))) wordStarts.push(item);
  }
  return [...starts, ...wordStarts];
}

export function AddItemForm({
  listId,
  kind,
  categories,
  items,
}: {
  listId: string;
  kind: ListKind;
  categories: Category[];
  /** The list's current items — typing in the item field searches them, so you can see if something's already on the list. */
  items: ExistingItem[];
}) {
  // Mirrors the item field (left uncontrolled so the form action can reset it).
  const [query, setQuery] = useState("");
  const action = async (prevState: ActionState, formData: FormData) => {
    const result = await addItem(listId, prevState, formData);
    // The form's fields reset once the action finishes; clear the search with them.
    setQuery("");
    return result;
  };
  const [state, formAction, pending] = useActionState(action, undefined);
  // Like CreateListForm's type selector: focusing the item field reveals the
  // category picker, which then stays up rather than vanishing on blur.
  const [active, setActive] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [uncheckPending, startUncheck] = useTransition();
  const { editingId } = useItemEdit();
  const matches = findMatches(items, query);
  const exactMatch = matches.some((m) => m.label.trim().toLowerCase() === query.trim().toLowerCase());

  // Tapping a checked-off match puts it back on the list instead of adding
  // a duplicate — then clears the field, since there's nothing left to add.
  function uncheck(itemId: string) {
    startUncheck(async () => {
      await toggleItem(listId, itemId, false);
      formRef.current?.reset();
      setQuery("");
    });
  }

  // Hidden while an item's edit form is open, same as ListControls — on
  // mobile this bar is pinned to the screen bottom, where it would cover
  // the edit form's own pinned Save bar (expanded Notes).
  if (editingId) {
    // The item field remounts empty when this comes back, so drop the
    // search too (a render-time state adjustment, not an effect).
    if (query) setQuery("");
    return null;
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      // Mobile: pinned along the bottom of the screen for one-thumb reach,
      // full-bleed regardless of <main>'s side padding. Desktop/tablet (md:)
      // reverts to sitting in normal flow above the item list, unchanged.
      className="flex flex-col gap-2 max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-30 max-md:border-t max-md:border-foreground/15 max-md:bg-background max-md:px-4 max-md:pt-3 max-md:pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:static"
    >
      {/* Search display: as you type, the items already on the list that
          match, right above the field (on mobile, the pinned bar grows
          upward to fit it). Checked-off items show struck through, and
          tapping one unchecks it. */}
      {query.trim() && (
        <div aria-live="polite" className="text-sm">
          {matches.length === 0 ? (
            <p className="text-foreground/50">Not on this list yet</p>
          ) : (
            <>
              <p className="text-xs font-medium tracking-wide text-foreground/40 uppercase">
                {exactMatch ? "Already on this list" : "On this list"}
              </p>
              <ul className="mt-0.5 divide-y divide-foreground/10 dark:divide-foreground/15">
                {matches.slice(0, MAX_MATCHES).map((m) =>
                  m.isDone ? (
                    <li key={m.id}>
                      <button
                        type="button"
                        onClick={() => uncheck(m.id)}
                        disabled={uncheckPending}
                        title="Uncheck — put it back on the list"
                        className="flex w-full items-center gap-2 py-1 text-left text-foreground/40 hover:text-foreground/70 active:opacity-60 disabled:opacity-50"
                      >
                        <span className="min-w-0 flex-1 truncate line-through">{m.label}</span>
                        <span className="flex shrink-0 items-center gap-1 text-xs">
                          <RotateCcw className="size-3.5" strokeWidth={1.75} aria-hidden />
                          Uncheck
                        </span>
                      </button>
                    </li>
                  ) : (
                    <li key={m.id} className="truncate py-1">
                      {m.label}
                    </li>
                  ),
                )}
              </ul>
              {matches.length > MAX_MATCHES && (
                <p className="text-xs text-foreground/40">+{matches.length - MAX_MATCHES} more</p>
              )}
            </>
          )}
        </div>
      )}
      <div className="flex gap-2">
        <input
          name="label"
          placeholder="Add an item…"
          required
          autoComplete="off"
          onFocus={() => setActive(true)}
          onChange={(e) => setQuery(e.target.value)}
          className="min-w-0 flex-1 rounded-md border border-black/15 bg-white/80 px-3 py-1.5 text-sm text-field-ink placeholder:text-field-ink/40"
        />
        {kind === "shopping" && (
          <input
            name="quantity"
            placeholder="Qty"
            className="w-[34px] min-w-0 shrink-0 rounded-md border border-black/15 bg-white/80 px-1 py-1.5 text-center text-sm text-field-ink placeholder:text-field-ink/40"
          />
        )}
        <button
          type="submit"
          disabled={pending}
          aria-label="Add item"
          title="Add item"
          className="flex w-[34px] shrink-0 items-center justify-center rounded-md bg-foreground text-background transition-colors hover:bg-foreground/90 active:bg-foreground/80 disabled:opacity-50"
        >
          <Plus className="size-4" strokeWidth={2} />
        </button>
      </div>
      {active && categories.length > 0 && (
        <select
          name="categoryId"
          defaultValue=""
          disabled={pending}
          aria-label="Category"
          className="w-full rounded-md border border-black/15 bg-white/80 px-2 py-[5px] text-sm text-field-ink disabled:opacity-50"
        >
          <option value="" className="bg-white/80 text-field-ink">
            No category
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id} className="bg-white/80 text-field-ink">
              {c.name}
            </option>
          ))}
        </select>
      )}
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
