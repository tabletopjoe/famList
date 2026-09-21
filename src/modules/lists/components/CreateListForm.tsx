"use client";

import { useActionState, useState } from "react";
import { createList } from "../actions";
import { LIST_KINDS, LIST_KIND_LABELS } from "../types";

export function CreateListForm() {
  const [state, formAction, pending] = useActionState(createList, undefined);
  // Focusing the title field is "starting" a new list — the type selector
  // then stays up for the rest of that attempt rather than disappearing on
  // blur, which would otherwise hide it the moment you click into it.
  const [active, setActive] = useState(false);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          name="title"
          placeholder="New list, e.g. Groceries"
          required
          onFocus={() => setActive(true)}
          className="min-w-0 flex-1 rounded-md border border-black/15 bg-white/80 px-3 py-2 text-sm text-field-ink placeholder:text-field-ink/40"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90 active:bg-foreground/80 disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create"}
        </button>
      </div>
      {active && (
        <select
          name="kind"
          defaultValue="shopping"
          disabled={pending}
          className="w-full rounded-md border border-black/15 bg-white/80 px-2 py-1.5 text-sm text-field-ink disabled:opacity-50"
        >
          {LIST_KINDS.map((k) => (
            <option key={k} value={k} className="bg-white/80 text-field-ink">
              {LIST_KIND_LABELS[k]}
            </option>
          ))}
        </select>
      )}
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
