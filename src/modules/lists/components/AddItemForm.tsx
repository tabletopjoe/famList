"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import { addItem, type ActionState } from "../actions";
import { useDeleteMode } from "./DeleteModeContext";

export function AddItemForm({ listId }: { listId: string }) {
  const action = async (prevState: ActionState, formData: FormData) => {
    const result = await addItem(listId, prevState, formData);
    return result;
  };
  const [state, formAction, pending] = useActionState(action, undefined);
  const { deleteMode, toggle } = useDeleteMode();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={toggle}
          aria-pressed={deleteMode}
          aria-label={deleteMode ? "Done deleting items" : "Delete items"}
          title={deleteMode ? "Done deleting items" : "Delete items"}
          className={`flex size-8 items-center justify-center rounded-md transition-colors ${
            deleteMode
              ? "bg-red-600/15 text-red-500"
              : "text-black/40 hover:text-red-600 dark:text-white/40 dark:hover:text-red-400"
          }`}
        >
          <Trash2 className="size-4" strokeWidth={1.75} />
        </button>
      </div>
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
            className="w-20 min-w-0 shrink-0 rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/15 dark:bg-white/5"
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
    </div>
  );
}
