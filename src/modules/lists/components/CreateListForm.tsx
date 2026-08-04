"use client";

import { useActionState } from "react";
import { createList } from "../actions";

export function CreateListForm() {
  const [state, formAction, pending] = useActionState(createList, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          name="title"
          placeholder="New list, e.g. Groceries"
          required
          className="flex-1 rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/15 dark:bg-white/5"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create list"}
        </button>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
