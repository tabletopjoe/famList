"use client";

import { useActionState, useState, useTransition, type ReactNode } from "react";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import { updateItem, createCategory, deleteItem, type ActionState } from "../actions";
import type { ListKind } from "../types";

/** A bare domain (e.g. "example.com/recipe") would otherwise resolve relative to this app's own origin. */
function externalHref(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

type EditableItem = {
  id: string;
  label: string;
  quantity: string | null;
  notes: string | null;
  link: string | null;
  categoryId: string | null;
};

type Category = { id: string; name: string };

const fieldClass =
  "min-w-0 flex-1 rounded-md border border-black/15 bg-white/80 px-2 py-1.5 text-sm text-field-ink placeholder:text-field-ink/40 disabled:opacity-50";

/** Label and input side by side, for every field except Notes — keeps rows compact so Notes gets the leftover height. */
function FieldRow({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="w-20 shrink-0 text-sm text-foreground/70">
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
  categories,
  onCancel,
  onSaved,
}: {
  listId: string;
  kind: ListKind;
  item: EditableItem;
  categories: Category[];
  onCancel: () => void;
  onSaved: () => void;
}) {
  const action = async (prevState: ActionState, formData: FormData) => {
    const result = await updateItem(listId, item.id, prevState, formData);
    if (!result) onSaved();
    return result;
  };
  const [state, formAction, pending] = useActionState(action, undefined);

  // Controlled (unlike the other fields) so adding a category can select it
  // right away — Save still has to be pressed to actually persist the
  // assignment, same as Name/Quantity/Notes/Link.
  const [categoryId, setCategoryId] = useState(item.categoryId ?? "");
  // Also controlled (unlike Name/Quantity/Notes) so the launch icon beside
  // it reflects whatever's currently typed, not just the last-saved link.
  const [link, setLink] = useState(item.link ?? "");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [categoryPending, startCategoryTransition] = useTransition();
  // Delete sits right next to Save, so the first tap only arms it and the
  // second actually deletes — no browser confirm() dialog needed.
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deletePending, startDeleteTransition] = useTransition();
  const busy = pending || deletePending;

  function handleDelete() {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    startDeleteTransition(async () => {
      await deleteItem(listId, item.id);
      onSaved();
    });
  }

  function handleAddCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    startCategoryTransition(async () => {
      const result = await createCategory(listId, name);
      if ("error" in result) {
        setCategoryError(result.error);
      } else {
        setCategoryError(null);
        setCategoryId(result.category.id);
        setNewCategoryName("");
      }
    });
  }

  const categoryField = (
    <FieldRow id="item-edit-category" label="Category">
      <select
        id="item-edit-category"
        name="categoryId"
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        disabled={pending}
        className={fieldClass}
      >
        <option value="" className="bg-white/80 text-field-ink">
          None
        </option>
        {categories.map((c) => (
          <option key={c.id} value={c.id} className="bg-white/80 text-field-ink">
            {c.name}
          </option>
        ))}
      </select>
    </FieldRow>
  );
  const addCategoryRow = (
    <div className="flex items-center gap-2">
      <span className="w-20 shrink-0" aria-hidden />
      <input
        value={newCategoryName}
        onChange={(e) => setNewCategoryName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleAddCategory();
          }
        }}
        placeholder="New category"
        disabled={categoryPending}
        className={fieldClass}
      />
      <button
        type="button"
        onClick={handleAddCategory}
        disabled={categoryPending}
        aria-label="Add category"
        title="Add category"
        className="flex size-8 shrink-0 items-center justify-center rounded-md bg-foreground text-background transition-colors hover:bg-foreground/90 active:bg-foreground/80 disabled:opacity-50"
      >
        <Plus className="size-4" strokeWidth={2} />
      </button>
    </div>
  );

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
  const trimmedLink = link.trim();
  const linkField = (
    <FieldRow id="item-edit-link" label="Link">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {trimmedLink ? (
          <a
            href={externalHref(trimmedLink)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open link"
            title="Open link"
            className="shrink-0 text-foreground/50 transition-colors hover:text-foreground active:text-foreground"
          >
            <ExternalLink className="size-4" strokeWidth={1.75} />
          </a>
        ) : (
          <ExternalLink className="size-4 shrink-0 text-foreground/20" strokeWidth={1.75} aria-hidden />
        )}
        <input
          id="item-edit-link"
          name="link"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          disabled={pending}
          className={fieldClass}
        />
      </div>
    </FieldRow>
  );
  // Recipe and notes lists get the most out of this form when Notes has the
  // room — those are the two kinds where it's the main thing being edited.
  const maximizeNotes = kind === "recipe" || kind === "notes";
  const notesField = (
    <label htmlFor="item-edit-notes" className="block text-sm text-foreground/70">
      Notes
      <textarea
        id="item-edit-notes"
        name="notes"
        defaultValue={item.notes ?? ""}
        disabled={pending}
        rows={maximizeNotes ? 10 : 3}
        className="mt-1 w-full resize-none rounded-md border border-black/15 bg-white/80 px-2 py-1.5 text-sm text-field-ink placeholder:text-field-ink/40 disabled:opacity-50"
      />
    </label>
  );

  return (
    <div className="mt-3 rounded-lg border border-foreground/15 bg-card-background/70 p-4 shadow-xl backdrop-blur-md">
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
        {categoryField}
        {addCategoryRow}
        {categoryError && <p className="text-sm text-red-400">{categoryError}</p>}
        {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
        <div className="flex items-center justify-end gap-2 border-t border-foreground/10 pt-3">
          <button
            type="button"
            onClick={handleDelete}
            onBlur={() => setConfirmingDelete(false)}
            disabled={busy}
            className={`mr-auto flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors disabled:opacity-50 ${
              confirmingDelete
                ? "bg-red-600 font-medium text-white hover:bg-red-700 active:bg-red-800"
                : "text-red-500 hover:text-red-600 active:opacity-70"
            }`}
          >
            <Trash2 className="size-4" strokeWidth={1.75} />
            {confirmingDelete ? "Confirm delete" : "Delete"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-md px-3 py-1.5 text-sm text-foreground/70 hover:text-foreground active:opacity-70 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90 active:bg-foreground/80 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
