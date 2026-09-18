"use client";

import { useActionState, type ReactNode } from "react";
import { updateItem, type ActionState } from "../actions";
import type { ListKind } from "../types";

type EditableItem = {
  id: string;
  label: string;
  quantity: string | null;
  notes: string | null;
  link: string | null;
};

const fieldClass =
  "min-w-0 flex-1 rounded-md border border-black/15 bg-white/80 px-2 py-1.5 text-sm text-background placeholder:text-background/40 disabled:opacity-50";

/** Label and input side by side, for every field except Notes — keeps rows compact so Notes gets the leftover height. */
function FieldRow({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="w-20 shrink-0 text-sm text-white/70">
        {label}
      </label>
      {children}
    </div>
  );
}

/**
 * Translucent panel for editing one item's fields — styled to match
 * ListSettingsMenu's panel, but sits in normal flow beneath the single
 * filtered-down row ItemList renders while editing, rather than floating
 * over it. Field set and order depend on the list's kind: recipe and notes
 * lists have no use for Quantity, and each favors a different field order
 * (see the caller's request for the specifics).
 */
export function ItemEditForm({
  listId,
  kind,
  item,
  onCancel,
  onSaved,
}: {
  listId: string;
  kind: ListKind;
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

  const nameField = (
    <FieldRow id="item-edit-label" label="Name">
      <input id="item-edit-label" name="label" defaultValue={item.label} required disabled={pending} className={fieldClass} />
    </FieldRow>
  );
  const quantityField = (
    <FieldRow id="item-edit-quantity" label="Quantity">
      <input
        id="item-edit-quantity"
        name="quantity"
        defaultValue={item.quantity ?? ""}
        disabled={pending}
        className={fieldClass}
      />
    </FieldRow>
  );
  const linkField = (
    <FieldRow id="item-edit-link" label="Link">
      <input id="item-edit-link" name="link" defaultValue={item.link ?? ""} disabled={pending} className={fieldClass} />
    </FieldRow>
  );
  // Recipe and notes lists get the most out of this form when Notes has the
  // room — those are the two kinds where it's the main thing being edited.
  const maximizeNotes = kind === "recipe" || kind === "notes";
  const notesField = (
    <label htmlFor="item-edit-notes" className="block text-sm text-white/70">
      Notes
      <textarea
        id="item-edit-notes"
        name="notes"
        defaultValue={item.notes ?? ""}
        disabled={pending}
        rows={maximizeNotes ? 10 : 3}
        className="mt-1 w-full resize-none rounded-md border border-black/15 bg-white/80 px-2 py-1.5 text-sm text-background placeholder:text-background/40 disabled:opacity-50"
      />
    </label>
  );

  return (
    <div className="mt-3 rounded-lg border border-white/15 bg-card-background/70 p-4 shadow-xl backdrop-blur-md">
      <form action={formAction} className="space-y-3">
        {kind === "recipe" ? (
          <>
            {nameField}
            {linkField}
            {notesField}
          </>
        ) : kind === "notes" ? (
          <>
            {nameField}
            {notesField}
            {linkField}
          </>
        ) : (
          <>
            {nameField}
            {quantityField}
            {notesField}
            {linkField}
          </>
        )}
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
