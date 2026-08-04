"use client";

import { useActionState } from "react";
import { addItem, type ActionState } from "../actions";

export function AddItemForm({ listId }: { listId: string }) {
  const action = async (prevState: ActionState, formData: FormData) => {
    const result = await addItem(listId, prevState, formData);
    return result;
  };
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          name="label"
          placeholder="Add an item…"
          required
          className="flex-1 rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/15 dark:bg-white/5"
        />
        <input
          name="quantity"
          placeholder="Qty"
          className="w-20 rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/15 dark:bg-white/5"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
        >
          Add
        </button>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
