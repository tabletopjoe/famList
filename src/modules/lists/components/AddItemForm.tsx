"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
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
          className="min-w-0 flex-1 rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/15 dark:bg-white/5"
        />
        <input
          name="quantity"
          placeholder="Qty"
          className="w-[38px] min-w-0 shrink-0 rounded-md border border-black/10 px-1 py-2 text-center text-sm dark:border-white/15 dark:bg-white/5"
        />
        <button
          type="submit"
          disabled={pending}
          aria-label="Add item"
          title="Add item"
          className="flex w-[38px] shrink-0 items-center justify-center rounded-md bg-foreground text-background disabled:opacity-50"
        >
          <Plus className="size-4" strokeWidth={2} />
        </button>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
