"use client";

import { useActionState } from "react";
import { updateItem, type ActionState } from "../actions";

type EditableItem = {
  id: string;
  label: string;
  quantity: string | null;
  notes: string | null;
  link: string | null;
};

/**
 * Translucent panel for editing one item's fields — styled to match
 * ListSettingsMenu's panel, but sits in normal flow beneath the single
 * filtered-down row ItemList renders while editing, rather than floating
 * over it.
 */
export function ItemEditForm({
  listId,
  item,
  onCancel,
  onSaved,
}: {
  listId: string;
  item: EditableItem;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const action = async (prevState: ActionState, formData: FormData) => {
    const result = await updateItem(listId, item.id, prevState, formData);
    if (!result) onSaved();
    return result;
  };
  const [state, formAction, pending] = useActionState(action, undefined);

  const fieldClass =
    "mt-1 w-full rounded-md border border-white/15 bg-white/5 px-2 py-1.5 text-sm text-white disabled:opacity-50";

  return (
    <div className="mt-3 rounded-lg border border-white/15 bg-card-background/70 p-4 shadow-xl backdrop-blur-md">
      <p className="text-sm font-medium text-white">Edit item</p>
      <form action={formAction} className="mt-3 space-y-3">
        <label className="block text-sm text-white/70">
          Name
          <input name="label" defaultValue={item.label} required disabled={pending} className={fieldClass} />
        </label>
        <label className="block text-sm text-white/70">
          Quantity
          <input name="quantity" defaultValue={item.quantity ?? ""} disabled={pending} className={fieldClass} />
        </label>
        <label className="block text-sm text-white/70">
          Notes
          <textarea name="notes" defaultValue={item.notes ?? ""} disabled={pending} rows={3} className={fieldClass} />
        </label>
        <label className="block text-sm text-white/70">
          Link
          <input name="link" defaultValue={item.link ?? ""} disabled={pending} className={fieldClass} />
        </label>
        {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
        <div className="flex justify-end gap-2 border-t border-white/10 pt-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="rounded-md px-3 py-1.5 text-sm text-white/70 hover:text-white disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
