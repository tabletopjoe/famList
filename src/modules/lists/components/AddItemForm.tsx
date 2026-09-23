"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { addItem, type ActionState } from "../actions";
import type { ListKind } from "../types";

type Category = { id: string; name: string };

export function AddItemForm({
  listId,
  kind,
  categories,
}: {
  listId: string;
  kind: ListKind;
  categories: Category[];
}) {
  const action = async (prevState: ActionState, formData: FormData) => {
    const result = await addItem(listId, prevState, formData);
    return result;
  };
  const [state, formAction, pending] = useActionState(action, undefined);
  // Like CreateListForm's type selector: focusing the item field reveals the
  // category picker, which then stays up rather than vanishing on blur.
  const [active, setActive] = useState(false);

  return (
    <form
      action={formAction}
      // Mobile: pinned along the bottom of the screen for one-thumb reach,
      // full-bleed regardless of <main>'s side padding. Desktop/tablet (md:)
      // reverts to sitting in normal flow above the item list, unchanged.
      className="flex flex-col gap-2 max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-30 max-md:border-t max-md:border-foreground/15 max-md:bg-background max-md:px-4 max-md:pt-3 max-md:pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:static"
    >
      <div className="flex gap-2">
        <input
          name="label"
          placeholder="Add an item…"
          required
          onFocus={() => setActive(true)}
          className="min-w-0 flex-1 rounded-md border border-black/15 bg-white/80 px-3 py-2 text-sm text-field-ink placeholder:text-field-ink/40"
        />
        {kind === "shopping" && (
          <input
            name="quantity"
            placeholder="Qty"
            className="w-[38px] min-w-0 shrink-0 rounded-md border border-black/15 bg-white/80 px-1 py-2 text-center text-sm text-field-ink placeholder:text-field-ink/40"
          />
        )}
        <button
          type="submit"
          disabled={pending}
          aria-label="Add item"
          title="Add item"
          className="flex w-[38px] shrink-0 items-center justify-center rounded-md bg-foreground text-background transition-colors hover:bg-foreground/90 active:bg-foreground/80 disabled:opacity-50"
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
          className="w-full rounded-md border border-black/15 bg-white/80 px-2 py-1.5 text-sm text-field-ink disabled:opacity-50"
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
